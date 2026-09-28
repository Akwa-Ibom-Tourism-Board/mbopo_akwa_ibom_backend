import nodemailer from "nodemailer";
import configurations from ".";

const transport = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 2525,
  secure: false,
  auth: {
    user: "apikey",
    pass: configurations.SENDGRID_API_KEY!,
  },
});

export const sendEmail = async (payload: {
  to: string;
  subject: string;
  htmlBody: string;
}): Promise<void> => {
  await transport.sendMail({
    from: `Mbopo Akwa Ibom <${configurations.EMAIL_FROM}>`,
    to: payload.to,
    subject: payload.subject,
    html: payload.htmlBody,
  });
};

/**
 * Wraps a message (and optional action button) in the branded email shell
 * used by every outgoing email.
 */
export const wrapEmailHtml = (
  message: string,
  actionLink?: string,
  actionText?: string,
): string => {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Mbopo Akwa Ibom</title>
  </head>
  <body
    style="
      margin: 0;
      padding: 0;
      background-color: #fdf8f4;
      font-family: Arial, sans-serif;
      color: #2a2523;
    "
  >
    <table
      cellpadding="0"
      cellspacing="0"
      border="0"
      width="100%"
      style="background-color: #fdf8f4; padding: 20px 0"
    >
      <tr>
        <td align="center">
          <table
            cellpadding="0"
            cellspacing="0"
            border="0"
            width="600"
            style="
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
            "
          >
            <!-- Header -->
            <tr>
              <td
                align="center"
                bgcolor="#e77818"
                style="padding: 30px; color: #ffffff"
              >
                <h1 style="margin: 0; font-size: 20px">Mbopo Akwa Ibom</h1>
              </td>
            </tr>

            <!-- Message Section -->
            <tr>
              <td style="padding: 40px 30px 10px 30px">
                <p
                  style="
                    font-size: 16px;
                    color: #78716e;
                    line-height: 1.6;
                    margin: 0 0 20px 0;
                  "
                >
                  ${message}
                </p>
              </td>
            </tr>

            <!-- Action Button -->
            ${
              actionLink
                ? `
            <tr>
              <td align="center" style="padding: 0 30px 30px 30px">
                <a
                  href="${actionLink}"
                  target="_blank"
                  style="
                    display: inline-block;
                    background-color: #e77818;
                    color: #ffffff;
                    text-decoration: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    font-size: 16px;
                    font-weight: bold;
                  "
                >
                  ${actionText}
                </a>
              </td>
            </tr>
            `
                : ""
            }

            <!-- Footer -->
            <tr>
              <td
                align="center"
                style="
                  padding: 20px 30px 40px 30px;
                  border-top: 1px solid #f2f0ed;
                "
              >
                <p style="font-size: 12px; opacity: 0.7; margin-top: 20px; color: #78716e;">
                  &copy; ${new Date().getFullYear()} Akwa Ibom State Tourism Board. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

export default {
  sendEmail,
  wrapEmailHtml,
};
