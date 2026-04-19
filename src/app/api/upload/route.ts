import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/session";
import { uploadImage } from "@/lib/cloudinary";
import { uploadLimiter } from "@/lib/ratelimit";

// ---------------------------------------------------------------------------
// POST /api/upload
//
// Accepts a multipart/form-data request with a single "file" field.
// Reads the image, encodes it as a base64 data URI, and uploads it to
// Cloudinary. Returns the secure URL to store in the entry document.
//
// Client usage (entry/new form):
//   const form = new FormData();
//   form.append("file", fileInput.files[0]);
//   const res = await fetch("/api/upload", { method: "POST", body: form });
//   const { photoUrl } = await res.json();
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  let session: Awaited<ReturnType<typeof getAuthSession>>;
  try {
    session = await getAuthSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (uploadLimiter) {
    try {
      const { success } = await uploadLimiter.limit(session.user.id);
      if (!success) {
        return NextResponse.json(
          { error: "Upload limit reached. Try again later." },
          { status: 429 }
        );
      }
    } catch (err) {
      console.error("[upload] rate limit check failed:", err);
    }
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing file field" }, { status: 400 });
  }

  // Validate type and size (max 8 MB)
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are supported" }, { status: 415 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "File exceeds 8 MB limit" }, { status: 413 });
  }

  // Convert Blob → base64 data URI for Cloudinary's uploader
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const dataUri = `data:${file.type};base64,${base64}`;

  try {
    const photoUrl = await uploadImage(dataUri);
    return NextResponse.json({ photoUrl }, { status: 201 });
  } catch (err) {
    console.error("[upload] Cloudinary error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 502 });
  }
}
