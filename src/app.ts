import express, { Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import logger from "morgan";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import rootRouter from "./routes";
import config from "./configurations";
import errorUtilities from "./configurations/error-handler";
import { syncDatabases } from "./configurations/syncDb";
import { scheduleRetention } from "./configurations/maintenance";

dotenv.config();

const app = express();

errorUtilities.processErrorHandler();

app.disable("x-powered-by");
app.use(helmet());
app.use(compression());
app.use(express.urlencoded({ extended: true }));
// Access-Control-Expose-Headers is required for authenticate.ts's silent
// in-request token refresh to be usable at all — without it, the browser
// receives x-access-token/x-refresh-token on a refreshed response but JS
// can't read either one.
app.use(
  cors({
    exposedHeaders: ["x-access-token", "x-refresh-token"],
  }),
);
app.use(logger("dev"));
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1", rootRouter);

app.get("/", (_request: Request, response: Response) => {
  response.send("Welcome to the Mbopo Akwa Ibom Backend Server. 👋");
});

app.use(errorUtilities.globalErrorHandler);

(async () => {
  await syncDatabases();
  scheduleRetention();
  app.listen(config.PORT, () => {
    console.log(`server running on Port ${config.PORT}`);
  });
})();

export default app;
