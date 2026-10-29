import { Request, Response } from "express";
import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import saveDocumentService from "../services/save-document.service";

const saveDocument = errorUtilities.withControllerErrorHandling(
  async (request: Request, response: Response) => {
    const result = await saveDocumentService(
      request.adminUser!.id,
      request.adminUser!.role,
      request.params.id,
      request.body,
    );
    return responseUtilities.responseHandler(response, result.message, result.statusCode, result.data);
  },
);

export default saveDocument;
