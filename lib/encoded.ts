
export function encodeSessionId(id: string) {
  const base64 = btoa(id);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeSessionId(hash: string) {
  let base64 = hash.replace(/-/g, '+').replace(/_/g, '/');
  
  while (base64.length % 4) {
    base64 += '=';
  }
  
  return atob(base64);
}