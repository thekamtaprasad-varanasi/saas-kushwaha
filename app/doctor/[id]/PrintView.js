"use client";

function parseMSE(raw) {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export default function PrintView({
  prescription,
  patient,
  clinic,
  medicines,
  mse,
  tests,
  notes,
  followupDate,
  complaints,
  diagnosis,
}) {
  const mseObj = typeof mse === "string" ? parseMSE(mse) : mse || {};

  return (
    <div className="hidden print:block p-8 max-w-2xl mx-auto font-serif text-sm text-gray-900">
      {/* Letterhead */}
      <div className="flex items-start justify-between border-b-2 border-gray-800 pb-3 mb-4">
        <div className="flex-1">
          {clinic?.clinic_logo && (
            <img
              src={clinic.clinic_logo}
              alt="logo"
              className="h-16 object-contain mb-2"
            />
          )}
          <p className="text-xl font-bold text-gray-900">
            {clinic?.doctor_name || "Doctor Name"}
          </p>
          <p className="text-sm text-gray-600">{clinic?.qualification || ""}</p>
          {clinic?.reg_no && (
            <p className="text-xs text-gray-500">Reg. No: {clinic.reg_no}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">{clinic?.name || ""}</p>
        </div>
        <div className="text-right text-xs text-gray-600">
          <p>{clinic?.clinic_address || ""}</p>
          {clinic?.clinic_phone && <p>Ph: {clinic.clinic_phone}</p>}
        </div>
      </div>

      {/* Patient Info */}
      <div className="flex justify-between mb-4 bg-gray-50 rounded p-3 text-xs">
        <div>
          <p>
            <strong>Patient:</strong> {patient?.name}
          </p>
          <p>
            <strong>Phone:</strong> {patient?.phone}
          </p>
        </div>
        <div className="text-right">
          <p>
            <strong>Token:</strong> #{prescription?.id}
          </p>
          <p>
            <strong>Date:</strong> {prescription?.visit_date?.slice(0, 10)}
          </p>
        </div>
      </div>

      {complaints && (
        <p className="mb-2">
          <strong>C/O:</strong> {complaints}
        </p>
      )}

      {(prescription?.weight || prescription?.bp || prescription?.sugar) && (
        <p className="mb-2">
          <strong>Vitals:</strong>{" "}
          {[
            prescription?.weight && `Weight ${prescription.weight} kg`,
            prescription?.bp && `BP ${prescription.bp}`,
            prescription?.sugar && `Sugar ${prescription.sugar}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
      {diagnosis && (
        <p className="mb-2">
          <strong>Diagnosis:</strong> {diagnosis}
        </p>
      )}

      {(mseObj.mood ||
        mseObj.affect ||
        mseObj.thought ||
        mseObj.appearance ||
        mseObj.perception ||
        mseObj.cognition ||
        mseObj.insight ||
        mseObj.judgement) && (
        <div className="mb-3">
          <p className="font-semibold mb-1">Mental Status Examination:</p>
          <div className="pl-2 text-xs flex flex-col gap-0.5">
            {mseObj.appearance && <p>Appearance: {mseObj.appearance}</p>}
            {mseObj.mood && <p>Mood: {mseObj.mood}</p>}
            {mseObj.affect && <p>Affect: {mseObj.affect}</p>}
            {mseObj.thought && <p>Thought: {mseObj.thought}</p>}
            {mseObj.perception && <p>Perception: {mseObj.perception}</p>}
            {mseObj.cognition && <p>Cognition: {mseObj.cognition}</p>}
            {(mseObj.insight || mseObj.judgement) && (
              <p>
                Insight: {mseObj.insight || "—"} · Judgement:{" "}
                {mseObj.judgement || "—"}
              </p>
            )}
          </div>
        </div>
      )}

      {tests && (
        <p className="mb-3">
          <strong>Investigations:</strong> {tests}
        </p>
      )}

      {medicines.filter((m) => m.name).length > 0 && (
        <div className="mb-4">
          <p className="font-bold mb-1 text-base">Rx</p>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-400">
                <th className="text-left py-1 pr-2">Medicine</th>
                <th className="text-left py-1 pr-2">Dose</th>
                <th className="text-left py-1 pr-2">Timing</th>
                <th className="text-left py-1 pr-2">Food</th>
                <th className="text-left py-1">Duration</th>
              </tr>
            </thead>
            <tbody>
              {medicines
                .filter((m) => m.name)
                .map((m, i) => (
                  <tr key={i} className="border-b border-gray-200">
                    <td className="py-1 pr-2 font-medium">
                      {m.brand ? (
                        <>
                          {m.brand}
                          <span className="block text-[10px] text-gray-500 font-normal">
                            ({m.name})
                          </span>
                        </>
                      ) : (
                        m.name
                      )}
                    </td>
                    <td className="py-1 pr-2">{m.dose}</td>
                    <td className="py-1 pr-2">{m.timing.join("-") || "—"}</td>
                    <td className="py-1 pr-2">{m.food}</td>
                    <td className="py-1">{m.duration}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {notes && (
        <p className="mb-2">
          <strong>Advice:</strong> {notes}
        </p>
      )}

      {followupDate && (
        <p className="mb-2">
          <strong>Follow-up:</strong> {followupDate}
        </p>
      )}

      <div className="mt-12 flex justify-end">
        <div className="text-center text-xs">
          {clinic?.signature && (
            <img
              src={clinic.signature}
              alt="signature"
              className="h-14 object-contain mx-auto mb-1"
            />
          )}
          <div className="border-t border-gray-500 w-36 mb-1" />
          <p>{clinic?.doctor_name || "Doctor"}</p>
          <p className="text-gray-500">{clinic?.qualification || ""}</p>
          {clinic?.reg_no && (
            <p className="text-gray-500">Reg. No: {clinic.reg_no}</p>
          )}
        </div>
      </div>
    </div>
  );
}