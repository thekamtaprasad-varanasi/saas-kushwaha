"use client";
import { useState } from "react";

export default function PsychologistLoginPage() {
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (phone.length !== 10 || pin.length !== 6) {
      setError("Enter 10-digit mobile and 6-digit PIN");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, pin, role: "psychologist" }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      window.location.href = "/psychologist";
    } else {
      setError(data.error || "Login failed");
    }
  }

  return (
    <main className="min-h-screen bg-purple-50 flex items-center justify-center p-4">
      <form
        autoComplete="off"
        onSubmit={(e) => e.preventDefault()}
        className="bg-white rounded-2xl shadow p-8 w-full max-w-sm flex flex-col gap-5"
      >
        {/* Decoy fields to absorb Chrome autofill */}
        <input type="text" name="username" autoComplete="username" className="hidden" tabIndex={-1} />
        <input type="password" name="password" autoComplete="current-password" className="hidden" tabIndex={-1} />

        <div className="text-center">
          <div className="text-4xl mb-2">🧠</div>
          <h1 className="text-xl font-bold text-purple-800">
            Psychologist Login
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Enter your mobile number and PIN
          </p>
        </div>

        <input
          type="tel"
          inputMode="numeric"
          name="psy-mobile-xyz"
          autoComplete="off"
          data-form-type="other"
          value={phone}
          onChange={(e) =>
            setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
          }
          placeholder="10-digit mobile number"
          maxLength={10}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        <div className="flex gap-2">
          <input
            type={showPin ? "text" : "password"}
            name="psy-pin-xyz"
            autoComplete="off"
            data-form-type="other"
            value={pin}
            onChange={(e) =>
              setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="6-digit PIN"
            maxLength={6}
            inputMode="numeric"
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <button
            type="button"
            onClick={() => setShowPin((p) => !p)}
            className="text-xl px-4 border border-gray-300 rounded-xl text-gray-500 hover:bg-gray-50"
            aria-label={showPin ? "Hide PIN" : "Show PIN"}
          >
            {showPin ? "🙈" : "👁️"}
          </button>
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          className="bg-purple-600 text-white py-3 rounded-2xl font-semibold text-base hover:bg-purple-700 disabled:opacity-60 transition"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </main>
  );
}