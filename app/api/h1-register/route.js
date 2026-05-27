import { db } from "@/lib/db.js";
import { prescriptions, patients, clinics } from "@/lib/schema.js";
import { eq, and, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session.js";
import { checkExpiry } from "@/lib/access.js";

const DEVELOPER_EMAIL = "prasad.kamta@gmail.com";

const H1_DRUGS = [
  "alprazolam",
  "clonazepam",
  "diazepam",
  "lorazepam",
  "nitrazepam",
  "etizolam",
  "oxazepam",
  "zolpidem",
  "zopiclone",
  "eszopiclone",
  "methylphenidate",
  "atomoxetine",
  "buprenorphine",
  "tramadol",
  "codeine",
  "pentazocine",
  "phenobarbitone",
  "phenobarbital",
  "tapentadol",
  "ketamine",
];

export async function GET(request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await checkExpiry(session)))
    return NextResponse.json({ error: "expired" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  const rows = await db
    .select({
      id: prescriptions.id,
      visit_date: prescriptions.visit_date,
      medicines: prescriptions.medicines,
      patient_name: patients.name,
      patient_phone: patients.phone,
    })
    .from(prescriptions)
    .innerJoin(patients, eq(prescriptions.patient_id, patients.id))
    .where(
      and(
        eq(prescriptions.clinic_id, session.clinic_id),
        inArray(prescriptions.status, ["doctor_done", "dispensed"]),
      ),
    );

  const entries = [];
  for (const r of rows) {
    if (!r.medicines) continue;
    let meds;
    try {
      meds = JSON.parse(r.medicines);
    } catch {
      continue;
    }
    if (!Array.isArray(meds)) continue;

    for (const m of meds) {
      const base = (m.name || "").toLowerCase().split(" (")[0].trim();
      if (H1_DRUGS.some((h1) => base.includes(h1))) {
        entries.push({
          prescription_id: r.id,
          date: r.visit_date?.slice(0, 10) || "",
          patient_name: r.patient_name,
          patient_phone: r.patient_phone,
          drug_name: m.name,
          dose: m.dose,
          duration: m.duration,
        });
      }
    }
  }

  const filtered = entries.filter((e) => {
    if (from && e.date < from) return false;
    if (to && e.date > to) return false;
    return true;
  });

  filtered.sort((a, b) => (b.date > a.date ? 1 : -1));

  return NextResponse.json(filtered);
}
