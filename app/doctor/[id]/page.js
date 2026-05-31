"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PrescriptionForm from "./PrescriptionForm";
import PrintView from "./PrintView";
import { SCALES } from "@/lib/scales";

const MSE_DEFAULT = {
  appearance: "",
  mood: "",
  affect: "",
  thought: "",
  perception: "",
  cognition: "",
  insight: "",
  judgement: "",
};

function parseMeds(raw) {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr)
      ? arr
          .filter((m) => m.name)
          .map((m) => ({
            name: m.name || "",
            dose: m.dose || "",
            timing: Array.isArray(m.timing) ? m.timing : [],
            duration: m.duration || "7 days",
            food: m.food || "After food",
          }))
      : [];
  } catch {
    return [];
  }
}

function parseMSE(raw) {
  if (!raw) return { ...MSE_DEFAULT };
  try {
    return { ...MSE_DEFAULT, ...JSON.parse(raw) };
  } catch {
    return { ...MSE_DEFAULT };
  }
}

export default function DoctorPrescriptionPage() {
  const { id } = useParams();
  const router = useRouter();

  const [prescription, setPrescription] = useState(null);
  const [patient, setPatient] = useState(null);
  const [clinic, setClinic] = useState(null);
  const [history, setHistory] = useState([]);
  const [assessment, setAssessment] = useState(null);

  const [complaints, setComplaints] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [tests, setTests] = useState("");
  const [mse, setMse] = useState({ ...MSE_DEFAULT });
  const [notes, setNotes] = useState("");
  const [followupDate, setFollowupDate] = useState("");
  const [medicines, setMedicines] = useState([
    { name: "", dose: "", timing: [], duration: "7 days", food: "After food" },
  ]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/prescriptions/${id}`);
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (res.status === 403) {
        window.location.href = "/expired";
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      setPrescription(data);

      if (data.complaints) setComplaints(data.complaints);
      if (data.diagnosis) setDiagnosis(data.diagnosis);
      if (data.tests) setTests(data.tests);
      if (data.mse) setMse(parseMSE(data.mse));
      if (data.notes) setNotes(data.notes);
      if (data.followup_date) setFollowupDate(data.followup_date);
      if (data.medicines) {
        const parsed = parseMeds(data.medicines);
        if (parsed.length > 0) setMedicines(parsed);
      }

      const aRes = await fetch(`/api/doctor/assessment?prescription_id=${id}`);
      if (aRes.ok) {
        const aData = await aRes.json();
        if (aData) setAssessment(aData);
      }

      const qRes = await fetch(
        `/api/prescriptions?patient_id=${data.patient_id}`,
      );
      if (qRes.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (qRes.status === 403) {
        window.location.href = "/expired";
        return;
      }
      if (!qRes.ok) return;
      const qData = await qRes.json();
      if (qData.length > 0)
        setPatient({
          name: qData[0].patient_name,
          phone: qData[0].patient_phone,
        });
      setHistory(
        qData
          .filter((r) => r.id !== Number(id) && r.status === "doctor_done")
          .sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date)),
      );

      const sRes = await fetch("/api/settings");
      if (sRes.ok) setClinic(await sRes.json());
    }
    load();
  }, [id]);

  async function handleSave(andPrint = false) {
    setSaving(true);
    const res = await fetch(`/api/prescriptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        complaints,
        diagnosis,
        tests,
        mse: JSON.stringify(mse),
        medicines: JSON.stringify(medicines),
        notes,
        followup_date: followupDate,
        status: "doctor_done",
      }),
    });
    setSaving(false);
    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }
    if (res.status === 403) {
      window.location.href = "/expired";
      return;
    }
    if (!res.ok) return;
    setSaved(true);
    if (andPrint) window.print();
  }

  if (!prescription)
    return <p className="text-center mt-20 text-gray-400">Loading...</p>;

  return (
    <>
      <style>{`
        @media print { .no-print { display: none !important; } body { background: white; } }
      `}</style>

      <main className="min-h-screen bg-emerald-50 p-4 pb-4 no-print">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => router.back()}
            className="text-emerald-700 text-sm mb-4 mt-2 flex items-center gap-1"
          >
            ← Back to Queue
          </button>

          {/* Patient Card */}
          <div className="bg-white rounded-2xl shadow p-4 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-lg text-gray-800">
                  {patient?.name}
                </p>
                <p className="text-sm text-gray-500">{patient?.phone}</p>
              </div>
              <span className="text-xs text-gray-400">
                Token #{prescription.id}
              </span>
            </div>
          </div>

          {/* Chief Complaints Card — editable, always visible */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
            <label className="block text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">
              📋 Chief Complaints
            </label>
            <textarea
              value={complaints}
              onChange={(e) => setComplaints(e.target.value)}
              placeholder="Enter complaints..."
              rows={2}
              className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Vitals Card */}
          {(prescription.weight || prescription.bp) && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">
                Vitals (today)
              </p>
              <div className="flex gap-4 text-sm">
                {prescription.weight && (
                  <div>
                    <span className="text-gray-500">Weight: </span>
                    <span className="font-semibold text-gray-800">
                      {prescription.weight} kg
                    </span>
                  </div>
                )}
                {prescription.bp && (
                  <div>
                    <span className="text-gray-500">BP: </span>
                    <span className="font-semibold text-gray-800">
                      {prescription.bp}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Psychologist Assessment Card */}
          {assessment && (
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 mb-4">
              <p className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                🧠 Psychologist Assessment
              </p>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-24 flex-shrink-0">Mood</span>
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex-1 bg-purple-100 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${(assessment.mood / 10) * 100}%` }}
                      />
                    </div>
                    <span className="font-bold text-purple-700">
                      {assessment.mood}/10
                    </span>
                  </div>
                </div>
                {assessment.history && (
                  <div>
                    <span className="text-gray-500 text-xs">History</span>
                    <p className="text-gray-800 mt-0.5 bg-white rounded-xl px-3 py-2 text-xs">
                      {assessment.history}
                    </p>
                  </div>
                )}
                {assessment.symptoms && (
                  <div>
                    <span className="text-gray-500 text-xs">Symptoms</span>
                    <p className="text-gray-800 mt-0.5 bg-white rounded-xl px-3 py-2 text-xs">
                      {assessment.symptoms}
                    </p>
                  </div>
                )}
                {assessment.notes && (
                  <div>
                    <span className="text-gray-500 text-xs">Notes</span>
                    <p className="text-gray-800 mt-0.5 bg-white rounded-xl px-3 py-2 text-xs">
                      {assessment.notes}
                    </p>
                  </div>
                )}
                {(() => {
                  let scales = {};
                  try {
                    scales = JSON.parse(assessment.scales || "{}");
                  } catch {
                    scales = {};
                  }
                  const entries = Object.keys(scales);
                  if (entries.length === 0) return null;
                  const COLOR = {
                    emerald: "bg-emerald-500",
                    lime: "bg-lime-500",
                    amber: "bg-amber-500",
                    orange: "bg-orange-500",
                    red: "bg-red-500",
                    indigo: "bg-indigo-500",
                    gray: "bg-gray-400",
                  };
                  return (
                    <div className="mt-1">
                      <span className="text-gray-500 text-xs">
                        Rating Scales
                      </span>
                      <div className="flex flex-col gap-1.5 mt-1">
                        {SCALES.filter((s) => scales[s.id]?.result).map((s) => {
                          const r = scales[s.id].result;
                          return (
                            <div
                              key={s.id}
                              className="bg-white rounded-xl px-3 py-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-700">
                                  {s.name}
                                </span>
                                <span
                                  className={`text-[11px] font-bold text-white px-2 py-0.5 rounded-full ${COLOR[r.color] || COLOR.gray}`}
                                >
                                  {r.total}/{r.max} · {r.label}
                                </span>
                              </div>
                              {r.detail && (
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {r.detail.map((d, di) => (
                                    <span
                                      key={di}
                                      className="text-[10px] text-gray-500"
                                    >
                                      {d.name}: <strong>{d.score}</strong> (
                                      {d.label})
                                    </span>
                                  ))}
                                </div>
                              )}
                              {r.alert && (
                                <p className="text-[10px] text-red-600 font-semibold mt-1">
                                  ⚠ {r.alert}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          <PrescriptionForm
            complaints={complaints}
            setComplaints={setComplaints}
            diagnosis={diagnosis}
            setDiagnosis={setDiagnosis}
            mse={mse}
            setMse={setMse}
            tests={tests}
            setTests={setTests}
            medicines={medicines}
            setMedicines={setMedicines}
            notes={notes}
            setNotes={setNotes}
            followupDate={followupDate}
            setFollowupDate={setFollowupDate}
            history={history}
            saving={saving}
            saved={saved}
            onSave={handleSave}
          />
        </div>
      </main>

      <PrintView
        prescription={prescription}
        patient={patient}
        clinic={clinic}
        medicines={medicines}
        mse={mse}
        tests={tests}
        notes={notes}
        followupDate={followupDate}
        complaints={complaints}
        diagnosis={diagnosis}
      />
    </>
  );
}
