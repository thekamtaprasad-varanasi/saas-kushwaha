"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = {
  doctor: [
    { href: "/doctor", label: "Queue", icon: "🩺" },
    { href: "/doctor/patients", label: "Patients", icon: "👥" },
    { href: "/doctor/reminders", label: "Reminders", icon: "🔔" },
    { href: "/doctor/settings", label: "Settings", icon: "⚙️" },
  ],
  receptionist: [{ href: "/receptionist", label: "Reception", icon: "🏥" }],
  pharmacy: [
    { href: "/pharmacy", label: "Queue", icon: "💊" },
    { href: "/pharmacy/walkin", label: "Walk-in", icon: "🚶" },
    { href: "/pharmacy/brands", label: "Brands", icon: "🏷️" },
  ],
  psychologist: [{ href: "/psychologist", label: "Patients", icon: "🧠" }],
};

export default function TopBar({ role, name }) {
  const pathname = usePathname();
  const items = NAV[role] || [];

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-indigo-900 shadow-md">
      <div className="max-w-2xl mx-auto flex items-center gap-1 px-3 py-2 overflow-x-auto scrollbar-none">
        {/* Home */}
        <Link
          href="/home"
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
            pathname === "/home"
              ? "bg-white text-indigo-900"
              : "text-indigo-200 hover:bg-indigo-800"
          }`}
        >
          <span>🏠</span>
          <span>Home</span>
        </Link>
        <Link
          href="/help"
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
            pathname === "/help"
              ? "bg-white text-indigo-900"
              : "text-indigo-200 hover:bg-indigo-800"
          }`}
        >
          <span>❓</span>
          <span>Help</span>
        </Link>
        {/* Role links — PC only */}
        <div className="hidden md:flex items-center gap-1">
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" + role && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  active
                    ? "bg-white text-indigo-900"
                    : "text-indigo-200 hover:bg-indigo-800"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Name + Logout */}
        <button
          onClick={handleLogout}
          className="bg-transparent text-red-300 text-sm px-2 py-1.5 rounded-lg hover:bg-indigo-800 whitespace-nowrap transition"
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
}
