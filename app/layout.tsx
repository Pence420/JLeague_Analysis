import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "J-Scout — J1 League Intelligence",
  description:
    "Auditable J1 League recruitment intelligence built from official 2025 standings and player records.",
  openGraph: {
    title: "J-Scout — J1 League Intelligence",
    description:
      "Evidence-led football analysis with official facts, labeled derivations, and explicit source boundaries.",
    type: "website",
    images: ["/og/j-scout-league-intelligence.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
