import { UniqueConstraintError } from "sequelize";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { User } from "../../../auth/User";
import { serializeUser } from "../../../auth/auth.helpers";
import { verifyAndEvaluateEligibility } from "../../../auth/services/identity-check.service";

export interface VerifyIdentityPayload {
  nin: string;
  vin: string;
}

// Maps the violated column name (Sequelize parses this out of the DB error
// into UniqueConstraintError#fields) to a friendly field label.
const DUPLICATE_FIELD_LABELS: Record<string, string> = {
  nin: "NIN",
  vin: "VIN",
};

// The one-time step that attaches verified NIN/VIN identity to an already
// existing, logged-in account. Never re-runnable once `identityVerified` is
// true. Never trusts a client-resubmitted identity-check response — re-runs
// §8 eligibility here, at persist time, same as the old register.service.ts
// used to at account-creation time.
const verifyIdentityService = errorUtilities.withServiceErrorHandling(
  async (userId: string, payload: VerifyIdentityPayload) => {
    const user = await User.findByPk(userId);
    if (!user) {
      throw errorUtilities.createError("User not found", StatusCodes.NOT_FOUND);
    }

    if (user.get("identityVerified")) {
      throw errorUtilities.createError(
        "Your identity has already been verified",
        StatusCodes.BAD_REQUEST,
      );
    }

    const { eligible, reasons, identity } = await verifyAndEvaluateEligibility(
      payload.nin,
      payload.vin,
    );

    if (!eligible) {
      return responseUtilities.handleServicesResponse(
        StatusCodes.UNPROCESSABLE_ENTITY,
        "You are not eligible to register",
        { reasons },
      );
    }

    try {
      await user.update({
        nin: identity.nin,
        vin: identity.vin,
        firstName: identity.firstName,
        lastName: identity.lastName,
        gender: identity.gender,
        dateOfBirth: identity.dateOfBirth,
        localGovernment: identity.localGovernment,
        ward: identity.ward,
        identityVerified: true,
      });
    } catch (error: any) {
      if (error instanceof UniqueConstraintError) {
        const violatedField = Object.keys(error.fields || {})[0];
        const field =
          (violatedField && DUPLICATE_FIELD_LABELS[violatedField]) ||
          "identity details";
        throw errorUtilities.createError(
          `This ${field} is already linked to another account`,
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
