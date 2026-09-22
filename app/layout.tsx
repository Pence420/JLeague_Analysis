import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "J-Scout — J1 League Intelligence",
  description:
    "Explainable J1 League scouting analytics built from clearly labeled sample data.",
  openGraph: {
    title: "J-Scout — J1 League Intelligence",
    description: "Evidence-led, transparent football recruitment analysis.",
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
