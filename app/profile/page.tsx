'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function ProfileRedirect() {
  const router = useRouter();

  useEffect(() => {
    async function redirectToUsername() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Jika belum login, lempar ke halaman login
      if (!session) {
        router.push('/login');
        return;
      }

      // Ambil username si user
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', session.user.id)
        .single();

      if (data?.username) {
        // Redirect ke public profile-nya sendiri
        router.push(`/profile/${data.username}`);
      } else {
        // Jika karena alasan tertentu belum punya username, paksa isi
        router.push('/login');
      }
    }

    redirectToUsername();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-purple-500"></div>
    </div>
  );
}
