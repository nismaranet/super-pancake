'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Shield,
  Users,
  Search,
  ChevronRight,
  Plus,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';
import Link from 'next/link';

export default function TeamsIndex() {
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userTeam, setUserTeam] = useState<any>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);

    // 1. Fetch Teams with member counts
    const { data: teamsData } = await supabase
      .from('teams')
      .select('*, team_members(count)')
      .order('total_xp', { ascending: false });

    if (teamsData) setTeams(teamsData);

    // 2. Get Current User Session & Profile
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setUserProfile(profile);

      // 3. Check if user already has a team
      const { data: memberData } = await supabase
        .from('team_members')
        .select('team_id, teams(*)')
        .eq('profile_id', user.id)
        .eq('status', 'active')
        .single();

      if (memberData) setUserTeam(memberData.teams);
    }

    setLoading(false);
  };

  const filteredTeams = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tag.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading)
    return (
      <div className="min-h-screen pt-32 px-4 max-w-7xl mx-auto flex items-center justify-center text-[var(--foreground)] font-black uppercase animate-pulse">
        Loading Team Directory...
      </div>
    );

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16">
        <div>
          <h1 className="text-5xl md:text-6xl font-black italic text-[var(--foreground)] uppercase tracking-tighter flex items-center gap-4">
            <Shield size={48} className="text-purple-500" /> Team Hub
          </h1>
          <p className="text-[var(--muted)] mt-2 font-medium">
            Jelajahi atau bangun dinasti e-sports kamu di ekosistem Nismara.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 md:w-80">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              size={18}
            />
            <input
              type="text"
              placeholder="Search team name or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-[var(--card)] border border-[var(--card-border)] rounded-2xl outline-none focus:border-purple-500 transition-all text-sm font-bold"
            />
          </div>

          {/* Action Button: My Team or Create Team */}
          {userProfile && (
            <>
              {userTeam ? (
                <Link
                  href={`/teams/hq`}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:scale-105 transition-transform text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                >
                  <Shield size={16} /> My Team HQ
                </Link>
              ) : (
                <Link
                  href={userProfile.steam_guid ? '/teams/create' : '#'}
                  className={`${
                    userProfile.steam_guid
                      ? 'bg-[var(--foreground)] text-[var(--background)] hover:opacity-90'
                      : 'bg-red-600 text-white cursor-not-allowed'
                  } px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all`}
                >
                  {userProfile.steam_guid ? (
                    <>
                      <Plus size={16} /> Create Team
                    </>
                  ) : (
                    <>
                      <AlertCircle size={16} /> Assign Steam GUID First
                    </>
                  )}
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredTeams.map((team) => (
          <Link
            href={`/teams/${team.uri}`}
            key={team.id}
            className="group bg-[var(--card)] border border-[var(--card-border)] rounded-[2.5rem] hover:border-purple-500/50 transition-all shadow-xl relative overflow-hidden flex flex-col"
          >
            {/* Banner Section */}
            <div className="h-32 w-full relative overflow-hidden bg-zinc-900">
              {team.banner_url ? (
                <img
                  src={team.banner_url}
                  alt="Banner"
                  className="w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-900/40 via-zinc-900 to-blue-900/40" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--card)] to-transparent" />
            </div>

            {/* Team Content */}
            <div className="px-8 pb-8 pt-0 -mt-12 relative z-10 flex-1">
              <div className="flex justify-between items-end mb-6">
                {/* Logo */}
                <div className="w-24 h-24 bg-[var(--background)] rounded-3xl border-4 border-[var(--card)] flex items-center justify-center relative shadow-2xl overflow-hidden">
                  {team.logo_url ? (
                    <img
                      src={team.logo_url}
                      alt={team.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Shield size={40} className="text-purple-500/40" />
                  )}

                  <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-lg border-2 border-[var(--card)] shadow-lg">
                    LV {team.team_level || 1}
                  </div>
                </div>

                <div className="text-right pb-2">
                  <span className="text-xs font-black bg-purple-500/10 text-purple-400 px-3 py-1 rounded-lg border border-purple-500/20 tracking-widest uppercase">
                    [{team.tag}]
                  </span>
                </div>
              </div>

              <h3 className="text-2xl font-black text-[var(--foreground)] uppercase tracking-tighter mb-1 truncate">
                {team.name}
              </h3>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">
                  <Users size={14} className="text-purple-500" />
                  {team.team_members?.[0]?.count || 0} Members
                </div>
                <div className="h-1 w-1 rounded-full bg-zinc-700" />
                <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                  {team.total_xp?.toLocaleString('id-ID') || 0} Total XP
                </div>
              </div>

              <div className="pt-6 border-t border-[var(--card-border)] flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-purple-500 group-hover:gap-4 transition-all">
                View Full Profile{' '}
                <ChevronRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredTeams.length === 0 && (
        <div className="text-center py-20 bg-[var(--card)] rounded-[3rem] border border-dashed border-[var(--card-border)]">
          <p className="text-[var(--muted)] font-bold uppercase tracking-widest">
            No teams found matching your search.
          </p>
        </div>
      )}
    </div>
  );
}
