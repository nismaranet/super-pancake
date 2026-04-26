'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { getRankDetails } from '@/components/RankBadge';
import { useRouter } from 'next/navigation';
import RankBadge from '@/components/RankBadge';
import {
  Shield,
  Users,
  Target,
  ChevronLeft,
  ExternalLink,
  Crown,
  Medal,
  Star,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  Settings,
  Activity,
  Route,
} from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

const formatPlayingTime = (time: number) => {
  if (!time) return '0h 0m';
  const totalSeconds = time > 10000000 ? Math.floor(time / 1000) : Number(time);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return `${h}h ${m}m`;
};

export default function TeamPublicProfile() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userMemberStatus, setUserMemberStatus] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<
    'overview' | 'history' | 'hotlaps' | 'events'
  >('overview');

  const [stats, setStats] = useState({
    totalDistance: 0,
    totalTime: 0,
    avgSR: 0,
    stats: { wins: 0, podiums: 0, starts: 0 },
  });

  const router = useRouter();

  useEffect(() => {
    if (params.uri) {
      fetchInitialData();
    }
  }, [params.uri]);

  const fetchInitialData = async () => {
    setLoading(true);

    // 1. Fetch Team Details
    const { data: teamData } = await supabase
      .from('teams')
      .select('*')
      .eq('uri', params.uri)
      .single();

    if (!teamData) {
      setLoading(false);
      return;
    }
    setTeam(teamData);

    // 2. Fetch Active Roster
    const { data: membersData } = await supabase
      .from('team_members')
      .select(
        `
        role,
        status,
        profiles:profile_id (
          id,
          username,
          avatar_url,
          safety_rating,
          driver_level,
          total_wins,
          total_starts,
          total_podiums,
          total_playing_time,
          total_distance_km
        )
      `,
      )
      .eq('team_id', teamData.id)
      .eq('status', 'active')
      .order('role', { ascending: false });

    if (membersData) {
      setMembers(membersData);

      let dist = 0,
        time = 0,
        rWins = 0,
        rPods = 0,
        rStarts = 0,
        rSR = 0,
        validDrivers = 0;

      membersData.forEach((m: any) => {
        const prof = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
        if (prof) {
          validDrivers++;
          dist += prof.total_distance_km || 0;
          time += Number(prof.total_playing_time) || 0;
          rWins += prof.total_wins || 0;
          rPods += prof.total_podiums || 0;
          rStarts += prof.total_starts || 0;
          rSR += prof.safety_rating || 0;
        }
      });

      setStats({
        totalDistance: Math.floor(dist),
        totalTime: Math.floor(time / 3600),
        avgSR: validDrivers > 0 ? Number((rSR / validDrivers).toFixed(2)) : 0,
        stats: { wins: rWins, podiums: rPods, starts: rStarts },
      });

      setLoading(false);
    }

    // 3. Check Current User Session & Membership
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

      // Cek status membership (baik aktif maupun pending)
      const { data: memberCheck } = await supabase
        .from('team_members')
        .select('*')
        .eq('profile_id', user.id)
        .in('status', ['active', 'pending'])
        .maybeSingle();

      setUserMemberStatus(memberCheck);
    }

    setLoading(false);
  };

  const handleJoinTeam = async () => {
    if (!userProfile || !team || isSubmitting) return;

    setIsSubmitting(true);

    // Gunakan .select().single() agar langsung mengembalikan data yang di-insert
    const { data, error } = await supabase
      .from('team_members')
      .insert([
        {
          team_id: team.id,
          profile_id: userProfile.id,
          role: 'member',
          status: 'pending',
          joined_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error joining team:', error.message);
      alert('Gagal mengirim permintaan join: ' + error.message);
    } else if (data) {
      // Langsung set state dari data yang dikembalikan Supabase
      setUserMemberStatus(data);
    }

    setIsSubmitting(false);
  };

  const calculateLevelProgress = (xp: number, level: number) => {
    const currentLevelBaseXP = (level - 1) * 500;
    const nextLevelXP = level * 500;
    const progress = Math.max(
      0,
      Math.min(
        100,
        ((xp - currentLevelBaseXP) / (nextLevelXP - currentLevelBaseXP)) * 100,
      ),
    );
    return { progress, nextLevelXP };
  };

  const { progress: xpProgress, nextLevelXP } = calculateLevelProgress(
    team?.total_xp || 0,
    team?.team_level || 1,
  );

  const rank = getRankDetails(stats.avgSR);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-[var(--foreground)] font-black uppercase italic animate-pulse tracking-tighter">
          Loading Team Profile...
        </div>
      </div>
    );

  if (!team)
    return (
      <div className="min-h-screen pt-32 text-center font-black uppercase">
        Team Not Found
      </div>
    );

  return (
    <div className="min-h-screen bg-[var(--background)] pb-20">
      {/* Hero Banner Section */}
      <div className="relative h-[350px] md:h-[450px] w-full overflow-hidden">
        {team.banner_url ? (
          <img
            src={team.banner_url}
            alt="Banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-900/40 via-zinc-900 to-blue-900/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-transparent to-transparent" />

        <div className="absolute top-32 left-4 md:left-8">
          <Link
            href="/teams"
            className="group flex items-center gap-2 text-white/70 hover:text-white transition-all font-bold uppercase text-[10px] tracking-widest bg-black/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/5"
          >
            <ChevronLeft
              size={14}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Back to Directory
          </Link>
        </div>
      </div>

      {/* Team Info Header */}
      <div className="max-w-7xl mx-auto px-4 -mt-24 relative z-30">
        <div className="flex flex-col md:flex-row items-end gap-6 md:gap-10 mb-12">
          {/* Logo */}
          <div className="w-40 h-40 md:w-52 md:h-52 bg-[var(--card)] rounded-[2.5rem] border-[10px] border-[var(--background)] shadow-2xl overflow-hidden flex items-center justify-center shrink-0">
            {team.logo_url ? (
              <img
                src={team.logo_url}
                alt={team.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Shield size={64} className="text-purple-500/20" />
            )}
          </div>

          <div className="flex-1 pb-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-purple-600 text-white text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest">
                LVL {team.team_level || 1}
              </span>
              <span className="text-purple-400 text-[10px] font-black uppercase tracking-[0.2em]">
                [{team.tag}]
              </span>
            </div>
            <h1 className="text-4xl md:text-7xl font-black italic text-[var(--foreground)] uppercase tracking-tighter leading-[0.8] mb-4">
              {team.name}
            </h1>
          </div>

          {/* Stats */}
          <div className="flex gap-4 pb-4 w-full md:w-auto">
            <div className="flex-1 md:flex-none bg-[var(--card)] border border-[var(--card-border)] p-5 rounded-[2rem] text-center min-w-[140px] shadow-xl">
              <p className="text-[var(--muted)] text-[9px] font-black uppercase tracking-widest mb-1">
                Team Tag
              </p>
              <p className="text-3xl font-black text-purple-500 italic leading-none">
                {team?.tag}
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-24 md:-mt-32 relative z-20 pt-40">
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 items-start">
            {/* --- LEFT SIDEBAR --- */}
            <div className="w-full lg:col-span-4 space-y-6">
              {/* Identity Card */}
              <div className="bg-[var(--card)] border p-8 border-[var(--card-border)] rounded-[2rem] shadow-xl relative text-center pt-1 md:pt-10">
                <h2 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-purple-500">
                  <Target size={18} /> Team Information
                </h2>
                <div className="space-y-4">
                  <div className="bg-[var(--background)] p-4 rounded-2xl border border-[var(--card-border)] text-center">
                    <p className="text-[10px] font-black uppercase text-[var(--muted)] mb-1">
                      {team?.name} Berdiri Sejak
                    </p>
                    <p className="font-bold text-sm text-[var(--foreground)] uppercase tracking-tighter">
                      {new Date(team?.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="px-4 mb-6 pt-4">
                  <ReactMarkdown
                    components={{
                      // Kita override styling default-nya agar sesuai desainmu
                      p: ({ children }) => (
                        <p className="text-sm text-[var(--foreground)] mb-2">
                          {children}
                        </p>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-bold text-[var(--accent)]">
                          {children}
                        </strong>
                      ),
                      em: ({ children }) => (
                        <em className="italic">{children}</em>
                      ),
                      a: ({ children, href }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--accent)] hover:underline underline-offset-4"
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {team.bio ||
                      'This teams prefers to let their performance do the talking.'}
                  </ReactMarkdown>
                </div>

                <div className="p-4 bg-[var(--background)] border border-[var(--card-border)] rounded-2xl mb-4 text-left">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <span className="text-[10px] text-[var(--muted)] font-black uppercase tracking-widest mb-1 block">
                        Team Level
                      </span>
                      <span className="text-3xl font-black leading-none text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-blue-500">
                        {team.team_level || 1}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[var(--muted)] font-bold uppercase block">
                        Next Level
                      </span>
                      <span className="text-xs font-black">
                        {team.total_xp} / {nextLevelXP} XP
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-[var(--card-border)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[var(--accent)] to-blue-500 rounded-full transition-all duration-1000"
                      style={{ width: `${xpProgress}%` }}
                    ></div>
                  </div>
                </div>

                {userMemberStatus?.team_id === team?.id && (
                  <div className="mt-4 pt-4 border-t border-[var(--card-border)]">
                    <button
                      onClick={() => router.push('/teams/hq/')}
                      className="w-full flex items-center justify-center gap-2 bg-[var(--background)] border border-[var(--card-border)] hover:border-[var(--accent)] text-[var(--foreground)] hover:text-[var(--accent)] py-3.5 rounded-xl transition-all font-black text-[11px] uppercase tracking-widest shadow-sm"
                    >
                      <Settings size={16} /> Go to Team HQ
                    </button>
                  </div>
                )}

                {/* Action Button: Join Team Logic */}
                {userProfile && (
                  <div className="mt-4">
                    {userMemberStatus ? (
                      userMemberStatus.status === 'active' ? (
                        userMemberStatus.team_id === team?.id ? (
                          <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-500/10 border border-green-500/20 text-green-500 rounded-2xl font-black uppercase tracking-widest text-[10px]">
                            <CheckCircle2 size={14} /> You are a member
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 border border-zinc-700 text-zinc-500 rounded-2xl font-black uppercase tracking-widest text-[10px]">
                            <Shield size={14} /> Already in another team
                          </div>
                        )
                      ) : (
                        // Tampilan jika status 'pending'
                        <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl font-black uppercase tracking-widest text-[10px]">
                          <Clock size={14} className="animate-pulse" /> Request
                          Pending
                        </div>
                      )
                    ) : (
                      <button
                        onClick={handleJoinTeam}
                        disabled={!userProfile.steam_guid || isSubmitting}
                        className={`inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg ${
                          userProfile.steam_guid
                            ? isSubmitting
                              ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:scale-105 shadow-purple-500/20'
                            : 'bg-red-600 text-white cursor-not-allowed'
                        }`}
                      >
                        {userProfile.steam_guid ? (
                          isSubmitting ? (
                            'Processing...'
                          ) : (
                            <>
                              <Plus size={16} /> Request to Join
                            </>
                          )
                        ) : (
                          <>
                            <AlertCircle size={16} /> Assign Steam GUID First
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Telemetry Card */}
              <div className="bg-[var(--card)] border border-[var(--card-border)] p-6 rounded-[2rem] shadow-xl space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Activity size={16} className="text-blue-500" /> Team
                  Telemetry
                </h3>
                <div className="flex justify-between items-center p-4 bg-[var(--background)] rounded-2xl border border-[var(--card-border)]">
                  <div className="flex gap-3 items-center">
                    <Clock size={18} className="text-blue-500" />
                    <span className="text-xs font-bold text-[var(--muted)] uppercase">
                      Playtime
                    </span>
                  </div>
                  <span className="font-black text-sm">
                    {stats.totalTime} H
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-[var(--background)] rounded-2xl border border-[var(--card-border)]">
                  <div className="flex gap-3 items-center">
                    <Route size={18} className="text-emerald-500" />
                    <span className="text-xs font-bold text-[var(--muted)] uppercase">
                      Distance
                    </span>
                  </div>
                  <span className="font-black font-mono text-sm">
                    {stats.totalDistance.toFixed(1)}{' '}
                    <span className="text-[10px]">KM</span>
                  </span>
                </div>
              </div>
            </div>

            {/* --- RIGHT MAIN CONTENT (TABS) --- */}
            <div className="w-full lg:col-span-8 space-y-6">
              <div className="flex overflow-x-auto gap-2 p-2 bg-[var(--card)] border border-[var(--card-border)] rounded-2xl shadow-sm hide-scrollbar whitespace-nowrap">
                {[{ id: 'overview', icon: Activity, label: 'Overview' }].map(
                  (tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all shrink-0 ${
                        activeTab === tab.id
                          ? 'bg-[var(--accent)] text-white shadow-lg'
                          : 'text-[var(--muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)]'
                      }`}
                    >
                      <tab.icon size={16} /> {tab.label}
                    </button>
                  ),
                )}
              </div>

              {/* TAB: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div
                    className={`bg-[var(--card)] border p-6 md:p-8 rounded-[2rem] shadow-xl ${rank.bg} ${rank.border}`}
                  >
                    <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center mb-8 gap-4">
                      <div className="flex items-center gap-4">
                        <Star size={32} className={rank.color} />
                        <div>
                          <h2 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter">
                            Team Overall Stats
                          </h2>
                          <span
                            className={`text-[9px] md:text-[10px] font-black tracking-widest px-2 py-1 rounded bg-[var(--background)] border ${rank.border} ${rank.color}`}
                          >
                            {rank.label}
                          </span>
                        </div>
                      </div>
                      <div className="md:text-right">
                        <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-1">
                          Safety Rating
                        </p>
                        <span
                          className={`text-4xl font-black leading-none ${rank.color}`}
                        >
                          {stats.avgSR.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 md:gap-4">
                      <div className="bg-[var(--background)] p-3 md:p-4 rounded-xl text-center border border-[var(--card-border)]">
                        <span className="block text-2xl md:text-3xl font-black mb-1">
                          {stats.stats.wins}
                        </span>
                        <span className="text-[9px] text-[var(--muted)] font-bold uppercase">
                          Wins
                        </span>
                      </div>
                      <div className="bg-[var(--background)] p-3 md:p-4 rounded-xl text-center border border-[var(--card-border)]">
                        <span className="block text-2xl md:text-3xl font-black mb-1">
                          {stats.stats.podiums}
                        </span>
                        <span className="text-[9px] text-[var(--muted)] font-bold uppercase">
                          Podiums
                        </span>
                      </div>
                      <div className="bg-[var(--background)] p-3 md:p-4 rounded-xl text-center border border-[var(--card-border)]">
                        <span className="block text-2xl md:text-3xl font-black mb-1">
                          {stats.stats.starts}
                        </span>
                        <span className="text-[9px] text-[var(--muted)] font-bold uppercase">
                          Starts
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-8">
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-3 mb-8">
                      <Users size={28} className="text-purple-500" /> Active
                      Roster
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {members.length > 0 ? (
                        members.map((member, index) => (
                          <Link
                            href={`/profile/${member.profiles?.username}`}
                            key={member.profiles?.id}
                          >
                            <div
                              key={index}
                              className="group bg-[var(--card)] border border-[var(--card-border)] p-5 rounded-[2rem] flex items-center gap-5 hover:border-purple-500/40 transition-all"
                            >
                              <div className="relative shrink-0">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-900 border-2 border-zinc-800">
                                  <img
                                    src={
                                      member.profiles?.avatar_url ||
                                      `https://api.dicebear.com/7.x/bottts/svg?seed=${member.profiles?.username}`
                                    }
                                    className="w-full h-full object-cover"
                                    alt="Driver"
                                  />
                                </div>
                                {member.role === 'owner' && (
                                  <div className="absolute -top-2 -left-2 bg-yellow-500 text-black p-1 rounded-lg">
                                    <Crown size={10} fill="currentColor" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-black uppercase tracking-tight text-[var(--foreground)]">
                                  {member.profiles?.username}
                                </h4>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-[10px] font-black text-orange-500 uppercase flex items-center gap-1">
                                    <RankBadge
                                      sr={member.profiles?.safety_rating || 0}
                                    />
                                  </span>
                                  <span className="text-[10px] font-bold text-[var(--muted)] uppercase">
                                    LV {member.profiles?.driver_level || 1}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <div className="col-span-full py-10 text-center border border-dashed border-[var(--card-border)] rounded-3xl text-[var(--muted)] uppercase font-bold">
                          No active drivers yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
