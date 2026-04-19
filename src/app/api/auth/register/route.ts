import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import { hashPassword } from "@/lib/utils";
import { registerLimiter, getIp } from "@/lib/ratelimit";
import { SignUpSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  if (registerLimiter) {
    try {
      const ip = getIp(req.headers);
      const { success, reset } = await registerLimiter.limit(ip);
      if (!success) {
        return NextResponse.json(
          { error: "Too many registration attempts. Try again later." },
          {
            status: 429,
            headers: { "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)) },
          }
        );
      }
    } catch (err) {
      // Upstash unreachable — fail open so registration still works.
      console.error("[register] rate limit check failed:", err);
    }
  }

  const body = await req.json().catch(() => null);
  const parsed = SignUpSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;

  await connectDB();

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  await User.create({
    name,
    email: email.toLowerCase(),
    authProvider: "credentials",
    passwordHash,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
