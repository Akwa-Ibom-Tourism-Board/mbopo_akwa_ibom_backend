import errorUtilities from "../../configurations/error-handler";
import responseUtilities from "../../configurations/response";
import { StatusCodes } from "../../configurations/statusCodes";
import { User } from "../User";
import { serializeUser } from "../auth.helpers";

export const meService = errorUtilities.withServiceErrorHandling(
  async (userId: string) => {
    const user = await User.findByPk(userId);

    if (!user) {
      throw errorUtilities.createError("User not found", StatusCodes.NOT_FOUND);
    }

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "User fetched successfully",
      serializeUser(user),
    );
  },
);

export interface UpdateMePayload {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

export const updateMeService = errorUtilities.withServiceErrorHandling(
  async (userId: string, payload: UpdateMePayload) => {
    const user = await User.findByPk(userId);

    if (!user) {
      throw errorUtilities.createError("User not found", StatusCodes.NOT_FOUND);
    }

    await user.update(payload);

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      "Profile updated successfully",
      serializeUser(user),
    );
  },
);
