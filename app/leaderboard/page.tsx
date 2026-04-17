'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import {
  Trophy,
  ShieldCheck,
  Activity,
  Medal,
  Flag,
  Crown,
  ChevronRight,
  Search,
} from 'lucide-react';

// --- HELPER: RANK SYSTEM ---
const getRankDetails = (sr: number) => {
  if (sr >= 80)
    return {
      label: 'ELITE',
      color: 'text-cyan-400',
      border: 'border-cyan-400/50',
      bg: 'bg-cyan-400/10',
    };
  if (sr >= 60)
    return {
      label: 'PRO',
      color: 'text-purple-400',
      border: 'border-purple-400/50',
      bg: 'bg-purple-400/10',
    };
  if (sr >= 40)
    return {
      label: 'SEMI-PRO',
      color: 'text-blue-400',
      border: 'border-blue-400/50',
      bg: 'bg-blue-400/10',
    };
  if (sr >= 20)
    return {
      label: 'AMATEUR',
      color: 'text-slate-300',
      border: 'border-slate-300/50',
      bg: 'bg-slate-300/10',
    };
  return {
    label: 'ROOKIE',
    color: 'text-orange-400',
    border: 'border-orange-400/50',
    bg: 'bg-orange-400/10',
  };
};

type LeaderboardCategory =
  | 'safety_rating'
  | 'total_xp'
  | 'total_wins'
  | 'total_starts';

