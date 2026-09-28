import { Request, Response, NextFunction, ErrorRequestHandler } from "express";

const createError = (message: string, statusCode: number, data?: any) => ({
  message,
  statusCode,
  data,
  timestamp: new Date(),
  isOperational: true,
});

const createUnknownError = (error: any) => ({
  message: `Something went wrong: ${error.message || "Unknown error"}`,
  statusCode: error.statusCode || 500,
  timestamp: new Date(),
  details: error.stack || error.message,
  isOperational: false,
});

const withControllerErrorHandling = (fn: (...args: any[]) => Promise<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

const withServiceErrorHandling = (fn: (...args: any[]) => Promise<any>) => {
  return async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error: any) {
      console.error("Service error:", error.message);
      throw error;
    }
  };
};

const globalErrorHandler: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
): any => {
  const errorResponse = err.isOperational ? err : createUnknownError(err);

  console.error("❌ Error:", errorResponse.details || err);

  return res.status(errorResponse.statusCode).json({
    status: "error",
    message: errorResponse.message,
    timestamp: errorResponse.timestamp,
    details: !err.isOperational ? errorResponse.details : "",
  });
};

const processErrorHandler = () => {
  process.on("uncaughtException", (err) => {
    console.error("💥 UNCAUGHT EXCEPTION:", err);
    process.exit(1);
  });

  process.on("unhandledRejection", (reason) => {
    console.error("💥 UNHANDLED REJECTION:", reason);
  });
};

export default {
  createError,
  createUnknownError,
  withControllerErrorHandling,
  withServiceErrorHandling,
  globalErrorHandler,
  processErrorHandler,
};
