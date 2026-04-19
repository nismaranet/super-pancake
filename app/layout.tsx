import type { Metadata } from 'next';
import {
  Geist as GeistFont,
  Geist_Mono as GeistMonoFont,
} from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CookieConsent from '@/components/CookieConsent';
import { SpeedInsights } from '@vercel/speed-insights/next';

const geistSans = GeistFont({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = GeistMonoFont({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Nismara Racing - Sim Racing Community Indonesia by Nismara Group',
  description:
    'Komunitas Sim Racing Indonesia yang didirikan oleh Nismara Group. Bergabunglah dengan kami untuk pengalaman balap virtual terbaik dan server balap yang seru!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning // Penting agar tidak error saat switch tema
    >
      {/* Menghapus 'bg-gray-900 text-white' agar body menggunakan 
        variabel warna dari globals.css (Dark/Light mode)
      */}
      <body className="min-h-screen flex flex-col transition-colors duration-300">
        <Providers>
          <Navbar />
          <SpeedInsights />
          {/* Menambahkan padding top agar konten tidak tertutup 
            navbar yang posisinya fixed 
          */}
          <main className="flex-grow pt-16">{children}</main>
          <CookieConsent />
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
