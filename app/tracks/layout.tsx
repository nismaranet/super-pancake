import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Tracks List | Nismara Racing',
  description:
    'Daftar lengkap track Nismara Racing Indonesia. Lihat berbagai sirkuit balap, detail lintasan, dan statistik dari setiap pembalap di lintasan balap',
  openGraph: {
    title: 'Tracks List - Nismara Racing',
    description:
      'Daftar lengkap track Nismara Racing Indonesia. Lihat berbagai sirkuit balap, detail lintasan, dan statistik dari setiap pembalap di lintasan balap',
    images: ['https://i.imgur.com/WTq93jI.png'],
  },
  keywords: [
    'Nismara Racing',
    'Nismara Group',
    'Tracks Nismara Racing',
    'Daftar Circuit Nismara Racing',
  ],
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
    },
  },
};

export default function TracksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
