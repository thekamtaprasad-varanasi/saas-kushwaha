// app/api/rx/[token]/route.js

import { db } from '@/lib/db.js';
import { prescriptions, patients, clinics } from '@/lib/schema.js';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { token } = await params;
  if (!token || token.length < 10) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }

  const [row] = await db.select({
    id: prescriptions.id,
    visit_date: prescriptions.visit_date,
    complaints: prescriptions.complaints,
    mse: prescriptions.mse,
    tests: prescriptions.tests,
    medicines: prescriptions.medicines,
    notes: prescriptions.notes,
    followup_date: prescriptions.followup_date,
    patient_name: patients.name,
    patient_phone: patients.phone,
    clinic_name: clinics.name,
  })
    .from(prescriptions)
    .innerJoin(patients, eq(prescriptions.patient_id, patients.id))
    .innerJoin(clinics, eq(clinics.id, 1))
    .where(eq(prescriptions.public_token, token));

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(row);
}