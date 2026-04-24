import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Team List | Nismara Racing',
  description:
    'Temukan daftar team Nismara Racing Indonesia dengan informasi lengkap, profil pembalap, dan performa tim dalam berbagai event balap',
  openGraph: {
    title: 'Team List - Nismara Racing',
    description:
      'Temukan daftar team Nismara Racing Indonesia dengan informasi lengkap, profil pembalap, dan performa tim dalam berbagai event balap',
    images: ['https://i.imgur.com/WTq93jI.png'],
  },
  keywords: ['Nismara Racing', 'Nismara Group', 'Team Nismara Racing'],
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

export default function TeamsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
