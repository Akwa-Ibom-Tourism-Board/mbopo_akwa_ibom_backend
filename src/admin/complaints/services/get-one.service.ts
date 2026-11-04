import { Op } from "sequelize";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { Message } from "../../../messages/Message";
import { MessageReply } from "../../../messages/MessageReply";
import { ComplainantReply } from "../../../messages/ComplainantReply";
import { AdminUser, AdminRole } from "../../users/AdminUser";
import { serializeComplaint, registeredEmailSet } from "../helpers/complaint.helpers";

const getComplaintService = errorUtilities.withServiceErrorHandling(async (id: string, viewerRole: AdminRole) => {
  const message = await Message.findByPk(id);
  if (!message) {
    throw errorUtilities.createError("Complaint not found", StatusCodes.NOT_FOUND);
  }

  const replies = await MessageReply.findAll({ where: { messageId: id } });
  const complainantReplies = await ComplainantReply.findAll({ where: { messageId: id } });
  const staffIds = [...new Set(replies.map((r) => r.get("staffId") as string))];
  const staff = staffIds.length
    ? await AdminUser.findAll({ where: { id: { [Op.in]: staffIds } } })
    : [];
  const staffById = new Map(staff.map((s) => [s.get("id") as string, s]));
  const registered = await registeredEmailSet([message.get("email") as string]);

  const data = await serializeComplaint(
    message,
    replies,
    complainantReplies,
    staffById,
    registered.has((message.get("email") as string).toLowerCase()),
    viewerRole,
  );

  return responseUtilities.handleServicesResponse(StatusCodes.OK, "Complaint fetched", data);
});

export default getComplaintService;
