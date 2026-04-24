import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Nismara Racing',
  description:
    'Pelajari syarat dan ketentuan Nismara Racing. Ketahui aturan penggunaan, kebijakan, serta hak dan kewajiban pengguna platform',
  openGraph: {
    title: 'Terms & Conditions - Nismara Racing',
    description:
      'Pelajari syarat dan ketentuan Nismara Racing. Ketahui aturan penggunaan, kebijakan, serta hak dan kewajiban pengguna platform',
    images: ['https://i.imgur.com/WTq93jI.png'],
  },
  keywords: ['Nismara Racing', 'Nismara Group', 'Terms Nismara Racing'],
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

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
