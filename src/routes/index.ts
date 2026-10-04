import { Router } from "express";
import authRouter from "../auth/auth.routes";
import applicantRegistrationRouter from "../applicants/registration/applicant-registration.routes";
import applicationRouter from "../applicants/application/application.routes";
import uploadsRouter from "../uploads/uploads.routes";
import messagesRouter from "../messages/messages.routes";
import notificationsRouter from "../notifications/notifications.routes";

const rootRouter = Router();

rootRouter.use("/auth", authRouter);
rootRouter.use("/applicants", applicantRegistrationRouter);
rootRouter.use("/applicants/application", applicationRouter);
rootRouter.use("/uploads", uploadsRouter);
rootRouter.use("/messages", messagesRouter);
rootRouter.use("/notifications", notificationsRouter);

export default rootRouter;
