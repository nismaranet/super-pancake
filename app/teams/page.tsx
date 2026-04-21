'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Shield, Users, Search, ChevronRight, Plus } from 'lucide-react';
import Link from 'next/link';

export default function TeamsIndex() {
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('teams')
      .select('*, team_members(count)')
      .order('name', { ascending: true });

    if (data) setTeams(data);
    setLoading(false);
  };

  const filteredTeams = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tag.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading)
    return (
      <div className="min-h-screen pt-32 px-4 max-w-7xl mx-auto animate-pulse text-[var(--foreground)] font-black uppercase">
        Loading Directory...
      </div>
    );

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-black italic text-[var(--foreground)] uppercase tracking-tighter flex items-center gap-4">
            <Shield size={40} className="text-purple-500" /> Team Directory
          </h1>
          <p className="text-[var(--muted)] mt-2 font-medium">
            Jelajahi tim e-sports profesional di ekosistem Nismara.
          </p>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              size={18}
            />
            <input
              type="text"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[var(--card)] border border-[var(--card-border)] rounded-2xl outline-none focus:border-purple-500 transition-all text-sm"
            />
          </div>
          <Link
            href="/teams/hq"
            className="bg-[var(--accent)] hover:opacity-90 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2"
          >
            <Plus size={16} /> My Team
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeams.map((team) => (
          <Link
            href={`/teams/${team.uri}`}
            key={team.id}
            className="group bg-[var(--card)] border border-[var(--card-border)] p-8 rounded-[2.5rem] hover:border-purple-500/50 transition-all shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full group-hover:bg-purple-500/10 transition-colors" />

            <div className="flex justify-between items-start mb-6">
              <div className="w-16 h-16 bg-[var(--background)] rounded-2xl border border-[var(--card-border)] flex items-center justify-center relative">
                <Shield size={32} className="text-purple-500/40" />

                {/* BADGE LEVEL TIM (TAMBAHKAN INI) */}
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-lg border-2 border-[var(--card)] shadow-lg">
                  LV {team.team_level || 1}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-black bg-purple-500/10 text-purple-400 px-3 py-1 rounded-lg border border-purple-500/20 tracking-widest uppercase">
                  [{team.tag}]
                </span>
                {/* TAMPILAN XP */}
                <p className="text-[9px] font-bold text-[var(--muted)] mt-2 uppercase tracking-widest">
                  {team.total_xp?.toLocaleString('id-ID') || 0} XP
                </p>
              </div>
            </div>

            <h3 className="text-xl font-black text-[var(--foreground)] uppercase tracking-tighter mb-2 truncate">
              {team.name}
            </h3>
            <div className="flex items-center gap-4 text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">
              <span className="flex items-center gap-1">
                <Users size={12} /> {team.team_members[0].count} Members
              </span>
            </div>

            <div className="mt-8 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-purple-500 group-hover:translate-x-1 transition-transform">
              View Team Profile <ChevronRight size={14} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
