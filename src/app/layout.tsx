import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@/lib/dev-error-handler"; // Filter HMR errors in development
import { ClientProviders } from "@/components/providers/client-providers";
import { reportWebVital, type WebVitalData } from "@/lib/monitoring";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gym Manager",
  description: "Modern gym management system",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}

/**
 * Report Web Vitals to monitoring system
 * Metrics tracked: FCP, LCP, CLS, FID, TTFB, INP
 * Only reported in production builds
 */
export function reportWebVitals(metric: WebVitalData) {
  reportWebVital(metric);
}
