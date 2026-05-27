// app/api/prescriptions/route.js

import { db } from "@/lib/db.js";
import { prescriptions, patients } from "@/lib/schema.js";
import { eq, and, lt, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session.js";

export async function GET(request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const patient_id = searchParams.get("patient_id");

  if (status === "doctor_done") {
    await db
      .update(prescriptions)
      .set({ status: "lapsed" })
      .where(
        and(
          eq(prescriptions.status, "doctor_done"),
          lt(prescriptions.visit_date, sql`date('now', 'start of day')`),
        ),
      );
  }

  const rows = await db
    .select({
      id: prescriptions.id,
      patient_id: prescriptions.patient_id,
      visit_date: prescriptions.visit_date,
      complaints: prescriptions.complaints,
      diagnosis: prescriptions.diagnosis,
      mse: prescriptions.mse,
      tests: prescriptions.tests,
      medicines: prescriptions.medicines,
      notes: prescriptions.notes,
      followup_date: prescriptions.followup_date,
      status: prescriptions.status,
      patient_name: patients.name,
      patient_phone: patients.phone,
    })
    .from(prescriptions)
    .innerJoin(patients, eq(prescriptions.patient_id, patients.id));

  let filtered = rows;
  if (status) filtered = filtered.filter((r) => r.status === status);
  if (patient_id)
    filtered = filtered.filter((r) => r.patient_id === parseInt(patient_id));

  return NextResponse.json(filtered);
}

export async function POST(request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { patient_id, complaints, status, weight, bp, sugar } =
    await request.json();

  if (!patient_id)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const initialStatus = status || "waiting";
  const publicToken = crypto.randomUUID() + crypto.randomUUID().slice(0, 8);

  await db.insert(prescriptions).values({
    patient_id,
    complaints: complaints || "",
    status: initialStatus,
    public_token: publicToken,
    weight: weight || "",
    bp: bp || "",
    sugar: sugar || "",
  });

  const [created] = await db
    .select()
    .from(prescriptions)
    .where(eq(prescriptions.patient_id, patient_id))
    .orderBy(sql`${prescriptions.id} DESC`)
    .limit(1);

  return NextResponse.json(created);
}