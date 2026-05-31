"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

function fmtIST(visitDate) {
  if (!visitDate) return "";
  const iso = visitDate.includes("T") ? visitDate : visitDate.replace(" ", "T");
  const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function waitTime(visitDate) {
  if (!visitDate) return "";
  // DB stores UTC without 'Z' — treat as UTC, not local
  const iso = visitDate.includes("T") ? visitDate : visitDate.replace(" ", "T");
  const then = new Date(iso.endsWith("Z") ? iso : iso + "Z");
  const now = new Date();
  const mins = Math.floor((now - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem === 0 ? `${hrs} hr` : `${hrs}h ${rem}m`;
}

export default function DoctorQueuePage() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [clinic, setClinic] = useState(null);

  async function fetchQueue(silent = false) {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/prescriptions?status=waiting");
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
      const sorted = (Array.isArray(data) ? data : []).sort(
        (a, b) => new Date(a.visit_date) - new Date(b.visit_date),
      );
      setQueue(sorted);
      setLastRefresh(new Date());
    } catch (e) {
      console.error("fetchQueue error:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let interval;

    async function init() {
      try {
        const s = await fetch("/api/settings");

        if (s.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (s.status === 403) {
          window.location.href = "/expired";
          return;
        }
        if (!s.ok) {
          setLoading(false);
          return;
        }

        const data = await s.json();
        setClinic(data);

        // First-time: clinic name not set yet
        if (!data?.name) {
          window.location.href = "/doctor/settings?first=1";
          return;
        }

        await fetchQueue();
        interval = setInterval(() => fetchQueue(true), 15000);
      } catch (e) {
        console.error("Doctor init error:", e);
        setLoading(false);
      }
    }

    init();
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <>
      <main className="min-h-screen bg-emerald-50 p-4 pb-4">
        <div className="max-w-md mx-auto">
          {/* Clinic Info Card */}
          {clinic?.name && (
            <div className="bg-white rounded-2xl shadow p-4 mb-4 mt-4 flex items-center gap-3">
              {clinic.clinic_logo && (
                <img
                  src={clinic.clinic_logo}
                  alt="logo"
                  className="h-12 w-12 object-contain rounded-xl border border-gray-100"
                />
              )}
              <div className="min-w-0">
                <p className="font-bold text-emerald-800 text-base leading-tight truncate">
                  {clinic.name}
                </p>
                {clinic.doctor_name && (
                  <p className="text-sm text-gray-600 truncate">
                    {clinic.doctor_name}
                    {clinic.qualification ? ` · ${clinic.qualification}` : ""}
                  </p>
                )}
                {clinic.clinic_address && (
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {clinic.clinic_address}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Queue Header */}
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-emerald-800">
              Patient Queue{" "}
              {queue.length > 0 && (
                <span className="text-lg text-emerald-600">
                  ({queue.length})
                </span>
              )}
            </h1>
            <button
              onClick={() => fetchQueue()}
              className="text-sm text-emerald-600 border border-emerald-300 px-3 py-1 rounded-lg"
            >
              Refresh
            </button>
          </div>

          {lastRefresh && (
            <p className="text-xs text-gray-400 mb-4">
              Auto-refreshes every 15s · Last:{" "}
              {lastRefresh.toLocaleTimeString()}
            </p>
          )}

          {loading && (
            <p className="text-gray-400 text-center mt-10">Loading...</p>
          )}

          {!loading && queue.length === 0 && (
            <p className="text-gray-400 text-center mt-10">
              No pending patients
            </p>
          )}

          <div className="flex flex-col gap-3">
            {queue.map((p, idx) => (
              <Link
                key={p.id}
                href={`/doctor/${p.id}`}
                className="bg-white rounded-2xl shadow p-4 flex flex-col gap-1 hover:shadow-md active:scale-95 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-600 text-white text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-gray-800">
                      {p.patient_name}
                    </span>
                  </div>
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                    {waitTime(p.visit_date)}
                  </span>
                </div>
                <span className="text-sm text-gray-500 ml-9">
                  {p.patient_phone}
                </span>
                {p.complaints && (
                  <span className="text-sm text-gray-600 mt-1 ml-9">
                    &quot;{p.complaints}&quot;
                  </span>
                )}
                <span className="text-xs text-gray-400 mt-1 ml-9">
                  Token #{p.id} · {fmtIST(p.visit_date)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
