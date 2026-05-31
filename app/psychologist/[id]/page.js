"use client";
import { useEffect, useState, use } from "react";
import { SCALES } from "@/lib/scales";

const COLOR = {
  emerald: "bg-emerald-500 text-white",
  lime: "bg-lime-500 text-white",
  amber: "bg-amber-500 text-white",
  orange: "bg-orange-500 text-white",
  red: "bg-red-500 text-white",
  indigo: "bg-indigo-500 text-white",
  gray: "bg-gray-400 text-white",
};

export default function PsychologistAssessmentPage({ params }) {
  const { id } = use(params);
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const [mood, setMood] = useState(5);
  const [history, setHistory] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [notes, setNotes] = useState("");

  // scales state: { phq9: {answers:[], extra:{}}, ... }
  const [scaleData, setScaleData] = useState({});
  const [openScale, setOpenScale] = useState(null);

  useEffect(() => {
    fetch(`/api/psychologist/assessment?prescription_id=${id}`)
      .then((r) => {
        if (r.status === 401) {
          window.location.href = "/psychologist/login";
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setPrescription(data.prescription);
        if (data.assessment) {
          setMood(data.assessment.mood ?? 5);
          setHistory(data.assessment.history || "");
          setSymptoms(data.assessment.symptoms || "");
          setNotes(data.assessment.notes || "");
          try {
            const saved = JSON.parse(data.assessment.scales || "{}");
            setScaleData(saved || {});
          } catch {
            setScaleData({});
          }
        }
        setLoading(false);
      });
  }, [id]);

  function setAnswer(scaleId, qIndex, value) {
    setScaleData((prev) => {
      const cur = prev[scaleId] || { answers: [], extra: {} };
      const answers = [...(cur.answers || [])];
      answers[qIndex] = value;
      return { ...prev, [scaleId]: { ...cur, answers } };
    });
  }

  function setExtra(scaleId, key, value) {
    setScaleData((prev) => {
      const cur = prev[scaleId] || { answers: [], extra: {} };
      return {
        ...prev,
        [scaleId]: { ...cur, extra: { ...(cur.extra || {}), [key]: value } },
      };
    });
  }

  function getResult(scale) {
    const d = scaleData[scale.id];
    if (
      !d ||
      !d.answers ||
      d.answers.filter((v) => v !== undefined).length === 0
    )
      return null;
    const answers = scale.questions.map((_, i) => d.answers[i] ?? 0);
    return scale.scoreFn(answers, d.extra || {});
  }

  async function handleSendToDoctor() {
    setSaving(true);
    const toSave = {};
    for (const scale of SCALES) {
      const d = scaleData[scale.id];
      if (
        !d ||
        !d.answers ||
        d.answers.filter((v) => v !== undefined).length === 0
      )
        continue;
      const answers = scale.questions.map((_, i) => d.answers[i] ?? 0);
      toSave[scale.id] = {
        answers,
        extra: d.extra || {},
        result: scale.scoreFn(answers, d.extra || {}),
      };
    }
    await fetch("/api/psychologist/assessment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prescription_id: parseInt(id),
        mood,
        history,
        symptoms,
        notes,
        scales: toSave,
      }),
    });
    await fetch(`/api/prescriptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "waiting" }),
    });
    setSaving(false);
    setDone(true);
    setTimeout(() => {
      window.location.href = "/psychologist";
    }, 1200);
  }

  if (loading)
    return <p className="text-center mt-20 text-gray-400">Loading...</p>;
  if (!prescription)
    return <p className="text-center mt-20 text-red-400">Not found</p>;

  return (
    <main className="min-h-screen bg-purple-50 p-4 pb-4">
      <div className="max-w-md mx-auto">
        <a
          href="/psychologist"
          className="text-sm text-purple-600 mb-4 inline-block"
        >
          ← Back to Queue
        </a>

        {/* Patient */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <p className="font-bold text-gray-800 text-lg">
            {prescription.patient_name}
          </p>
          <p className="text-sm text-gray-500">
            {prescription.patient_phone}
          </p>
          {prescription.complaints && (
            <p className="text-xs text-gray-400 mt-1">
              Chief complaint: {prescription.complaints}
            </p>
          )}
        </div>

        {/* Rating Scales */}
        <div className="mb-4">
          <p className="font-semibold text-gray-700 mb-2 px-1">
            Rating Scales
          </p>
          <div className="flex flex-col gap-2">
            {SCALES.map((scale) => {
              const result = getResult(scale);
              const isOpen = openScale === scale.id;
              return (
                <div
                  key={scale.id}
                  className="bg-white rounded-2xl shadow overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenScale(isOpen ? null : scale.id)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">
                        {scale.title}
                      </p>
                      <p className="text-xs text-gray-400">{scale.name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {result && (
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-full ${COLOR[result.color] || COLOR.gray}`}
                        >
                          {result.total}/{result.max}
                        </span>
                      )}
                      <span className="text-purple-600 text-lg font-bold">
                        {isOpen ? "▲" : "▼"}
                      </span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                      <p className="text-xs text-gray-500 mb-3">
                        {scale.intro}
                      </p>

                      {scale.questions.map((q, qi) => {
                        const cur = scaleData[scale.id]?.answers?.[qi];
                        return (
                          <div key={qi} className="mb-3">
                            <p className="text-sm text-gray-700 mb-1">
                              {qi + 1}. {q}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {scale.options.map((opt) => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() =>
                                    setAnswer(scale.id, qi, opt.value)
                                  }
                                  className={`text-xs px-2 py-1 rounded-lg border transition ${
                                    cur === opt.value
                                      ? "bg-purple-600 text-white border-purple-600"
                                      : "border-gray-300 text-gray-600"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}

                      {scale.followups &&
                        scale.followups.map((f) => (
                          <div
                            key={f.key}
                            className="mb-3 mt-2 border-t border-gray-100 pt-2"
                          >
                            <p className="text-sm text-gray-700 mb-1">
                              {f.text}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {f.options.map((opt) => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() =>
                                    setExtra(scale.id, f.key, opt.value)
                                  }
                                  className={`text-xs px-2 py-1 rounded-lg border transition ${
                                    scaleData[scale.id]?.extra?.[f.key] ===
                                    opt.value
                                      ? "bg-purple-600 text-white border-purple-600"
                                      : "border-gray-300 text-gray-600"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}

                      {result && (
                        <div className="mt-3 rounded-xl bg-gray-50 p-3">
                          {result.detail ? (
                            <div className="flex flex-col gap-2">
                              {result.detail.map((d, di) => (
                                <div
                                  key={di}
                                  className="flex items-center justify-between"
                                >
                                  <span className="text-sm text-gray-600">
                                    {d.name}: <strong>{d.score}</strong>
                                  </span>
                                  <span
                                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${COLOR[d.color] || COLOR.gray}`}
                                  >
                                    {d.label}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                Score:{" "}
                                <strong>
                                  {result.total}/{result.max}
                                </strong>
                              </span>
                              <span
                                className={`text-xs font-bold px-2 py-0.5 rounded-full ${COLOR[result.color] || COLOR.gray}`}
                              >
                                {result.label}
                              </span>
                            </div>
                          )}
                          {result.alert && (
                            <p className="text-xs text-red-600 font-semibold mt-2">
                              ⚠ {result.alert}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Clinical Notes */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4 flex flex-col gap-4">
          <p className="font-semibold text-gray-700">Clinical Notes</p>

          <div>
            <label className="text-xs text-gray-500">
              Overall Mood (1 low – 10 good)
            </label>
            <div className="flex items-center gap-3 mt-2">
              <input
                type="range"
                min={1}
                max={10}
                value={mood}
                onChange={(e) => setMood(Number(e.target.value))}
                className="flex-1 accent-purple-600"
              />
              <span className="text-lg font-bold text-purple-700 w-6 text-center">
                {mood}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500">Patient History</label>
            <textarea
              value={history}
              onChange={(e) => setHistory(e.target.value)}
              rows={2}
              placeholder="Previous episodes, family history..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mt-1 resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Current Symptoms</label>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              rows={2}
              placeholder="Sleep issues, anxiety, mood swings..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mt-1 resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">
              Psychologist Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Assessment notes for doctor..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mt-1 resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
        </div>

        {done && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-xl p-3 mb-3 text-center">
            ✓ Sent to Doctor queue
          </div>
        )}

        <button
          onClick={handleSendToDoctor}
          disabled={saving || done}
          className="w-full bg-purple-600 text-white py-3 rounded-2xl font-semibold text-base hover:bg-purple-700 disabled:opacity-60 transition"
        >
          {saving ? "Saving..." : "Send to Doctor →"}
        </button>
      </div>
    </main>
  );
}