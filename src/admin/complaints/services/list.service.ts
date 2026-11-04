import { Op } from "sequelize";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { Message } from "../../../messages/Message";
import { MessageReply } from "../../../messages/MessageReply";
import { ComplainantReply } from "../../../messages/ComplainantReply";
import { AdminUser, AdminRole } from "../../users/AdminUser";
import { serializeComplaint, registeredEmailSet } from "../helpers/complaint.helpers";

const listComplaintsService = errorUtilities.withServiceErrorHandling(async (viewerRole: AdminRole) => {
  const messages = await Message.findAll({ order: [["updatedAt", "DESC"]] });
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

  return responseUtilities.handleServicesResponse(StatusCodes.OK, "Complaints fetched", data);
});

export default listComplaintsService;
