import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nismara Racing - Sim Racing Community Indonesia by Nismara Group",
  description: "Komunitas Sim Racing Indonesia yang didirikan oleh Nismara Group. Bergabunglah dengan kami untuk pengalaman balap virtual terbaik dan server balap yang seru!",
};

export default function RootLayout({
  
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-gray-900 text-white">
  <Navbar />
  {children}
  <Footer />
</body>
    </html>
  );
}
