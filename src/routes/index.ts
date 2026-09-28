import { Router } from "express";
import authRouter from "../auth/auth.routes";
import applicantRegistrationRouter from "../applicants/registration/applicant-registration.routes";
import applicationRouter from "../applicants/application/application.routes";

const rootRouter = Router();

rootRouter.use("/auth", authRouter);
rootRouter.use("/applicants", applicantRegistrationRouter);
rootRouter.use("/applicants/application", applicationRouter);

export default rootRouter;
