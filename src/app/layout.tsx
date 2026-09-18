import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PropertyCheck Pakistan — due diligence before you commit money",
    template: "%s · PropertyCheck Pakistan",
  },
  description:
    "Make property due diligence understandable to ordinary Pakistanis. Not a listing site. Understand a property before you commit money. Never claims a deal is legally verified unless an official source confirms it.",
  applicationName: "PropertyCheck Pakistan",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
  appleWebApp: { capable: true, title: "PropertyCheck" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0b3a24",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
