// app/api/settings/route.js

import { db } from "@/lib/db.js";
import { clinics } from "@/lib/schema.js";
import { getSession } from "@/lib/session.js";
import { NextResponse } from "next/server";

export async function PATCH(request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const allowed = [
    "pin_receptionist",
    "pin_pharmacy",
    "pin_psychologist",
    "phone_receptionist",
    "phone_pharmacy",
    "phone_psychologist",
    "has_psychologist",
    "name",
    "doctor_name",
    "qualification",
    "reg_no",
    "signature",
    "clinic_address",
    "clinic_phone",
    "clinic_logo",
    "templates",
    "custom_meds",
  ];
  const update = {};
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key];
  }

  const [clinic] = await db.select().from(clinics);
  if (!clinic)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.update(clinics).set(update);
  const [updated] = await db.select().from(clinics);
  return NextResponse.json(updated);
}

export async function GET() {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [result] = await db.select().from(clinics);
  if (!result)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(result);
}