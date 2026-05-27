"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = {
  doctor: [
    { href: "/doctor", icon: "🩺", label: "Queue" },
    { href: "/doctor/patients", icon: "👥", label: "Patients" },
    { href: "/doctor/reminders", icon: "🔔", label: "Reminders" },
    { href: "/doctor/settings", icon: "⚙️", label: "Settings" },
  ],
  receptionist: [
    { href: "/receptionist", icon: "🏥", label: "Reception" },
  ],
  pharmacy: [
    { href: "/pharmacy", icon: "💊", label: "Pharmacy" },
    { href: "/pharmacy/walkin", icon: "🚶", label: "Walk-in" },
    { href: "/pharmacy/brands", icon: "🏷️", label: "Brands" },
  ],
  psychologist: [
    { href: "/psychologist", icon: "🧠", label: "Patients" },
  ],
};

export default function BottomNav({ role = "doctor" }) {
  const pathname = usePathname();
  const items = NAV[role] || [];

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("logout error:", e);
    }
    window.location.href = "/login";
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
      <div className="max-w-2xl mx-auto flex items-stretch">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" + role &&
              pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 text-[11px] font-medium ${
                active ? "text-emerald-600" : "text-gray-500"
              }`}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="mt-1">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center justify-center py-2 text-[11px] font-medium text-red-500"
        >
          <span className="text-xl leading-none">🚪</span>
          <span className="mt-1">Logout</span>
        </button>
      </div>
    </div>
  );
}