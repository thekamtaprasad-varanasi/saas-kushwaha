"use client";
import { useState, useMemo, useEffect } from "react";
import { checkInteractions } from "@/lib/interactions";
import {
  MEDICINES_BY_TIER,
  CONDITIONS,
  getMedicineDefaults,
} from "@/lib/medicines";

const MEDICINE_TIMINGS = [
  "Morning",
  "Afternoon",
  "Evening",
  "Night",
  "HS",
  "SOS",
];
const DURATIONS = [
  "3 days",
  "5 days",
  "7 days",
  "10 days",
  "14 days",
  "1 month",
  "2 months",
  "3 months",
];
const FOOD_OPTIONS = ["After food", "Empty stomach", "With or without food"];

const MOOD_OPTIONS = [
  "Euthymic",
  "Depressed",
  "Elated",
  "Anxious",
  "Irritable",
  "Labile",
];
const AFFECT_OPTIONS = [
  "Normal",
  "Blunted",
  "Flat",
  "Restricted",
  "Labile",
  "Inappropriate",
];
const INSIGHT_OPTIONS = [
  "Grade I",
  "Grade II",
  "Grade III",
  "Grade IV",
  "Grade V",
  "Grade VI",
];
const JUDGEMENT_OPTIONS = ["Intact", "Impaired", "Poor"];