export default function LeaderboardPage() {
  const [activeCategory, setActiveCategory] =
    useState<LeaderboardCategory>('safety_rating');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    {
      id: 'safety_rating',
      label: 'Safety Rating',
      icon: <ShieldCheck size={18} />,
      color: 'text-purple-400',
    },
    {
      id: 'total_xp',
      label: 'Experience Level',
      icon: <Activity size={18} />,
      color: 'text-blue-400',
    },
    {
      id: 'total_wins',
      label: 'Total Wins (P1)',
      icon: <Trophy size={18} />,
      color: 'text-yellow-400',
    },
    {
      id: 'total_starts',
      label: 'Event Starts',
      icon: <Flag size={18} />,
      color: 'text-zinc-400',
    },
  ];

  useEffect(() => {
    fetchLeaderboard(activeCategory);
  }, [activeCategory]);

  async function fetchLeaderboard(category: LeaderboardCategory) {
    setLoading(true);
    try {
      // Mengambil Top 50 Pembalap berdasarkan kategori yang dipilih
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'username, display_name, avatar_url, safety_rating, total_xp, driver_level, total_wins, total_starts',
        )
        .order(category, { ascending: false })
        .not('username', 'is', null) // Pastikan hanya user yang sudah setup onboarding yang masuk
        .limit(50);

      if (error) throw error;
      setLeaderboard(data || []);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }

  // Filter pencarian
  const filteredLeaderboard = leaderboard.filter(
    (driver) =>
      driver.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.username?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen text-white font-sans pb-24 pt-24 px-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-96 bg-purple-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* HEADER */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter mb-4 flex items-center justify-center gap-4">
            <Crown className="text-yellow-500" size={48} /> Hall of Fame
          </h1>
          <p className="text-gray-400 text-sm font-bold uppercase tracking-[0.3em]">
            Top 50 Drivers in Nismara
          </p>
        </div>

        {/* CONTROLS (TABS & SEARCH) */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
          {/* Tabs */}
          <div className="flex bg-white/5 p-2 rounded-2xl border border-white/10 overflow-x-auto w-full md:w-auto scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as LeaderboardCategory)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? 'bg-white/10 text-white shadow-lg'
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={activeCategory === cat.id ? cat.color : ''}>
                  {cat.icon}
                </span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search
              className="absolute left-4 top-3.5 text-gray-500"
              size={16}
            />
            <input
              type="text"
              placeholder="Cari Pembalap..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-2xl pl-11 pr-4 py-3 focus:outline-none focus:border-purple-500 transition-all placeholder:text-gray-600"
            />
          </div>
        </div>

        {/* LEADERBOARD LIST */}
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-md">
          {loading ? (
            <div className="py-32 flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead className="bg-[#120821]/80 text-[10px] font-black uppercase tracking-[0.3em] text-purple-300/50">
                  <tr>
                    <th className="px-8 py-6 text-center w-24">Rank</th>
                    <th className="px-6 py-6">Driver</th>
                    <th className="px-6 py-6 text-center">Class</th>
                    <th className="px-8 py-6 text-right">
                      {categories.find((c) => c.id === activeCategory)?.label}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLeaderboard.map((driver, index) => {
                    const rankData = getRankDetails(driver.safety_rating || 0);

                    // Style untuk Top 3 (Emas, Perak, Perunggu)
                    let rankStyle = 'text-gray-500 font-bold';
                    let rowBg = 'hover:bg-white/[0.02]';

                    if (index === 0) {
                      rankStyle =
                        'text-yellow-400 font-black text-2xl drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]';
                      rowBg =
                        'bg-yellow-500/5 hover:bg-yellow-500/10 border-l-4 border-yellow-400';
                    } else if (index === 1) {
                      rankStyle = 'text-slate-300 font-black text-xl';
                      rowBg =
                        'bg-slate-300/5 hover:bg-slate-300/10 border-l-4 border-slate-300';
                    } else if (index === 2) {
                      rankStyle = 'text-orange-400 font-black text-xl';
                      rowBg =
                        'bg-orange-400/5 hover:bg-orange-400/10 border-l-4 border-orange-400';
                    }

                    return (
                      <tr
                        key={driver.username}
                        className={`transition-all group ${rowBg}`}
                      >
                        {/* RANKING NUMBER */}
                        <td className="px-8 py-6 text-center">
                          <span className={`italic ${rankStyle}`}>
                            #{index + 1}
                          </span>
                        </td>

                        {/* DRIVER INFO */}
                        <td className="px-6 py-6">
                          <Link
                            href={`/profile/${driver.username}`}
                            className="flex items-center gap-4 group-hover:translate-x-2 transition-transform duration-300"
                          >
                            <div className="relative">
                              <img
                                src={
                                  driver.avatar_url ||
                                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${driver.username}`
                                }
                                className="w-12 h-12 rounded-2xl object-cover border border-white/10 group-hover:border-purple-500/50 transition-colors"
                                alt=""
                              />
                              {index === 0 && (
                                <Crown
                                  size={16}
                                  className="absolute -top-2 -right-2 text-yellow-400 drop-shadow-md rotate-12"
                                  fill="currentColor"
                                />
                              )}
                            </div>
                            <div>
                              <h4 className="text-base font-black italic uppercase text-white group-hover:text-purple-400 transition-colors">
                                {driver.display_name || driver.username}
                              </h4>
                              <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mt-0.5">
                                @{driver.username} • Lvl{' '}
                                {driver.driver_level || 1}
                              </p>
                            </div>
                          </Link>
                        </td>

                        {/* CLASS LABEL */}
                        <td className="px-6 py-6 text-center">
                          <div
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black border ${rankData.border} ${rankData.color} ${rankData.bg} tracking-widest inline-block`}
                          >
                            {rankData.label}
                          </div>
                        </td>

                        {/* STAT VALUE (Dynamis berdasarkan Tab) */}
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <h3 className="text-2xl font-black italic tracking-tighter">
                              {activeCategory === 'safety_rating' &&
                                (driver.safety_rating || 0).toFixed(2)}
                              {activeCategory === 'total_xp' &&
                                (driver.total_xp || 0).toLocaleString()}
                              {activeCategory === 'total_wins' &&
                                (driver.total_wins || 0)}
                              {activeCategory === 'total_starts' &&
                                (driver.total_starts || 0)}
                            </h3>
                            <ChevronRight
                              className="text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                              size={18}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredLeaderboard.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-20 text-center">
                        <p className="text-xs font-black text-gray-600 uppercase tracking-widest italic">
                          Tidak ada pembalap ditemukan
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
