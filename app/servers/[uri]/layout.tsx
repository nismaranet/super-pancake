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

  const { data: serverData, error } = await supabase
    .from('servers')
    .select('*')
    .eq('uri', uri)
    .single();

  const { data: trackData } = await supabase
    .from('tracks')
    .select('*')
    .eq('id', serverData.track_id)
    .single();

  if (error) {
    console.error('Error fetching tracks for metadata:', error);
  }

  const serverName = serverData?.name || uri;
  const imageUrl = serverData?.image_url || 'https://i.imgur.com/WTq93jI.png';
  const maxPlayer = serverData?.max_players || 'Unknown Author';
  const trackName = trackData?.name || 'Unknown Circuit';

  return {
    title: `${serverName} Details | Nismara Racing`,
    description: `Server ${serverName} saat ini bermain di ${trackName}. Server ${serverName} memiliki kapasistas ${maxPlayer} player. Ayo bergabung dan balapan bersama`,
    openGraph: {
      title: `${serverName} Details | Nismara Racing`,
      description: `Server ${serverName} saat ini bermain di ${trackName}. Server ${serverName} memiliki kapasistas ${maxPlayer} player. Ayo bergabung dan balapan bersama`,
      images: [imageUrl],
    },
    keywords: [
      `${serverName} Assetto Corsa`,
      `${serverName} Nismara Racing`,
      'Nismara Racing Server',
      'Nismara Racing',
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

export default function ServersUriLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
