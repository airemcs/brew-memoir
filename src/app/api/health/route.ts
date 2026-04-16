import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";

// ---------------------------------------------------------------------------
// GET /api/health
//
// Public endpoint — excluded from auth middleware.
// Verifies the MongoDB connection is alive by running a lightweight ping.
// Remove or restrict this route before going to production.
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    await connectDB();

    // Ping the deployment to confirm the connection is usable
    await mongoose.connection.db!.admin().ping();

    return NextResponse.json({
      status: "ok",
      mongodb: "connected",
      db: mongoose.connection.name,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { status: "error", mongodb: "disconnected", message },
      { status: 503 }
    );
  }
}
