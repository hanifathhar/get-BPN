import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrustMark PBB dan BPHTB - Kabupaten Tapanuli Selatan",
  description: "Dokumentasi & Layanan API Interoperabilitas",
  icons: {
    icon: "/Logo-Tapsel.png",
    shortcut: "/Logo-Tapsel.png",
    apple: "/Logo-Tapsel.png",
  },
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
