import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { Message, MessageStatus } from "../../../messages/Message";
import { recordActivity } from "../../helpers/activity.helpers";

const updateComplaintStatusService = errorUtilities.withServiceErrorHandling(
  async (staffId: string, id: string, status: MessageStatus) => {
    const message = await Message.findByPk(id);
    if (!message) {
      throw errorUtilities.createError("Complaint not found", StatusCodes.NOT_FOUND);
    }

    await message.update({ status } as any);

    await recordActivity(
      staffId,
      "complaints",
      status === MessageStatus.Resolved
        ? `Resolved complaint "${message.get("title") || "General enquiry"}"`
        : `Marked complaint "${message.get("title") || "General enquiry"}" as ${status.replace("_", " ")}`,
    );

    return responseUtilities.handleServicesResponse(StatusCodes.OK, "Status updated");
  },
);

export default updateComplaintStatusService;
