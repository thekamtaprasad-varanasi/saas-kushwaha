import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Single-tenant: यह table अब सिर्फ clinic settings store करती है — हमेशा एक ही row (id=1)
export const clinics = sqliteTable("clinics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone_receptionist: text("phone_receptionist").default(""),
  phone_pharmacy: text("phone_pharmacy").default(""),
  phone_psychologist: text("phone_psychologist").default(""),
  pin_receptionist: text("pin_receptionist").default(""),
  pin_pharmacy: text("pin_pharmacy").default(""),
  pin_psychologist: text("pin_psychologist").default(""),
  has_psychologist: integer("has_psychologist").default(0),
  created_at: text("created_at").default(sql`(datetime('now','localtime'))`),
  doctor_name: text("doctor_name").default(""),
  qualification: text("qualification").default(""),
  reg_no: text("reg_no").default(""),
  signature: text("signature").default(""),
  templates: text("templates").default("{}"),
  custom_meds: text("custom_meds").default("{}"),
  clinic_address: text("clinic_address").default(""),
  clinic_phone: text("clinic_phone").default(""),
  brands: text("brands").default("{}"),
  clinic_logo: text("clinic_logo").default(""),
});

export const patients = sqliteTable("patients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  created_at: text("created_at").default(sql`(datetime('now','localtime'))`),
});

export const prescriptions = sqliteTable("prescriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  patient_id: integer("patient_id")
    .notNull()
    .references(() => patients.id),
  visit_date: text("visit_date").default(sql`(datetime('now','localtime'))`),
  complaints: text("complaints").default(""),
  diagnosis: text("diagnosis").default(""),
  mse: text("mse").default(""),
  tests: text("tests").default(""),
  medicines: text("medicines").default(""),
  notes: text("notes").default(""),
  followup_date: text("followup_date").default(""),
  status: text("status").default("waiting"),
  weight: text("weight").default(""),
  bp: text("bp").default(""),
  sugar: text("sugar").default(""),
  reminder_sent: integer("reminder_sent").default(0),
  public_token: text("public_token").default(""),
});

export const assessments = sqliteTable("assessments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  prescription_id: integer("prescription_id").notNull(),
  mood: integer("mood"),
  history: text("history"),
  symptoms: text("symptoms"),
  notes: text("notes"),
  scales: text("scales").default("{}"),
  created_at: text("created_at").default(sql`(datetime('now'))`),
  updated_at: text("updated_at").default(sql`(datetime('now'))`),
});