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

  const { data: trackData, error } = await supabase
    .from('tracks')
    .select('*')
    .eq('uri', uri)
    .single();

  if (error) {
    console.error('Error fetching tracks for metadata:', error);
  }

  const tracksName = trackData?.name || uri;
  const imageUrl = trackData?.image_url || 'https://i.imgur.com/WTq93jI.png';
  const author = trackData?.author || 'Unknown Author';
  const country = trackData?.contry || 'Unknown Country';
  const city = trackData?.city || 'Unknown City';
  const length = trackData?.length || 'Unknown Length';

  return {
    title: `${tracksName} Details | Nismara Racing`,
    description: `Circuit ${tracksName} berada di ${city}, ${country}. Circuit ini memiliki panjang ${length} meter dan Mod Circuit ${tracksName} dibuat oleh ${author}`,
    openGraph: {
      title: `${tracksName} Details | Nismara Racing`,
      description: `Circuit ${tracksName} berada di ${city}, ${country}. Circuit ini memiliki panjang ${length} meter dan Mod Circuit ${tracksName} dibuat oleh ${author}`,
      images: [imageUrl],
    },
    keywords: [
      `${tracksName} Assetto Corsa`,
      `${tracksName}`,
      'Nismara Racing Circuit',
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

export default function TracksUriLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
