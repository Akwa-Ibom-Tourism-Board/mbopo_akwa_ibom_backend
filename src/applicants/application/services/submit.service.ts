import crypto from "crypto";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { Application, ApplicationStatus } from "../Application";
import { applicationSubmitSchema } from "../application.routes";

const generateReferenceCode = (): string => {
  const year = new Date().getFullYear();
  const digits = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  return `MAI-${year}-${digits}`;
};

const submitService = errorUtilities.withServiceErrorHandling(
  async (applicantId: string, payload: Record<string, any>) => {
    const application = await Application.findOne({ where: { applicantId } });

    if (!application) {
      throw errorUtilities.createError(
        "No draft application found",
        StatusCodes.NOT_FOUND,
      );
    }

    if (application.get("status") !== ApplicationStatus.Draft) {
      throw errorUtilities.createError(
        "This application has already been submitted",
        StatusCodes.CONFLICT,
      );
    }

    if (Object.keys(payload).length > 0) {
      await application.update(payload);
    }

    const merged = application.toJSON();
    const { error } = applicationSubmitSchema.validate(merged, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: true,
    });

    if (error) {
      const missingFields = error.details.map((detail) =>
        detail.message.replace(/["\\]/g, ""),
      );
      throw errorUtilities.createError(
        `Application is incomplete: ${missingFields.join("; ")}`,
        StatusCodes.BAD_REQUEST,
      );
    }

    const referenceCode = generateReferenceCode();

    // Conditional atomic update — the WHERE status = "draft" clause is what
    // makes this safe under concurrency: only one of two simultaneous submit
    // requests can match and flip the row; the other affects zero rows and
    // gets the 409 below. See BUILD_ME.md §10.
    const [affectedCount] = await Application.update(
      {
        status: ApplicationStatus.Submitted,
        referenceCode,
        submittedAt: new Date(),
      },
      { where: { applicantId, status: ApplicationStatus.Draft } },
    );

    if (affectedCount === 0) {
      throw errorUtilities.createError(
        "This application has already been submitted",
        StatusCodes.CONFLICT,
      );
    }

    await application.reload();

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "Application submitted",
      application,
    );
  },
);

export default submitService;
