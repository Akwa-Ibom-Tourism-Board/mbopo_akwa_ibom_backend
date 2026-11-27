import { Op } from "sequelize";
import { Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import { User } from "../../../auth/User";
import { Application } from "../../../applicants/application/Application";
import { AdminRole } from "../../users/AdminUser";
import { serializeCandidateForViewer } from "../../helpers/candidate.helpers";
import {
  applicantIdsForStatus,
  buildRegistrationProgress,
  type ApplicantFilterStatus,
} from "../../helpers/applicant-progress.helpers";
import { sendXlsx, type ExportColumn } from "../../helpers/export.helpers";

export interface ExportQuery {
  status?: ApplicantFilterStatus; // omitted = every participant
}

type Row = ReturnType<typeof serializeCandidateForViewer> & {
  currentStepLabel: string | null;
  completedSteps: number;
  totalSteps: number;
};

const COLUMNS: ExportColumn<Row>[] = [
  { header: "Name", value: (r) => r.name, width: 28 },
  { header: "Email", value: (r) => (r as any).email, width: 30 },
  { header: "Phone", value: (r) => (r as any).phone, width: 18 },
  { header: "LGA", value: (r) => r.lga, width: 20 },
  { header: "Senatorial District", value: (r) => r.senatorialDistrict, width: 24 },
  {
    header: "Application status",
    value: (r) => r.status ?? "not_started",
    width: 18,
  },
  { header: "Reference code", value: (r) => r.referenceCode, width: 18 },
  { header: "Submitted at", value: (r) => r.submittedAt, width: 20 },
  {
    header: "Registration step reached",
    value: (r) => r.currentStepLabel ?? "Submitted / complete",
    width: 28,
  },
  {
    header: "Steps completed",
    value: (r) => `${r.completedSteps}/${r.totalSteps}`,
    width: 16,
  },
  { header: "Judging stage", value: (r) => (r as any).stage, width: 18 },
  { header: "Judging phase", value: (r) => (r as any).phase, width: 16 },
  { header: "Candidate status", value: (r) => (r as any).candidateStatus, width: 18 },
  { header: "VIN (as entered)", value: (r) => (r as any).draftVin, width: 20 },
  {
    header: "VIN verified",
    value: (r) => {
      const v = (r as any).isVinVerified;
      if (!(r as any).draftVin) return "No VIN";
      return v === true ? "Verified" : v === false ? "Failed" : "Not yet checked";
    },
    width: 16,
  },
  { header: "VIN note", value: (r) => (r as any).vinVerificationFailedReason, width: 40 },
  { header: "NIN", value: (r) => (r as any).nin, width: 18 },
];

const FILENAME_SUFFIX: Record<string, string> = {
  all: "all-participants",
  not_started: "not-started",
  in_progress: "applicants-in-progress",
  submitted: "contestants",
};

const exportParticipantsService = errorUtilities.withServiceErrorHandling(
  async (viewerRole: AdminRole, response: Response, query: ExportQuery) => {
    const matchingIds = await applicantIdsForStatus(query.status);
    const where = matchingIds ? { id: { [Op.in]: matchingIds } } : {};

    const users = await User.findAll({ where, order: [["createdAt", "DESC"]] });
    const applications = await Application.findAll({
      where: { applicantId: { [Op.in]: users.map((u) => u.get("id") as string) } },
    });
    const applicationByApplicantId = new Map(
      applications.map((app) => [app.get("applicantId") as string, app]),
    );

    const rows: Row[] = users.map((user) => {
      const application = applicationByApplicantId.get(user.get("id") as string) ?? null;
      const progress = buildRegistrationProgress(user, application);
      return {
        ...serializeCandidateForViewer(user, application, viewerRole),
        currentStepLabel: progress.currentStepLabel,
        completedSteps: progress.completedSteps,
        totalSteps: progress.totalSteps,
      };
    });

    const suffix = FILENAME_SUFFIX[query.status ?? "all"] ?? "participants";
    await sendXlsx(
      response,
      `mbopo-${suffix}-${new Date().toISOString().slice(0, 10)}.xlsx`,
      "Participants",
      COLUMNS,
      rows,
    );
  },
);

export default exportParticipantsService;
