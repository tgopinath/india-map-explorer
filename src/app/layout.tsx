import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import Script from "next/script";
import AppShell from "@/components/AppShell";
import "./globals.css";

const baloo = Baloo_2({ variable: "--font-baloo", subsets: ["latin"], weight: ["500", "600", "700", "800"] });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Map Explorer — India & World 360",
  description: "Explore India's states and districts and the whole world on a 3D globe: landmarks, cultures, food, festivals, games and a travel passport for kids.",
};

export const viewport: Viewport = {
  themeColor: "#356ae6",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // the iOS app draws under the status bar and home indicator (safe areas)
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-m3-*: Material Design 3 inside the Android app only (shared Kolam M3 kit in public/m3). The app is
    // light-only, so the M3 scheme stays light too. The kit adds classes to <html> before hydration.
    // The iOS kit (public/ios) does the same inside the iOS app; data-theme="light" keeps it light as well.
    <html lang="en" className={`${baloo.variable} ${nunito.variable} antialiased`} data-m3-primary="#356ae6" data-theme="light" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-css-tags -- the kit is a static file shared with non-Next apps */}
        <link rel="stylesheet" href="/m3/kolam-m3.css" />
        {/* eslint-disable-next-line @next/next/no-css-tags -- iOS app mode (Apple HIG), shared Kolam iOS kit in public/ios */}
        <link rel="stylesheet" href="/ios/kolam-ios.css" />
      </head>
      <body>
        <Script src="/m3/kolam-m3.js" strategy="beforeInteractive" />
        <Script src="/ios/kolam-ios.js" strategy="beforeInteractive" />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
