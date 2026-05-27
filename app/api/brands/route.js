// app/api/brands/route.js

import { db } from '@/lib/db.js';
import { clinics } from '@/lib/schema.js';
import { getSession } from '@/lib/session.js';
import { NextResponse } from 'next/server';

async function getClinic() {
  const [c] = await db.select().from(clinics);
  return c;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clinic = await getClinic();
  if (!clinic) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let brands = {};
  try { brands = JSON.parse(clinic.brands || '{}'); } catch { brands = {}; }

  return NextResponse.json({ brands });
}

export async function PATCH(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.role !== 'pharmacy' && session.role !== 'doctor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();

  if (body.salt && (body.brand !== undefined || body.price !== undefined || body.expiry !== undefined || body.stock !== undefined)) {
    const clinic = await getClinic();
    if (!clinic) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    let brands = {};
    try { brands = JSON.parse(clinic.brands || '{}'); } catch { brands = {}; }

    const existing = brands[body.salt] || {};
    brands[body.salt] = {
      brand: body.brand !== undefined ? body.brand : (existing.brand || ''),
      price: body.price !== undefined ? body.price : (existing.price || ''),
      expiry: body.expiry !== undefined ? body.expiry : (existing.expiry || ''),
      stock: body.stock !== undefined ? body.stock : (existing.stock || ''),
    };

    await db.update(clinics).set({ brands: JSON.stringify(brands) });
    return NextResponse.json({ ok: true, salt: body.salt, mapping: brands[body.salt] });
  }

  if (body.brands && typeof body.brands === 'object') {
    await db.update(clinics).set({ brands: JSON.stringify(body.brands) });
    return NextResponse.json({ ok: true, brands: body.brands });
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}