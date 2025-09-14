import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CA Practice Automation",
  description: "Comprehensive platform for Chartered Accountants to manage GST returns, ITR filings, and client relationships with AI-powered automation.",
  keywords: ["CA", "Chartered Accountant", "GST", "ITR", "Tax Automation", "AI", "Next.js", "TypeScript"],
  authors: [{ name: "CA Practice Automation Team" }],
  openGraph: {
    title: "CA Practice Automation",
    description: "AI-powered platform for Chartered Accountants to streamline GST returns, ITR filings, and client management.",
    url: "https://ca-practice-automation.com",
    siteName: "CA Practice Automation",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CA Practice Automation",
    description: "AI-powered platform for Chartered Accountants",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
