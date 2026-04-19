'use client';

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import {
  Trophy,
  ShieldCheck,
  Activity,
  Wallet,
  Gamepad2,
  AlertTriangle,
  Route,
  Settings,
  Flag,
  Clock,
  History,
  Timer,
  CalendarDays,
  Car,
  TrendingUp,
  TrendingDown,
  MapPin,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';

// Helpers: Rank Label & Warna berdasarkan SR
const getRankDetails = (sr: number) => {
  if (sr >= 80)
    return {
      label: 'ELITE',
      color: 'text-cyan-500',
      border: 'border-cyan-500/50',
      bg: 'bg-cyan-500/5',
    };
  if (sr >= 60)
    return {
      label: 'PRO',
      color: 'text-[var(--accent)]',
      border: 'border-[var(--accent)]',
      bg: 'bg-[var(--accent)]/5',
    };
  if (sr >= 40)
    return {
      label: 'SEMI-PRO',
      color: 'text-blue-500',
      border: 'border-blue-500/50',
      bg: 'bg-blue-500/5',
    };
  if (sr >= 20)
    return {
      label: 'AMATEUR',
      color: 'text-emerald-500',
      border: 'border-emerald-500/50',
      bg: 'bg-emerald-500/5',
    };
  return {
    label: 'ROOKIE',
    color: 'text-[var(--muted)]',
    border: 'border-[var(--card-border)]',
    bg: 'bg-[var(--card)]',
  };
};

// Formatting helpers
const formatPlayingTime = (time: number) => {
  if (!time) return '0h 0m';
  const totalSeconds = time > 10000000 ? Math.floor(time / 1000) : Number(time);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return `${h}h ${m}m`;
};

const formatLapTime = (ms: number) => {
  if (!ms) return '--:--.---';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
};

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
};

