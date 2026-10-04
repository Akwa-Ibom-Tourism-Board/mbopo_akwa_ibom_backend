import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import { StatusCodes } from "../../configurations/statusCodes";
import { Notification } from "../Notification";
import { invalidateUnreadCount } from "./unread-count.service";

const markReadService = errorUtilities.withServiceErrorHandling(
  async (userId: string, notificationId: string) => {
    // Scoped to userId in the WHERE clause, not a separate ownership
    // check after a findByPk — this is both the authorization guard (a
    // user can never flip another user's row) and an atomic
    // conditional update in one query, per BUILD_ME.md §10.
    const [affectedCount] = await Notification.update(
      { read: true },
      { where: { id: notificationId, userId } },
    );

    invalidateUnreadCount(userId);

    if (affectedCount === 0) {
      throw errorUtilities.createError(
        "Notification not found",
        StatusCodes.NOT_FOUND,
      );
    }

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "Notification marked as read",
    );
  },
);

export default markReadService;
