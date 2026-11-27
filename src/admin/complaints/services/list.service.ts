import { Op, fn, col, where as sqlWhere, type WhereOptions } from "sequelize";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { Message } from "../../../messages/Message";
import { MessageReply } from "../../../messages/MessageReply";
import { ComplainantReply } from "../../../messages/ComplainantReply";
import { AdminUser, AdminRole } from "../../users/AdminUser";
import { serializeComplaint, registeredEmailSet } from "../helpers/complaint.helpers";
import { parsePageParams, buildPageMeta } from "../../helpers/pagination.helpers";

export interface ComplaintListQuery {
  search?: string;
  status?: string;
  channel?: string;
  // "contestant" | "public" — not a DB column, derived by matching the
  // sender's email against registered applicants (see complaint.helpers.ts).
  source?: string;
  page?: unknown;
  limit?: unknown;
}

const listComplaintsService = errorUtilities.withServiceErrorHandling(
  async (viewerRole: AdminRole, query: ComplaintListQuery) => {
    const { page, limit, offset } = parsePageParams(query);

    const where: WhereOptions = {};
    const andConditions: any[] = [];

    if (query.status?.trim()) where.status = query.status.trim();
    if (query.channel?.trim()) where.source = query.channel.trim();
    if (query.search?.trim()) {
      const term = `%${query.search.trim()}%`;
      andConditions.push({
        [Op.or]: [
          { name: { [Op.iLike]: term } },
          { email: { [Op.iLike]: term } },
          { title: { [Op.iLike]: term } },
        ],
      });
    }

    // Resolve the "source" filter (contestant vs. public) to a concrete set
    // of emails *before* paginating — same reasoning as the Contestants
    // list fix: filtering a derived field after the page is already cut
    // would hide real matches sitting on other pages.
    if (query.source?.trim()) {
      const candidates = await Message.findAll({
        where: andConditions.length ? { ...where, [Op.and]: andConditions } : where,
        attributes: ["email"],
      });
      const uniqueEmails = [
        ...new Set(candidates.map((m) => (m.get("email") as string).toLowerCase())),
      ];
      const registered = await registeredEmailSet(uniqueEmails);
      const wantRegistered = query.source.trim() === "contestant";
      const matchingEmails = uniqueEmails.filter((e) => registered.has(e) === wantRegistered);
      andConditions.push(
        sqlWhere(fn("lower", col("email")), {
          [Op.in]: matchingEmails.length ? matchingEmails : [""],
        }),
      );
    }

    const finalWhere = andConditions.length ? { ...where, [Op.and]: andConditions } : where;

    const { rows: messages, count: total } = await Message.findAndCountAll({
      where: finalWhere,
      order: [["updatedAt", "DESC"]],
      limit,
      offset,
    });

    const messageIds = messages.map((m) => m.get("id") as string);
    const replies = await MessageReply.findAll({
      where: { messageId: { [Op.in]: messageIds } },
    });
    const complainantReplies = await ComplainantReply.findAll({
      where: { messageId: { [Op.in]: messageIds } },
    });
    const staffIds = [...new Set(replies.map((r) => r.get("staffId") as string))];
    const staff = staffIds.length
      ? await AdminUser.findAll({ where: { id: { [Op.in]: staffIds } } })
      : [];
    const staffById = new Map(staff.map((s) => [s.get("id") as string, s]));
    const registered = await registeredEmailSet(messages.map((m) => m.get("email") as string));

    const data = await Promise.all(
      messages.map((message) =>
        serializeComplaint(
          message,
          replies.filter((r) => r.get("messageId") === message.get("id")),
          complainantReplies.filter((r) => r.get("messageId") === message.get("id")),
          staffById,
          registered.has((message.get("email") as string).toLowerCase()),
          viewerRole,
        ),
      ),
    );

    return responseUtilities.handleServicesResponse(StatusCodes.OK, "Complaints fetched", {
      complaints: data,
      meta: buildPageMeta(page, limit, total),
    });
  },
);

export default listComplaintsService;
