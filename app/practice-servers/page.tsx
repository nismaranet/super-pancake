import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import {
  Server,
  ChevronRight,
  Activity,
  Trophy,
  ChevronLeft,
  LayoutGrid,
  User,
  Calendar,
} from 'lucide-react';

export default async function PracticeServerListPage() {
  // Ambil data server dari database
  const { data: practices } = await supabase
    .from('practices')
    .select('*')
    .order('name', { ascending: true });

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pt-28 pb-12 px-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* HEADER SECTION */}
        <div className="mb-12 border-b border-[var(--glass-border)] pb-8 relative">
          <div className="flex items-center gap-2 text-[var(--accent)] mb-3">
            <LayoutGrid size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">
              Racing Lobby
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-4">
            Practice <span className="text-[var(--accent)]">Servers</span>
          </h1>

          <p className="text-[var(--muted)] max-w-2xl font-medium">
            Pilih server favorit Anda untuk melihat statistik real-time, daftar
            driver yang sedang online, dan unduh mod pack yang diperlukan untuk
            memulai balapan.
          </p>

          {/* Decorative Glow */}
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-[var(--accent)]/5 blur-[100px] rounded-full pointer-events-none"></div>
        </div>

        {/* SERVER GRID */}
        {practices && practices.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {practices.map((practice) => (
              <Link
                key={practice.id}
                href={`/practice-servers/${practice.uri || practice.id}`}
                className="group relative"
              >
                <div className="glass rounded-3xl overflow-hidden border-[var(--glass-border)] hover:border-[var(--accent)]/50 transition-all duration-500 hover:shadow-2xl hover:shadow-[var(--accent)]/10 flex flex-col h-full">
                  {/* Decorative Banner/Pattern */}
                  <div className="h-40 w-full bg-gradient-to-br from-[var(--accent)]/20 to-transparent relative overflow-hidden">
                    <div
                      className="absolute inset-0 opacity-10"
                      style={{
                        backgroundImage: `url(${practice.image_url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    ></div>
                    <div className="absolute top-4 left-6">
                      <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1 text-white">
                        <User size={12} className="text-[var(--accent)]" />
                        <span className="text-[9px] font-black uppercase tracking-widest">
                          {practice.max_players} Players
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content Details */}
                  <div className="p-8 flex-grow flex flex-col">
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter group-hover:text-[var(--accent)] transition-colors mb-4 leading-none">
                      {practice.name}
                    </h2>

                    <p className="text-[var(--muted)] text-sm mb-8 line-clamp-2">
                      Sesi latihan {practice.server_tag || 'Standard'}
                    </p>

                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-[var(--glass-border)]">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-[var(--accent)]" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                          Sejak{' '}
                          {new Date(practice.created_at).toLocaleDateString(
                            'id-ID',
                            { day: 'numeric', month: 'short', year: 'numeric' },
                          )}
                        </span>
                      </div>

                      <div className="h-10 w-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center group-hover:bg-[var(--accent)] transition-all duration-300 group-hover:scale-110">
                        <ChevronRight className="h-5 w-5 text-[var(--accent)] group-hover:text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 glass rounded-3xl border-dashed border-2 border-[var(--glass-border)]">
            <Server
              size={48}
              className="mx-auto text-[var(--muted)] opacity-20 mb-4"
            />
            <p className="text-[var(--muted)] italic font-bold uppercase tracking-widest text-sm">
              Belum ada server yang aktif saat ini.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
