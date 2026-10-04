import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import { StatusCodes } from "../../configurations/statusCodes";
import { Notification } from "../Notification";
import { invalidateUnreadCount } from "./unread-count.service";

const markAllReadService = errorUtilities.withServiceErrorHandling(
  async (userId: string) => {
    const [affectedCount] = await Notification.update(
      { read: true },
      { where: { userId, read: false } },
    );

    invalidateUnreadCount(userId);

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "All notifications marked as read",
      { updated: affectedCount },
    );
  },
);

export default markAllReadService;
