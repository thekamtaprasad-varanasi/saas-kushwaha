"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function buildMessage(patientName, clinicName, followupDate) {
  const msg = `Namaste ${patientName} ji,\n\nYeh reminder hai ki aapki follow-up visit ${clinicName} par ${followupDate} ko hai.\n\nKripya time par aayen. Dawa niyamit le rahe hain na?\n\nDhanyavaad.`;
  return encodeURIComponent(msg);
}

function normalizePhone(phone) {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.length === 10) return "91" + digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  return digits;
}

export default function RemindersPage() {
  const router = useRouter();
  const [mode, setMode] = useState("today");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sent, setSent] = useState({});

  async function fetchList(m) {
    setLoading(true);
    const res = await fetch(`/api/reminders?mode=${m}`);
    if (!res.ok) {
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (res.status === 403) {
        window.location.href = "/expired";
        return;
      }
      setLoading(false);
      return;
    }
    const data = await res.json();
    setList(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    fetchList(mode);
  }, [mode]);

  function openWhatsApp(row) {
    const phone = normalizePhone(row.patient_phone);
    const msg = buildMessage(
      row.patient_name,
      row.clinic_name || "the clinic",
      row.followup_date,
    );
    const url = `https://wa.me/${phone}?text=${msg}`;
    window.open(url, "_blank");
    setSent((prev) => ({ ...prev, [row.prescription_id]: true }));
  }

  return (
    <>
      <main className="min-h-screen bg-emerald-50 p-4 pb-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => router.back()}
            className="text-emerald-700 text-sm mb-3 mt-2"
          >
            ← Back
          </button>

          <h1 className="text-2xl font-bold text-emerald-800 mb-1">
            Follow-up Reminders
          </h1>
          <p className="text-xs text-gray-500 mb-4">
            WhatsApp will open in one tap. Message is pre-filled. Just press
            Send.
          </p>

          <div className="bg-white rounded-2xl shadow p-2 mb-4 flex gap-1">
            <button
              onClick={() => setMode("today")}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${mode === "today" ? "bg-emerald-600 text-white" : "text-gray-600"}`}
            >
              Today
            </button>
            <button
              onClick={() => setMode("upcoming")}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${mode === "upcoming" ? "bg-emerald-600 text-white" : "text-gray-600"}`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setMode("overdue")}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${mode === "overdue" ? "bg-red-500 text-white" : "text-gray-600"}`}
            >
              Overdue
            </button>
          </div>

          {loading && (
            <p className="text-center text-gray-400 mt-10">Loading...</p>
          )}

          {!loading && list.length === 0 && (
            <p className="text-center text-gray-400 mt-10">
              {mode === "today" && "No follow-ups today."}
              {mode === "upcoming" && "No upcoming follow-ups."}
              {mode === "overdue" && "No overdue follow-ups."}
            </p>
          )}

          <div className="flex flex-col gap-3">
            {list.map((row) => (
              <div
                key={row.prescription_id}
                className="bg-white rounded-2xl shadow p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {row.patient_name}
                    </p>
                    <p className="text-sm text-gray-500">{row.patient_phone}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      mode === "overdue"
                        ? "bg-red-100 text-red-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {row.followup_date}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  Token #{row.prescription_id} · Last visit:{" "}
                  {row.visit_date?.slice(0, 10)}
                </p>

                <button
                  onClick={() => openWhatsApp(row)}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 ${
                    sent[row.prescription_id]
                      ? "bg-gray-200 text-gray-600"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {sent[row.prescription_id]
                    ? "✓ Opened — re-send?"
                    : "📱 Send via WhatsApp"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
