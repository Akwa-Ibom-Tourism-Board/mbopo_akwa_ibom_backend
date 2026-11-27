import { Op } from "sequelize";
import { Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import { User } from "../../../auth/User";
import { Application, ApplicationStatus } from "../../../applicants/application/Application";
import { AdminRole } from "../../users/AdminUser";
import { serializeCandidateForViewer } from "../../helpers/candidate.helpers";
import { sendXlsx, type ExportColumn } from "../../helpers/export.helpers";

type Row = ReturnType<typeof serializeCandidateForViewer>;

const COLUMNS: ExportColumn<Row>[] = [
  { header: "Name", value: (r) => r.name, width: 28 },
  { header: "Email", value: (r) => (r as any).email, width: 30 },
  { header: "Phone", value: (r) => (r as any).phone, width: 18 },
  { header: "LGA", value: (r) => r.lga, width: 20 },
  { header: "Reference code", value: (r) => r.referenceCode, width: 18 },
  { header: "Submitted at", value: (r) => r.submittedAt, width: 20 },
  { header: "VIN (as entered)", value: (r) => (r as any).draftVin, width: 20 },
  {
    header: "VIN status",
    value: (r) => ((r as any).isVinVerified === false ? "Failed" : "Not yet checked"),
    width: 16,
  },
  { header: "Reason", value: (r) => (r as any).vinVerificationFailedReason, width: 50 },
];

/**
 * Only contestants whose VIN isn't a confirmed match — isVinVerified is
 * null (never checked: either no VIN was given at all, or a check hasn't
 * completed yet) or false (checked and failed) — never "true". Every
 * submitted contestant, regardless of VIN, is in scope; "has no VIN" and
 * "has one but it failed/hasn't been checked" are both represented, with
 * the VIN column simply blank for the former.
 */
const exportUnverifiedVinService = errorUtilities.withServiceErrorHandling(
  async (viewerRole: AdminRole, response: Response) => {
    const applications = await Application.findAll({
      where: { status: ApplicationStatus.Submitted },
      order: [["submittedAt", "DESC"]],
    });
    const applicantIds = applications.map((app) => app.get("applicantId") as string);
    // Plain `{ [Op.ne]: true }` would compile to `<> true`, which in SQL's
    // three-valued logic silently excludes NULL rows — exactly the "never
    // checked / no VIN" case this export most needs to include. Spell out
    // both "false" and "null" explicitly instead.
    const users = await User.findAll({
      where: {
        id: { [Op.in]: applicantIds },
        [Op.or]: [{ isVinVerified: false }, { isVinVerified: null }],
      },
    });
    const userByApplicantId = new Map(users.map((u) => [u.get("id") as string, u]));

    const rows: Row[] = applications
      .map((application) => {
        const user = userByApplicantId.get(application.get("applicantId") as string);
        return user ? serializeCandidateForViewer(user, application, viewerRole) : null;
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    await sendXlsx(
      response,
      `mbopo-unverified-vins-${new Date().toISOString().slice(0, 10)}.xlsx`,
      "Unverified VINs",
      COLUMNS,
      rows,
    );
  },
);

export default exportUnverifiedVinService;
