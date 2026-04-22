// lib/utils.js
export const getCdnUrl = (url) => {
  if (!url) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const cdnUrl = process.env.CDN_URL;

  if (
    typeof window !== 'undefined' &&
    window.location.hostname === 'localhost'
  ) {
    return url;
  }

  if (process.env.NODE_ENV === 'development') {
    return url;
  }

  if (url.includes(supabaseUrl)) {
    return url.replace(supabaseUrl, cdnUrl);
  }

  return url;
};
