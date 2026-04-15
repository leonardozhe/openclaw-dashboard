import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Orbitron, Rajdhani, Share_Tech_Mono } from 'next/font/google';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 添加赛博朋克风格字体
const orbitron = Orbitron({
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: "--font-orbitron",
  subsets: ["latin"],
});

const rajdhani = Rajdhani({
  weight: ['300', '400', '500', '600', '700'],
  variable: "--font-rajdhani",
  subsets: ["latin"],
});

const shareTechMono = Share_Tech_Mono({
  weight: ['400'],
  variable: "--font-share-tech-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MeetClaw - OpenClaw Desktop Manager",
  description: "OpenClaw Desktop Manager Application",
  icons: {
    icon: "/lobster.png",
    apple: "/lobster.png",
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
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} ${rajdhani.variable} ${shareTechMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
