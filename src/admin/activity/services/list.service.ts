import { Op } from "sequelize";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { ActivityLog } from "../ActivityLog";
import { AdminUser, AdminRole } from "../../users/AdminUser";

const listActivityService = errorUtilities.withServiceErrorHandling(async (viewerRole: AdminRole) => {
  const entries = await ActivityLog.findAll({ order: [["createdAt", "DESC"]], limit: 500 });

  const actorIds = [
    ...new Set(entries.map((e) => e.get("actorId") as string | null).filter(Boolean)),
  ] as string[];
  const actors = actorIds.length
    ? await AdminUser.findAll({ where: { id: { [Op.in]: actorIds } } })
    : [];
  const actorById = new Map(actors.map((a) => [a.get("id") as string, a]));

  const data = entries
    .map((entry) => {
      const actorId = entry.get("actorId") as string | null;
      const actor = actorId ? actorById.get(actorId) : null;
      const actorRole = (actor?.get("role") as AdminRole | undefined) ?? null;
      if (actorRole === AdminRole.SuperAdmin && viewerRole !== AdminRole.SuperAdmin) {
        return null;
      }
      return {
        id: entry.get("id"),
        at: entry.get("createdAt"),
        actorId,
        actorName: actor ? `${actor.get("firstName")} ${actor.get("lastName")}` : "System",
        actorRole,
        category: entry.get("category"),
        summary: entry.get("summary"),
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  return responseUtilities.handleServicesResponse(StatusCodes.OK, "Activity fetched", data);
});

export default listActivityService;
