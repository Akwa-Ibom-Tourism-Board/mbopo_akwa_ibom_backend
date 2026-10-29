import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { NewsPost } from "../NewsPost";

const listNewsService = errorUtilities.withServiceErrorHandling(async () => {
  const posts = await NewsPost.findAll({ order: [["publishedAt", "DESC"]] });
  return responseUtilities.handleServicesResponse(StatusCodes.OK, "News fetched", posts);
});

export default listNewsService;
