import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload a base64-encoded image (or a remote URL) to Cloudinary.
 * Returns the secure URL to store in MongoDB.
 */
export async function uploadImage(
  file: string, // base64 data URI or remote URL
  folder = "brew-memoir"
): Promise<string> {
  const result = await cloudinary.uploader.upload(file, {
    folder,
    resource_type: "image",
    // Resize to a sensible max so we don't blow the free-tier quota
    transformation: [{ width: 1200, height: 1200, crop: "limit", quality: "auto" }],
  });
  return result.secure_url;
}

/**
 * Delete an image from Cloudinary by its public ID.
 * The public ID is the path portion of the URL without the extension,
 * e.g. "brew-memoir/abc123".
 */
export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

/**
 * Extract the Cloudinary public ID from a secure URL.
 * e.g. "https://res.cloudinary.com/<cloud>/image/upload/v1234/brew-memoir/abc.jpg"
 *   → "brew-memoir/abc"
 */
export function getPublicId(url: string): string {
  const parts = url.split("/upload/");
  if (parts.length < 2) return "";
  // Strip the version segment (v1234/) and file extension
  const withoutVersion = parts[1].replace(/^v\d+\//, "");
  return withoutVersion.replace(/\.[^/.]+$/, "");
}
