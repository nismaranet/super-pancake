import { MetadataRoute } from 'next';
import { createSupabaseServer } from '@/lib/supabaseServer';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createSupabaseServer();
  
  // Sesuaikan dengan domain utama yang sekarang menggunakan .my.id
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://racing.nismara.web.id';

  // Ambil semua URI yang dibutuhkan dari tabel Supabase
  // Pastikan nama tabel (events, cars, tracks) sesuai dengan schema database-nya
  const { data: events } = await supabase.from('events').select('uri');
  const { data: cars } = await supabase.from('cars').select('uri');
  const { data: tracks } = await supabase.from('tracks').select('uri');
  const { data: servers } = await supabase.from('servers').select('uri');
  const { data: teams } = await supabase.from('teams').select('uri');
  const { data: profiles } = await supabase.from('profiles').select('username'); 

  // Mapping rute dinamis untuk Events
  const eventUrls = events?.map((event) => ({
    url: `${baseUrl}/events/${event.uri}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  })) ?? [];

    const teamUrls = teams?.map((teams) => ({
    url: `${baseUrl}/teams/${teams.uri}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  })) ?? [];

      const profileUrls = profiles?.map((profiles) => ({
    url: `${baseUrl}/profile/${profiles.username}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  })) ?? [];

    const serverUrls = servers?.map((server) => ({
    url: `${baseUrl}/servers/${server.uri}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  })) ?? [];

  // Mapping rute dinamis untuk Cars
  const carUrls = cars?.map((car) => ({
    url: `${baseUrl}/cars/${car.uri}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  })) ?? [];

  // Mapping rute dinamis untuk Tracks
  const trackUrls = tracks?.map((track) => ({
    url: `${baseUrl}/tracks/${track.uri}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  })) ?? [];

  // Tambahkan rute statis yang penting untuk di-index
  const staticUrls = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/cars`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tracks`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/leaderboard`,
      lastModified: new Date(),
      changeFrequency: 'always' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/teams`,
      lastModified: new Date(),
      changeFrequency: 'always' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'always' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'always' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/cookies-policy`,
      lastModified: new Date(),
      changeFrequency: 'always' as const,
      priority: 0.6,
    },
  ];

  // Gabungkan semua rute statis dan dinamis
  return [...staticUrls, ...eventUrls, ...carUrls, ...trackUrls, ...serverUrls, ...profileUrls, ...teamUrls];
}