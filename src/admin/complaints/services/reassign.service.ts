import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { Message } from "../../../messages/Message";
import { AdminUser, AdminRole } from "../../users/AdminUser";
import { recordActivity } from "../../helpers/activity.helpers";

const reassignComplaintService = errorUtilities.withServiceErrorHandling(
  async (staffId: string, id: string, assignedToId: string) => {
    const message = await Message.findByPk(id);
    if (!message) {
      throw errorUtilities.createError("Complaint not found", StatusCodes.NOT_FOUND);
    }

    const assignee = await AdminUser.findByPk(assignedToId);
    if (!assignee || (assignee.get("role") as AdminRole) !== AdminRole.CustomerService) {
      throw errorUtilities.createError(
        "Complaints can only be assigned to Customer Service staff",
        StatusCodes.BAD_REQUEST,
      );
    }

    await message.update({ assignedToId } as any);

    await recordActivity(
      staffId,
      "complaints",
      `Reassigned complaint "${message.get("title") || "General enquiry"}"`,
    );

    return responseUtilities.handleServicesResponse(StatusCodes.OK, "Complaint reassigned");
  },
);

export default reassignComplaintService;
