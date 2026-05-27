// app/api/prescriptions/[id]/route.js

import { db } from '@/lib/db.js';
import { prescriptions } from '@/lib/schema.js';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session.js';

export async function GET(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await params;
  const pid = parseInt(id);
  if (!pid) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const result = await db.select().from(prescriptions).where(eq(prescriptions.id, pid));
  if (result.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(result[0]);
}

export async function PATCH(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await params;
  const pid = parseInt(id);
  if (!pid) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const body = await request.json();
  const allowed = ['complaints', 'diagnosis', 'tests', 'mse', 'medicines', 'notes', 'followup_date', 'status'];
  const update = {};
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key];
  }

  await db.update(prescriptions).set(update).where(eq(prescriptions.id, pid));

  const [updated] = await db.select().from(prescriptions).where(eq(prescriptions.id, pid));
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}