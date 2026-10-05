import { UniqueConstraintError } from "sequelize";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import verifyNIN, { NINVerificationResult } from "../../../configurations/nin-provider";
import { copyNinPhotoToAvatar } from "../../../configurations/cloudinary";
import { SELFIE_MISMATCH_CODE, SELFIE_MISMATCH_MESSAGE } from "../../../configurations/dvp-client";
import { User, Gender } from "../../../auth/User";
import {
  serializeUser,
  parseDateOfBirth,
  isEligibleAge,
  isAkwaIbomIndigene,
} from "../../../auth/auth.helpers";
import { namesMatch } from "../../../auth/name-match";

export interface VerifyIdentityPayload {
  nin: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  /** Base64 data URI of the live selfie. */
  image: string;
}

// Every failing reason is collected (no short-circuit) so the applicant sees
// everything at once.
const evaluateEligibility = (ninResult: NINVerificationResult, dateOfBirth: string): string[] => {
  const reasons: string[] = [];

  if (ninResult.gender?.toLowerCase() !== Gender.Female) {
    reasons.push("Applicants must be female");
  }
  if (!isEligibleAge(dateOfBirth)) {
    reasons.push("Applicants must be between 22 and 27 years old");
  }
  // NIN-sourced: a blank/missing address state fails closed.
  if (!isAkwaIbomIndigene({ state: ninResult.addressState ?? undefined })) {
    reasons.push("Applicants must be an indigene of Akwa Ibom State");
  }
  return reasons;
};

// The single NIN-verification-and-commit step: NIN record + live selfie
// face-match, then identity (and the NIN photo as a locked avatar) is
// attached to the logged-in account. Never re-runnable once
// `identityVerified` is true. Nothing is persisted unless every check passes.
const verifyIdentityService = errorUtilities.withServiceErrorHandling(
  async (userId: string, payload: VerifyIdentityPayload) => {
    const user = await User.findByPk(userId);
    if (!user) {
      throw errorUtilities.createError("User not found", StatusCodes.NOT_FOUND);
    }

    const alreadyVerified = () =>
      errorUtilities.createError("Your identity has already been verified", StatusCodes.BAD_REQUEST);
    if (user.get("identityVerified")) throw alreadyVerified();

    let ninResult: NINVerificationResult;
    try {
      ninResult = await verifyNIN({
        nin: payload.nin,
        firstName: payload.firstName,
        lastName: payload.lastName,
        image: payload.image,
        mustCheckImage: true,
      });
    } catch (error: any) {
      if (error?.code === SELFIE_MISMATCH_CODE) {
        throw errorUtilities.createError(SELFIE_MISMATCH_MESSAGE, StatusCodes.BAD_REQUEST);
      }
      throw error;
    }

    const dateOfBirth = parseDateOfBirth(ninResult.dateOfBirth);
    if (!dateOfBirth) {
      throw errorUtilities.createError(
        "NIN record has an invalid date of birth",
        StatusCodes.BAD_REQUEST,
      );
    }

    const nameMatches = namesMatch(
      { firstName: payload.firstName, middleName: payload.middleName, lastName: payload.lastName },
      {
        firstName: ninResult.firstName,
        middleName: ninResult.middleName,
        lastName: ninResult.lastName,
      },
    );
    if (!nameMatches) {
      throw errorUtilities.createError(
        "The name you entered does not match your NIN record",
        StatusCodes.BAD_REQUEST,
      );
    }

    if (ninResult.selfieMatch === false) {
      throw errorUtilities.createError(SELFIE_MISMATCH_MESSAGE, StatusCodes.BAD_REQUEST);
    }

    const reasons = evaluateEligibility(ninResult, dateOfBirth);
    if (reasons.length > 0) {
      return responseUtilities.handleServicesResponse(
        StatusCodes.UNPROCESSABLE_ENTITY,
        "You are not eligible to register",
        { reasons },
      );
    }

    // Before the DB write, so a Cloudinary failure can never leave
    // identityVerified = true with no photo. Overwrites in place on retry.
    if (!ninResult.photoUrl) {
      throw errorUtilities.createError(
        "Your NIN record has no photo on file. Please contact support.",
        StatusCodes.BAD_REQUEST,
      );
    }
    const avatar = await copyNinPhotoToAvatar(userId, ninResult.photoUrl);

    try {
      // Conditional update: "one-time" is a database guarantee, so two
      // concurrent calls can't both write.
      const [affected] = await User.update(
        {
          nin: ninResult.nin || payload.nin,
          firstName: ninResult.firstName,
          lastName: ninResult.lastName,
          middleName: ninResult.middleName || payload.middleName || null,
          gender: Gender.Female,
          dateOfBirth,
          avatarUrl: avatar.url,
          avatarPublicId: avatar.publicId,
          identityVerified: true,
        },
        { where: { id: userId, identityVerified: false } },
      );
      if (affected === 0) throw alreadyVerified();
      await user.reload();
    } catch (error: any) {
      if (error instanceof UniqueConstraintError) {
        throw errorUtilities.createError(
          "This NIN is already linked to another account",
          StatusCodes.BAD_REQUEST,
        );
      }
      throw error;
    }

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "Identity verified successfully",
      serializeUser(user),
    );
  },
);

export default verifyIdentityService;
