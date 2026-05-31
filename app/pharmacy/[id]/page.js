"use client";
import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";

export default function PharmacyPrescriptionPage() {
  const { id } = useParams();
  const router = useRouter();

  const [prescription, setPrescription] = useState(null);
  const [patient, setPatient] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clinicInfo, setClinicInfo] = useState(null);
  const [brandsMap, setBrandsMap] = useState({});
  const [adding, setAdding] = useState(false);
  const [newMed, setNewMed] = useState({
    salt: "",
    brand: "",
    qty: "1",
    price: "",
  });

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/prescriptions/${id}`);
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (res.status === 403) {
          window.location.href = "/expired";
          return;
        }
        return;
      }
      const data = await res.json();
      setPrescription(data);
      if (data.status === "dispensed") setDone(true);

      const qRes = await fetch(
        `/api/prescriptions?patient_id=${data.patient_id}`,
      );
      if (!qRes.ok) {
        if (qRes.status === 401) {
          window.location.href = "/login";
          return;
        }
        return;
      }
      const qData = await qRes.json();
      if (qData.length > 0)
        setPatient({
          name: qData[0].patient_name,
          phone: qData[0].patient_phone,
        });

      const [brandsRes, settingsRes] = await Promise.all([
        fetch("/api/brands"),
        fetch("/api/settings"),
      ]);
      const brandsData = brandsRes.ok ? await brandsRes.json() : { brands: {} };
      const settingsData = settingsRes.ok ? await settingsRes.json() : {};
      setClinicInfo(settingsData);

      const bMap = brandsData.brands || {};
      setBrandsMap(bMap);

      if (data.medicines && data.medicines !== "") {
        try {
          const meds = JSON.parse(data.medicines);
          setMedicines(
            meds.map((m) => {
              const key = `${m.name} ${m.dose}`.trim();
              const mapped = bMap[key] || bMap[m.name] || {};
              return {
                name: m.name || "",
                dose: m.dose || "",
                timing: Array.isArray(m.timing) ? m.timing : [],
                duration: m.duration || "",
                food: m.food || "After food",
                brand: mapped.brand || m.brand || "",
                price: mapped.price || m.price || "",
                qty: m.qty || "1",
                dispensed: m.dispensed || false,
              };
            }),
          );
        } catch {}
      }
    }
    load();
  }, [id]);

  function updateField(i, field, value) {
    setMedicines((prev) =>
      prev.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)),
    );
  }

  function removeMedicine(i) {
    if (!confirm("Remove?")) return;
    setMedicines((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleNewSaltChange(value) {
    const mapped = brandsMap[value] || {};
    setNewMed((prev) => ({
      ...prev,
      salt: value,
      brand: mapped.brand || prev.brand,
      price: mapped.price || prev.price,
    }));
  }

  function addMedicine() {
    if (!newMed.salt && !newMed.brand) {
      alert("Enter Salt or Brand");
      return;
    }
    setMedicines((prev) => [
      ...prev,
      {
        name: newMed.salt,
        dose: "",
        timing: [],
        duration: "",
        food: "After food",
        brand: newMed.brand,
        price: newMed.price,
        qty: newMed.qty,
        dispensed: false,
      },
    ]);
    setNewMed({ salt: "", brand: "", qty: "1", price: "" });
    setAdding(false);
  }

  const total = useMemo(() => {
    return medicines.reduce((sum, m) => {
      const p = parseFloat(m.price) || 0;
      const q = parseFloat(m.qty) || 1;
      return sum + p * q;
    }, 0);
  }, [medicines]);

  async function handleDispense() {
    setSaving(true);

    // Decrement stock for each dispensed medicine (match by salt name in brandsMap)
    const updatedBrands = { ...brandsMap };
    let stockChanged = false;
    for (const m of medicines) {
      if (!m.name) continue;
      const entry = updatedBrands[m.name];
      if (entry && entry.stock !== undefined && entry.stock !== "") {
        const cur = parseInt(entry.stock);
        if (!isNaN(cur)) {
          const qty = parseInt(m.qty) || 1;
          updatedBrands[m.name] = {
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
      } catch {
        /* stock update is best-effort */
      }
    }

    const res = await fetch(`/api/prescriptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        medicines: JSON.stringify(medicines),
        status: "dispensed",
      }),
    });
    setSaving(false);
    if (!res.ok) {
      alert("Failed to save");
      return;
    }
    setDone(true);
  }

  function handlePrint() {
    window.print();
  }

  if (!prescription)
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

          <div className="bg-white rounded-2xl shadow p-4 mb-4">
            <p className="font-bold text-lg text-gray-800">{patient?.name}</p>
            <p className="text-sm text-gray-500">{patient?.phone}</p>
            <p className="text-xs text-gray-400 mt-1">
              Token #{prescription.id} · {prescription.visit_date?.slice(0, 16)}
            </p>
            {prescription.complaints && (
              <p className="text-sm text-gray-600 mt-1">
                C/O: {prescription.complaints}
              </p>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow p-4 mb-4">
            <p className="font-semibold text-gray-700 mb-3">
              Medicines ({medicines.length})
            </p>
            <div className="flex flex-col gap-4">
              {medicines.map((med, i) => (
                <div
                  key={i}
                  className="border border-gray-200 rounded-xl p-3 flex flex-col gap-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-sm text-gray-800">
                        {med.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {med.dose} · {med.timing.join("-") || "—"} ·{" "}
                        {med.duration}
                      </p>
                      <p className="text-xs text-gray-400">{med.food}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateField(i, "dispensed", !med.dispensed)
                        }
                        className={`text-xs px-3 py-1 rounded-full font-semibold border transition ${
                          med.dispensed
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : "border-gray-300 text-gray-500"
                        }`}
                      >
                        {med.dispensed ? "✓ Given" : "Give"}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeMedicine(i)}
                        className="text-lg text-red-400"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-400">Brand</label>
                      <input
                        type="text"
                        value={med.brand}
                        onChange={(e) =>
                          updateField(i, "brand", e.target.value)
                        }
                        placeholder="Brand name"
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                      />
                    </div>
                    <div className="w-20">
                      <label className="text-[10px] text-gray-400">Qty</label>
                      <input
                        type="text"
                        value={med.qty}
                        onChange={(e) => updateField(i, "qty", e.target.value)}
                        inputMode="decimal"
                        placeholder="1"
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                      />
                    </div>
                    <div className="w-24">
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
                  </div>
                </div>
              ))}
            </div>

            {adding ? (
              <div className="border border-orange-200 rounded-xl p-3 flex flex-col gap-2 mt-4">
                <p className="text-xs font-semibold text-orange-600">
                  New Medicine
                </p>
                <input
                  list="new-salts"
                  type="text"
                  value={newMed.salt}
                  onChange={(e) => handleNewSaltChange(e.target.value)}
                  placeholder="Salt name"
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                />
                <datalist id="new-salts">
                  {Object.keys(brandsMap).map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
                <input
                  type="text"
                  value={newMed.brand}
                  onChange={(e) =>
                    setNewMed((p) => ({ ...p, brand: e.target.value }))
                  }
                  placeholder="Brand name"
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMed.qty}
                    onChange={(e) =>
                      setNewMed((p) => ({ ...p, qty: e.target.value }))
                    }
                    placeholder="Qty"
                    inputMode="decimal"
                    className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                  />
                  <input
                    type="text"
                    value={newMed.price}
                    onChange={(e) =>
                      setNewMed((p) => ({ ...p, price: e.target.value }))
                    }
                    placeholder="₹ Price"
                    inputMode="decimal"
                    className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addMedicine}
                    className="flex-1 bg-orange-500 text-white py-2 rounded-xl text-sm font-semibold"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setAdding(false)}
                    className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-xl text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="mt-3 w-full border-2 border-dashed border-orange-300 text-orange-600 py-2 rounded-xl text-sm font-semibold"
              >
                + Add Medicine
              </button>
            )}

            {medicines.length > 0 && (
              <div className="mt-4 flex justify-between items-center border-t pt-3">
                <p className="font-semibold text-gray-700">Total</p>
                <p className="text-lg font-bold text-emerald-700">
                  ₹ {total.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {done && (
            <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-xl p-3 mb-3 text-center">
              ✓ Dispensed
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleDispense}
              disabled={saving || done}
              className="bg-emerald-600 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-60 transition"
            >
              {saving ? "Saving..." : done ? "Dispensed" : "Mark Dispensed"}
            </button>
            <button
              onClick={handlePrint}
              className="bg-gray-800 text-white py-3 rounded-xl font-semibold text-sm transition"
            >
              Print Bill
            </button>
          </div>
        </div>
      </main>

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
            <p className="font-bold text-base text-gray-800">PHARMACY BILL</p>
            <p>Token #{prescription.id}</p>
            <p>{prescription.visit_date?.slice(0, 10)}</p>
          </div>
        </div>

        <div className="flex justify-between mb-4 text-sm">
          <div>
            <p>
              <strong>Patient:</strong> {patient?.name}
            </p>
            <p>
              <strong>Phone:</strong> {patient?.phone}
            </p>
          </div>
        </div>

        <table className="w-full text-sm border-collapse mb-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left border border-gray-300 px-2 py-1.5">
                #
              </th>
              <th className="text-left border border-gray-300 px-2 py-1.5">
                Salt / Brand
              </th>
              <th className="text-left border border-gray-300 px-2 py-1.5">
                Timing
              </th>
              <th className="text-left border border-gray-300 px-2 py-1.5">
                Duration
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
                  <p className="font-medium">{m.brand || m.name}</p>
                  {m.brand && (
                    <p className="text-xs text-gray-400">
                      ({m.name} {m.dose})
                    </p>
                  )}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-xs">
                  {m.timing.join("-") || "—"} · {m.food}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-xs">
                  {m.duration}
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
                colSpan={6}
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
