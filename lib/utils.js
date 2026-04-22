// lib/utils.js
export const getCdnUrl = (url) => {
  if (!url) return null;

  const supabaseUrl = 'https://nlmmskdqkigfotubkfut.supabase.co';

  const cdnUrl = 'https://cdn.nismara.my.id';

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
