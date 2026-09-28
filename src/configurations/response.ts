import { Response } from "express";

export interface ResponseDetails {
  message: string;
  statusCode: number;
  data?: any;
}

/**
 * Sends a standardized JSON response to the client: { status, message, data }.
 * Used to send responses from controllers back to the frontend/client.
 */
const responseHandler = (
  response: Response,
  message: string,
  statusCode: number,
  data?: any,
) => {
  return response.status(statusCode).json({
    status: statusCode >= 200 && statusCode < 300 ? "success" : "error",
    message,
    data: data ?? null,
  });
};

const handleServicesResponse = (
  statusCode: number,
  message: string,
  data?: any,
): ResponseDetails => {
  return { statusCode, message, data };
};

export default {
  responseHandler,
  handleServicesResponse,
};
