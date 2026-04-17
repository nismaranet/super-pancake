'use server';

import Link from 'next/link';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

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
    <div className="flex min-h-screen bg-gray-900 text-white">
      {/* SIDEBAR */}
      <div className="w-64 bg-gray-950 p-6 border-r border-gray-800">
        <h1 className="text-xl font-bold mb-8 text-blue-500">Admin Panel</h1>

        <nav className="flex flex-col gap-4">
          <Link href="/admin" className="hover:text-blue-400 transition-colors">
            Dashboard
          </Link>
          <Link
            href="/admin/members"
            className="hover:text-blue-400 transition-colors"
          >
            Members
          </Link>
          <Link
            href="/admin/servers"
            className="hover:text-blue-400 transition-colors"
          >
            Servers
          </Link>
          <Link
            href="/admin/practice"
            className="hover:text-blue-400 transition-colors"
          >
            Practice Server
          </Link>
          <Link
            href="/admin/cars"
            className="hover:text-blue-400 transition-colors"
          >
            Cars
          </Link>
          <Link
            href="/admin/tracks"
            className="hover:text-blue-400 transition-colors"
          >
            Tracks
          </Link>
          <Link
            href="/admin/events"
            className="hover:text-blue-400 transition-colors"
          >
            Events
          </Link>
        </nav>
      </div>

      {/* CONTENT */}
      <div className="flex-1 p-8 overflow-auto">{children}</div>
    </div>
  );
}
