"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

function fmtDate(raw) {
  if (!raw) return "";
  const iso = raw.includes("T") ? raw : raw.replace(" ", "T");
  const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
  return d.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtDateTime(raw) {
  if (!raw) return "";
  const iso = raw.includes("T") ? raw : raw.replace(" ", "T");
  const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

const STATUS_LABEL = {
  waiting: { label: "Waiting", color: "bg-yellow-100 text-yellow-700" },
  doctor_done: { label: "Done", color: "bg-blue-100 text-blue-700" },
  dispensed: { label: "Dispensed", color: "bg-green-100 text-green-700" },
  lapsed: { label: "Lapsed", color: "bg-gray-100 text-gray-500" },
  psychologist: { label: "Psychology", color: "bg-purple-100 text-purple-700" },
};

const EXACT_ONLY = ["/", "/doctor", "/receptionist", "/psychologist"];

export default function PatientSearchPage() {
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHx, setLoadingHx] = useState(false);
  const [searchDone, setSearchDone] = useState(false);

  useEffect(() => {
    const q = query.trim();
    const isPhone = /^\d{10}$/.test(q);
    const isName = !isPhone && q.length >= 2;

    if (!isPhone && !isName) {
      setPatients([]);
      setSearchDone(false);
      return;
    }

    setSearching(true);
    setSearchDone(false);
    setSelected(null);
    setHistory([]);

    const param = isPhone ? `phone=${q}` : `name=${encodeURIComponent(q)}`;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/patients?${param}`);
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (res.status === 403) {
          window.location.href = "/expired";
          return;
        }
        const data = res.ok ? await res.json() : [];
        setPatients(Array.isArray(data) ? data : []);
      } catch {
        setPatients([]);
      } finally {
        setSearching(false);
        setSearchDone(true);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const loadHistory = useCallback(async (patient) => {
    setSelected(patient);
    setHistory([]);
    setLoadingHx(true);
    try {
      const res = await fetch(`/api/prescriptions?patient_id=${patient.id}`);
      if (!res.ok) return;
      const data = await res.json();
      const sorted = (Array.isArray(data) ? data : []).sort(
        (a, b) => new Date(b.visit_date) - new Date(a.visit_date),
      );
      setHistory(sorted);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHx(false);
    }
  }, []);

  function clear() {
    setQuery("");
    setPatients([]);
    setSelected(null);
    setHistory([]);
    setSearchDone(false);
  }

  return (
    <>
      <main className="min-h-screen bg-emerald-50 p-4 pb-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold text-emerald-800 mt-4 mb-4">
            Patient Search
          </h1>

          {/* Search box */}
          <div className="relative mb-4">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
              🔍
            </span>
            <input
              type="text"
              inputMode="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name or 10-digit mobile number"
              className="w-full border border-gray-300 rounded-2xl pl-11 pr-10 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white shadow-sm"
              autoFocus
            />
            {query.length > 0 && (
              <button
                onClick={clear}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl leading-none"
              >
                ×
              </button>
            )}
          </div>

          {/* Hint */}
          {query.trim().length === 0 && (
            <p className="text-sm text-gray-400 text-center mt-8">
              Type at least 2 letters of name
              <br />
              or full 10-digit number
            </p>
          )}

          {/* Searching */}
          {searching && (
            <p className="text-sm text-gray-400 text-center mt-6">
              Searching...
            </p>
          )}

          {/* No results */}
          {!searching && searchDone && patients.length === 0 && !selected && (
            <p className="text-sm text-gray-500 text-center mt-6">
              No patient found
            </p>
          )}

          {/* Patient list */}
          {!selected && patients.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-gray-400 mb-1">
                {patients.length} patient{patients.length > 1 ? "s" : ""} found
                — tap to view history
              </p>
              {patients.map((p) => (
                <button
                  key={p.id}
                  onClick={() => loadHistory(p)}
                  className="bg-white rounded-2xl shadow px-4 py-3 flex items-center gap-3 text-left w-full hover:shadow-md active:scale-95 transition"
                >
                  <span className="bg-emerald-100 text-emerald-700 font-bold rounded-full w-10 h-10 flex items-center justify-center text-base shrink-0">
                    {p.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate">
                      {p.name}
                    </p>
                    <p className="text-sm text-gray-500">{p.phone}</p>
                  </div>
                  <span className="ml-auto text-gray-300 text-xl">›</span>
                </button>
              ))}
            </div>
          )}

          {/* Selected patient + history */}
          {selected && (
            <div>
              {/* Patient header */}
              <div className="bg-white rounded-2xl shadow p-4 mb-4 flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelected(null);
                    setHistory([]);
                  }}
                  className="text-emerald-700 text-sm font-semibold shrink-0"
                >
                  ← Back
                </button>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="bg-emerald-100 text-emerald-700 font-bold rounded-full w-10 h-10 flex items-center justify-center text-base shrink-0">
                    {selected.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800 truncate">
                      {selected.name}
                    </p>
                    <p className="text-sm text-gray-500">{selected.phone}</p>
                  </div>
                </div>
              </div>

              {/* Loading history */}
              {loadingHx && (
                <p className="text-sm text-gray-400 text-center mt-6">
                  Loading visit history...
                </p>
              )}

              {/* No visits */}
              {!loadingHx && history.length === 0 && (
                <p className="text-sm text-gray-500 text-center mt-6">
                  No visits found
                </p>
              )}

              {/* Visit count */}
              {!loadingHx && history.length > 0 && (
                <p className="text-xs text-gray-400 mb-3">
                  {history.length} visit{history.length > 1 ? "s" : ""} total
                </p>
              )}

              {/* Timeline */}
              <div className="flex flex-col gap-0">
                {history.map((rx, idx) => {
                  const st = STATUS_LABEL[rx.status] || {
                    label: rx.status,
                    color: "bg-gray-100 text-gray-500",
                  };
                  const isLast = idx === history.length - 1;

                  return (
                    <div key={rx.id} className="flex gap-3">
                      {/* Timeline spine */}
                      <div className="flex flex-col items-center shrink-0 w-6">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 mt-4 shrink-0 z-10" />
                        {!isLast && (
                          <span className="w-0.5 flex-1 bg-emerald-200 mt-0.5" />
                        )}
                      </div>

                      {/* Visit card */}
                      <Link
                        href={`/doctor/${rx.id}`}
                        className="flex-1 bg-white rounded-2xl shadow p-4 mb-3 hover:shadow-md active:scale-95 transition block"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-bold text-gray-800">
                            {fmtDate(rx.visit_date)}
                          </p>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${st.color}`}
                          >
                            {st.label}
                          </span>
                        </div>

                        {rx.diagnosis && (
                          <p className="text-sm text-emerald-700 font-semibold mb-1 truncate">
                            Dx: {rx.diagnosis}
                          </p>
                        )}

                        {rx.complaints && (
                          <p className="text-xs text-gray-500 truncate mb-1">
                            CC: {rx.complaints}
                          </p>
                        )}

                        {(() => {
                          try {
                            const meds = JSON.parse(rx.medicines || "[]");
                            if (Array.isArray(meds) && meds.length > 0) {
                              return (
                                <p className="text-xs text-gray-400 truncate">
                                  💊{" "}
                                  {meds
                                    .map((m) => m.name)
                                    .filter(Boolean)
                                    .join(", ")}
                                </p>
                              );
                            }
                          } catch {
                            return null;
                          }
                          return null;
                        })()}

                        <p className="text-[11px] text-gray-300 mt-2">
                          Token #{rx.id} · {fmtDateTime(rx.visit_date)}
                        </p>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
