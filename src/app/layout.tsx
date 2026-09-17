import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrustMark PBB dan BPHTB",
  description: "Dokumentasi & Layanan API",
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
