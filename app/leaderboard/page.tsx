'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { getRankDetails } from '@/components/RankBadge';
import {
  Trophy,
  ShieldCheck,
  Activity,
  Medal,
  Flag,
  Crown,
  ChevronRight,
  Search,
  Wallet,
  Route,
  Clock,
} from 'lucide-react';

const formatPlayingTime = (time: number) => {
  if (!time) return '0h 0m';
  const totalSeconds = time > 10000000 ? Math.floor(time / 1000) : Number(time);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return `${h}h ${m}m`;
};

type LeaderboardCategory =
  | 'safety_rating'
  | 'total_wins'
  | 'total_podiums'
  | 'total_starts'
  | 'total_xp'
  | 'nrc_coin'
  | 'total_distance_km'
  | 'total_playing_time';

export default function LeaderboardPage() {
  const [activeCategory, setActiveCategory] =
    useState<LeaderboardCategory>('safety_rating');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Struktur Kategori untuk Sidebar (Kanan)
  const categoryGroups = [
    {
      title: 'Career Stats',
      icon: <ShieldCheck size={16} className="text-[var(--accent)]" />,
      items: [
        {
          id: 'safety_rating',
          label: 'Safety Rating',
          icon: <ShieldCheck size={16} />,
          color: 'group-hover:text-[var(--accent)]',
        },
        {
          id: 'total_wins',
          label: 'Wins',
          icon: <Trophy size={16} />,
          color: 'group-hover:text-yellow-500',
        },
        {
          id: 'total_podiums',
          label: 'Podiums',
          icon: <Medal size={16} />,
          color: 'group-hover:text-orange-500',
        },
        {
          id: 'total_starts',
          label: 'Starts',
          icon: <Flag size={16} />,
          color: 'group-hover:text-blue-500',
        },
      ],
    },
    {
      title: 'Global Stats',
      icon: <Activity size={16} className="text-rose-500" />,
      items: [
        {
          id: 'total_xp',
          label: 'Experience (XP)',
          icon: <Activity size={16} />,
          color: 'group-hover:text-rose-500',
        },
        {
          id: 'nrc_coin',
          label: 'Top Earners (NRC)',
          icon: <Wallet size={16} />,
          color: 'group-hover:text-amber-500',
        },
        {
          id: 'total_distance_km',
          label: 'Distance Driven',
          icon: <Route size={16} />,
          color: 'group-hover:text-emerald-500',
        },
        {
          id: 'total_playing_time',
          label: 'Playing Time',
          icon: <Clock size={16} />,
          color: 'group-hover:text-blue-500',
        },
      ],
    },
  ];

  useEffect(() => {
    fetchLeaderboard(activeCategory);
  }, [activeCategory]);

  async function fetchLeaderboard(category: LeaderboardCategory) {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          `
          username, display_name, avatar_url, driver_level,
          safety_rating, total_wins, total_podiums, total_starts,
          total_xp, nrc_coin, total_distance_km, total_playing_time
        `,
        )
        .order(category, { ascending: false })
        .not('username', 'is', null)
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

  // Menentukan nama kategori aktif untuk Header Tabel
  const activeLabel =
    categoryGroups.flatMap((g) => g.items).find((i) => i.id === activeCategory)
      ?.label || 'Score';

  // Helper untuk mendapatkan nilai statistik yang tepat berdasarkan kategori aktif
  const getDisplayValue = (driver: any, category: LeaderboardCategory) => {
    switch (category) {
      case 'safety_rating':
        return (driver.safety_rating || 0).toFixed(2);
      case 'total_distance_km':
        return `${(driver.total_distance_km || 0).toFixed(1)} KM`;
      case 'total_playing_time':
        return formatPlayingTime(driver.total_playing_time || 0);
      default:
        return (driver[category] || 0).toLocaleString();
    }
  };

  // Helper untuk mendapatkan label Class/Rank yang tepat (Ranked vs Unranked SR)
  const getDriverClass = (driver: any, category: LeaderboardCategory) => {
    const isUnrankedCategory = category.startsWith('unranked_');
    const srValue = isUnrankedCategory
      ? driver.unranked_safety_rating
      : driver.safety_rating;
    return getRankDetails(srValue || 0);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans pb-24 pt-24 px-4 sm:px-6 relative overflow-hidden transition-colors duration-300">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-[var(--accent-glow)] blur-[150px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* HEADER */}
        <div className="text-center mb-10 md:mb-16">
          <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-4 flex items-center justify-center gap-4 text-[var(--foreground)] drop-shadow-sm">
            <Crown className="text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.4)] w-10 h-10 md:w-12 md:h-12" />
            Hall of Fame
          </h1>
          <p className="text-[var(--muted)] text-xs md:text-sm font-bold uppercase tracking-[0.3em]">
            Top 50 Drivers in Nismara
          </p>
        </div>

        {/* 2-COLUMN LAYOUT */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* KOLOM KANAN / ATAS DI MOBILE (SEARCH & MENU) */}
          <div className="w-full lg:w-1/3 xl:w-1/4 order-1 lg:order-2 space-y-6 lg:sticky lg:top-28">
            {/* Search Box */}
            <div className="bg-[var(--card)] border border-[var(--card-border)] p-4 rounded-3xl shadow-lg">
              <div className="relative">
                <Search
                  className="absolute left-4 top-3.5 text-[var(--muted)]"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search Driver..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] text-sm rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-[var(--accent)] transition-all placeholder:text-[var(--muted)] shadow-inner"
                />
              </div>
            </div>

            {/* Navigation Menu */}
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-3xl shadow-lg overflow-hidden">
              {categoryGroups.map((group, gIdx) => (
                <div
                  key={group.title}
                  className={`${gIdx !== 0 ? 'border-t border-[var(--card-border)]' : ''}`}
                >
                  <div className="bg-[var(--background)]/50 px-5 py-3 flex items-center gap-2">
                    {group.icon}
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">
                      {group.title}
                    </h3>
                  </div>
                  <div className="p-2 space-y-1">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() =>
                          setActiveCategory(item.id as LeaderboardCategory)
                        }
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all group ${
                          activeCategory === item.id
                            ? 'bg-[var(--accent)] text-white shadow-md'
                            : 'text-[var(--foreground)] hover:bg-[var(--background)] border border-transparent hover:border-[var(--card-border)]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={
                              activeCategory === item.id
                                ? 'text-white'
                                : `text-[var(--muted)] ${item.color}`
                            }
                          >
                            {item.icon}
                          </span>
                          {item.label}
                        </div>
                        {activeCategory === item.id && (
                          <ChevronRight size={14} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* KOLOM KIRI / BAWAH DI MOBILE (TABLE LEADERBOARD) */}
          <div className="w-full lg:w-2/3 xl:w-3/4 order-2 lg:order-1">
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-[2.5rem] overflow-hidden shadow-xl">
              {loading ? (
                <div className="py-32 flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[var(--accent)]"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[700px]">
                    <thead className="bg-[var(--background)] text-[10px] font-black uppercase tracking-[0.3em] text-[var(--muted)] border-b border-[var(--card-border)]">
                      <tr>
                        <th className="px-6 py-6 text-center w-24">Rank</th>
                        <th className="px-6 py-6">Driver</th>
                        <th className="px-6 py-6 text-center">Class</th>
                        <th className="px-8 py-6 text-right text-[var(--accent)]">
                          {activeLabel}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--card-border)]">
                      {filteredLeaderboard.map((driver, index) => {
                        // Menggunakan helper untuk mendapatkan Class sesuai konteks tab
                        const rankData = getDriverClass(driver, activeCategory);

                        // Style untuk Top 3
                        let rankStyle = 'text-[var(--muted)] font-bold';
                        let rowBg = 'hover:bg-[var(--background)]';

                        if (index === 0) {
                          rankStyle =
                            'text-yellow-500 font-black text-3xl drop-shadow-md';
                          rowBg =
                            'bg-yellow-500/5 hover:bg-yellow-500/10 border-l-4 border-yellow-500';
                        } else if (index === 1) {
                          rankStyle =
                            'text-slate-400 font-black text-2xl drop-shadow-sm';
                          rowBg =
                            'bg-slate-500/5 hover:bg-slate-500/10 border-l-4 border-slate-400';
                        } else if (index === 2) {
                          rankStyle =
                            'text-orange-500 font-black text-xl drop-shadow-sm';
                          rowBg =
                            'bg-orange-500/5 hover:bg-orange-500/10 border-l-4 border-orange-500';
                        }

                        return (
                          <tr
                            key={driver.username}
                            className={`transition-colors group ${rowBg}`}
                          >
                            {/* RANKING NUMBER */}
                            <td className="px-6 py-6 text-center">
                              <span className={`italic ${rankStyle}`}>
                                #{index + 1}
                              </span>
                            </td>

                            {/* DRIVER INFO */}
                            <td className="px-6 py-4">
                              <Link
                                href={`/profile/${driver.username}`}
                                className="flex items-center gap-4 group-hover:translate-x-2 transition-transform duration-300"
                              >
                                <div className="relative shrink-0">
                                  <img
                                    src={
                                      driver.avatar_url ||
                                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${driver.username}`
                                    }
                                    className="w-12 h-12 rounded-2xl object-cover border border-[var(--card-border)] group-hover:border-[var(--accent)] transition-colors bg-[var(--background)] shadow-sm"
                                    alt="Avatar"
                                  />
                                  {index === 0 && (
                                    <Crown
                                      size={16}
                                      className="absolute -top-2 -right-2 text-yellow-500 drop-shadow-md rotate-12"
                                      fill="currentColor"
                                    />
                                  )}
                                </div>
                                <div>
                                  <h4 className="text-base font-black italic uppercase text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                                    {driver.display_name || driver.username}
                                  </h4>
                                  <p className="text-[10px] text-[var(--muted)] font-bold tracking-widest uppercase mt-0.5">
                                    @{driver.username} • Lvl{' '}
                                    {driver.driver_level || 1}
                                  </p>
                                </div>
                              </Link>
                            </td>

                            {/* CLASS LABEL */}
                            <td className="px-6 py-4 text-center">
                              <div
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black border ${rankData.border} ${rankData.color} ${rankData.bg} tracking-widest inline-block shadow-sm`}
                              >
                                {rankData.label}
                              </div>
                            </td>

                            {/* STAT VALUE */}
                            <td className="px-8 py-4 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <h3
                                  className={`text-2xl font-black italic tracking-tighter ${activeCategory.includes('safety_rating') ? rankData.color : 'text-[var(--foreground)]'}`}
                                >
                                  {getDisplayValue(driver, activeCategory)}
                                </h3>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredLeaderboard.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-20 text-center">
                            <div className="flex flex-col items-center justify-center text-[var(--muted)]">
                              <Search size={32} className="mb-4 opacity-50" />
                              <p className="text-xs font-black uppercase tracking-widest italic">
                                Tidak ada pembalap ditemukan
                              </p>
                            </div>
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
      </div>
    </div>
  );
}
