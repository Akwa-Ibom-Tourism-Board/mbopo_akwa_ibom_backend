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
// TODO: restrict CORS to the frontend origin(s) before launch. For now the
// API is open to every origin. The allow-list below is disabled, not removed:
// uncomment it and the `origin` option to restore it. Origins come from
// FRONTEND_URL and optionally CORS_ORIGINS (comma-separated); each entry is
// reduced to its bare origin so a trailing slash or path can't miss.
//
// const toOrigin = (value: string): string | null => {
//   try {
//     return new URL(value.trim()).origin;
//   } catch {
//     return null;
//   }
// };
// const allowedOrigins = [config.FRONTEND_URL, process.env.CORS_ORIGINS]
//   .flatMap((value) => (value || "").split(","))
//   .map(toOrigin)
//   .filter((origin): origin is string => Boolean(origin));
// console.log("CORS allowed origins:", allowedOrigins.join(", "));
app.use(
  cors({
    // origin: (origin, callback) => {
    //   // No Origin header = not a browser request (curl, server-to-server).
    //   if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
    //     return callback(null, true);
    //   }
    //   console.warn(`CORS blocked origin: ${origin}`);
    //   return callback(null, false);
    // },
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
