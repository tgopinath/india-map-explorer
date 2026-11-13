import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import AppShell from "@/components/AppShell";
import "./globals.css";

const baloo = Baloo_2({ variable: "--font-baloo", subsets: ["latin"], weight: ["500", "600", "700", "800"] });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "India Map Explorer",
  description: "Learn India's states, Union Territories and districts with maps, puzzles and quizzes.",
};

export const viewport: Viewport = {
  themeColor: "#356ae6",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${baloo.variable} ${nunito.variable} antialiased`}>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
