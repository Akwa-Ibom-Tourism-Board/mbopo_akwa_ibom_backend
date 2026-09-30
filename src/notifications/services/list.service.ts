import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import { StatusCodes } from "../../configurations/statusCodes";
import { Notification } from "../Notification";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export interface ListNotificationsQuery {
  page?: number;
  limit?: number;
}

const listNotificationsService = errorUtilities.withServiceErrorHandling(
  async (userId: string, query: ListNotificationsQuery) => {
    const limit = Math.min(query.limit || DEFAULT_LIMIT, MAX_LIMIT);
    const page = query.page && query.page > 0 ? query.page : 1;
    const offset = (page - 1) * limit;

    const { rows, count } = await Notification.findAndCountAll({
      where: { userId },
      attributes: ["id", "title", "body", "type", "read", "createdAt"],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "Notifications fetched successfully",
      {
        notifications: rows,
        page,
        limit,
        total: count,
        hasMore: offset + rows.length < count,
      },
    );
  },
);

export default listNotificationsService;
