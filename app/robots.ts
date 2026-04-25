import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://racing.nismara.web.id';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Jika ada rute seperti admin dashboard yang tidak ingin diindex, taruh di disallow:
      disallow: ['/admin/', '/test-sync/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}