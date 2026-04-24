import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Server List | Nismara Racing',
  description:
    'Lihat daftar server yang tersedia di Nismara Racing dan mulai balapan sekarang. Temukan server yang menarik untuk dimainkan bersama teman-teman',
  openGraph: {
    title: 'Server List | Nismara Racing',
    description:
      'Lihat daftar server yang tersedia di Nismara Racing dan mulai balapan sekarang. Temukan server yang menarik untuk dimainkan bersama teman-teman',
    images: ['https://i.imgur.com/WTq93jI.png'],
  },
  keywords: ['Nismara Racing', 'Nismara Group', 'Server Nismara Racing'],
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

export default function ServersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
