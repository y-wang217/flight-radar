import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Flight Radar" };
export const viewport: Viewport = { themeColor: "#09090b", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-zinc-950 text-zinc-100 antialiased">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
