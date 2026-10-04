import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import { StatusCodes } from "../../configurations/statusCodes";
import { Notification } from "../Notification";

// The frontend polls this endpoint, and every poll that reaches Postgres
// keeps the (billed-by-the-second) serverless compute awake. A short
// per-process cache absorbs repeat polls; local writes invalidate it, and
// other instances' writes are at most CACHE_TTL_MS stale.
const CACHE_TTL_MS = 15_000;
const MAX_CACHE_ENTRIES = 5_000;
const cache = new Map<string, { count: number; expiresAt: number }>();

export const invalidateUnreadCount = (userId: string): void => {
  cache.delete(userId);
};

const unreadCountService = errorUtilities.withServiceErrorHandling(
  async (userId: string) => {
    const cached = cache.get(userId);
    let count: number;

    if (cached && cached.expiresAt > Date.now()) {
      count = cached.count;
    } else {
      count = await Notification.count({ where: { userId, read: false } });
      if (cache.size >= MAX_CACHE_ENTRIES) cache.clear();
      cache.set(userId, { count, expiresAt: Date.now() + CACHE_TTL_MS });
    }

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "Unread count fetched successfully",
      { count },
    );
  },
);

export default unreadCountService;
