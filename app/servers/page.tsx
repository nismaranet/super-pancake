'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import {
  Server,
  Gamepad2,
  Users,
  MapPin,
  Search,
  Activity,
  ChevronRight,
  Zap,
} from 'lucide-react';

export default function ServersExplore() {
  const [servers, setServers] = useState<any[]>([]);
  const [practices, setPractices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchAllServers() {
      // 1. Ambil data Main Servers
      const { data: sData } = await supabase
        .from('servers')
        .select('*, tracks(name, country)')
        .order('created_at', { ascending: false });

      // 2. Ambil data Practice Servers
      const { data: pData } = await supabase
        .from('practices')
        .select('*, tracks(name, country)')
        .order('created_at', { ascending: false });

      if (sData) setServers(sData);
      if (pData) setPractices(pData);
      setLoading(false);
    }

    fetchAllServers();
  }, []);

  // Logika Filter Pencarian
  const filteredServers = useMemo(() => {
    return servers.filter(
      (s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tracks?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [servers, searchQuery]);

  const filteredPractices = useMemo(() => {
    return practices.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tracks?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [practices, searchQuery]);

  if (loading)
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center space-y-4 transition-colors duration-300">
        <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[var(--accent)] font-black uppercase italic tracking-widest text-xs">
          Scanning Network...
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto pt-16">
        {/* --- HEADER & SEARCH --- */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 relative">
          <div className="absolute -top-10 -left-10 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>

          <div className="relative z-10">
            <h1 className="text-4xl md:text-5xl font-black italic text-[var(--foreground)] uppercase tracking-tighter mb-2">
              Server{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-[var(--accent)]">
                Explore
              </span>
            </h1>
            <p className="text-[var(--muted)] text-sm font-bold tracking-widest uppercase">
              Nismara Racing Server Directory
            </p>
          </div>

          <div className="relative group w-full md:w-80 z-10">
            <input
              type="text"
              placeholder="Search server or track..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 pl-10 rounded-xl bg-[var(--card)] border border-[var(--card-border)] focus:border-[var(--accent)] outline-none transition-all shadow-inner text-sm text-[var(--foreground)]"
            />
            <Search
              className="absolute left-3 top-3.5 text-[var(--muted)] group-focus-within:text-[var(--accent)] transition-colors"
              size={18}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* --- LEFT: MAIN SERVERS (2 COLS) --- */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center gap-3">
              <Gamepad2 className="text-blue-500" size={24} />
              <h2 className="text-2xl font-black italic text-[var(--foreground)] uppercase tracking-tighter">
                Main Servers
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredServers.length === 0 ? (
                <p className="text-[var(--muted)] italic text-sm font-bold col-span-2">
                  No servers found.
                </p>
              ) : (
                filteredServers.map((s) => (
                  <Link
                    href={`/servers/${s.uri}`}
                    key={s.id}
                    className="group block"
                  >
                    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-[2rem] overflow-hidden hover:border-[var(--accent)] transition-all duration-300 shadow-sm hover:shadow-[0_0_30px_var(--accent-glow)] h-full flex flex-col transform hover:-translate-y-1">
                      {/* Image container */}
                      <div className="relative h-44 overflow-hidden bg-[var(--background)]">
                        {s.image_url ? (
                          <img
                            src={s.image_url}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                            alt={s.name}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[var(--muted)] font-black italic text-xs">
                            NO PREVIEW
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--card)] via-transparent to-transparent"></div>

                        <div className="absolute top-4 left-6 flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${s.is_active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
                          ></span>
                          <span className="text-[9px] font-black uppercase tracking-widest text-white drop-shadow-md">
                            {s.is_active ? 'Live Now' : 'Offline'}
                          </span>
                        </div>
                      </div>

                      <div className="p-6 flex flex-col flex-grow">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-lg font-black text-[var(--foreground)] uppercase group-hover:text-blue-500 transition-colors leading-tight truncate">
                            {s.name}
                          </h3>
                        </div>

                        <div className="space-y-3 mt-auto">
                          <div className="flex items-center gap-2 text-[var(--muted)]">
                            <MapPin size={14} className="text-blue-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest truncate">
                              {s.tracks?.name || 'TBA Track'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-4 border-t border-[var(--card-border)]">
                            <div className="flex items-center gap-2">
                              <Users
                                size={14}
                                className="text-[var(--accent)]"
                              />
                              <span className="text-xs font-black text-[var(--foreground)]">
                                {s.max_players || 0}{' '}
                                <span className="text-[var(--muted)] font-bold uppercase text-[9px]">
                                  Slots
                                </span>
                              </span>
                            </div>
                            <span className="text-[9px] font-black text-[var(--accent)] uppercase tracking-widest">
                              Detail →
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* --- RIGHT: PRACTICE SERVERS --- */}
          <div className="lg:col-span-1 space-y-8">
            <div className="flex items-center gap-3">
              <Activity className="text-purple-500" size={24} />
              <h2 className="text-2xl font-black italic text-[var(--foreground)] uppercase tracking-tighter">
                Practice Grid
              </h2>
            </div>

            <div className="space-y-4">
              {filteredPractices.length === 0 ? (
                <p className="text-[var(--muted)] italic text-sm font-bold">
                  No practice servers found.
                </p>
              ) : (
                filteredPractices.map((p) => (
                  <Link
                    href={`/practice-servers/${p.uri || '#'}`}
                    key={p.id}
                    target="_blank"
                    className="group block"
                  >
                    <div className="p-5 bg-[var(--card)] border border-[var(--card-border)] rounded-2xl hover:border-purple-500 transition-all shadow-sm flex items-center justify-between">
                      <div className="overflow-hidden pr-4">
                        <p className="text-sm font-black text-[var(--foreground)] uppercase group-hover:text-purple-500 transition-colors truncate">
                          {p.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse shadow-[0_0_5px_var(--accent-glow)]"></span>
                            <span className="text-[9px] text-[var(--muted)] font-black uppercase tracking-widest">
                              Active Server
                            </span>
                          </div>
                          {p.server_tag && (
                            <span className="text-[8px] border border-[var(--card-border)] px-1.5 py-0.5 rounded text-[var(--muted)] font-bold uppercase">
                              {p.server_tag}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-2 bg-[var(--background)] rounded-xl border border-[var(--card-border)] group-hover:border-purple-500/50 transition-colors">
                        <ChevronRight
                          size={18}
                          className="text-[var(--muted)] group-hover:text-purple-500"
                        />
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>

            {/* INFO BOX */}
            <div className="bg-gradient-to-br from-blue-600/10 to-[var(--accent)]/10 border border-blue-500/20 p-6 rounded-[2rem]">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={14} className="text-blue-500" />
                <h4 className="text-xs font-black text-[var(--foreground)] uppercase tracking-widest">
                  Pro Tip
                </h4>
              </div>
              <p className="text-[10px] text-[var(--muted)] leading-relaxed italic font-medium">
                Gunakan Practice Server untuk menghafal titik pengereman sebelum
                mengikuti jadwal balapan resmi di Live Servers agar Safety
                Rating kamu tetap terjaga.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
