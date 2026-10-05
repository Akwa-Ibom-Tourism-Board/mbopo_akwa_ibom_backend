import crypto from "crypto";
import { UniqueConstraintError } from "sequelize";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { database } from "../../../configurations/database";
import { Application, ApplicationStatus } from "../Application";
import { findApplicationForUpdate } from "../application.helpers";
import { queueEmail } from "../../../configurations/email-queue";
import { User } from "../../../auth/User";
import { applicationSubmittedTemplate } from "../emailTemplates/applicationSubmitted";
import { applicationSubmitSchema } from "../application.routes";
import { createNotification } from "../../../notifications/services/create.service";
import { NotificationType } from "../../../notifications/Notification";

const generateReferenceCode = (): string => {
  const year = new Date().getFullYear();
  const digits = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  return `MAI-${year}-${digits}`;
};

const MAX_REFERENCE_CODE_ATTEMPTS = 5;

const submitOnce = (applicantId: string, payload: Record<string, any>) =>
  database.transaction(async (transaction) => {
    // Row lock: concurrent photo saves / draft edits wait here, so the
    // data validated below is exactly the data that gets submitted.
    const application = await findApplicationForUpdate(
      applicantId,
      transaction,
    );

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
      await application.update(payload, { transaction });
    }

    const { error } = applicationSubmitSchema.validate(application.toJSON(), {
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

    // Belt and braces with the row lock: the conditional WHERE status =
    // "draft" is the database-level guarantee that only one submit wins.
    // See BUILD_ME.md §10.
    const [affectedCount] = await Application.update(
      {
        status: ApplicationStatus.Submitted,
        referenceCode,
        submittedAt: new Date(),
      },
      { where: { applicantId, status: ApplicationStatus.Draft }, transaction },
    );

    if (affectedCount === 0) {
      throw errorUtilities.createError(
        "This application has already been submitted",
        StatusCodes.CONFLICT,
      );
    }

    await application.reload({ transaction });
    return { application, referenceCode };
  });

const submitService = errorUtilities.withServiceErrorHandling(
  async (applicantId: string, payload: Record<string, any>) => {
    let result: Awaited<ReturnType<typeof submitOnce>> | undefined;

    // The 6-digit reference code is random, so a (rare) collision on its
    // unique index rolls the transaction back; retry with a fresh code.
    for (let attempt = 1; !result; attempt++) {
      try {
        result = await submitOnce(applicantId, payload);
      } catch (error) {
        const isCodeCollision =
          error instanceof UniqueConstraintError &&
          error.fields &&
          "referenceCode" in error.fields;
        if (!isCodeCollision || attempt >= MAX_REFERENCE_CODE_ATTEMPTS)
          throw error;
      }
    }

    // Outside the transaction on purpose: createNotification swallows its
    // own errors, and a failed INSERT inside a Postgres transaction would
    // abort it. Only fire once the submit has durably committed.
    await createNotification({
      userId: applicantId,
      title: "Application submitted",
      body: `Your Mbopo Akwa Ibom application was submitted successfully. Your reference code is ${result.referenceCode}.`,
      type: NotificationType.Application,
    });

    // Confirmation email — best-effort like the notification: the
    // application is already submitted, so nothing here may fail the request.
    try {
      const applicant = await User.findByPk(applicantId, {
        attributes: ["email", "firstName"],
      });
      if (applicant) {
        const template = applicationSubmittedTemplate(
          (applicant.get("firstName") as string | null) ?? null,
          result.referenceCode,
        );
        await queueEmail({
          to: applicant.get("email") as string,
          subject: template.subject,
          htmlBody: template.htmlBody,
        });
      }
    } catch (error: any) {
      console.error("Failed to queue submission email:", error.message);
    }

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "Application submitted",
      result.application,
    );
  },
);

export default submitService;
