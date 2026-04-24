import type { Metadata, ResolvingMetadata } from 'next';
import { supabase } from '@/lib/supabaseClient';
import React from 'react';

type Props = {
  params: Promise<{ uri: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const resolvedParams = await params;
  const uri = resolvedParams.uri;

  const { data: teamData, error } = await supabase
    .from('teams')
    .select('*')
    .eq('uri', uri)
    .single();

  if (error) {
    console.error('Error fetching tracks for metadata:', error);
  }

  const teamName = teamData?.name || uri;
  const imageUrl = teamData?.banner_url || 'https://i.imgur.com/WTq93jI.png';
  const createDate = new Date(teamData?.created_at).toLocaleDateString(
    'id-ID',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
  );

  return {
    title: `${teamName} Team | Nismara Racing`,
    description: `Team ${teamName} adalah salah satu Team Racing yang terdaftar di Nismara Racing. ${teamName} terdaftar sejak ${createDate}`,
    openGraph: {
      title: `${teamName} Team | Nismara Racing`,
      description: `Team ${teamName} adalah salah satu Team Racing yang terdaftar di Nismara Racing. ${teamName} terdaftar sejak ${createDate}`,
      images: [imageUrl],
    },
    keywords: [
      `${teamName} Team`,
      `${teamName} Assetto Corsa`,
      `${teamName} Nismara Racing`,
      'Nismara Racing Team',
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
}

export default function TeamsUriLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
