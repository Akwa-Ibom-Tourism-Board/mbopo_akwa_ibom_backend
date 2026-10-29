import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import { StatusCodes } from "../../configurations/statusCodes";
import { NewsPost } from "../../admin/voting-content/NewsPost";

const getNewsService = errorUtilities.withServiceErrorHandling(async () => {
  const posts = await NewsPost.findAll({ order: [["publishedAt", "DESC"]] });
  return responseUtilities.handleServicesResponse(StatusCodes.OK, "News fetched", posts);
});

export default getNewsService;
