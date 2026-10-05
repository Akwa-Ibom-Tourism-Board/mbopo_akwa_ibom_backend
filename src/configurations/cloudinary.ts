import { v2 as cloudinary } from "cloudinary";
import config from ".";
import errorUtilities from "./error-handler";
import { StatusCodes } from "./statusCodes";

export type PhotoField =
  | "certificateOfOrigin"
  | "fullImage"
  | "fullImage2"
  | "videoPitch";
export type UploadField = PhotoField | "avatar";
export type CloudinaryResourceType = "image" | "video";

export const PHOTO_FIELDS: readonly PhotoField[] = [
  "certificateOfOrigin",
  "fullImage",
  "fullImage2",
  "videoPitch",
];
export const UPLOAD_FIELDS: readonly UploadField[] = [...PHOTO_FIELDS, "avatar"];

const requireCredentials = () => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = config;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw errorUtilities.createError(
      "File uploads are not configured",
      StatusCodes.SERVICE_UNAVAILABLE,
    );
  }
  return {
    cloudName: CLOUDINARY_CLOUD_NAME as string,
    apiKey: CLOUDINARY_API_KEY as string,
    apiSecret: CLOUDINARY_API_SECRET as string,
  };
};

/**
 * Single source of truth for an asset's deterministic public_id — used by
 * the signature endpoint to issue it and by the save endpoints to verify it.
 */
export function buildPublicId(applicantId: string, field: UploadField): string {
  const scope = field === "avatar" ? "users" : "applications";
  return `mbopo/${process.env.NODE_ENV}/${scope}/${applicantId}/${field}`;
}

export const resourceTypeFor = (field: UploadField): CloudinaryResourceType =>
  field === "videoPitch" ? "video" : "image";

// Per-slot format allow-list, enforced by Cloudinary itself (it's a signed
// param, so the client can't widen it). Replaces the old multer mime check.
const ALLOWED_FORMATS: Record<UploadField, string> = {
  certificateOfOrigin: "jpg,jpeg,png,pdf",
  fullImage: "jpg,jpeg,png",
  fullImage2: "jpg,jpeg,png",
  videoPitch: "mp4,webm",
  avatar: "jpg,jpeg,png",
};

/**
 * Every param returned here is covered by the signature, and the client must
 * send exactly these values — nothing more, nothing less.
 */
const buildUploadParams = (publicId: string, field: UploadField): Record<string, string | number | boolean> => {
  const params: Record<string, string | number | boolean> = {
    public_id: publicId,
    overwrite: true,
    // Overwrite must also purge the CDN's copy of the previous version.
    invalidate: true,
    allowed_formats: ALLOWED_FORMATS[field],
  };

  if (field === "videoPitch") {
    // Derived 720p / capped-bitrate rendition, generated in the background
    // so the upload response isn't held up by video processing.
    params.eager = "c_limit,w_1280,h_720,vc_auto,br_2m";
    params.eager_async = true;
  } else if (field === "avatar") {
    // Incoming transformation: replaces the stored original, so storage
    // itself stays small (unlike `eager`, which only adds a derived copy).
    params.transformation = "c_limit,w_512,h_512,q_auto";
  } else if (field !== "certificateOfOrigin") {
    params.transformation = "c_limit,w_1200,h_1200,q_auto";
  }

  return params;
};

export interface SignedUpload {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  publicId: string;
  overwrite: true;
  resourceType: CloudinaryResourceType;
  /** Exact extra form fields the browser must send alongside the above. */
  uploadParams: Record<string, string | number | boolean>;
}

export function signUpload(applicantId: string, field: UploadField): SignedUpload {
  const { cloudName, apiKey, apiSecret } = requireCredentials();
  const publicId = buildPublicId(applicantId, field);
  const timestamp = Math.floor(Date.now() / 1000);
  const uploadParams = buildUploadParams(publicId, field);

  const signature = cloudinary.utils.api_sign_request(
    { ...uploadParams, timestamp },
    apiSecret,
  );

  return {
    cloudName,
    apiKey,
    timestamp,
    signature,
    publicId,
    overwrite: true,
    resourceType: resourceTypeFor(field),
    uploadParams,
  };
}

/**
 * Integrity check for client-reported uploads: the publicId must be the exact
 * one we'd have issued, and the URL must be a Cloudinary delivery URL of the
 * right resource type in *our* cloud pointing at that publicId — otherwise a
 * client could store an arbitrary URL.
 */
export function assertValidUploadReference(
  applicantId: string,
  field: UploadField,
  url: string,
  publicId: string,
): void {
  const invalid = () =>
    errorUtilities.createError("Invalid upload reference", StatusCodes.BAD_REQUEST);

  if (publicId !== buildPublicId(applicantId, field)) throw invalid();

  const { cloudName } = requireCredentials();
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw invalid();
  }

  const prefix = `/${cloudName}/${resourceTypeFor(field)}/upload/`;
  if (
    parsed.protocol !== "https:" ||
    parsed.hostname !== "res.cloudinary.com" ||
    !parsed.pathname.startsWith(prefix) ||
    !decodeURIComponent(parsed.pathname).includes(`/${publicId}`)
  ) {
    throw invalid();
  }
}

// Matches the route's own Joi cap on the incoming `image` field — a
// defense-in-depth repeat of that check, not the only place it's enforced.
const SELFIE_DATA_URI_MAX_LENGTH = 1_400_000;
const SELFIE_DATA_URI_PATTERN = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;

/**
 * Uploads the applicant's own live-capture selfie — already in hand as a
 * base64 data URI, no network fetch needed — to Cloudinary as their
 * permanent avatar, at the deterministic avatar public_id (so a retry
 * overwrites in place). This is deliberately the selfie itself, not the
 * NIN record's own photo: it's what the applicant actually looks like
 * right now, captured at verification time, not however old/low-quality
 * their official ID photo happens to be.
 */
export async function uploadSelfieToAvatar(
  userId: string,
  selfieDataUri: string,
): Promise<{ url: string; publicId: string }> {
  const { cloudName, apiKey, apiSecret } = requireCredentials();
  const failed = (message: string) =>
    errorUtilities.createError(message, StatusCodes.BAD_GATEWAY);

  if (
    selfieDataUri.length > SELFIE_DATA_URI_MAX_LENGTH ||
    !SELFIE_DATA_URI_PATTERN.test(selfieDataUri)
  ) {
    throw failed("Could not save your photo. Please retake it and try again.");
  }

  try {
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
    const publicId = buildPublicId(userId, "avatar");

    const uploaded = await cloudinary.uploader.upload(selfieDataUri, {
      public_id: publicId,
      overwrite: true,
      invalidate: true,
      resource_type: "image",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [{ width: 512, height: 512, crop: "limit", quality: "auto" }],
    });

    return { url: uploaded.secure_url, publicId: uploaded.public_id };
  } catch (error: any) {
    console.error("Selfie avatar upload failed:", error.message);
    throw failed("Could not save your photo. Please retake it and try again.");
  }
}
