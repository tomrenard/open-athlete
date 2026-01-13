import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OpenAthlete - Open Source Fitness Platform",
  description:
    "Track your runs, rides, and swims with OpenAthlete. An open-source fitness platform with beautiful analytics and social features.",
  keywords: ["fitness", "running", "cycling", "swimming", "tracking", "open source"],
  authors: [{ name: "OpenAthlete" }],
  openGraph: {
    title: "OpenAthlete - Open Source Fitness Platform",
    description: "Track your athletic journey with OpenAthlete",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
