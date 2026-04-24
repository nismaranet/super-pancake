import type { Metadata, ResolvingMetadata } from 'next';
import { supabase } from '@/lib/supabaseClient';
import React from 'react';

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const resolvedParams = await params;
  const username = resolvedParams.username;

  const { data: profileData, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (error) {
    console.error('Error fetching profile for metadata:', error);
  }

  const displayName =
    profileData?.display_name || profileData?.username || username;
  const bannerUrl =
    profileData?.banner_url || 'https://i.imgur.com/WTq93jI.png';

  return {
    title: `${displayName} Profile | Nismara Racing`,
    description: `Profile page of ${displayName}`,
    openGraph: {
      title: `${displayName} Profile | Nismara Racing`,
      description: `Profile page of ${displayName}`,
      images: [bannerUrl],
    },
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

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
