// app/api/patients/route.js

import { db } from "@/lib/db.js";
import { patients } from "@/lib/schema.js";
import { eq, like } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session.js";

export async function GET(request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");
  const name = searchParams.get("name");

  if (phone) {
    const result = await db
      .select()
      .from(patients)
      .where(eq(patients.phone, phone));
    return NextResponse.json(result);
  }

  if (name && name.trim().length >= 2) {
    const result = await db
      .select()
      .from(patients)
      .where(like(patients.name, `%${name.trim()}%`))
      .limit(30);
    return NextResponse.json(result);
  }

  const result = await db.select().from(patients);
  return NextResponse.json(result);
}

export async function POST(request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { name, phone } = await request.json();

  if (!name || !phone) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(patients)
    .where(eq(patients.phone, phone));

  let patient;
  if (existing.length > 0) {
    patient = existing[0];
  } else {
    await db.insert(patients).values({ name, phone });
    const [inserted] = await db
      .select()
      .from(patients)
      .where(eq(patients.phone, phone));
    patient = inserted;
  }

  return NextResponse.json(patient);
}