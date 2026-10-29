import { Router } from "express";
import authRouter from "../auth/auth.routes";
import applicantRegistrationRouter from "../applicants/registration/applicant-registration.routes";
import applicationRouter from "../applicants/application/application.routes";
import uploadsRouter from "../uploads/uploads.routes";
import messagesRouter from "../messages/messages.routes";
import notificationsRouter from "../notifications/notifications.routes";
import adminAuthRouter from "../admin/auth/admin-auth.routes";
import adminUsersRouter from "../admin/users/admin-users.routes";
import adminApplicantsRouter from "../admin/applicants/applicants.routes";
import adminContestantsRouter from "../admin/contestants/contestants.routes";

const rootRouter = Router();

rootRouter.use("/auth", authRouter);
rootRouter.use("/applicants", applicantRegistrationRouter);
rootRouter.use("/applicants/application", applicationRouter);
rootRouter.use("/uploads", uploadsRouter);
rootRouter.use("/messages", messagesRouter);
rootRouter.use("/notifications", notificationsRouter);
rootRouter.use("/admin/auth", adminAuthRouter);
rootRouter.use("/admin/users", adminUsersRouter);
rootRouter.use("/admin/applicants", adminApplicantsRouter);
rootRouter.use("/admin/contestants", adminContestantsRouter);

export default rootRouter;
