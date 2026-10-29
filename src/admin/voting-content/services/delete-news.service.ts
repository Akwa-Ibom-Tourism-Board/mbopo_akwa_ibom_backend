import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { NewsPost } from "../NewsPost";
import { recordActivity } from "../../helpers/activity.helpers";

const deleteNewsService = errorUtilities.withServiceErrorHandling(
  async (actorId: string, id: string) => {
    const post = await NewsPost.findByPk(id);
    if (!post) {
      throw errorUtilities.createError("News post not found", StatusCodes.NOT_FOUND);
    }
    const title = post.get("title");
    await post.destroy();
    await recordActivity(actorId, "voting", `Deleted picture news post "${title}"`);
    return responseUtilities.handleServicesResponse(StatusCodes.OK, "News post deleted");
  },
);

export default deleteNewsService;
