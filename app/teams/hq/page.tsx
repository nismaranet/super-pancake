'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Shield,
  Users,
  CheckCircle2,
  XCircle,
  LogOut,
  Crown,
  Settings,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';

export default function TeamHQDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  // States: Team Data
  const [myTeam, setMyTeam] = useState<any>(null);
  const [myRole, setMyRole] = useState('');
  const [myStatus, setMyStatus] = useState('');

  // States: Members
  const [activeMembers, setActiveMembers] = useState<any[]>([]);
  const [pendingMembers, setPendingMembers] = useState<any[]>([]);

  const [historyData, setHistoryData] = useState<any[]>([]);
  const [chartMetric, setChartMetric] = useState<
    'total_distance_km' | 'avg_safety_rating' | 'total_xp'
  >('total_distance_km');

  useEffect(() => {
    fetchHQData();
  }, []);

  // Fetch history spesifik untuk tim ini (30 hari terakhir)
  useEffect(() => {
    if (myTeam) {
      const fetchHistory = async () => {
        const { data } = await supabase
          .from('team_daily_stats')
          .select('*')
          .eq('team_id', myTeam.id)
          .order('record_date', { ascending: true })
          .limit(30);
        setHistoryData(data || []);
      };
      fetchHistory();
    }
  }, [myTeam]);

  const fetchHQData = async () => {
    setLoading(true);
    const {
      data: { session: currSession },
    } = await supabase.auth.getSession();
    if (!currSession) return router.push('/auth/login');
    setSession(currSession);

    // 1. Cek Membership User
    const { data: membership } = await supabase
      .from('team_members')
      .select('role, status, teams(*)')
      .eq('profile_id', currSession.user.id)
      .maybeSingle();

    if (membership && membership.teams) {
      const team = Array.isArray(membership.teams)
        ? membership.teams[0]
        : membership.teams;
      setMyTeam(team);
      setMyRole(membership.role);
      setMyStatus(membership.status);

      // 2. Jika sudah punya tim (dan bukan pending), ambil data semua anggota
      if (membership.status === 'active') {
        const { data: allMembers } = await supabase
          .from('team_members')
          .select('*, profiles(*)')
          .eq('team_id', team.id)
          .order('role', { ascending: false }); // Owner di atas

        if (allMembers) {
          setActiveMembers(allMembers.filter((m) => m.status === 'active'));
          setPendingMembers(allMembers.filter((m) => m.status === 'pending'));
        }
      }
    } else {
      router.push('/teams'); // Tidak punya tim, lempar ke direktori
    }
    setLoading(false);
  };

  // ================= MANAJEMEN MEMBER =================

  const handleApprove = async (memberId: string) => {
    await supabase
      .from('team_members')
      .update({ status: 'active' })
      .eq('id', memberId);
    fetchHQData();
  };

  const handleRejectOrKick = async (memberId: string, isKick: boolean) => {
    const msg = isKick
      ? 'Keluarkan driver ini dari tim?'
      : 'Tolak permintaan bergabung?';
    if (!confirm(msg)) return;
    await supabase.from('team_members').delete().eq('id', memberId);
    fetchHQData();
  };

  const handleLeaveTeam = async () => {
    if (myRole === 'owner') {
      const confirmDisband = confirm(
        'PERINGATAN! Kamu adalah Owner. Jika kamu keluar, tim ini akan DIBUBARKAN secara permanen. Lanjutkan?',
      );
      if (!confirmDisband) return;
      await supabase.from('teams').delete().eq('id', myTeam.id);
    } else {
      const confirmLeave = confirm('Yakin ingin keluar dari tim ini?');
      if (!confirmLeave) return;
      await supabase
        .from('team_members')
        .delete()
        .eq('profile_id', session.user.id);
    }
    router.push('/teams');
  };

  if (loading)
    return (
      <div className="min-h-screen pt-32 text-center text-[var(--foreground)] font-black uppercase">
        Loading HQ...
      </div>
    );

  // Jika status masih pending
  if (myStatus === 'pending') {
    return (
      <div className="min-h-screen pt-32 px-4 max-w-3xl mx-auto text-center space-y-6">
        <Shield size={64} className="mx-auto text-amber-500/50" />
        <h1 className="text-3xl font-black uppercase text-[var(--foreground)] tracking-tighter">
          Application Pending
        </h1>
        <p className="text-[var(--muted)]">
          Kamu telah mendaftar ke tim{' '}
          <strong className="text-[var(--foreground)]">{myTeam.name}</strong>.
          Silakan tunggu Owner tim untuk menerima permintaanmu.
        </p>
        <button
          onClick={handleLeaveTeam}
          className="text-red-500 text-sm font-bold uppercase tracking-widest hover:underline"
        >
          Batalkan Permintaan
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 max-w-7xl mx-auto space-y-8">
      {/* HQ HEADER */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-[2.5rem] p-8 md:p-12 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-[10px] font-black bg-[var(--accent)] text-white px-3 py-1 rounded-lg tracking-widest uppercase">
            Internal Dashboard
          </span>
          <h1 className="text-4xl font-black italic text-[var(--foreground)] uppercase tracking-tighter mt-4 flex items-center gap-3">
            {myTeam.name} HQ
          </h1>
          <p className="text-[var(--muted)] font-bold text-xs uppercase tracking-widest mt-2 flex items-center gap-2">
            <Crown
              size={14}
              className={myRole === 'owner' ? 'text-yellow-500' : ''}
            />{' '}
            Access Level: {myRole}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {myRole === 'owner' && (
            <Link
              href="/teams/hq/settings"
              className="bg-[var(--background)] border border-[var(--card-border)] hover:border-purple-500 text-[var(--foreground)] px-6 py-3 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition text-xs"
            >
              <Settings size={16} /> Team Settings
            </Link>
          )}
          <button
            onClick={handleLeaveTeam}
            className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 px-6 py-3 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition text-xs"
          >
            <LogOut size={16} />{' '}
            {myRole === 'owner' ? 'Disband Team' : 'Leave Team'}
          </button>
        </div>
      </div>

      {/* PENDING REQUESTS (HANYA UNTUK OWNER) */}
      {myRole === 'owner' && pendingMembers.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-[2rem] p-8">
          <h3 className="text-lg font-black italic text-amber-500 uppercase tracking-tighter mb-4 flex items-center gap-2">
            <AlertTriangle size={20} /> Applications Pending (
            {pendingMembers.length})
          </h3>
          <div className="space-y-3">
            {pendingMembers.map((member) => {
              const prof = Array.isArray(member.profiles)
                ? member.profiles[0]
                : member.profiles;
              return (
                <div
                  key={member.id}
                  className="bg-[var(--background)] border border-amber-500/20 p-4 rounded-2xl flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-black text-[var(--foreground)] uppercase text-sm">
                      {prof?.display_name || prof?.username}
                    </h4>
                    <p className="text-[10px] text-[var(--muted)] uppercase tracking-widest mt-1">
                      Level {prof?.driver_level || 1} • SR:{' '}
                      {prof?.safety_rating?.toFixed(2) || '2.50'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(member.id)}
                      className="p-3 bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl transition"
                      title="Accept Driver"
                    >
                      <CheckCircle2 size={18} />
                    </button>
                    <button
                      onClick={() => handleRejectOrKick(member.id, false)}
                      className="p-3 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition"
                      title="Reject Driver"
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-[var(--card)] border border-[var(--card-border)] p-8 rounded-[2.5rem] shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">
              Team Progress Analytics
            </h3>
            <p className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-widest mt-1">
              Historical Performance Data
            </p>
          </div>

          {/* Selector Metrik */}
          <div className="flex bg-[var(--background)] p-1 rounded-xl border border-[var(--card-border)]">
            <button
              onClick={() => setChartMetric('total_distance_km')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${chartMetric === 'total_distance_km' ? 'bg-purple-600 text-white' : 'text-[var(--muted)]'}`}
            >
              Distance
            </button>
            <button
              onClick={() => setChartMetric('avg_safety_rating')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${chartMetric === 'avg_safety_rating' ? 'bg-purple-600 text-white' : 'text-[var(--muted)]'}`}
            >
              Safety Rating
            </button>
            <button
              onClick={() => setChartMetric('total_xp')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${chartMetric === 'total_xp' ? 'bg-purple-600 text-white' : 'text-[var(--muted)]'}`}
            >
              EXP Gained
            </button>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historyData}>
              <defs>
                <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#374151"
                vertical={false}
              />
              <XAxis
                dataKey="record_date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 'bold' }}
                tickFormatter={(str) =>
                  new Date(str).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                  })
                }
              />
              <YAxis
                hide={true}
                domain={
                  chartMetric === 'avg_safety_rating'
                    ? [0, 5]
                    : ['auto', 'auto']
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
                itemStyle={{ color: '#a78bfa', fontWeight: 'bold' }}
              />
              <Area
                type="monotone"
                dataKey={chartMetric}
                stroke="#a78bfa"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorMetric)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ACTIVE ROSTER MANAGEMENT */}
      <div>
        <h3 className="text-xl font-black italic text-[var(--foreground)] uppercase tracking-tighter mb-6 flex items-center gap-2">
          <Users size={20} className="text-purple-500" /> Active Roster
          Management
        </h3>
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-[2rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[var(--background)] border-b border-[var(--card-border)]">
                <tr className="text-[10px] text-[var(--muted)] uppercase tracking-widest">
                  <th className="py-5 px-6 font-black">Driver</th>
                  <th className="py-5 px-6 font-black">Role</th>
                  <th className="py-5 px-6 font-black">Performance</th>
                  {myRole === 'owner' && (
                    <th className="py-5 px-6 font-black text-right">Action</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {activeMembers.map((member) => {
                  const prof = Array.isArray(member.profiles)
                    ? member.profiles[0]
                    : member.profiles;
                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-[var(--background)] transition"
                    >
                      <td className="py-5 px-6">
                        <p className="font-black text-[var(--foreground)] uppercase text-sm">
                          {prof?.display_name || prof?.username}
                        </p>
                        <Link
                          href={`/driver/${prof?.username}`}
                          className="text-[10px] text-purple-500 hover:underline flex items-center gap-1 mt-1"
                        >
                          View Profile <ChevronRight size={10} />
                        </Link>
                      </td>
                      <td className="py-5 px-6">
                        {member.role === 'owner' ? (
                          <span className="text-yellow-500 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
                            <Crown size={12} /> Owner
                          </span>
                        ) : (
                          <span className="text-[var(--muted)] text-[10px] font-black uppercase tracking-widest">
                            Driver
                          </span>
                        )}
                      </td>
                      <td className="py-5 px-6">
                        <span className="text-xs font-bold text-[var(--foreground)]">
                          SR: {prof?.safety_rating?.toFixed(2)}
                        </span>
                      </td>

                      {/* OWNER ONLY: KICK BUTTON */}
                      {myRole === 'owner' && (
                        <td className="py-5 px-6 text-right">
                          {member.role !== 'owner' && (
                            <button
                              onClick={() =>
                                handleRejectOrKick(member.id, true)
                              }
                              className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition text-[10px] font-black uppercase tracking-widest"
                            >
                              Kick
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
