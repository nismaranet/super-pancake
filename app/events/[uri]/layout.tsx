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

  const { data: eventData, error } = await supabase
    .from('events')
    .select('*, tracks(*)')
    .eq('uri', uri)
    .single();

  if (error) {
    console.error('Error fetching tracks for metadata:', error);
  }

  const eventName = eventData?.title || uri;
  const imageUrl = eventData?.image_url || 'https://i.imgur.com/WTq93jI.png';
  const maxPlayer = eventData?.max_participants || '0';
  const trackName = eventData?.tracks?.name || 'Unknown Circuit';
  const eventDate = new Date(eventData?.event_date).toLocaleDateString(
    'id-ID',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
  );

  return {
    title: `Event ${eventName} | Nismara Racing`,
    description: `Event ${eventName} berlangsung pada ${eventDate} dan akan dilaksanakan di circuit ${trackName} dengan total ${maxPlayer} peserta`,
    openGraph: {
      title: `Event ${eventName} | Nismara Racing`,
      description: `Event ${eventName} berlangsung pada ${eventDate} dan akan dilaksanakan di circuit ${trackName} dengan total ${maxPlayer} peserta`,
      images: [imageUrl],
    },
    keywords: [
      `${eventName} Event Assetto Corsa`,
      `Event ${eventName} Nismara Racing`,
      'Nismara Racing Event',
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

export default function EventsUriLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
