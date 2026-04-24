import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Events | Nismara Racing',
  description:
    'Daftar event balap Nismara Racing Indonesia terbaru. Cek jadwal lomba, lokasi event, dan informasi lengkap untuk mengikuti kompetisi racing terbaik',
  openGraph: {
    title: 'Events - Nismara Racing',
    description:
      'Daftar event balap Nismara Racing Indonesia terbaru. Cek jadwal lomba, lokasi event, dan informasi lengkap untuk mengikuti kompetisi racing terbaik',
    images: ['https://i.imgur.com/WTq93jI.png'],
  },
  keywords: ['Nismara Racing', 'Nismara Group', 'Event Nismara Racing'],
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

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
