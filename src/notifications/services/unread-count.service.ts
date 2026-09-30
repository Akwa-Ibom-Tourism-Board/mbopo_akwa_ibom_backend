import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import { StatusCodes } from "../../configurations/statusCodes";
import { Notification } from "../Notification";

const unreadCountService = errorUtilities.withServiceErrorHandling(
  async (userId: string) => {
    const count = await Notification.count({ where: { userId, read: false } });

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "Unread count fetched successfully",
      { count },
    );
  },
);

export default unreadCountService;
