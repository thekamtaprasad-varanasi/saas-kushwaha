export const dynamic = "force-dynamic";
import "./globals.css";
import { Inter } from "next/font/google";
import { getSession } from "@/lib/session";
import TopBar from "@/components/TopBar";
import ServiceWorker from "./ServiceWorker";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Psychiatrist Pro",
  description: "Where Mental Healing Meets Technology",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Psychiatrist Pro",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#4f46e5",
};

export default async function RootLayout({ children }) {
  const session = await getSession();

  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gray-50`}>
        <ServiceWorker />
        {session ? (
          <>
            <TopBar role={session.role} name={session.name} />
            <main className="max-w-5xl mx-auto px-4 pt-16 pb-8">
              {children}
            </main>
          </>
        ) : (
          <main>{children}</main>
        )}
      </body>
    </html>
  );
}