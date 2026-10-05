import express, { Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import logger from "morgan";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import rootRouter from "./routes";
import { generalLimiter } from "./configurations/rate-limit";
import config from "./configurations";
import errorUtilities from "./configurations/error-handler";
import { syncDatabases } from "./configurations/syncDb";
import { scheduleRetention } from "./configurations/maintenance";

dotenv.config();

const app = express();

errorUtilities.processErrorHandler();

// Behind Render's proxy: trust exactly one hop so req.ip (and therefore the
// rate limiters) sees the real client, not the proxy's shared address.
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet());
app.use(compression());
// Access-Control-Expose-Headers is required for authenticate.ts's silent
// in-request token refresh to be usable at all — without it, the browser
// receives x-access-token/x-refresh-token on a refreshed response but JS
// can't read either one.
// Only the configured frontend origin(s) may call the API from a browser.
// FRONTEND_URL may hold several comma-separated origins. If it's unset we
// warn and stay open rather than lock everyone out.
const allowedOrigins = (config.FRONTEND_URL || "")
  .split(",")
  .map((origin: string) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);
if (allowedOrigins.length === 0) {
  console.warn("⚠️  FRONTEND_URL is not set — CORS is open to every origin");
}
app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    exposedHeaders: ["x-access-token", "x-refresh-token"],
  }),
);
app.use(logger(process.env.NODE_ENV === "production" ? "combined" : "dev"));
// JSON only (files go straight to Cloudinary), and small: nothing here
// legitimately needs more than a few KB.
app.use(express.json({ limit: "50kb" }));
app.use(cookieParser());

app.use("/api/v1", generalLimiter, rootRouter);

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
