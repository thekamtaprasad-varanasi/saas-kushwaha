'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

function waitTime(visitDate) {
  if (!visitDate) return '';
  const then = new Date(visitDate);
  const now = new Date();
  const mins = Math.floor((now - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem === 0 ? `${hrs} hr` : `${hrs}h ${rem}m`;
}

export default function PharmacyQueuePage() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  async function fetchQueue(silent = false) {
    if (!silent) setLoading(true);
    const res = await fetch('/api/prescriptions?status=doctor_done');
    if (!res.ok) {
      if (res.status === 401) window.location.href = '/login';
      if (res.status === 403) window.location.href = '/expired';
      setLoading(false);
      return;
    }
    const data = await res.json();
    const sorted = (Array.isArray(data) ? data : []).sort((a, b) => new Date(a.visit_date) - new Date(b.visit_date));
    setQueue(sorted);
    setLastRefresh(new Date());
    setLoading(false);
  }

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(() => fetchQueue(true), 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <main className="min-h-screen bg-orange-50 p-4 pb-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mt-4 mb-2">
            <h1 className="text-2xl font-bold text-orange-800">
              Pharmacy Queue {queue.length > 0 && <span className="text-lg text-orange-600">({queue.length})</span>}
            </h1>
            <button onClick={() => fetchQueue()} className="text-sm text-orange-600 border border-orange-300 px-3 py-1 rounded-lg">
              Refresh
            </button>
          </div>
          {lastRefresh && (
            <p className="text-xs text-gray-400 mb-4">
              Auto-refreshes every 15s · Last: {lastRefresh.toLocaleTimeString()}
            </p>
          )}

          {loading && <p className="text-gray-400 text-center mt-10">Loading...</p>}
          {!loading && queue.length === 0 && (
            <p className="text-gray-400 text-center mt-10">No prescriptions ready</p>
          )}

          <div className="flex flex-col gap-3">
            {queue.map((p, idx) => (
              <Link key={p.id} href={`/pharmacy/${p.id}`}
                className="bg-white rounded-2xl shadow p-4 flex flex-col gap-1 hover:shadow-md active:scale-95 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-orange-500 text-white text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-gray-800">{p.patient_name}</span>
                  </div>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                    {waitTime(p.visit_date)}
                  </span>
                </div>
                <span className="text-sm text-gray-500 ml-9">{p.patient_phone}</span>
                <span className="text-xs text-gray-400 mt-1 ml-9">Token #{p.id} · {p.visit_date?.slice(0, 16)}</span>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}