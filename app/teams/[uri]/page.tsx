'use client';

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Users,
  Trophy,
  Timer,
  Gauge,
  CheckCircle2,
  Activity,
  Zap,
  Flag,
  Crown,
  UserPlus,
  Clock,
} from 'lucide-react';

export default function PublicTeamProfile({ params }: any) {
  const resolvedParams = use(params) as any;
  const uri = resolvedParams.uri;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);

  // States for Join Request
  const [session, setSession] = useState<any>(null);
  const [myMembership, setMyMembership] = useState<any>(null); // Pengecekan status user saat ini
  const [isRequesting, setIsRequesting] = useState(false);

  // Statistik Gabungan Tim
  const [stats, setStats] = useState({
    totalDistance: 0,
    totalTime: 0,
    avgSR: 0,
    avgUnrankedSR: 0,
    ranked: { wins: 0, podiums: 0, starts: 0 },
    unranked: { wins: 0, podiums: 0, starts: 0 },
  });

  useEffect(() => {
    fetchTeamData();
  }, [uri]);

  const fetchTeamData = async () => {
    setLoading(true);

    // 1. Fetch Session (Siapa yang sedang melihat halaman ini?)
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();
    setSession(currentSession);

    // 2. Fetch Data Tim berdasarkan URI
    const { data: teamData } = await supabase
      .from('teams')
      .select('*, profiles!teams_owner_id_fkey(display_name)')
      .eq('uri', uri)
      .single();

    if (teamData) {
      setTeam(teamData);

      // Cek apakah user yang login sudah ada di tabel team_members (di tim manapun)
      if (currentSession) {
        const { data: myMem } = await supabase
          .from('team_members')
          .select('*')
          .eq('profile_id', currentSession.user.id)
          .maybeSingle();
        setMyMembership(myMem);
      }

      // 3. Fetch Data Semua Member Aktif untuk Roster & Statistik
      const { data: memberData } = await supabase
        .from('team_members')
        .select('role, status, profiles(*)')
        .eq('team_id', teamData.id)
        .eq('status', 'active');

      if (memberData) {
        setMembers(memberData);

        let dist = 0,
          time = 0,
          rWins = 0,
          rPods = 0,
          rStarts = 0,
          rSR = 0,
          uWins = 0,
          uPods = 0,
          uStarts = 0,
          uSR = 0,
          validDrivers = 0;

        memberData.forEach((m: any) => {
          const prof = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
          if (prof) {
            validDrivers++;
            dist += prof.total_distance_km || 0;
            time += Number(prof.total_playing_time) || 0;
            rWins += prof.total_wins || 0;
            rPods += prof.total_podiums || 0;
            rStarts += prof.total_starts || 0;
            rSR += prof.safety_rating || 0;
            uWins += prof.unranked_wins || 0;
            uPods += prof.unranked_podiums || 0;
            uStarts += prof.unranked_starts || 0;
            uSR += prof.unranked_safety_rating || 0;
          }
        });

        setStats({
          totalDistance: Math.floor(dist),
          totalTime: Math.floor(time / 3600),
          avgSR: validDrivers > 0 ? Number((rSR / validDrivers).toFixed(2)) : 0,
          avgUnrankedSR:
            validDrivers > 0 ? Number((uSR / validDrivers).toFixed(2)) : 0,
          ranked: { wins: rWins, podiums: rPods, starts: rStarts },
          unranked: { wins: uWins, podiums: uPods, starts: uStarts },
        });
      }
    }
    setLoading(false);
  };

  const handleRequestJoin = async () => {
    if (!session) return router.push('/auth/login');
    if (!confirm(`Kirim permintaan untuk bergabung dengan ${team.name}?`))
      return;

    setIsRequesting(true);
    const { error } = await supabase.from('team_members').insert([
      {
        team_id: team.id,
        profile_id: session.user.id,
        role: 'driver',
        status: 'pending',
      },
    ]);

    if (error) {
      alert('Gagal mengirim permintaan: ' + error.message);
    } else {
      alert('✅ Permintaan terkirim! Menunggu persetujuan Owner tim.');
      fetchTeamData(); // Refresh data
    }
    setIsRequesting(false);
  };

  if (loading)
    return (
      <div className="min-h-screen pt-32 px-4 max-w-7xl mx-auto animate-pulse text-[var(--foreground)] font-black">
        Loading Team Profile...
      </div>
    );
  if (!team)
    return (
      <div className="min-h-screen pt-32 px-4 text-[var(--foreground)]">
        Team not found.
      </div>
    );

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* BANNER & HEADER */}
      <div className="relative h-auto md:h-80 w-full rounded-[3rem] overflow-hidden border border-[var(--card-border)] bg-[var(--background)] shadow-xl flex flex-col md:block">
        {team.banner_url ? (
          <img
            src={team.banner_url}
            className="absolute inset-0 w-full h-full object-cover opacity-90"
            alt="Team Banner"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-900/20 to-blue-900/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

        <div className="relative z-10 p-8 md:absolute md:bottom-8 md:left-8 md:right-8 flex flex-col md:flex-row items-center md:items-end justify-between gap-6 h-full md:h-auto text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
            <div className="w-32 h-32 bg-[var(--card)] rounded-3xl border-4 border-[var(--background)] shadow-2xl flex items-center justify-center overflow-hidden shrink-0">
              {team.logo_url ? (
                <img
                  src={team.logo_url}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Shield size={48} className="text-purple-500/20" />
              )}
            </div>
            <div className="mb-2">
              <span className="text-[10px] font-black bg-purple-500/80 text-white px-3 py-1 rounded-lg tracking-widest uppercase shadow-lg">
                [{team.tag}] LVL {team.team_level || 1}
              </span>
              <h1 className="text-3xl md:text-5xl font-black italic text-white uppercase tracking-tighter leading-none mt-3">
                {team.name}
              </h1>
              <p className="text-xs font-bold text-gray-300 uppercase tracking-widest mt-2 flex items-center justify-center md:justify-start gap-2">
                <Users size={14} /> {members.length} Drivers •{' '}
                {team.total_xp?.toLocaleString('id-ID') || 0} XP
              </p>
            </div>
          </div>

          {/* JOIN BUTTON LOGIC */}
          <div className="mt-4 md:mt-0 w-full md:w-auto">
            {!session ? (
              <button
                onClick={() => router.push('/auth/login')}
                className="w-full md:w-auto bg-[var(--accent)] hover:opacity-90 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition"
              >
                <UserPlus size={18} /> Log in to Join
              </button>
            ) : myMembership?.team_id === team.id ? (
              myMembership.status === 'active' ? (
                <div className="w-full md:w-auto bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-8 py-3 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2">
                  <CheckCircle2 size={18} /> You are a member
                </div>
              ) : (
                <div className="w-full md:w-auto bg-amber-500/20 text-amber-400 border border-amber-500/30 px-8 py-3 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2">
                  <Clock size={18} /> Request Pending
                </div>
              )
            ) : myMembership ? (
              <div className="w-full md:w-auto bg-gray-500/20 text-gray-400 border border-gray-500/30 px-8 py-3 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-not-allowed text-xs text-center">
                Already in another team
              </div>
            ) : (
              <button
                onClick={handleRequestJoin}
                disabled={isRequesting}
                className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <UserPlus size={18} />{' '}
                {isRequesting ? 'Sending...' : 'Request to Join'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* STATS ANALYTICS */}
      {/* ... (BAGIAN STATS DAN ROSTER SAMA PERSIS DENGAN KODE SEBELUMNYA) ... */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* RANKED STATS */}
        <div className="bg-[var(--card)] border border-[var(--card-border)] p-8 rounded-[2.5rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform">
            <Trophy size={120} />
          </div>
          <h3 className="text-xl font-black italic text-purple-500 uppercase tracking-tighter mb-6 flex items-center gap-3">
            <Activity size={20} /> Ranked Efficiency
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <StatBox
              label="Avg Safety Rating"
              value={stats.avgSR}
              sub="Professionalism"
              color="text-emerald-500"
            />
            <StatBox
              label="Total Team Wins"
              value={stats.ranked.wins}
              sub="Victories"
            />
            <StatBox
              label="Total Podiums"
              value={stats.ranked.podiums}
              sub="Top 3 Finishes"
            />
            <StatBox
              label="Total Race Starts"
              value={stats.ranked.starts}
              sub="Experience"
            />
          </div>
        </div>

        {/* UNRANKED STATS */}
        <div className="bg-[var(--card)] border border-[var(--card-border)] p-8 rounded-[2.5rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:-rotate-12 transition-transform">
            <Zap size={120} />
          </div>
          <h3 className="text-xl font-black italic text-blue-500 uppercase tracking-tighter mb-6 flex items-center gap-3">
            <Flag size={20} /> Casual Activity
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <StatBox
              label="Avg Safety Rating"
              value={stats.avgUnrankedSR}
              sub="Casual Behavior"
              color="text-blue-400"
            />
            <StatBox
              label="Unranked Wins"
              value={stats.unranked.wins}
              sub="Casual Victories"
            />
            <StatBox
              label="Team Mileage"
              value={`${stats.totalDistance.toLocaleString('id-ID')} KM`}
              sub="Total Distance"
            />
            <StatBox
              label="Service Time"
              value={`${stats.totalTime.toLocaleString('id-ID')} HRS`}
              sub="Track Time"
            />
          </div>
        </div>
      </div>

      {/* ROSTER LIST */}
      <div>
        <h3 className="text-xl font-black italic text-[var(--foreground)] uppercase tracking-tighter mb-6 flex items-center gap-2">
          <Users size={20} className="text-purple-500" /> Active Roster
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m: any, idx: number) => {
            const prof = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
            return (
              <div
                key={idx}
                className="bg-[var(--card)] border border-[var(--card-border)] p-5 rounded-2xl flex items-center gap-4 hover:border-[var(--accent)] transition-colors"
              >
                <div className="w-12 h-12 bg-[var(--background)] rounded-xl flex items-center justify-center font-black text-purple-500 shrink-0">
                  {prof?.driver_level || 1}
                </div>
                <div className="overflow-hidden">
                  <h4 className="font-black text-[var(--foreground)] uppercase text-sm leading-none truncate">
                    {prof?.display_name || prof?.username || 'Unknown Driver'}
                  </h4>
                  <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mt-1 flex items-center gap-1">
                    {m.role === 'owner' ? (
                      <Crown size={10} className="text-yellow-500" />
                    ) : (
                      ''
                    )}{' '}
                    {m.role}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  sub,
  color = 'text-[var(--foreground)]',
}: any) {
  return (
    <div className="bg-[var(--background)] border border-[var(--card-border)] p-5 rounded-2xl relative z-10">
      <p className="text-[9px] font-black text-[var(--muted)] uppercase tracking-widest mb-1">
        {label}
      </p>
      <p className={`text-2xl font-black tracking-tighter ${color}`}>{value}</p>
      <p className="text-[8px] font-bold text-[var(--muted)] uppercase mt-1 opacity-50">
        {sub}
      </p>
    </div>
  );
}
