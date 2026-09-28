import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import { StatusCodes } from "../../configurations/statusCodes";
import { User } from "../User";

const logoutService = errorUtilities.withServiceErrorHandling(
  async (userId: string) => {
    await User.update({ refreshToken: null }, { where: { id: userId } });

    return responseUtilities.handleServicesResponse(StatusCodes.OK, "Logged out successfully");
  },
);

export default logoutService;
