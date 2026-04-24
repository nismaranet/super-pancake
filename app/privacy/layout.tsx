import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Privacy Policy | Nismara Racing',
  description:
    'Kebijakan privasi Nismara Racing menjelaskan cara kami mengelola, melindungi, dan menggunakan data pengguna secara aman dan transparan',
  openGraph: {
    title: 'Privacy Policy - Nismara Racing',
    description:
      'Kebijakan privasi Nismara Racing menjelaskan cara kami mengelola, melindungi, dan menggunakan data pengguna secara aman dan transparan',
    images: ['https://i.imgur.com/WTq93jI.png'],
  },
  keywords: [
    'Nismara Racing',
    'Nismara Group',
    'Privacy Policy Nismara Racing',
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

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
