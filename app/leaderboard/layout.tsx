import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Leaderboards | Nismara Racing',
  description:
    'Siapa yang memimpin di Nismara Racing? Lihat leaderboard resmi dengan ranking pembalap, skor terkini, dan statistik balapan paling update',
  openGraph: {
    title: 'Leaderboards - Nismara Racing',
    description:
      'Siapa yang memimpin di Nismara Racing? Lihat leaderboard resmi dengan ranking pembalap, skor terkini, dan statistik balapan paling update',
    images: ['https://i.imgur.com/WTq93jI.png'],
  },
  keywords: ['Nismara Racing', 'Nismara Group', 'Leaderboard Nismara Racing'],
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

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
