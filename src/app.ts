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
import { UPLOADS_DIR } from "./configurations/upload";

dotenv.config();

const app = express();

errorUtilities.processErrorHandler();

app.disable("x-powered-by");
app.use(helmet());
app.use(compression());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(cookieParser());

app.use("/uploads", express.static(UPLOADS_DIR));

app.use("/api/v1", rootRouter);

app.get("/", (_request: Request, response: Response) => {
  response.send("Welcome to the Mbopo Akwa Ibom Backend Server. 👋");
});

app.use(errorUtilities.globalErrorHandler);

(async () => {
  await syncDatabases();
  app.listen(config.PORT, () => {
    console.log(`server running on Port ${config.PORT}`);
  });
})();

export default app;
