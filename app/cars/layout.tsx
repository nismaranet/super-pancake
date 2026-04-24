import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Car List | Nismara Racing',
  description:
    'Temukan daftar mobil di Nismara Racing Indonesia. Lihat berbagai kendaraan balap, spesifikasi, dan performa terbaik untuk setiap kompetisi',
  openGraph: {
    title: 'Car List - Nismara Racing',
    description:
      'Temukan daftar mobil di Nismara Racing Indonesia. Lihat berbagai kendaraan balap, spesifikasi, dan performa terbaik untuk setiap kompetisi',
    images: ['https://i.imgur.com/WTq93jI.png'],
  },
  keywords: [
    'Nismara Racing',
    'Nismara Group',
    'List Car Nismara Racing',
    'Daftar Kendaraan Nismara Racing',
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

export default function CarsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
