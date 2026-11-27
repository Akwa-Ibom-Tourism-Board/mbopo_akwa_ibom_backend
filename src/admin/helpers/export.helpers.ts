import { Response } from "express";
import ExcelJS from "exceljs";

export interface ExportColumn<T> {
  header: string;
  width?: number;
  value: (row: T) => string | number | boolean | Date | null | undefined;
}

/**
 * Streams a one-sheet .xlsx straight to the response — used by every admin
 * "download as Excel" action (see admin/participants/services/export.service.ts
 * and admin/contestants/services/export-unverified-vin.service.ts). Not
 * wrapped in the usual { status, message, data } JSON envelope: this is a
 * binary file download, so the controller calling this is the one place in
 * the admin API that doesn't go through responseUtilities.responseHandler.
 */
export async function sendXlsx<T>(
  response: Response,
  filename: string,
  sheetName: string,
  columns: ExportColumn<T>[],
  rows: T[],
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = columns.map((column) => ({
    header: column.header,
    width: column.width ?? 22,
  }));
  sheet.getRow(1).font = { bold: true };

  for (const row of rows) {
    sheet.addRow(columns.map((column) => column.value(row) ?? ""));
  }

  response.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  response.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  await workbook.xlsx.write(response);
  response.end();
}
