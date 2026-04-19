import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getAuthSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Entry, Cafe } from "@/lib/models";
import { deleteImage, getPublicId } from "@/lib/cloudinary";

const DEV_USER_ID = "000000000000000000000001";
function isBypassAuth() {
  return process.env.BYPASS_AUTH === "true" && process.env.NODE_ENV !== "production";
}

async function getUserId(): Promise<string | null> {
  try {
    const session = await getAuthSession();
    return session.user.id;
  } catch {
    return isBypassAuth() ? DEV_USER_ID : null;
  }
}

// ---------------------------------------------------------------------------
// Shared ownership guard
//
// Fetches the entry and verifies it belongs to the requesting user.
// Returns the lean document or a NextResponse error to return early.
// ---------------------------------------------------------------------------

async function getOwnedEntry(id: string, userId: string) {
  if (!Types.ObjectId.isValid(id)) {
    return { error: NextResponse.json({ error: "Invalid entry ID" }, { status: 400 }) };
  }

  const entry = await Entry.findById(id).lean();

  if (!entry) {
    return { error: NextResponse.json({ error: "Entry not found" }, { status: 404 }) };
  }

  if (entry.userId.toString() !== userId) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { entry };
}

// ---------------------------------------------------------------------------
// GET /api/entries/[id]
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const result = await getOwnedEntry(id, userId);
  if ("error" in result) return result.error;

  return NextResponse.json(result.entry);
}

// ---------------------------------------------------------------------------
// DELETE /api/entries/[id]
//
// Deletes the entry. If the entry has a photoUrl, the corresponding
// Cloudinary asset is also removed to avoid orphaned uploads.
// ---------------------------------------------------------------------------

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const result = await getOwnedEntry(id, userId);
  if ("error" in result) return result.error;

  const { entry } = result;

  // Clean up Cloudinary asset if one was attached
  if (entry.photoUrl) {
    try {
      await deleteImage(getPublicId(entry.photoUrl));
    } catch (err) {
      // Log but don't fail the request — the DB record is the source of truth
      console.error("[entries/delete] Cloudinary cleanup failed:", err);
    }
  }

  await Entry.findByIdAndDelete(id);

  // Clean up the cafe if it's now empty and hasn't been customized
  if (entry.cafeId) {
    const remaining = await Entry.countDocuments({ cafeId: entry.cafeId });
    if (remaining === 0) {
      await Cafe.deleteOne({
        _id: entry.cafeId,
        isFavorite: false,
        tags: { $size: 0 },
      });
    }
  }

  return new NextResponse(null, { status: 204 });
}