const formatModelName = (str: string) => {
  if (!str) return 'Unknown';
  return str
    .split(/[_|-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const HISTORY_PER_PAGE = 10;
const PASSED_PER_PAGE = 5;

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const resolvedParams = use(params);
  const username = resolvedParams.username;
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [trackMap, setTrackMap] = useState<Record<string, string>>({});
  const [carMap, setCarMap] = useState<Record<string, string>>({});

  const [activeTab, setActiveTab] = useState<
    'overview' | 'history' | 'hotlaps' | 'events'
  >('overview');

  // Lazy Load History States
  const [raceHistory, setRaceHistory] = useState<any[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Lazy Load Passed Events States
  const [passedEvents, setPassedEvents] = useState<any[]>([]);
  const [passedPage, setPassedPage] = useState(1);
  const [hasMorePassed, setHasMorePassed] = useState(true);
  const [loadingMorePassed, setLoadingMorePassed] = useState(false);

  const [hotlaps, setHotlaps] = useState<any[]>([]);
  const [trackStats, setTrackStats] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: currentUserProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (currentUserProfile) setCurrentUser(currentUserProfile);
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (profileError || !profileData) {
        setProfile(null);
        setLoading(false);
        return;
      }
      setProfile(profileData);

      // MENGGUNAKAN NAMA KOLOM SQL YANG BENAR: track_model DAN model_key
      const { data: tracksData } = await supabase
        .from('tracks')
        .select('track_model, name, uri');
      const { data: carsData } = await supabase
        .from('cars')
        .select('model_key, name');

      const tMap: Record<string, string> = {};
      const cMap: Record<string, string> = {};

      tracksData?.forEach((t: any) => (tMap[t.track_model] = t.name));
      carsData?.forEach((c: any) => (cMap[c.model_key] = c.name));

      setTrackMap(tMap);
      setCarMap(cMap);

      const steamGuid = profileData.steam_guid;
      const userId = profileData.id;

      if (steamGuid || userId) {
        const [historyRes, hotlapsRes, statsRes, eventsRes, passedRes] =
          await Promise.all([
            steamGuid
              ? supabase
                  .from('race_earnings_history')
                  .select('*, events(title)')
                  .eq('steam_guid', steamGuid)
                  .order('created_at', { ascending: false })
                  .range(0, HISTORY_PER_PAGE - 1)
              : Promise.resolve({ data: [] }),
            steamGuid
              ? supabase
                  .from('hotlap_data')
                  .select('*')
                  .eq('driver_guid', steamGuid)
                  .order('updated_at', { ascending: false })
              : Promise.resolve({ data: [] }),
            steamGuid
              ? supabase
                  .from('driver_track_stats')
                  .select('*')
                  .eq('driver_guid', steamGuid)
                  .order('total_laps', { ascending: false })
              : Promise.resolve({ data: [] }),
            userId
              ? supabase
                  .from('event_participants')
                  .select('*, events(*)')
                  .eq('user_id', userId)
                  .order('created_at', { ascending: false })
              : Promise.resolve({ data: [] }),
            steamGuid
              ? supabase
                  .from('race_earnings_history')
                  .select('*, events(*)')
                  .eq('steam_guid', steamGuid)
                  .not('event_id', 'is', null)
                  .order('created_at', { ascending: false })
                  .range(0, PASSED_PER_PAGE - 1)
              : Promise.resolve({ data: [] }),
          ]);

        if (historyRes.data) {
          setRaceHistory(historyRes.data);
          if (historyRes.data.length < HISTORY_PER_PAGE)
            setHasMoreHistory(false);
        }
        if (hotlapsRes.data) setHotlaps(hotlapsRes.data);
        if (statsRes.data) setTrackStats(statsRes.data);
        if (eventsRes.data) setEvents(eventsRes.data);

        if (passedRes.data) {
          setPassedEvents(passedRes.data);
          if (passedRes.data.length < PASSED_PER_PAGE) setHasMorePassed(false);
        }
      }

      setLoading(false);
    }

    fetchData();
  }, [username]);

  const loadMoreHistory = async () => {
    if (!profile?.steam_guid || loadingMore) return;
    setLoadingMore(true);

    const nextPage = historyPage + 1;
    const from = (nextPage - 1) * HISTORY_PER_PAGE;
    const to = from + HISTORY_PER_PAGE - 1;

    const { data } = await supabase
      .from('race_earnings_history')
      .select('*, events(title)')
      .eq('steam_guid', profile.steam_guid)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (data) {
      if (data.length < HISTORY_PER_PAGE) setHasMoreHistory(false);
      setRaceHistory((prev) => [...prev, ...data]);
      setHistoryPage(nextPage);
    }
    setLoadingMore(false);
  };

  const loadMorePassedEvents = async () => {
    if (!profile?.steam_guid || loadingMorePassed) return;
    setLoadingMorePassed(true);

    const nextPage = passedPage + 1;
    const from = (nextPage - 1) * PASSED_PER_PAGE;
    const to = from + PASSED_PER_PAGE - 1;

    const { data } = await supabase
      .from('race_earnings_history')
      .select('*, events(*)')
      .eq('steam_guid', profile.steam_guid)
      .not('event_id', 'is', null)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (data) {
      if (data.length < PASSED_PER_PAGE) setHasMorePassed(false);
      setPassedEvents((prev) => [...prev, ...data]);
      setPassedPage(nextPage);
    }
    setLoadingMorePassed(false);
  };

  const getSessionName = (race: any) => {
    if (race.events?.title) return race.events.title;
    if (race.session_id) {
      const parts = race.session_id.split('_/results');
      if (parts.length > 1) return formatModelName(parts[0]);
    }
    return 'Public Server Session';
  };

  const calculateLevelProgress = (xp: number, level: number) => {
    const currentLevelBaseXP = (level - 1) * 1000;
    const nextLevelXP = level * 1000;
    const progress = Math.max(
      0,
      Math.min(
        100,
        ((xp - currentLevelBaseXP) / (nextLevelXP - currentLevelBaseXP)) * 100,
      ),
    );
    return { progress, nextLevelXP };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)] space-y-4">
        <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
        <div className="text-[var(--accent)] font-black uppercase italic tracking-widest text-sm drop-shadow-md">
          Loading Telemetry...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
        <AlertTriangle
          size={56}
          className="text-[var(--muted)] mb-6 animate-pulse"
        />
        <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-2">
          Driver Not Found
        </h1>
        <button
          onClick={() => router.push('/')}
          className="mt-8 px-8 py-3 bg-[var(--accent)] text-white rounded-xl font-black uppercase tracking-widest text-xs"
        >
          Return to Paddock
        </button>
      </div>
    );
  }

  const isOwner = currentUser?.username === profile.username;
  const rankedDetails = getRankDetails(profile.safety_rating);
  const bannerImg =
    profile.banner_url ||
    `https://images.unsplash.com/photo-1547038577-c866986e2eb9?q=80&w=2000&auto=format&fit=crop`;
  const { progress: xpProgress, nextLevelXP } = calculateLevelProgress(
    profile.total_xp,
    profile.driver_level || 1,
  );

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-20 transition-colors duration-300">
      {/* --- HERO BANNER --- */}
      <div className="relative h-60 md:h-96 w-full group overflow-hidden bg-[var(--card)]">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <img
          src={bannerImg}
          alt="Banner"
          className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/40 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-24 md:-mt-32 relative z-20">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 items-start">
          {/* --- LEFT SIDEBAR --- */}
          <div className="w-full lg:col-span-4 space-y-6">
            {/* Identity Card */}
            <div className="bg-[var(--card)] border border-[var(--card-border)] p-6 rounded-[2rem] shadow-xl relative text-center pt-20 md:pt-24">
              <div className="absolute -top-16 md:-top-20 left-1/2 -translate-x-1/2 z-30">
                <img
                  src={
                    profile.avatar_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.steam_guid}`
                  }
                  alt="Avatar"
                  className="w-32 h-32 md:w-40 md:h-40 rounded-full border-[6px] border-[var(--card)] object-cover shadow-2xl bg-[var(--background)]"
                />
              </div>

              <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter">
                {profile.display_name || profile.username}
              </h1>
              <p className="text-xs text-[var(--muted)] font-bold tracking-widest uppercase mt-1 mb-4">
                @{profile.username}
              </p>

              <div className="px-4 mb-6">
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
                  {profile.bio ||
                    'This driver prefers to let their lap times do the talking.'}
                </ReactMarkdown>
              </div>

              <div className="p-4 bg-[var(--background)] border border-[var(--card-border)] rounded-2xl mb-4 text-left">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <span className="text-[10px] text-[var(--muted)] font-black uppercase tracking-widest mb-1 block">
                      Driver Level
                    </span>
                    <span className="text-3xl font-black leading-none text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-blue-500">
                      {profile.driver_level || 1}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[var(--muted)] font-bold uppercase block">
                      Next Level
                    </span>
                    <span className="text-xs font-black">
                      {profile.total_xp} / {nextLevelXP} XP
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

              {isOwner && (
                <div className="mt-4 pt-4 border-t border-[var(--card-border)]">
                  <button
                    onClick={() => router.push('/profile/settings')}
                    className="w-full flex items-center justify-center gap-2 bg-[var(--background)] border border-[var(--card-border)] hover:border-[var(--accent)] text-[var(--foreground)] hover:text-[var(--accent)] py-3.5 rounded-xl transition-all font-black text-[11px] uppercase tracking-widest shadow-sm"
                  >
                    <Settings size={16} /> Profile Settings
                  </button>
                </div>
              )}
            </div>

            {/* Telemetry Card */}
            <div className="bg-[var(--card)] border border-[var(--card-border)] p-6 rounded-[2rem] shadow-xl space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                <Activity size={16} className="text-blue-500" /> Driver
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
                  {formatPlayingTime(profile.total_playing_time)}
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
                  {profile.total_distance_km?.toFixed(1)}{' '}
                  <span className="text-[10px]">KM</span>
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-[var(--background)] rounded-2xl border border-[var(--card-border)]">
                <div className="flex gap-3 items-center">
                  <Wallet size={18} className="text-yellow-500" />
                  <span className="text-xs font-bold text-[var(--muted)] uppercase">
                    NRC
                  </span>
                </div>
                <span className="font-black text-yellow-500">
                  {profile.nrc_coin?.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Mini Track Stats */}
            {trackStats.length > 0 && (
              <div className="bg-[var(--card)] border border-[var(--card-border)] p-6 rounded-[2rem] shadow-xl">
                <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                  <MapPin size={16} className="text-rose-500" /> Favorite Tracks
                </h3>
                <div className="space-y-3">
                  {trackStats.slice(0, 5).map((track, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-sm font-bold truncate max-w-[250px]">
                        {trackMap[track.track_model] ||
                          formatModelName(track.track_model)}
                      </span>
                      <span className="text-xs text-[var(--muted)]">
                        {track.total_laps} Laps
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* --- RIGHT MAIN CONTENT (TABS) --- */}
          <div className="w-full lg:col-span-8 space-y-6">
            <div className="flex overflow-x-auto gap-2 p-2 bg-[var(--card)] border border-[var(--card-border)] rounded-2xl shadow-sm hide-scrollbar whitespace-nowrap">
              {[
                { id: 'overview', icon: Activity, label: 'Overview' },
                { id: 'history', icon: History, label: 'Race History' },
                { id: 'hotlaps', icon: Timer, label: 'Hotlaps' },
                { id: 'events', icon: CalendarDays, label: 'Events' },
              ].map((tab) => (
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
              ))}
            </div>

            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div
                  className={`bg-[var(--card)] border p-6 md:p-8 rounded-[2rem] shadow-xl ${rankedDetails.bg} ${rankedDetails.border}`}
                >
                  <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center mb-8 gap-4">
                    <div className="flex items-center gap-4">
                      <ShieldCheck size={32} className={rankedDetails.color} />
                      <div>
                        <h2 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter">
                          Ranked Career
                        </h2>
                        <span
                          className={`text-[9px] md:text-[10px] font-black tracking-widest px-2 py-1 rounded bg-[var(--background)] border ${rankedDetails.border} ${rankedDetails.color}`}
                        >
                          {rankedDetails.label}
                        </span>
                      </div>
                    </div>
                    <div className="md:text-right">
                      <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-1">
                        Safety Rating
                      </p>
                      <span
                        className={`text-4xl font-black leading-none ${rankedDetails.color}`}
                      >
                        {profile.safety_rating?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 md:gap-4">
                    <div className="bg-[var(--background)] p-3 md:p-4 rounded-xl text-center border border-[var(--card-border)]">
                      <span className="block text-2xl md:text-3xl font-black mb-1">
                        {profile.total_wins}
                      </span>
                      <span className="text-[9px] text-[var(--muted)] font-bold uppercase">
                        Wins
                      </span>
                    </div>
                    <div className="bg-[var(--background)] p-3 md:p-4 rounded-xl text-center border border-[var(--card-border)]">
                      <span className="block text-2xl md:text-3xl font-black mb-1">
                        {profile.total_podiums}
                      </span>
                      <span className="text-[9px] text-[var(--muted)] font-bold uppercase">
                        Podiums
                      </span>
                    </div>
                    <div className="bg-[var(--background)] p-3 md:p-4 rounded-xl text-center border border-[var(--card-border)]">
                      <span className="block text-2xl md:text-3xl font-black mb-1">
                        {profile.total_starts}
                      </span>
                      <span className="text-[9px] text-[var(--muted)] font-bold uppercase">
                        Starts
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-[var(--card)] border border-[var(--card-border)] p-6 md:p-8 rounded-[2rem] shadow-xl">
                  <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center mb-8 gap-4">
                    <div className="flex items-center gap-4">
                      <Gamepad2
                        size={32}
                        className="text-[var(--foreground)]"
                      />
                      <div>
                        <h2 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter">
                          Casual Play
                        </h2>
                        <span className="text-[9px] md:text-[10px] font-black tracking-widest px-2 py-1 rounded bg-[var(--background)] border border-[var(--card-border)] text-[var(--muted)]">
                          UNRANKED
                        </span>
                      </div>
                    </div>
                    <div className="md:text-right">
                      <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-1">
                        Unranked SR
                      </p>
                      <span className="text-4xl font-black leading-none">
                        {profile.unranked_safety_rating?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 md:gap-4">
                    <div className="bg-[var(--background)] p-3 md:p-4 rounded-xl text-center border border-[var(--card-border)]">
                      <span className="block text-2xl md:text-3xl font-black mb-1">
                        {profile.unranked_wins}
                      </span>
                      <span className="text-[9px] text-[var(--muted)] font-bold uppercase">
                        Wins
                      </span>
                    </div>
                    <div className="bg-[var(--background)] p-3 md:p-4 rounded-xl text-center border border-[var(--card-border)]">
                      <span className="block text-2xl md:text-3xl font-black mb-1">
                        {profile.unranked_podiums}
                      </span>
                      <span className="text-[9px] text-[var(--muted)] font-bold uppercase">
                        Podiums
                      </span>
                    </div>
                    <div className="bg-[var(--background)] p-3 md:p-4 rounded-xl text-center border border-[var(--card-border)]">
                      <span className="block text-2xl md:text-3xl font-black mb-1">
                        {profile.unranked_starts}
                      </span>
                      <span className="text-[9px] text-[var(--muted)] font-bold uppercase">
                        Starts
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: HISTORY */}
            {activeTab === 'history' && (
              <div className="bg-[var(--card)] border border-[var(--card-border)] p-6 rounded-[2rem] shadow-xl">
                <h2 className="text-xl font-black italic uppercase tracking-tighter mb-6">
                  Recent Earnings & History
                </h2>
                {raceHistory.length === 0 ? (
                  <p className="text-center text-[var(--muted)] text-sm py-10">
                    No race history found.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {raceHistory.map((race) => (
                      <div
                        key={race.id}
                        className="flex flex-col lg:flex-row justify-between lg:items-center p-4 bg-[var(--background)] border border-[var(--card-border)] rounded-xl gap-4"
                      >
                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${race.session_type === 'ranked' ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'bg-[var(--muted)]/10 text-[var(--muted)]'}`}
                            >
                              {race.session_type}
                            </span>
                            <span className="text-xs text-[var(--muted)]">
                              {formatDate(race.created_at)}
                            </span>
                          </div>
                          <p className="font-bold text-sm text-[var(--foreground)] truncate">
                            {getSessionName(race)}
                          </p>
                          <p className="text-xs text-[var(--muted)] flex items-center gap-1 mt-1 truncate">
                            <Car size={12} />{' '}
                            {carMap[race.car_model] ||
                              formatModelName(race.car_model)}{' '}
                            •{' '}
                            {trackMap[race.track_model] ||
                              formatModelName(race.track_model)}{' '}
                            • {race.laps_completed} Laps
                          </p>
                          <div className="flex flex-wrap gap-3 mt-3">
                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-[var(--muted)]">
                              <AlertTriangle
                                size={12}
                                className="text-yellow-500"
                              />{' '}
                              Cuts: {race.track_cuts || 0}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-[var(--muted)]">
                              <Activity size={12} className="text-rose-500" />{' '}
                              Colls:{' '}
                              {(race.incidents_car || 0) +
                                (race.incidents_env || 0)}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-[var(--muted)]">
                              <Trophy
                                size={12}
                                className="text-[var(--accent)]"
                              />{' '}
                              XP: +{race.xp_gained || 0}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-4 items-center bg-[var(--card)] p-3 rounded-lg border border-[var(--card-border)]">
                          <div className="text-center min-w-[40px] md:min-w-[50px]">
                            <p className="text-[9px] md:text-[10px] text-[var(--muted)] uppercase font-bold">
                              SR
                            </p>
                            <p
                              className={`text-xs md:text-sm font-black flex items-center justify-center ${race.sr_change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}
                            >
                              {race.sr_change >= 0 ? (
                                <TrendingUp size={12} className="mr-1" />
                              ) : (
                                <TrendingDown size={12} className="mr-1" />
                              )}
                              {race.sr_change > 0 ? '+' : ''}
                              {race.sr_change?.toFixed(2)}
                            </p>
                          </div>
                          <div className="w-px h-8 bg-[var(--card-border)]"></div>
                          <div className="text-center min-w-[40px] md:min-w-[50px]">
                            <p className="text-[9px] md:text-[10px] text-[var(--muted)] uppercase font-bold">
                              NRC
                            </p>
                            <p
                              className={`text-xs md:text-sm font-black flex items-center justify-center ${race.nrc_change >= 0 ? 'text-yellow-500' : 'text-rose-500'}`}
                            >
                              {race.nrc_change > 0 ? '+' : ''}
                              {race.nrc_change}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {hasMoreHistory && (
                      <button
                        onClick={loadMoreHistory}
                        disabled={loadingMore}
                        className="w-full flex items-center justify-center gap-2 bg-[var(--background)] border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] py-3 rounded-xl transition-all font-black text-[10px] md:text-xs uppercase mt-4 disabled:opacity-50"
                      >
                        {loadingMore ? (
                          'Loading Data...'
                        ) : (
                          <>
                            <ChevronDown size={16} /> Load More
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB: HOTLAPS */}
            {activeTab === 'hotlaps' && (
              <div className="bg-[var(--card)] border border-[var(--card-border)] p-6 rounded-[2rem] shadow-xl">
                <h2 className="text-xl font-black italic uppercase tracking-tighter mb-6">
                  Personal Best Laps
                </h2>
                {hotlaps.length === 0 ? (
                  <p className="text-center text-[var(--muted)] text-sm py-10">
                    No hotlap records found.
                  </p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {hotlaps.map((lap) => (
                      <div
                        key={lap.id}
                        className="p-4 bg-[var(--background)] border border-[var(--card-border)] rounded-xl flex justify-between items-center group hover:border-[var(--accent)] transition-colors"
                      >
                        <div className="overflow-hidden pr-2">
                          <p className="font-bold text-xs md:text-sm truncate">
                            {trackMap[lap.track_model] ||
                              formatModelName(lap.track_model)}
                          </p>
                          <p className="text-[10px] md:text-xs text-[var(--muted)] truncate">
                            {carMap[lap.car_model] ||
                              formatModelName(lap.car_model)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-base md:text-lg font-black text-[var(--accent)] font-mono">
                            {formatLapTime(lap.best_lap)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: EVENTS (Registered + Passed) */}
            {activeTab === 'events' && (
              <div className="space-y-6">
                {/* 1. REGISTERED EVENTS */}
                <div className="bg-[var(--card)] border border-[var(--card-border)] p-6 rounded-[2rem] shadow-xl">
                  <h2 className="text-xl font-black italic uppercase tracking-tighter mb-6">
                    Registered Events
                  </h2>
                  {events.length === 0 ? (
                    <p className="text-center text-[var(--muted)] text-sm py-10">
                      Not registered for any events yet.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {events.map((reg) => (
                        <div
                          key={reg.id}
                          className="flex gap-4 p-4 bg-[var(--background)] border border-[var(--card-border)] rounded-xl"
                        >
                          {reg.events?.image_url ? (
                            <img
                              src={reg.events.image_url}
                              alt="Event"
                              className="w-16 h-16 md:w-24 md:h-24 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-16 h-16 md:w-24 md:h-24 bg-[var(--card)] rounded-lg flex items-center justify-center border border-[var(--card-border)]">
                              <Flag className="text-[var(--muted)]" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex flex-col md:flex-row md:justify-between items-start">
                              <h3 className="font-black text-sm md:text-lg">
                                {reg.events?.title || 'Unknown Event'}
                              </h3>
                              <span className="text-[9px] font-black uppercase px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mt-1 md:mt-0">
                                Upcoming
                              </span>
                            </div>
                            <p className="text-[10px] md:text-xs text-[var(--muted)] mb-2 mt-1">
                              {reg.events?.event_date
                                ? formatDate(reg.events.event_date)
                                : 'TBA'}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <span className="text-[9px] md:text-[10px] border border-[var(--card-border)] px-2 py-1 rounded-md">
                                Car: <b>{reg.car_name}</b>
                              </span>
                              {reg.team_name && (
                                <span className="text-[9px] md:text-[10px] border border-[var(--card-border)] px-2 py-1 rounded-md">
                                  Team: <b>{reg.team_name}</b>
                                </span>
                              )}
                              <span className="text-[9px] md:text-[10px] bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-1 rounded-md font-bold">
                                #{reg.driver_number}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. PASSED EVENTS */}
                <div className="bg-[var(--card)] border border-[var(--card-border)] p-6 rounded-[2rem] shadow-xl">
                  <h2 className="text-xl font-black italic uppercase tracking-tighter mb-6 flex items-center gap-2">
                    <CheckCircle2 size={20} className="text-[var(--muted)]" />{' '}
                    Passed Events
                  </h2>
                  {passedEvents.length === 0 ? (
                    <p className="text-center text-[var(--muted)] text-sm py-10">
                      No completed events in history.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {passedEvents.map((raceEvent) => {
                        const eventData = raceEvent.events;
                        return (
                          <Link
                            href={`/events/${eventData?.id || raceEvent.event_id}`}
                            key={raceEvent.id}
                            className="block group"
                          >
                            <div className="flex flex-col md:flex-row gap-4 p-4 bg-[var(--background)] border border-[var(--card-border)] rounded-xl opacity-90 group-hover:opacity-100 group-hover:border-[var(--accent)] transition-all cursor-pointer">
                              <div className="flex items-center gap-4 flex-1">
                                {eventData?.image_url ? (
                                  <img
                                    src={eventData.image_url}
                                    alt="Event"
                                    className="w-12 h-12 md:w-16 md:h-16 object-cover rounded-lg grayscale group-hover:grayscale-0 transition-all"
                                  />
                                ) : (
                                  <div className="w-12 h-12 md:w-16 md:h-16 bg-[var(--card)] rounded-lg flex items-center justify-center border border-[var(--card-border)]">
                                    <Trophy
                                      className="text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors"
                                      size={16}
                                    />
                                  </div>
                                )}
                                <div>
                                  <h3 className="font-black text-sm md:text-base text-[var(--foreground)] leading-tight group-hover:text-[var(--accent)] transition-colors">
                                    {eventData?.title || 'Unknown Event'}
                                  </h3>
                                  <p className="text-[10px] md:text-xs text-[var(--muted)] mt-1">
                                    {eventData?.event_date
                                      ? formatDate(eventData.event_date)
                                      : formatDate(raceEvent.created_at)}
                                  </p>
                                </div>
                              </div>

                              {/* SR, NRC & XP Earnings for this passed event */}
                              <div className="flex gap-4 items-center bg-[var(--card)] p-2 md:p-3 rounded-lg border border-[var(--card-border)] self-start md:self-center w-full md:w-auto mt-2 md:mt-0">
                                <div className="text-center flex-1 md:min-w-[40px]">
                                  <p className="text-[9px] text-[var(--muted)] uppercase font-bold">
                                    SR
                                  </p>
                                  <p
                                    className={`text-xs font-black flex items-center justify-center ${raceEvent.sr_change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}
                                  >
                                    {raceEvent.sr_change > 0 ? '+' : ''}
                                    {raceEvent.sr_change?.toFixed(2)}
                                  </p>
                                </div>
                                <div className="w-px h-6 bg-[var(--card-border)]"></div>
                                <div className="text-center flex-1 md:min-w-[40px]">
                                  <p className="text-[9px] text-[var(--muted)] uppercase font-bold">
                                    NRC
                                  </p>
                                  <p
                                    className={`text-xs font-black flex items-center justify-center ${raceEvent.nrc_change >= 0 ? 'text-yellow-500' : 'text-rose-500'}`}
                                  >
                                    {raceEvent.nrc_change > 0 ? '+' : ''}
                                    {raceEvent.nrc_change}
                                  </p>
                                </div>
                                <div className="w-px h-6 bg-[var(--card-border)]"></div>
                                <div className="text-center flex-1 md:min-w-[40px]">
                                  <p className="text-[9px] text-[var(--muted)] uppercase font-bold">
                                    XP
                                  </p>
                                  <p className="text-xs font-black text-[var(--accent)] flex items-center justify-center">
                                    +{raceEvent.xp_gained || 0}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      })}

                      {/* Lazy Load Button for Passed Events */}
                      {hasMorePassed && (
                        <button
                          onClick={loadMorePassedEvents}
                          disabled={loadingMorePassed}
                          className="w-full flex items-center justify-center gap-2 bg-[var(--background)] border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] py-3 rounded-xl transition-all font-black text-[10px] md:text-xs uppercase mt-4 disabled:opacity-50"
                        >
                          {loadingMorePassed ? (
                            'Loading Events...'
                          ) : (
                            <>
                              <ChevronDown size={16} /> Load More Events
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
