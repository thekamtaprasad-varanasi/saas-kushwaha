import Link from 'next/link';
export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 bg-zinc-900">
      <h1 className="text-3xl font-bold text-white text-center">Clinic Management</h1>
      <p className="text-gray-400">Select your role to continue</p>
      <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
        <Link href="/login"
          className="bg-emerald-600 text-white text-center py-4 px-6 rounded-2xl text-lg font-semibold hover:bg-emerald-700 transition">
          Doctor
        </Link>
        <Link href="/receptionist/login"
          className="bg-indigo-600 text-white text-center py-4 px-6 rounded-2xl text-lg font-semibold hover:bg-indigo-700 transition">
          Receptionist
        </Link>
        <Link href="/pharmacy/login"
          className="bg-orange-600 text-white text-center py-4 px-6 rounded-2xl text-lg font-semibold hover:bg-orange-700 transition">
          Pharmacy
        </Link>
        <Link href="/psychologist/login"
          className="bg-purple-600 text-white text-center py-4 px-6 rounded-2xl text-lg font-semibold hover:bg-purple-700 transition">
          Psychologist
        </Link>
      </div>
    </main>
  );
}