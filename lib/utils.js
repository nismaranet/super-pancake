// lib/utils.js
export const getCdnUrl = (url) => {
  if (!url) return null;
  
  const supabaseUrl = "https://nlmmskdqkigfotubkfut.supabase.co";
  // Gunakan domain baru kamu (tadi kamu sebut nismara.my.id atau web.id, sesuaikan ya)
  const cdnUrl = "https://cdn.nismara.my.id"; 

  // Opsional: Jika sedang di localhost, langsung saja ke Supabase biar nggak ngabisin kuota Worker
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
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