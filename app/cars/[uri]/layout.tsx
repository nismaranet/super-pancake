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

  const { data: carData, error } = await supabase
    .from('cars')
    .select('*')
    .eq('uri', uri)
    .single();

  if (error) {
    console.error('Error fetching cars for metadata:', error);
  }

  const carName = carData?.name || uri;
  const imageUrl = carData?.image_url || 'https://i.imgur.com/WTq93jI.png';
  const carBrand = carData?.brand || 'Unknown';
  const carClass = carData?.class || 'Unknown Class';

  return {
    title: `${carName} Details | Nismara Racing`,
    description: `Kendaraan ${carData} berasal dari brand ${carBrand} dan di Nismara Racing ${carData} berada di class ${carClass}`,
    openGraph: {
      title: `${carName} Details | Nismara Racing`,
      description: `Kendaraan ${carData} berasal dari brand ${carBrand} dan di Nismara Racing ${carData} berada di class ${carClass}`,
      images: [imageUrl],
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

export default function CarsUriLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
