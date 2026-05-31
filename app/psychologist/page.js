"use client";
import { useEffect, useState } from "react";

export default function PsychologistPage() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  function fetchQueue() {
    fetch("/api/prescriptions?status=psychologist")
      .then((r) => {
        if (r.status === 401) {
          window.location.href = "/psychologist/login";
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) setQueue(data);
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <main className="min-h-screen bg-purple-50 p-4 pb-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-xl font-bold text-purple-800 mt-4 mb-1">
            Psychologist Queue
          </h1>
          <p className="text-xs text-gray-400 mb-5">
            Auto-refreshes every 15 seconds
          </p>

          {loading && (
            <p className="text-center text-gray-400 mt-20">Loading...</p>
          )}

          {!loading && queue.length === 0 && (
            <div className="text-center mt-20 text-gray-400">
              <div className="text-4xl mb-2">✅</div>
              <p>No patients in queue</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {queue.map((p, i) => (
              <a
                key={p.id}
                href={`/psychologist/${p.id}`}
                className="bg-white rounded-2xl shadow p-4 flex items-center gap-4 active:scale-95 transition"
              >
                <div className="bg-purple-100 text-purple-700 font-bold rounded-full w-10 h-10 flex items-center justify-center text-lg flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">
                    {p.patient_name}
                  </p>
                  <p className="text-xs text-gray-500">{p.patient_phone}</p>
                  {p.complaints && (
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      📋 {p.complaints}
                    </p>
                  )}
                </div>
                <span className="text-gray-300 text-lg">›</span>
              </a>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
