"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MEDICINES_BY_CONDITION, CONDITIONS } from "@/lib/medicines";

export default function WalkInPage() {
  const router = useRouter();

  const [brandsMap, setBrandsMap] = useState({});
  const [clinicInfo, setClinicInfo] = useState(null);
  const [loadingInit, setLoadingInit] = useState(true);

  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");

  const [medicines, setMedicines] = useState([
    { salt: "", brand: "", qty: "1", price: "" },
  ]);

  const [pickerOpen, setPickerOpen] = useState(null); // row index jiska picker khula hai
  const [pickerSearch, setPickerSearch] = useState("");
  const [newSaltMode, setNewSaltMode] = useState(false);
  const [newSaltInput, setNewSaltInput] = useState("");

  const [printMode, setPrintMode] = useState(false);
  const [billDate] = useState(new Date().toISOString());

  useEffect(() => {
    async function load() {
      const [brandsRes, settingsRes] = await Promise.all([
        fetch("/api/brands"),
        fetch("/api/settings"),
      ]);
      if (brandsRes.status === 401 || settingsRes.status === 401) {
        window.location.href = "/login";
        return;
      }
      const brandsData = brandsRes.ok ? await brandsRes.json() : { brands: {} };
      const settingsData = settingsRes.ok ? await settingsRes.json() : {};
      setBrandsMap(brandsData.brands || {});
      setClinicInfo(settingsData);
      setLoadingInit(false);
    }
    load();
  }, []);

  // सारे salts (medicines.js से सभी doses + brandsMap से manually added)
  const allSalts = useMemo(() => {
    const set = new Set();
    for (const c of CONDITIONS) {
      for (const m of MEDICINES_BY_CONDITION[c] || []) {
        const doses = (m.dose || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (doses.length === 0) set.add(m.name);
        else for (const d of doses) set.add(`${m.name} ${d}`);
      }
    }
    for (const k of Object.keys(brandsMap)) set.add(k);
    return Array.from(set).sort();
  }, [brandsMap]);

  const filteredSalts = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return allSalts.slice(0, 50);
    return allSalts.filter((s) => s.toLowerCase().includes(q)).slice(0, 50);
  }, [allSalts, pickerSearch]);

  function pickSalt(rowIndex, saltValue) {
    const mapped = brandsMap[saltValue] || {};
    setMedicines((prev) =>
      prev.map((m, idx) =>
        idx === rowIndex
          ? {
              ...m,
              salt: saltValue,
              brand: mapped.brand || "",
              price: mapped.price || "",
            }
          : m,
      ),
    );
    setPickerOpen(null);
    setPickerSearch("");
    setNewSaltMode(false);
    setNewSaltInput("");
  }

  function updateField(i, field, value) {
    setMedicines((prev) =>
      prev.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)),
    );
  }

  function addRow() {
    setMedicines((prev) => [
      ...prev,
      { salt: "", brand: "", qty: "1", price: "" },
    ]);
  }

  function removeRow(i) {
    setMedicines((prev) =>
      prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i),
    );
  }

  // Salt-brand mapping save (inline)
  async function saveBrandMapping(i) {
    const row = medicines[i];
    if (!row.salt || !row.brand) {
      alert("Both Salt and Brand are required");
      return;
    }
    const updated = {
      ...brandsMap,
      [row.salt]: { brand: row.brand.trim(), price: (row.price || "").trim() },
    };
    const res = await fetch("/api/brands", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brands: updated }),
    });
    if (!res.ok) {
      alert("Save failed");
      return;
    }
    setBrandsMap(updated);
    alert("✓ Brand saved — will auto-fill next time");
  }

  async function addNewSaltToLibrary() {
    const salt = newSaltInput.trim();
    if (!salt) {
      alert("Enter salt name");
      return;
    }
    const updated = {
      ...brandsMap,
      [salt]: brandsMap[salt] || { brand: "", price: "" },
    };
    const res = await fetch("/api/brands", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brands: updated }),
    });
    if (!res.ok) {
      alert("Save failed");
      return;
    }
    setBrandsMap(updated);
    pickSalt(pickerOpen, salt);
  }

  const total = useMemo(() => {
    return medicines.reduce((sum, m) => {
      const p = parseFloat(m.price) || 0;
      const q = parseFloat(m.qty) || 1;
      return sum + p * q;
    }, 0);
  }, [medicines]);

  async function handlePrint() {
    // Decrement stock — but only if brandsMap actually loaded (never overwrite with empty)
    const updatedBrands = { ...brandsMap };
    let stockChanged = false;
    if (Object.keys(updatedBrands).length === 0) {
      // brands not loaded — skip stock update, just print (protect existing data)
      setPrintMode(true);
      setTimeout(() => window.print(), 200);
      return;
    }
    for (const m of medicines) {
      if (!m.salt) continue;
      const entry = updatedBrands[m.salt];
      if (entry && entry.stock !== undefined && entry.stock !== "") {
        const cur = parseInt(entry.stock);
        if (!isNaN(cur)) {
          const qty = parseInt(m.qty) || 1;
          updatedBrands[m.salt] = {
            ...entry,
            stock: String(Math.max(0, cur - qty)),
          };
          stockChanged = true;
        }
      }
    }
    if (stockChanged) {
      try {
        await fetch("/api/brands", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brands: updatedBrands }),
        });
        setBrandsMap(updatedBrands);
      } catch {
        /* stock update is best-effort */
      }
    }
    setPrintMode(true);
    setTimeout(() => window.print(), 200);
  }

  if (loadingInit)
    return <p className="text-center mt-20 text-gray-400">Loading...</p>;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
        @media screen {
          .print-only { display: none !important; }
        }
      `}</style>

      <main className="min-h-screen bg-orange-50 p-4 pb-4 no-print">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => router.back()}
            className="text-orange-700 text-sm mb-4 mt-2 flex items-center gap-1"
          >
            ← Back
          </button>

          <h1 className="text-2xl font-bold text-orange-800 mb-4">
            Walk-in Sale 🛒
          </h1>

          {/* Patient details */}
          <div className="bg-white rounded-2xl shadow p-4 mb-4 flex flex-col gap-3">
            <p className="font-semibold text-gray-700 text-sm">
              Patient Details{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </p>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Patient name"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <input
              type="tel"
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
              placeholder="Phone number"
              inputMode="tel"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {/* Medicines */}
          <div className="bg-white rounded-2xl shadow p-4 mb-4">
            <p className="font-semibold text-gray-700 mb-3">Medicines</p>

            <div className="flex flex-col gap-4">
              {medicines.map((med, i) => {
                const hasMapping = !!brandsMap[med.salt];
                return (
                  <div
                    key={i}
                    className="border border-gray-200 rounded-xl p-3 flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-semibold text-gray-500">
                        Item {i + 1}
                      </p>
                      {medicines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRow(i)}
                          className="text-xs text-red-400"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {/* Salt dropdown trigger */}
                    <div>
                      <label className="text-[10px] text-gray-400">
                        Salt / Generic
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setPickerOpen(i);
                          setPickerSearch("");
                          setNewSaltMode(false);
                        }}
                        className={`w-full text-left border rounded-lg px-3 py-2 text-sm ${
                          med.salt
                            ? "border-orange-300 bg-orange-50 text-gray-800"
                            : "border-gray-200 text-gray-400"
                        }`}
                      >
                        {med.salt || "Tap to select salt..."}
                      </button>
                    </div>

                    {/* Brand */}
                    <div>
                      <div className="flex justify-between items-end">
                        <label className="text-[10px] text-gray-400">
                          Brand name
                        </label>
                        {med.salt && med.brand && !hasMapping && (
                          <button
                            type="button"
                            onClick={() => saveBrandMapping(i)}
                            className="text-[10px] text-indigo-600 font-semibold"
                          >
                            💾 Save as my brand
                          </button>
                        )}
                        {hasMapping && (
                          <span className="text-[10px] text-emerald-600">
                            ✓ Saved
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={med.brand}
                        onChange={(e) =>
                          updateField(i, "brand", e.target.value)
                        }
                        placeholder="e.g. Oleanz 5"
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                      />
                    </div>

                    <div className="flex gap-2">
                      <div className="w-20">
                        <label className="text-[10px] text-gray-400">Qty</label>
                        <input
                          type="text"
                          value={med.qty}
                          onChange={(e) =>
                            updateField(i, "qty", e.target.value)
                          }
                          inputMode="decimal"
                          placeholder="1"
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-gray-400">
                          ₹ Price
                        </label>
                        <input
                          type="text"
                          value={med.price}
                          onChange={(e) =>
                            updateField(i, "price", e.target.value)
                          }
                          inputMode="decimal"
                          placeholder="0"
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                        />
                      </div>
                      <div className="w-24 flex flex-col justify-end">
                        <label className="text-[10px] text-gray-400">
                          Amount
                        </label>
                        <p className="border border-gray-100 bg-gray-50 rounded-lg px-2 py-1.5 text-sm text-right font-semibold text-emerald-700">
                          ₹
                          {(
                            (parseFloat(med.price) || 0) *
                            (parseFloat(med.qty) || 1)
                          ).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addRow}
              className="mt-3 w-full border-2 border-dashed border-orange-300 text-orange-600 py-2 rounded-xl text-sm font-semibold"
            >
              + Add Medicine
            </button>

            {medicines.length > 0 && (
              <div className="mt-4 flex justify-between items-center border-t pt-3">
                <p className="font-semibold text-gray-700">Total</p>
                <p className="text-xl font-bold text-emerald-700">
                  ₹ {total.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handlePrint}
            className="w-full bg-gray-800 text-white py-3 rounded-2xl font-semibold text-base"
          >
            🖨️ Print Bill
          </button>
        </div>
      </main>

      {/* Salt Picker Modal */}
      {pickerOpen !== null && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center no-print"
          onClick={() => setPickerOpen(null)}
        >
          <div
            className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <p className="font-bold text-gray-800">Select Salt</p>
              <button
                onClick={() => setPickerOpen(null)}
                className="text-gray-400 text-xl"
              >
                ×
              </button>
            </div>

            {!newSaltMode ? (
              <>
                <div className="p-3 border-b border-gray-100">
                  <input
                    type="text"
                    autoFocus
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    placeholder="Search salt..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>

                <div className="flex-1 overflow-y-auto">
                  {filteredSalts.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-8">
                      No match — press &quot;+ New Salt&quot; below
                    </p>
                  ) : (
                    filteredSalts.map((s) => {
                      const mapped = brandsMap[s];
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => pickSalt(pickerOpen, s)}
                          className="w-full text-left px-4 py-2.5 border-b border-gray-100 hover:bg-orange-50 flex justify-between items-center"
                        >
                          <div>
                            <p className="text-sm text-gray-800">{s}</p>
                            {mapped?.brand && (
                              <p className="text-[11px] text-indigo-600">
                                → {mapped.brand}{" "}
                                {mapped.price ? `(₹${mapped.price})` : ""}
                              </p>
                            )}
                          </div>
                          {mapped?.brand && (
                            <span className="text-[10px] text-emerald-600">
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="p-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setNewSaltMode(true);
                      setNewSaltInput(pickerSearch);
                    }}
                    className="w-full border-2 border-dashed border-indigo-300 text-indigo-600 py-2 rounded-lg text-sm font-semibold"
                  >
                    + Add New Salt
                  </button>
                </div>
              </>
            ) : (
              <div className="p-4 flex flex-col gap-3">
                <label className="text-xs text-gray-500">
                  New salt name (with dose)
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newSaltInput}
                  onChange={(e) => setNewSaltInput(e.target.value)}
                  placeholder="e.g. Pregabalin 75mg"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <p className="text-[11px] text-gray-500">
                  This new salt will be saved to your personal list and shown in
                  the dropdown next time
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewSaltMode(false);
                      setNewSaltInput("");
                    }}
                    className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addNewSaltToLibrary}
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-semibold"
                  >
                    Save & Select
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRINT LAYOUT */}
      <div className="print-only p-6">
        <div className="flex items-start justify-between mb-4 border-b-2 border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            {clinicInfo?.clinic_logo && (
              <img
                src={clinicInfo.clinic_logo}
                alt="logo"
                className="h-16 w-16 object-contain"
              />
            )}
            <div>
              <p className="text-xl font-bold text-gray-900">
                {clinicInfo?.name || "Clinic"}
              </p>
              {clinicInfo?.doctor_name && (
                <p className="text-sm font-semibold text-gray-700">
                  {clinicInfo.doctor_name}
                </p>
              )}
              {clinicInfo?.qualification && (
                <p className="text-xs text-gray-500">
                  {clinicInfo.qualification}
                </p>
              )}
              {clinicInfo?.clinic_address && (
                <p className="text-xs text-gray-500">
                  {clinicInfo.clinic_address}
                </p>
              )}
              {clinicInfo?.clinic_phone && (
                <p className="text-xs text-gray-500">
                  📞 {clinicInfo.clinic_phone}
                </p>
              )}
            </div>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p className="font-bold text-base text-gray-800">WALK-IN BILL</p>
            <p>{new Date(billDate).toLocaleDateString("en-IN")}</p>
            <p>
              {new Date(billDate).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        {(patientName || patientPhone) && (
          <div className="mb-4 text-sm">
            {patientName && (
              <p>
                <strong>Patient:</strong> {patientName}
              </p>
            )}
            {patientPhone && (
              <p>
                <strong>Phone:</strong> {patientPhone}
              </p>
            )}
          </div>
        )}

        <table className="w-full text-sm border-collapse mb-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left border border-gray-300 px-2 py-1.5">
                #
              </th>
              <th className="text-left border border-gray-300 px-2 py-1.5">
                Brand / Salt
              </th>
              <th className="text-right border border-gray-300 px-2 py-1.5">
                Qty
              </th>
              <th className="text-right border border-gray-300 px-2 py-1.5">
                Price
              </th>
              <th className="text-right border border-gray-300 px-2 py-1.5">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {medicines.map((m, i) => (
              <tr key={i} className="border-b border-gray-200">
                <td className="border border-gray-300 px-2 py-1">{i + 1}</td>
                <td className="border border-gray-300 px-2 py-1">
                  <p className="font-medium">{m.brand || m.salt || "—"}</p>
                  {m.brand && m.salt && (
                    <p className="text-xs text-gray-400">({m.salt})</p>
                  )}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-right">
                  {m.qty || 1}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-right">
                  ₹{m.price || 0}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-right font-semibold">
                  ₹
                  {(
                    (parseFloat(m.price) || 0) * (parseFloat(m.qty) || 1)
                  ).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50">
              <td
                colSpan={4}
                className="border border-gray-300 px-2 py-2 text-right font-bold"
              >
                Total
              </td>
              <td className="border border-gray-300 px-2 py-2 text-right font-bold text-emerald-700">
                ₹{total.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>

        <p className="text-xs text-gray-400 text-center mt-6">
          Thank you · {clinicInfo?.name}
        </p>
      </div>
    </>
  );
}
