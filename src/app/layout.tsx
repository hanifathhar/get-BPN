import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SISMIOP PBB & BPN REST API",
  description: "Dokumentasi & Layanan API Basis Data Oracle SISMIOP PBB dan BPN",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="antialiased bg-slate-950 text-slate-100" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
