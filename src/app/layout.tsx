import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { connection } from "next/server";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Site VIP", template: "%s · Site VIP" },
  description: "Know if your business is in the black this month.",
  applicationName: "Site VIP",
  appleWebApp: { capable: true, title: "Site VIP", statusBarStyle: "default" },
  // Stop iOS turning dollar figures into phone-number links.
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#f6f5f1",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Render every page per request, so each one carries the nonce from its
  // Content Security Policy (see src/proxy.ts).
  await connection();

  return (
    <html lang="en-AU" className={`${geist.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
