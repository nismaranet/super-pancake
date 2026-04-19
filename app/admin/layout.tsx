'use server';

import Link from 'next/link';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/admin/Sidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        // DI SINI: Jangan lakukan cookieStore.set karena akan error/gagal
        setAll: () => {},
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role?.toLowerCase().trim() !== 'admin') {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen bg-[#050505] text-white">
      {/* Sidebar - Client Component */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto">
        {/* Top Header Blur (Optional) */}
        <div className="sticky top-0 z-40 w-full h-16 bg-[#050505]/60 backdrop-blur-xl border-b border-white/5 px-8 flex items-center justify-end">
          {/* Kamu bisa tambah Search bar atau User Profile di sini */}
          <div className="text-[10px] font-bold text-white/30 tracking-widest uppercase">
            {new Date().toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
        </div>

        {/* Page Content */}
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
