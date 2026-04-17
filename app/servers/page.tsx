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

  // Logika Pencarian
  const filteredServers = useMemo(() => {
    return servers.filter(
      (s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.tracks?.name &&
          s.tracks.name.toLowerCase().includes(searchQuery.toLowerCase())),
    );
  }, [servers, searchQuery]);

  const filteredPractices = useMemo(() => {
    return practices.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.tracks?.name &&
          p.tracks.name.toLowerCase().includes(searchQuery.toLowerCase())),
    );
  }, [practices, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center space-y-4">
        <Activity className="text-blue-500 animate-spin" size={40} />
        <p className="text-blue-500 font-black italic tracking-widest uppercase">
          Scanning Network...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black italic text-white uppercase tracking-tighter mb-2">
              Server{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
                Explorer
              </span>
            </h1>
            <p className="text-gray-400 text-sm font-bold tracking-widest uppercase flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              Live Infrastructure Status: Operational
            </p>
          </div>

          <div className="relative group w-full md:w-80">
            <input
              type="text"
              placeholder="Search server or track..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-4 pl-12 rounded-2xl bg-gray-900 border border-gray-800 focus:border-blue-500 outline-none transition text-sm text-white"
            />
            <Search
              className="absolute left-4 top-4 text-gray-500 group-focus-within:text-blue-500 transition"
              size={18}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* KOLOM KIRI & TENGAH: MAIN SERVERS */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center gap-3">
              <Gamepad2 className="text-blue-500" size={24} />
              <h2 className="text-2xl font-black text-white italic uppercase tracking-wider">
                Live Servers
              </h2>
              <div className="h-px bg-gradient-to-r from-blue-500/30 to-transparent flex-grow ml-4"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredServers.length === 0 ? (
                <div className="col-span-full py-20 text-center border border-dashed border-gray-800 rounded-[2rem]">
                  <p className="text-gray-600 italic font-bold">
                    No live servers matching your search.
                  </p>
                </div>
              ) : (
                filteredServers.map((s) => (
                  <Link
                    href={`/servers/${s.id}`}
                    key={s.id}
                    className="group block"
                  >
                    <div className="bg-gray-900 border border-gray-800 rounded-[2rem] overflow-hidden hover:border-blue-500/50 transition-all duration-300 shadow-xl relative transform hover:-translate-y-1">
                      <div className="h-32 relative">
                        {s.image_url ? (
                          <img
                            src={s.image_url}
                            className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition"
                            alt={s.name}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-800" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
                        <span className="absolute top-4 left-4 bg-blue-600 text-white text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest shadow-lg">
                          {s.server_tag || 'Public'}
                        </span>
                      </div>

                      <div className="p-6">
                        <h3 className="text-lg font-black text-white group-hover:text-blue-400 transition mb-1 truncate">
                          {s.name}
                        </h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1 mb-6">
                          <MapPin size={10} className="text-blue-500" />{' '}
                          {s.tracks?.name || 'TBA Circuit'}
                        </p>

                        <div className="flex justify-between items-center pt-4 border-t border-gray-800/50">
                          <div className="flex items-center gap-2">
                            <Users size={14} className="text-gray-600" />
                            <span className="text-xs font-bold text-gray-400">
                              {s.max_players || 0} Slots
                            </span>
                          </div>
                          <span className="text-[10px] font-black text-blue-500 uppercase flex items-center gap-1">
                            Details <ChevronRight size={12} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* KOLOM KANAN: PRACTICE SERVERS */}
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <Zap className="text-purple-500" size={20} />
              <h2 className="text-xl font-black text-white italic uppercase tracking-wider">
                Practice
              </h2>
            </div>

            <div className="space-y-4">
              {filteredPractices.length === 0 ? (
                <div className="p-6 border border-dashed border-gray-800 rounded-3xl text-center text-gray-700 text-xs font-bold italic uppercase">
                  No active practice
                </div>
              ) : (
                filteredPractices.map((p) => (
                  <Link
                    href={`/practices/${p.id}`}
                    key={p.id}
                    className="group block"
                  >
                    <div className="bg-gray-900/40 border border-gray-800 p-5 rounded-3xl hover:border-purple-500/50 transition-all relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 blur-2xl group-hover:bg-purple-500/10 transition"></div>

                      <div className="relative z-10 flex justify-between items-start mb-4">
                        <div className="overflow-hidden">
                          <h4 className="text-sm font-black text-gray-200 group-hover:text-purple-400 transition truncate pr-4 uppercase tracking-tighter">
                            {p.name}
                          </h4>
                          <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1">
                            {p.tracks?.name || 'Unknown Track'}
                          </p>
                        </div>
                        <div className="flex h-6 w-6 rounded-full bg-gray-800 items-center justify-center text-gray-500 group-hover:text-purple-400 transition">
                          <ChevronRight size={14} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(147,51,234,0.5)]"></span>
                          <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">
                            Active Server
                          </span>
                        </div>
                        {p.server_tag && (
                          <span className="text-[8px] border border-gray-800 px-1.5 py-0.5 rounded text-gray-600 font-bold uppercase">
                            {p.server_tag}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>

            {/* INFO BOX */}
            <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 p-6 rounded-[2rem]">
              <h4 className="text-xs font-black text-white uppercase tracking-widest mb-2">
                Pro Tip
              </h4>
              <p className="text-[10px] text-gray-400 leading-relaxed italic">
                Gunakan Practice Server untuk menghafal titik pengereman sebelum
                mengikuti jadwal balapan resmi di Live Servers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
