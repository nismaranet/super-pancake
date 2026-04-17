'use client';
import { supabase } from '@/lib/supabaseClient';

export default function LoginButton() {
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        scopes: 'identify email guilds', // Minta akses ke daftar server user
        redirectTo: window.location.origin + '/profile',
      },
    });
  };

  return (
    <button
      onClick={handleLogin}
      className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition"
    >
      Login with Discord
    </button>
  );
}
