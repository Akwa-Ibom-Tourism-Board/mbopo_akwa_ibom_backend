import express from "express";
import errorUtilities from "../configurations/error-handler";
import responseUtilities from "../configurations/response";
import { StatusCodes } from "../configurations/statusCodes";
import { getRegistrationStatus } from "./registration.helpers";

const router = express.Router();

// Entirely unauthenticated — the main public site (Navbar, /register,
// the site-wide banner) polls this to know whether to show the register
// button/page at all, and what to tell a visitor if not.
const getStatus = errorUtilities.withControllerErrorHandling(
  async (_request, response) => {
    const status = await getRegistrationStatus();
    return responseUtilities.responseHandler(
      response,
      "Registration status fetched",
      StatusCodes.OK,
      { status },
    );
  },
);

router.get("/", getStatus);

export default router;
