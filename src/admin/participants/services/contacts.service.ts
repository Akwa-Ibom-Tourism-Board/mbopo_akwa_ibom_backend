import { Op } from "sequelize";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { User } from "../../../auth/User";
import { Application } from "../../../applicants/application/Application";
import {
  applicantIdsForStatus,
  buildRegistrationProgress,
  type ApplicantFilterStatus,
} from "../../helpers/applicant-progress.helpers";

export interface ContactsQuery {
  status?: ApplicantFilterStatus; // omitted = every participant
  // Which registration step an in-progress applicant is currently stuck
  // at (1-5) — only meaningful alongside status "in_progress"; for every
  // other cohort nobody has a "current step" to match, so it's ignored.
  step?: unknown;
}

// Deliberately not paginated — "copy all emails that match these filters"
// needs every match, not one page of them. Emails/phone numbers are two
// short strings per row, cheap to hold in memory even for the whole
// applicant pool, unlike the full records the paginated list endpoints
// return.
const getContactsService = errorUtilities.withServiceErrorHandling(
  async (query: ContactsQuery) => {
    const matchingIds = await applicantIdsForStatus(query.status);
    const where = matchingIds ? { id: { [Op.in]: matchingIds } } : {};

    // Full rows, not a narrow `attributes` list — buildRegistrationProgress
    // reads many fields off both (including identityVerified on the user),
    // and a column left unselected reads back as undefined from `.get()`,
    // silently miscomputing which step someone is on rather than erroring.
    const users = await User.findAll({ where });
    const applications = await Application.findAll({
      where: { applicantId: { [Op.in]: users.map((u) => u.get("id") as string) } },
    });
    const applicationByApplicantId = new Map(
      applications.map((app) => [app.get("applicantId") as string, app]),
    );

    const step = Number(query.step) || undefined;
    const matches = users.filter((user) => {
      if (!step) return true;
      const application = applicationByApplicantId.get(user.get("id") as string) ?? null;
      const progress = buildRegistrationProgress(user, application);
      const currentStep = progress.steps.find(
        (s) => s.label === progress.currentStepLabel,
      );
      return currentStep?.step === step;
    });

    const emails = matches.map((u) => u.get("email") as string);
    const phones = matches
      .map((u) => {
        const application = applicationByApplicantId.get(u.get("id") as string);
        const applicationPhone = application?.get("phone") as string | null | undefined;
        return applicationPhone || (u.get("phoneNumber") as string | null);
      })
      .filter((p): p is string => !!p && p.trim().length > 0);

    return responseUtilities.handleServicesResponse(StatusCodes.OK, "Contacts fetched", {
      count: matches.length,
      emails,
      phones,
    });
  },
);

export default getContactsService;
