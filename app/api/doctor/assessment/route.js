// app/api/doctor/assessment/route.js

import { db } from '@/lib/db.js';
import { assessments } from '@/lib/schema.js';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session.js';

export async function GET(request) {
  const session = await getSession();
  if (!session || session.role !== 'doctor')
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const prescription_id = parseInt(searchParams.get('prescription_id'));
  if (!prescription_id)
    return NextResponse.json({ error: 'Missing prescription_id' }, { status: 400 });

  const rows = await db.select()
    .from(assessments)
    .where(eq(assessments.prescription_id, prescription_id));

  if (rows.length === 0) return NextResponse.json(null);
  return NextResponse.json(rows[0]);
}