function splitDoses(doseStr) {
  return (doseStr || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function doseOptionsFor(medName) {
  const base = (medName || "").toLowerCase().trim();
  for (const cond of CONDITIONS) {
    const { latest, common } = MEDICINES_BY_TIER[cond];
    const hit = [...latest, ...common].find(
      (m) => m.name.toLowerCase() === base,
    );
    if (hit) return splitDoses(hit.dose);
  }
  return [];
}

function brandKey(med) {
  if (!med.dose || !med.dose.trim()) return med.name;
  return `${med.name} ${med.dose}`.trim();
}

export default function PrescriptionForm({
  complaints,
  setComplaints,
  diagnosis,
  setDiagnosis,
  mse,
  setMse,
  tests,
  setTests,
  medicines,
  setMedicines,
  notes,
  setNotes,
  followupDate,
  setFollowupDate,
  history,
  saving,
  saved,
  onSave,
}) {
  const [activeTab, setActiveTab] = useState("rx");
  const [showMSE, setShowMSE] = useState(false);
  const [showPicker, setShowPicker] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("All");
  const [tierTab, setTierTab] = useState("all");
  const [pickedSalts, setPickedSalts] = useState({});
  const [brandsMap, setBrandsMap] = useState({});
  const [templates, setTemplates] = useState({});
  const [customMeds, setCustomMeds] = useState({});

  useEffect(() => {
    fetch("/api/brands")
      .then((r) => (r.ok ? r.json() : { brands: {} }))
      .then((data) => setBrandsMap(data.brands || {}))
      .catch(() => setBrandsMap({}));
  }, []);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        try {
          setTemplates(
            typeof data.templates === "string"
              ? JSON.parse(data.templates || "{}")
              : data.templates || {},
          );
        } catch {
          setTemplates({});
        }
        try {
          setCustomMeds(
            typeof data.custom_meds === "string"
              ? JSON.parse(data.custom_meds || "{}")
              : data.custom_meds || {},
          );
        } catch {
          setCustomMeds({});
        }
      })
      .catch(() => {
        setTemplates({});
        setCustomMeds({});
      });
  }, []);

  useEffect(() => {
    const d = (diagnosis || "").toLowerCase();
    const MAP = [
      ["bipolar", "Bipolar Disorder"],
      ["depression", "Depression"],
      ["schizophrenia", "Antipsychotics"],
      ["insomnia", "Insomnia"],
      ["migraine", "Migraine"],
      ["epilepsy", "Epilepsy"],
      ["ocd", "OCD"],
      ["adhd", "ADHD"],
      ["ptsd", "PTSD"],
      ["sexual", "Loss of Libido (Herbal)"],
      ["libido", "Loss of Libido (Herbal)"],
    ];
    const hit = MAP.find(([key]) => d.includes(key));
    if (hit) {
      setSelectedCondition(hit[1]);
      setShowPicker(true);
    }
    if (diagnosis && templates[diagnosis]) {
      const tpl = templates[diagnosis];
      if (Array.isArray(tpl) && tpl.length > 0) {
        setMedicines((prev) => {
          const isEmpty =
            prev.length === 0 ||
            (prev.length === 1 && !prev[0].name && !prev[0].dose);
          if (!isEmpty) return prev;
          return tpl.map((m) => ({ ...m }));
        });
      }
    }
  }, [diagnosis, templates]);

  function updateMSE(field, value) {
    setMse((prev) => ({ ...prev, [field]: value }));
  }

  function addMedicine() {
    setMedicines((prev) => [
      ...prev,
      {
        name: "",
        dose: "",
        timing: [],
        duration: "7 days",
        food: "After food",
        brand: "",
      },
    ]);
  }

  function updateMedicine(index, field, value) {
    setMedicines((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    );
  }

  function applyBrandIfKnown(index) {
    setMedicines((prev) =>
      prev.map((m, i) => {
        if (i !== index) return m;
        if (m.brand && m.brand.trim()) return m;
        const mapped = brandsMap[brandKey(m)] || brandsMap[m.name];
        if (mapped && mapped.brand) return { ...m, brand: mapped.brand };
        return m;
      }),
    );
  }

  function toggleTiming(index, timing) {
    setMedicines((prev) =>
      prev.map((m, i) => {
        if (i !== index) return m;
        const exists = m.timing.includes(timing);
        return {
          ...m,
          timing: exists
            ? m.timing.filter((t) => t !== timing)
            : [...m.timing, timing],
        };
      }),
    );
  }

  function removeMedicine(index) {
    setMedicines((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length === 0
        ? [
            {
              name: "",
              dose: "",
              timing: [],
              duration: "7 days",
              food: "After food",
              brand: "",
            },
          ]
        : next;
    });
  }

  function togglePick(med) {
    const key = med.name.toLowerCase();
    setPickedSalts((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = med;
      return next;
    });
  }

  function addAllPicked() {
    const toAdd = Object.values(pickedSalts);
    if (toAdd.length === 0) return;
    const newEntries = toAdd.map((m) => {
      const firstDose = splitDoses(m.dose)[0] || "";
      const def = getMedicineDefaults(m.name) || {
        timing: [],
        food: "After food",
        duration: "7 days",
      };
      const key = `${m.name} ${firstDose}`.trim();
      const mapped = brandsMap[key] || brandsMap[m.name] || {};
      return {
        name: m.name,
        dose: firstDose,
        timing: def.timing,
        duration: def.duration,
        food: def.food,
        brand: mapped.brand || "",
      };
    });
    setMedicines((prev) => {
      const isEmptyFirst =
        prev.length === 1 &&
        !prev[0].name &&
        !prev[0].dose &&
        prev[0].timing.length === 0;
      const base = isEmptyFirst ? [] : prev;
      const existing = new Set(base.map((m) => m.name.toLowerCase()));
      const filtered = newEntries.filter(
        (m) => !existing.has(m.name.toLowerCase()),
      );
      return [...base, ...filtered];
    });
    setPickedSalts({});
  }

  function quickFollowup(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setFollowupDate(d.toISOString().slice(0, 10));
  }

  async function saveBrandMappings() {
    for (const m of medicines) {
      if (!m.name || !m.brand || !m.brand.trim()) continue;
      const key = brandKey(m);
      const existing = brandsMap[key] || brandsMap[m.name];
      if (!existing || existing.brand !== m.brand.trim()) {
        try {
          await fetch("/api/brands", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ salt: key, brand: m.brand.trim() }),
          });
        } catch {
          /* ignore */
        }
      }
    }
  }

  async function handleSave(andPrint) {
    await saveBrandMappings();
    onSave(andPrint);
  }

  function repeatMedicines(pastMeds) {
    if (!pastMeds || pastMeds.length === 0) return;
    setMedicines(
      pastMeds.map((m) => ({
        name: m.name || "",
        dose: m.dose || "",
        timing: Array.isArray(m.timing) ? m.timing : [],
        duration: m.duration || "1 month",
        food: m.food || "After food",
        brand: m.brand || "",
      })),
    );
    setActiveTab("rx");
  }
  const [newSalt, setNewSalt] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newSaltCat, setNewSaltCat] = useState(CONDITIONS[0]);

  async function addCustomMed() {
    const salt = newSalt.trim();
    if (!salt) {
      alert("Please enter medicine name.");
      return;
    }
    const cat = newSaltCat;
    const updated = { ...customMeds };
    const list = Array.isArray(updated[cat]) ? [...updated[cat]] : [];
    if (list.some((m) => m.name.toLowerCase() === salt.toLowerCase())) {
      alert("This medicine already exists in this category.");
      return;
    }
    list.push({ name: salt, dose: "", class: "Custom" });
    updated[cat] = list;
    // Also save salt→brand mapping so pharmacy/stock knows the brand
    if (newBrand.trim()) {
      try {
        await fetch("/api/brands", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ salt: salt, brand: newBrand.trim() }),
        });
      } catch {
        /* ignore */
      }
    }
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ custom_meds: JSON.stringify(updated) }),
      });
      if (!res.ok) {
        alert("Save failed");
        return;
      }
      setCustomMeds(updated);
      setNewSalt("");
      setNewBrand("");
      setSelectedCondition(cat);
      setTierTab("all");
      setSearch("");
      alert(`"${salt}" added to ${cat}. It will now show in the picker.`);
    } catch {
      alert("Save failed");
    }
  }

  async function saveAsTemplate() {
    if (!diagnosis || !diagnosis.trim()) {
      alert("First select the diagnosis, then save the template.");
      return;
    }
    const meds = medicines.filter((m) => m.name && m.name.trim());
    if (meds.length === 0) {
      alert("No medicines added yet.");
      return;
    }
    const updated = { ...templates, [diagnosis]: meds.map((m) => ({ ...m })) };
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templates: JSON.stringify(updated) }),
      });
      if (!res.ok) {
        alert("Template save failed");
        return;
      }
      setTemplates(updated);
      alert(`Template saved for "${diagnosis}"`);
    } catch {
      alert("Template save failed");
    }
  }

  const pickerList = useMemo(() => {
    const q = search.trim().toLowerCase();
    const conds =
      selectedCondition === "All" ? CONDITIONS : [selectedCondition];
    const arr = [];
    for (const cond of conds) {
      const { latest, common } = MEDICINES_BY_TIER[cond];
      if (tierTab === "all" || tierTab === "latest") {
        for (const m of latest)
          arr.push({ ...m, condition: cond, tier: "latest" });
      }
      if (tierTab === "all" || tierTab === "common") {
        for (const m of common)
          arr.push({ ...m, condition: cond, tier: "common" });
      }
      // Custom medicines added by this clinic for this condition
      const customForCond = customMeds[cond] || [];
      for (const m of customForCond) {
        const brandMapped = brandsMap[m.name] || {};
        arr.push({
          ...m,
          condition: cond,
          tier: "common",
          brand: brandMapped.brand || "",
        });
      }
    }
    const dedup = {};
    for (const m of arr) {
      const k = `${m.name.toLowerCase()}|${m.condition}`;
      if (!dedup[k]) dedup[k] = m;
    }
    let list = Object.values(dedup);
    if (q)
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.class || "").toLowerCase().includes(q) ||
          (m.brand || "").toLowerCase().includes(q),
      );
    return list;
  }, [selectedCondition, search, tierTab, customMeds]);

  const addedNames = useMemo(() => {
    const s = new Set();
    for (const m of medicines) {
      if (m.name) s.add(m.name.toLowerCase());
    }
    return s;
  }, [medicines]);

  const pickedCount = Object.keys(pickedSalts).length;
  const interactions = useMemo(() => checkInteractions(medicines), [medicines]);

  const parseMeds = (raw) => {
    if (!raw) return [];
    try {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.filter((m) => m.name) : [];
    } catch {
      return [];
    }
  };
  return (
    <div className="flex flex-col gap-4 pb-20">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 sticky top-0 z-10">
        <button
          type="button"
          onClick={() => setActiveTab("rx")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${
            activeTab === "rx"
              ? "bg-white text-emerald-700 shadow"
              : "text-gray-500"
          }`}
        >
          💊 Prescription
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("exam")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${
            activeTab === "exam"
              ? "bg-white text-emerald-700 shadow"
              : "text-gray-500"
          }`}
        >
          📝 Exam
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${
            activeTab === "history"
              ? "bg-white text-emerald-700 shadow"
              : "text-gray-500"
          }`}
        >
          📋 History {history.length > 0 && `(${history.length})`}
        </button>
      </div>

      {/* ===================== TAB 1: PRESCRIPTION ===================== */}
      {activeTab === "rx" && (
        <>
          {/* Diagnosis */}
          <div className="bg-white rounded-2xl shadow p-4">
            <label className="block font-semibold text-gray-700 mb-2">
              Diagnosis
            </label>
            <input
              type="text"
              list="diagnosis-list"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Type or pick — e.g. Depression, Anxiety..."
              className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <datalist id="diagnosis-list">
              <option value="Insomnia" />
              <option value="Migraine" />
              <option value="Epilepsy" />
              <option value="Depression" />
              <option value="Anxiety" />
              <option value="Bipolar Disorder" />
              <option value="Schizophrenia" />
              <option value="OCD" />
              <option value="ADHD" />
              <option value="PTSD" />
              <option value="Substance Use Disorder" />
              <option value="Sexual Health" />
            </datalist>
          </div>

          {/* Templates */}
          {Object.keys(templates).length > 0 && (
            <div className="bg-white rounded-2xl shadow p-4">
              <p className="font-semibold text-gray-700 mb-2">📋 Templates</p>
              <div className="flex flex-col gap-2">
                {Object.entries(templates).map(([diag, meds]) => (
                  <div
                    key={diag}
                    className="flex justify-between items-center px-3 py-2 rounded-xl border border-gray-200 bg-gray-50"
                  >
                    <span className="text-sm font-semibold text-gray-700 flex-1">
                      {diag}
                    </span>
                    <span className="text-xs text-gray-400 mr-3">
                      {meds.length} medicines
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setDiagnosis(diag);
                        setMedicines(meds.map((m) => ({ ...m })));
                      }}
                      className="text-xs text-indigo-600 border border-indigo-300 rounded-lg px-2 py-1 hover:bg-indigo-50 mr-1"
                    >
                      Load
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm(`Delete template "${diag}"?`)) return;
                        const updated = { ...templates };
                        delete updated[diag];
                        await fetch("/api/settings", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            templates: JSON.stringify(updated),
                          }),
                        });
                        setTemplates(updated);
                      }}
                      className="text-xs text-red-500 border border-red-300 rounded-lg px-2 py-1 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Medicine Picker */}
          <div className="bg-white rounded-2xl shadow p-4">
            <div className="flex justify-between items-center mb-3">
              <label className="font-semibold text-gray-700">
                Add Medicines
              </label>
              <button
                type="button"
                onClick={() => setShowPicker((p) => !p)}
                className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg font-semibold"
              >
                {showPicker ? "Hide" : "Show"}
              </button>
            </div>
            {showPicker && (
              <>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search salt name or class..."
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <div className="flex gap-1 mb-2">
                  <button
                    type="button"
                    onClick={() => setTierTab("all")}
                    className={`flex-1 text-xs py-1.5 rounded-lg font-semibold border ${tierTab === "all" ? "bg-gray-800 text-white border-gray-800" : "border-gray-300 text-gray-600"}`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setTierTab("latest")}
                    className={`flex-1 text-xs py-1.5 rounded-lg font-semibold border ${tierTab === "latest" ? "bg-amber-500 text-white border-amber-500" : "border-gray-300 text-gray-600"}`}
                  >
                    🆕 Latest
                  </button>
                  <button
                    type="button"
                    onClick={() => setTierTab("common")}
                    className={`flex-1 text-xs py-1.5 rounded-lg font-semibold border ${tierTab === "common" ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 text-gray-600"}`}
                  >
                    🔹 Common
                  </button>
                </div>
                <div className="flex gap-1 overflow-x-auto mb-2 pb-1">
                  <button
                    type="button"
                    onClick={() => setSelectedCondition("All")}
                    className={`text-xs px-3 py-1 rounded-full whitespace-nowrap border ${selectedCondition === "All" ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 text-gray-600"}`}
                  >
                    All
                  </button>
                  {CONDITIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedCondition(c)}
                      className={`text-xs px-3 py-1 rounded-full whitespace-nowrap border ${selectedCondition === c ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 text-gray-600"}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-500 mb-2">
                  Tick multiple salts → tap &quot;Add Selected&quot; once
                </p>
                {(() => {
                  const grouped = {};
                  for (const med of pickerList) {
                    const cls = med.class || "Other";
                    if (!grouped[cls]) grouped[cls] = [];
                    grouped[cls].push(med);
                  }
                  return (
                    <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto">
                      {Object.keys(grouped).length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-4">
                          No match.
                        </p>
                      )}
                      {Object.keys(grouped).map((cls) => (
                        <div key={cls}>
                          <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wide mb-1 sticky top-0 bg-white py-1">
                            {cls}
                          </p>
                          <div className="grid grid-cols-1 gap-1.5">
                            {grouped[cls].map((med, idx) => {
                              const key = `${med.name.toLowerCase()}`;
                              const picked = !!pickedSalts[key];
                              const already = addedNames.has(
                                med.name.toLowerCase(),
                              );
                              return (
                                <button
                                  key={`${cls}-${med.name}-${idx}`}
                                  type="button"
                                  onClick={() => togglePick(med)}
                                  disabled={already}
                                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-left transition ${
                                    already
                                      ? "bg-emerald-50 border-emerald-300 opacity-70 cursor-not-allowed"
                                      : picked
                                        ? "bg-indigo-600 border-indigo-600 text-white"
                                        : "border-gray-200 bg-white"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span
                                      className={`w-4 h-4 flex items-center justify-center rounded border text-[10px] shrink-0 ${
                                        already
                                          ? "bg-emerald-500 border-emerald-500 text-white"
                                          : picked
                                            ? "bg-white border-white text-indigo-600"
                                            : "border-gray-300"
                                      }`}
                                    >
                                      {(picked || already) && "✓"}
                                    </span>
                                    <span className="text-sm font-semibold truncate">
                                      {med.name}
                                    </span>
                                    {med.tier === "latest" && (
                                      <span className="text-[9px] px-1 rounded bg-amber-400 text-white shrink-0">
                                        NEW
                                      </span>
                                    )}
                                  </div>
                                  <span
                                    className={`text-[10px] shrink-0 ${picked ? "text-indigo-100" : "text-gray-400"}`}
                                  >
                                    {med.condition}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                {pickedCount > 0 && (
                  <div className="sticky bottom-0 mt-3 -mx-4 -mb-4 px-4 py-3 bg-white border-t border-gray-200 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPickedSalts({})}
                      className="px-3 py-2 text-xs border border-gray-300 rounded-lg text-gray-600"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={addAllPicked}
                      className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-semibold text-sm"
                    >
                      Add {pickedCount} Selected →
                    </button>
                  </div>
                )}

                {/* Add a new medicine not in the list */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-[11px] font-semibold text-gray-600 mb-1">
                    Medicine not in list? Add it here:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSalt}
                      onChange={(e) => setNewSalt(e.target.value)}
                      placeholder="Salt name (e.g. Multivitamin)"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                    <input
                      type="text"
                      value={newBrand}
                      onChange={(e) => setNewBrand(e.target.value)}
                      placeholder="Brand (e.g. Revital)"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                    <select
                      value={newSaltCat}
                      onChange={(e) => setNewSaltCat(e.target.value)}
                      className="border border-gray-300 rounded-lg px-2 py-2 text-xs focus:outline-none max-w-[120px]"
                    >
                      {CONDITIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={addCustomMed}
                    className="w-full mt-2 bg-emerald-600 text-white py-2 rounded-lg font-semibold text-sm"
                  >
                    + Add to library
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Drug interaction warnings */}
          {interactions.length > 0 && (
            <div className="flex flex-col gap-2">
              {interactions.map((w, i) => (
                <div
                  key={i}
                  className={`rounded-2xl p-4 border-2 ${w.severity === "danger" ? "bg-red-50 border-red-300" : "bg-amber-50 border-amber-300"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">
                      {w.severity === "danger" ? "⛔" : "⚠️"}
                    </span>
                    <span
                      className={`text-xs font-bold uppercase ${w.severity === "danger" ? "text-red-700" : "text-amber-700"}`}
                    >
                      {w.severity === "danger"
                        ? "Dangerous Interaction"
                        : "Caution"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">
                    <strong>{w.drugs.join(" + ")}</strong>
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{w.message}</p>
                </div>
              ))}
              <p className="text-[10px] text-gray-400 px-1">
                Automated safety check — final decision is the doctor&apos;s
                responsibility.
              </p>
            </div>
          )}

          {/* Prescription List */}
          <div className="bg-white rounded-2xl shadow p-4">
            <div className="flex justify-between items-center mb-3">
              <label className="font-semibold text-gray-700">
                Prescription ({medicines.filter((m) => m.name).length})
              </label>
              <button
                onClick={addMedicine}
                className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg font-semibold"
              >
                + Manual
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {medicines.map((med, i) => {
                const doseOpts = doseOptionsFor(med.name);
                const known = !!(
                  brandsMap[brandKey(med)] || brandsMap[med.name]
                );
                return (
                  <div
                    key={i}
                    className="border border-gray-200 rounded-xl p-3 flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-gray-400">
                        #{i + 1}
                      </span>
                      <button
                        onClick={() => removeMedicine(i)}
                        className="text-red-400 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      value={med.name}
                      onChange={(e) =>
                        updateMedicine(i, "name", e.target.value)
                      }
                      placeholder="Salt name"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                    <div className="flex gap-2">
                      {doseOpts.length > 0 && med.dose !== "__custom__" ? (
                        <select
                          value={doseOpts.includes(med.dose) ? med.dose : ""}
                          onChange={(e) => {
                            updateMedicine(i, "dose", e.target.value);
                            setTimeout(() => applyBrandIfKnown(i), 0);
                          }}
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                        >
                          <option value="">Select dose</option>
                          {doseOpts.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                          <option value="__custom__">Custom...</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={med.dose === "__custom__" ? "" : med.dose}
                          onChange={(e) =>
                            updateMedicine(i, "dose", e.target.value)
                          }
                          placeholder="Dose (e.g. 10mg)"
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
                        />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[10px] text-gray-400">
                          Brand{" "}
                          {known && (
                            <span className="text-emerald-500">• saved</span>
                          )}
                        </label>
                      </div>
                      <input
                        type="text"
                        value={med.brand || ""}
                        onChange={(e) =>
                          updateMedicine(i, "brand", e.target.value)
                        }
                        placeholder="Enter your brand (e.g. Nexito)"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {MEDICINE_TIMINGS.map((t) => (
                        <button
                          key={t}
                          onClick={() => toggleTiming(i, t)}
                          className={`text-xs px-2 py-1 rounded-full border transition ${med.timing.includes(t) ? "bg-emerald-500 text-white border-emerald-500" : "border-gray-300 text-gray-600"}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={med.food}
                        onChange={(e) =>
                          updateMedicine(i, "food", e.target.value)
                        }
                        className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none"
                      >
                        {FOOD_OPTIONS.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                      <select
                        value={med.duration}
                        onChange={(e) =>
                          updateMedicine(i, "duration", e.target.value)
                        }
                        className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none"
                      >
                        {DURATIONS.map((d) => (
                          <option key={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Follow-up */}
          <div className="bg-white rounded-2xl shadow p-4">
            <label className="block font-semibold text-gray-700 mb-2">
              Follow-up Date
            </label>
            <input
              type="date"
              value={followupDate}
              onChange={(e) => setFollowupDate(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <div className="flex flex-wrap gap-1 mt-2">
              {[7, 14, 30, 60].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => quickFollowup(d)}
                  className="text-xs border border-gray-300 rounded-full px-3 py-1 text-gray-600"
                >
                  +{d}d
                </button>
              ))}
              <button
                type="button"
                onClick={() => setFollowupDate("")}
                className="text-xs border border-gray-300 rounded-full px-3 py-1 text-gray-600"
              >
                Clear
              </button>
            </div>
            {followupDate && (
              <p className="text-xs text-emerald-700 mt-2">
                Reminder will be sent on {followupDate}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl shadow p-4">
            <label className="block font-semibold text-gray-700 mb-2">
              Doctor Notes / Advice
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Follow-up instructions, diet advice..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {saved && (
            <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-xl p-3 text-center">
              ✓ Prescription saved — visible in pharmacy queue
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="bg-emerald-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-emerald-700 disabled:opacity-60 transition"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="bg-gray-800 text-white py-3 rounded-xl font-semibold text-sm hover:bg-gray-900 disabled:opacity-60 transition"
            >
              Save & Print
            </button>
          </div>

          <button
            type="button"
            onClick={saveAsTemplate}
            className="w-full mt-2 border-2 border-dashed border-indigo-300 text-indigo-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-50 transition"
          >
            📋 Save these medicines as template for &quot;{diagnosis || "..."}
            &quot;
          </button>
        </>
      )}

      {/* ===================== TAB 2: EXAM ===================== */}
      {activeTab === "exam" && (
        <>
          {/* Complaints */}
          <div className="bg-white rounded-2xl shadow p-4">
            <label className="block font-semibold text-gray-700 mb-2">
              Chief Complaints
            </label>
            <textarea
              value={complaints}
              onChange={(e) => setComplaints(e.target.value)}
              placeholder="Patient complaints..."
              rows={2}
              className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {/* MSE */}
          <div className="bg-white rounded-2xl shadow p-4">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-gray-700">
                Mental Status Examination
              </label>
              <button
                type="button"
                onClick={() => setShowMSE((p) => !p)}
                className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg font-semibold"
              >
                {showMSE ? "Hide" : "Show"}
              </button>
            </div>
            {showMSE && (
              <div className="flex flex-col gap-3 mt-2">
                <div>
                  <label className="text-xs text-gray-500">
                    Appearance &amp; Behaviour
                  </label>
                  <input
                    type="text"
                    value={mse.appearance}
                    onChange={(e) => updateMSE("appearance", e.target.value)}
                    placeholder="Well-kempt, cooperative..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Mood</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {MOOD_OPTIONS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() =>
                          updateMSE("mood", mse.mood === m ? "" : m)
                        }
                        className={`text-xs px-2 py-1 rounded-full border ${mse.mood === m ? "bg-emerald-500 text-white border-emerald-500" : "border-gray-300 text-gray-600"}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Affect</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {AFFECT_OPTIONS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() =>
                          updateMSE("affect", mse.affect === m ? "" : m)
                        }
                        className={`text-xs px-2 py-1 rounded-full border ${mse.affect === m ? "bg-emerald-500 text-white border-emerald-500" : "border-gray-300 text-gray-600"}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Thought</label>
                  <input
                    type="text"
                    value={mse.thought}
                    onChange={(e) => updateMSE("thought", e.target.value)}
                    placeholder="Goal-directed, no delusions..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Perception</label>
                  <input
                    type="text"
                    value={mse.perception}
                    onChange={(e) => updateMSE("perception", e.target.value)}
                    placeholder="No hallucinations..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Cognition</label>
                  <input
                    type="text"
                    value={mse.cognition}
                    onChange={(e) => updateMSE("cognition", e.target.value)}
                    placeholder="Oriented x3..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Insight</label>
                    <select
                      value={mse.insight}
                      onChange={(e) => updateMSE("insight", e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none"
                    >
                      <option value="">—</option>
                      {INSIGHT_OPTIONS.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Judgement</label>
                    <select
                      value={mse.judgement}
                      onChange={(e) => updateMSE("judgement", e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none"
                    >
                      <option value="">—</option>
                      {JUDGEMENT_OPTIONS.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tests */}
          <div className="bg-white rounded-2xl shadow p-4">
            <label className="block font-semibold text-gray-700 mb-2">
              Tests / Investigations
            </label>
            <textarea
              value={tests}
              onChange={(e) => setTests(e.target.value)}
              placeholder="e.g. CBC, LFT, TSH..."
              rows={2}
              className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
        </>
      )}

      {/* ===================== TAB 3: HISTORY ===================== */}
      {activeTab === "history" && (
        <div className="bg-white rounded-2xl shadow p-4">
          <p className="font-semibold text-gray-700 mb-3">
            Previous Visits ({history.length})
          </p>
          {history.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">
              No previous visits
            </p>
          ) : (
            <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto">
              {history.map((v) => {
                const pastMeds = parseMeds(v.medicines);
                return (
                  <div
                    key={v.id}
                    className="border border-gray-200 rounded-xl p-3 bg-gray-50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {v.visit_date?.slice(0, 10)}
                        </p>
                        {v.diagnosis && (
                          <p className="text-xs text-gray-500">{v.diagnosis}</p>
                        )}
                      </div>
                    </div>
                    {v.complaints && (
                      <p className="text-xs text-gray-600 mb-1">
                        <span className="font-semibold">Complaints:</span>{" "}
                        {v.complaints}
                      </p>
                    )}
                    {pastMeds.length > 0 && (
                      <div className="mt-2">
                        <p className="text-[11px] font-semibold text-gray-500 uppercase mb-1">
                          Medicines
                        </p>
                        <ul className="text-xs text-gray-700 space-y-0.5">
                          {pastMeds.map((m, i) => (
                            <li key={i}>
                              • {m.brand ? `${m.brand} (${m.name})` : m.name}{" "}
                              {m.dose} — {(m.timing || []).join(", ")} (
                              {m.duration})
                            </li>
                          ))}
                        </ul>
                        <button
                          type="button"
                          onClick={() => repeatMedicines(pastMeds)}
                          className="mt-2 text-xs font-semibold text-indigo-600 border border-indigo-300 rounded-lg px-3 py-1 hover:bg-indigo-50"
                        >
                          🔄 Repeat these medicines
                        </button>
                      </div>
                    )}
                    {v.notes && (
                      <p className="text-xs text-gray-600 mt-2">
                        <span className="font-semibold">Notes:</span> {v.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
