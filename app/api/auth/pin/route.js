// app/api/auth/pin/route.js

import { db } from "@/lib/db.js";
import { clinics } from "@/lib/schema.js";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

const ROLE_CONFIG = {
  receptionist: {
    phoneField: "phone_receptionist",
    pinField: "pin_receptionist",
    cookie: "receptionist_session",
  },
  pharmacy: {
    phoneField: "phone_pharmacy",
    pinField: "pin_pharmacy",
    cookie: "pharmacy_session",
  },
  psychologist: {
    phoneField: "phone_psychologist",
    pinField: "pin_psychologist",
    cookie: "psychologist_session",
  },
};

export async function POST(request) {
  const { phone, pin, role } = await request.json();

  if (!phone || !pin || !role)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  if (!ROLE_CONFIG[role])
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  const { phoneField, pinField, cookie: cookieName } = ROLE_CONFIG[role];

  const [clinic] = await db.select().from(clinics);

  if (!clinic || clinic[phoneField] !== phone || clinic[pinField] !== pin)
    return NextResponse.json(
      { error: "Wrong mobile number or PIN" },
      { status: 401 },
    );

  const token = await new SignJWT({ clinic_id: clinic.id, role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("12h")
    .sign(SECRET);

  const cookieStore = await cookies();
  cookieStore.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12,
    path: "/",
    sameSite: "lax",
  });

  return NextResponse.json({ success: true });
}