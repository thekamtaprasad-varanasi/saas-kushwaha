// app/api/auth/callback/route.js

import { google } from "@/lib/google.js";
import { db } from "@/lib/db.js";
import { clinics } from "@/lib/schema.js";
import { createSession, setSessionCookieOnResponse } from "@/lib/session.js";
import { ALLOWED_EMAILS } from "@/lib/config.js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const cookieStore = await cookies();
  const savedState = cookieStore.get("google_state")?.value;
  const codeVerifier = cookieStore.get("google_code_verifier")?.value;

  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.redirect(new URL("/login?error=invalid", request.url));
  }

  try {
    const tokens = await google.validateAuthorizationCode(code, codeVerifier);
    const accessToken = tokens.accessToken();

    const userRes = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!userRes.ok) {
      return NextResponse.redirect(new URL("/login?error=failed", request.url));
    }

    const user = await userRes.json();

    if (!user || !user.email) {
      return NextResponse.redirect(new URL("/login?error=failed", request.url));
    }

    if (!ALLOWED_EMAILS.includes(user.email)) {
      return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
    }

    const [clinic] = await db.select().from(clinics);
    if (!clinic) {
      return NextResponse.redirect(new URL("/login?error=setup", request.url));
    }

    const token = await createSession({
      clinic_id: clinic.id,
      name: clinic.name,
      email: user.email,
      role: "doctor",
    });

    const response = NextResponse.redirect(new URL("/doctor", request.url));
    return setSessionCookieOnResponse(response, token);

  } catch (e) {
    console.error("Auth Callback Error:", e);
    return NextResponse.redirect(new URL("/login?error=failed", request.url));
  }
}