'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import {
  MapPin,
  Flag,
  Server,
  Calendar,
  ChevronRight,
  Info,
  Clock,
  ChevronLeft,
  User,
  ExternalLink,
  Download,
  Trophy,
  Crown,
  Timer,
  Car as CarIcon,
  Route,
  Medal,
} from 'lucide-react';

export default function CircuitDetailPage() {
  const params = useParams();
  const uri = params.uri as string;

  // ================= STATES =================
  const [track, setTrack] = useState<any>(null);
  const [activeServers, setActiveServers] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [pastEvents, setPastEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // STATE UNTUK HISTORY
  const [historyPage, setHistoryPage] = useState(1);
  const itemsPerPage = 3;

  // STATE UNTUK CARS & CLASS FILTER
  const [allCars, setAllCars] = useState<any[]>([]);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [carsLoaded, setCarsLoaded] = useState(false);

  // STATE UNTUK HOTLAP LEADERBOARD
  const [hotlaps, setHotlaps] = useState<any[]>([]);
  const [hotlapPage, setHotlapPage] = useState(1);
  const [totalHotlaps, setTotalHotlaps] = useState(0);
  const [loadingHotlaps, setLoadingHotlaps] = useState(false);
  const HOTLAPS_PER_PAGE = 10;

  // STATE UNTUK TRACK VETERANS (MILEAGE LEADERBOARD)
  const [trackStats, setTrackStats] = useState<any[]>([]);
  const [statsPage, setStatsPage] = useState(1);
  const [totalStats, setTotalStats] = useState(0);
  const [loadingStats, setLoadingStats] = useState(false);
  const STATS_PER_PAGE = 10;

  // ================= UTILS =================
  const formatLapTime = (timeInMs: number) => {
    if (!timeInMs) return '--:--.---';
    const minutes = Math.floor(timeInMs / 60000);
    const seconds = Math.floor((timeInMs % 60000) / 1000);
    const milliseconds = timeInMs % 1000;
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  const getPaginationClass = (isDisabled: boolean) => {
    const baseClass = 'p-2 rounded-lg border transition-colors';
    const disabledClass =
      'border-[var(--card-border)] text-[var(--card-border)] cursor-not-allowed';
    const activeClass =
      'border-[var(--card-border)] text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)] bg-[var(--background)]';
    return `${baseClass} ${isDisabled ? disabledClass : activeClass}`;
  };

  // ================= FETCH TRACK & EVENTS =================
  useEffect(() => {
    async function fetchAllData() {
      if (!uri) return;

      const { data: trackData, error: trackError } = await supabase
        .from('tracks')
        .select('*')
        .eq('uri', uri)
        .single();

      const { data: serverData } = await supabase
        .from('servers')
        .select('id, name, max_players, server_tag, is_active, uri')
        .eq('track_id', trackData.id)
        .eq('is_active', true);

      const { data: eventData } = await supabase
        .from('events')
        .select('id, title, event_date, image_url, event_tag, uri')
        .eq('track_id', trackData.id)
        .order('event_date', { ascending: true });

      console.log('Fetched track data:', { trackData, serverData, eventData });

      const { data: carsData } = await supabase
        .from('cars')
        .select('model_key, uri, name, brand, image_url, class');

      if (carsData) {
        setAllCars(carsData);
        const classes = Array.from(
          new Set(carsData.map((c: any) => c.class).filter(Boolean)),
        );
        setAvailableClasses(classes as string[]);
      }
      setCarsLoaded(true);

      if (!trackError && trackData) {
        setTrack(trackData);
        if (serverData) setActiveServers(serverData);

        if (eventData) {
          const now = new Date().getTime();
          const upcoming = eventData.filter(
            (e) => new Date(e.event_date).getTime() >= now,
          );
          const past = eventData
            .filter((e) => new Date(e.event_date).getTime() < now)
            .sort(
              (a, b) =>
                new Date(b.event_date).getTime() -
                new Date(a.event_date).getTime(),
            );

          setUpcomingEvents(upcoming);
          setPastEvents(past);
        }
      }
      setLoading(false);
    }

    fetchAllData();
  }, [uri]);

  useEffect(() => {
    setHotlapPage(1);
  }, [selectedClass]);

  // ================= FETCH HOTLAPS =================
  useEffect(() => {
    async function fetchHotlaps() {
      if (!track || !track.track_model || !carsLoaded) {
        setLoadingHotlaps(false);
        return;
      }
      setLoadingHotlaps(true);
      const from = (hotlapPage - 1) * HOTLAPS_PER_PAGE;
      const to = from + HOTLAPS_PER_PAGE - 1;

      let query = supabase
        .from('hotlap_data')
        .select('*', { count: 'exact' })
        .eq('track_model', track.track_model);

      if (selectedClass !== 'ALL') {
        const validModels = allCars
          .filter((c) => c.class === selectedClass)
          .map((c) => c.model_key);
        if (validModels.length === 0) {
          setHotlaps([]);
          setTotalHotlaps(0);
          setLoadingHotlaps(false);
          return;
        }
        query = query.in('car_model', validModels);
      }

      const { data: hlData, count } = await query
        .order('best_lap', { ascending: true })
        .range(from, to);

      if (hlData && hlData.length > 0) {
        const driverGuids = Array.from(
          new Set(hlData.map((h) => h.driver_guid)),
        );
        const { data: profiles } = await supabase
          .from('profiles')
          .select('steam_guid, username, avatar_url')
          .in('steam_guid', driverGuids);

        const enrichedHotlaps = hlData.map((h) => ({
          ...h,
          profile:
            profiles?.find((p) => p.steam_guid === h.driver_guid) || null,
          car: allCars.find((c) => c.model_key === h.car_model) || null,
        }));

        setHotlaps(enrichedHotlaps);
        if (count !== null) setTotalHotlaps(count);
      } else {
        setHotlaps([]);
        setTotalHotlaps(0);
      }
      setLoadingHotlaps(false);
    }

    fetchHotlaps();
  }, [track, hotlapPage, selectedClass, carsLoaded, allCars]);

  // ================= FETCH TRACK VETERANS (DRIVER STATS) =================
  useEffect(() => {
    async function fetchTrackStats() {
      if (!track || !track.track_model) {
        setLoadingStats(false);
        return;
      }
      setLoadingStats(true);
      const from = (statsPage - 1) * STATS_PER_PAGE;
      const to = from + STATS_PER_PAGE - 1;

      const { data: statsData, count } = await supabase
        .from('driver_track_stats')
        .select('*', { count: 'exact' })
        .eq('track_model', track.track_model)
        .order('total_distance_km', { ascending: false })
        .range(from, to);

      if (statsData && statsData.length > 0) {
        const driverGuids = Array.from(
          new Set(statsData.map((s) => s.driver_guid)),
        );
        const { data: profiles } = await supabase
          .from('profiles')
          .select('steam_guid, username, avatar_url')
          .in('steam_guid', driverGuids);

        const enrichedStats = statsData.map((s) => ({
          ...s,
          profile:
            profiles?.find((p) => p.steam_guid === s.driver_guid) || null,
        }));

        setTrackStats(enrichedStats);
        if (count !== null) setTotalStats(count);
      } else {
        setTrackStats([]);
        setTotalStats(0);
      }
      setLoadingStats(false);
    }

    fetchTrackStats();
  }, [track, statsPage]);

  const totalHistoryPages = Math.ceil(pastEvents.length / itemsPerPage);
  const currentHistoryEvents = pastEvents.slice(
    (historyPage - 1) * itemsPerPage,
    historyPage * itemsPerPage,
  );

  const totalHotlapPages = Math.ceil(totalHotlaps / HOTLAPS_PER_PAGE);
  const totalStatsPages = Math.ceil(totalStats / STATS_PER_PAGE);

  if (loading)
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[var(--background)] transition-colors duration-300 space-y-4">
        <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
        <div className="text-[var(--accent)] font-black uppercase italic tracking-widest text-sm">
          Loading Circuit Telemetry...
        </div>
      </div>
    );

  if (!track)
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--background)] text-[var(--foreground)] font-black text-2xl uppercase tracking-widest transition-colors duration-300">
        Circuit Not Found
      </div>
    );

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-20 transition-colors duration-300">
      {/* --- HERO BANNER --- */}
      <div className="relative h-[40vh] md:h-[60vh] overflow-hidden bg-[var(--background)]">
        {track.image_url ? (
          <img
            src={track.image_url}
            className="w-full h-full object-cover opacity-80"
            alt={track.name}
          />
        ) : (
          <div className="w-full h-full bg-[var(--card)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/60 to-transparent" />

        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-blue-600 text-white px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shadow-lg">
                {track.author || 'Official Track'}
              </span>
              <span className="flex items-center gap-1.5 text-blue-500 font-bold uppercase tracking-widest text-xs drop-shadow-md">
                <MapPin size={14} /> {track.city}, {track.country}
              </span>
            </div>
            <h1 className="text-4xl md:text-7xl font-black italic text-[var(--foreground)] uppercase tracking-tighter leading-none mb-6 max-w-4xl drop-shadow-md">
              {track.name}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        <div className="grid lg:grid-cols-3 gap-10 items-start relative">
          {/* --- MAIN CONTENT (LEFT COLUMN) --- */}
          <div className="lg:col-span-2 space-y-12">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[var(--card)] border border-[var(--card-border)] p-5 rounded-2xl flex flex-col justify-center items-center text-center shadow-sm hover:border-[var(--accent)] transition-colors group">
                <span className="text-[10px] text-[var(--muted)] uppercase font-bold tracking-widest mb-1 group-hover:text-[var(--accent)] transition-colors">
                  Length
                </span>
                <span className="text-lg font-black text-[var(--foreground)]">
                  {track.length || 'N/A'}
                </span>
              </div>
              <div className="bg-[var(--card)] border border-[var(--card-border)] p-5 rounded-2xl flex flex-col justify-center items-center text-center shadow-sm hover:border-[var(--accent)] transition-colors group">
                <span className="text-[10px] text-[var(--muted)] uppercase font-bold tracking-widest mb-1 group-hover:text-[var(--accent)] transition-colors">
                  Pitboxes
                </span>
                <span className="text-lg font-black text-[var(--foreground)]">
                  {track.pitboxes || 'N/A'}
                </span>
              </div>
              <div className="bg-[var(--card)] border border-[var(--card-border)] p-5 rounded-2xl flex flex-col justify-center items-center text-center shadow-sm hover:border-[var(--accent)] transition-colors group">
                <span className="text-[10px] text-[var(--muted)] uppercase font-bold tracking-widest mb-1 group-hover:text-[var(--accent)] transition-colors">
                  Direction
                </span>
                <span className="text-lg font-black text-[var(--foreground)] uppercase">
                  {track.run_direction || 'N/A'}
                </span>
              </div>
              <div className="bg-[var(--card)] border border-[var(--card-border)] p-5 rounded-2xl flex flex-col justify-center items-center text-center shadow-sm hover:border-blue-500 transition-colors group">
                <span className="text-[10px] text-[var(--muted)] uppercase font-bold tracking-widest mb-1 group-hover:text-blue-500 transition-colors">
                  Location
                </span>
                <span className="text-lg font-black text-[var(--foreground)] truncate w-full px-2">
                  {track.country || 'N/A'}
                </span>
              </div>
            </div>

            {/* Track Description / Layout Information */}
            {track.description && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Info size={18} className="text-blue-500" />
                  <h3 className="text-lg font-black italic text-[var(--foreground)] uppercase tracking-tighter">
                    Circuit Information
                  </h3>
                </div>
                <div
                  className="bg-[var(--card)] border border-[var(--card-border)] p-8 rounded-[2rem] text-[var(--muted)] text-sm leading-relaxed shadow-sm transition-colors"
                  dangerouslySetInnerHTML={{ __html: track.description }}
                />
              </div>
            )}

            {/* --- UPCOMING EVENTS ON THIS TRACK --- */}
            <div className="pt-8 border-t border-[var(--card-border)]">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 border border-blue-500/20">
                  <Calendar size={24} />
                </div>
                <h2 className="text-2xl font-black italic text-[var(--foreground)] uppercase tracking-tighter">
                  Scheduled Races
                </h2>
              </div>

              {upcomingEvents.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-[var(--card-border)] rounded-3xl bg-[var(--card)]">
                  <Flag
                    className="mx-auto text-[var(--muted)] opacity-50 mb-4"
                    size={40}
                  />
                  <p className="text-sm font-black text-[var(--muted)] uppercase tracking-widest italic">
                    No upcoming events on this circuit.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {upcomingEvents.map((event) => {
                    const eventDate = new Date(event.event_date);
                    const targetSlug = event.uri || event.id;
                    const formattedDate = eventDate.toLocaleDateString(
                      'id-ID',
                      {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      },
                    );

                    return (
                      <Link
                        href={`/events/${targetSlug}`}
                        key={event.id}
                        className="group block"
                      >
                        <div className="bg-[var(--background)] border border-[var(--card-border)] rounded-2xl overflow-hidden hover:border-[var(--accent)] transition-all shadow-sm flex flex-col h-full transform hover:-translate-y-1">
                          <div className="relative h-32 bg-[var(--card)] overflow-hidden">
                            {event.image_url ? (
                              <img
                                src={event.image_url}
                                alt={event.title}
                                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[var(--muted)] font-black italic text-xs">
                                NO COVER
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-transparent to-transparent"></div>
                            {event.event_tag && (
                              <div className="absolute top-3 left-3 bg-[var(--accent)] text-white text-[9px] px-2.5 py-1 rounded-md font-black uppercase tracking-widest shadow-lg">
                                {event.event_tag}
                              </div>
                            )}
                          </div>
                          <div className="p-5 flex flex-col flex-grow relative bg-[var(--background)]">
                            <h3 className="font-black text-lg text-[var(--foreground)] group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-[var(--accent)] transition-all leading-tight mb-4">
                              {event.title}
                            </h3>
                            <div className="mt-auto flex items-center justify-between border-t border-[var(--card-border)] pt-4">
                              <div className="flex items-center gap-2 text-[var(--muted)]">
                                <Clock size={14} className="text-blue-500" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">
                                  {formattedDate}
                                </span>
                              </div>
                              <ChevronRight
                                size={16}
                                className="text-[var(--muted)] group-hover:text-[var(--foreground)] transition-colors group-hover:translate-x-1"
                              />
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* --- HOTLAP LEADERBOARD --- */}
            <div className="pt-8 border-t border-[var(--card-border)]">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-500 border border-yellow-500/20 shadow-inner">
                    <Trophy size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black italic text-[var(--foreground)] uppercase tracking-tighter">
                      Track Records
                    </h2>
                    <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">
                      Official Hotlap Leaderboard
                    </p>
                  </div>
                </div>

                {availableClasses.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 md:pb-0">
                    <button
                      onClick={() => setSelectedClass('ALL')}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                        selectedClass === 'ALL'
                          ? 'bg-[var(--accent)] text-white shadow-[0_0_15px_var(--accent-glow)]'
                          : 'bg-[var(--card)] text-[var(--muted)] border border-[var(--card-border)] hover:border-[var(--accent)] hover:text-[var(--foreground)]'
                      }`}
                    >
                      Overall
                    </button>
                    {availableClasses.map((cls) => (
                      <button
                        key={cls}
                        onClick={() => setSelectedClass(cls)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                          selectedClass === cls
                            ? 'bg-[var(--accent)] text-white shadow-[0_0_15px_var(--accent-glow)]'
                            : 'bg-[var(--card)] text-[var(--muted)] border border-[var(--card-border)] hover:border-[var(--accent)] hover:text-[var(--foreground)]'
                        }`}
                      >
                        {cls}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {loadingHotlaps ? (
                <div className="py-12 flex justify-center items-center bg-[var(--card)] rounded-3xl border border-[var(--card-border)]">
                  <div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : !track.track_model ? (
                <div className="py-12 text-center border-2 border-dashed border-[var(--card-border)] rounded-3xl bg-[var(--card)]">
                  <Timer
                    className="mx-auto text-[var(--muted)] opacity-50 mb-4"
                    size={40}
                  />
                  <p className="text-sm font-black text-[var(--muted)] uppercase tracking-widest italic">
                    Data model sirkuit belum dikonfigurasi.
                  </p>
                </div>
              ) : hotlaps.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-[var(--card-border)] rounded-3xl bg-[var(--card)]">
                  <Timer
                    className="mx-auto text-[var(--muted)] opacity-50 mb-4"
                    size={40}
                  />
                  <p className="text-sm font-black text-[var(--muted)] uppercase tracking-widest italic">
                    Belum ada catatan waktu di{' '}
                    {selectedClass === 'ALL'
                      ? 'sirkuit ini'
                      : `kelas ${selectedClass}`}
                    .
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {hotlaps.map((lap, index) => {
                    const globalRank =
                      (hotlapPage - 1) * HOTLAPS_PER_PAGE + index + 1;
                    const isFirst = globalRank === 1;
                    const isSecond = globalRank === 2;
                    const isThird = globalRank === 3;

                    return (
                      <div
                        key={lap.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all ${
                          isFirst
                            ? 'bg-gradient-to-r from-yellow-500/10 to-[var(--background)] border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.15)] transform hover:-translate-y-1'
                            : isSecond
                              ? 'bg-[var(--card)] border-gray-400/50 hover:border-gray-400'
                              : isThird
                                ? 'bg-[var(--card)] border-orange-700/50 hover:border-orange-700/80'
                                : 'bg-[var(--card)] border-[var(--card-border)] hover:border-[var(--accent)]'
                        }`}
                      >
                        <div className="flex items-center gap-4 mb-4 sm:mb-0">
                          <div
                            className={`flex items-center justify-center font-black italic w-10 ${isFirst ? 'text-yellow-500 text-3xl drop-shadow-md' : isSecond ? 'text-gray-400 text-2xl' : isThird ? 'text-orange-700 text-2xl' : 'text-[var(--muted)] text-xl'}`}
                          >
                            #{globalRank}
                          </div>

                          {/* DRIVER INFO: CLICKABLE IF USERNAME EXISTS */}
                          {lap.profile?.username ? (
                            <Link
                              href={`/profile/${lap.profile.username}`}
                              className="flex items-center gap-4 group"
                            >
                              <div className="relative">
                                <img
                                  src={
                                    lap.profile.avatar_url ||
                                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${lap.driver_guid}`
                                  }
                                  alt="Driver"
                                  className={`rounded-xl object-cover border-2 transition-colors ${isFirst ? 'w-14 h-14 border-yellow-500 shadow-md group-hover:border-yellow-400' : 'w-10 h-10 border-[var(--card-border)] group-hover:border-[var(--accent)]'}`}
                                />
                                {isFirst && (
                                  <div className="absolute -top-3 -right-3 bg-yellow-500 text-yellow-950 p-1 rounded-full shadow-lg">
                                    <Crown size={14} className="fill-current" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p
                                  className={`font-black uppercase truncate max-w-[150px] transition-colors ${isFirst ? 'text-lg text-yellow-500 group-hover:text-yellow-400' : 'text-sm text-[var(--foreground)] group-hover:text-[var(--accent)]'}`}
                                >
                                  {lap.profile.username}
                                </p>
                                <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mt-0.5 flex items-center gap-1 group-hover:text-blue-500 transition-colors">
                                  <Server size={10} /> {lap.server_name}
                                </p>
                              </div>
                            </Link>
                          ) : (
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <img
                                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${lap.driver_guid}`}
                                  alt="Driver"
                                  className={`rounded-xl object-cover border-2 ${isFirst ? 'w-14 h-14 border-yellow-500 shadow-md' : 'w-10 h-10 border-[var(--card-border)]'}`}
                                />
                                {isFirst && (
                                  <div className="absolute -top-3 -right-3 bg-yellow-500 text-yellow-950 p-1 rounded-full shadow-lg">
                                    <Crown size={14} className="fill-current" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p
                                  className={`font-black uppercase truncate max-w-[150px] ${isFirst ? 'text-lg text-yellow-500' : 'text-sm text-[var(--foreground)]'}`}
                                >
                                  Unknown Driver
                                </p>
                                <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                  <Server size={10} /> {lap.server_name}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-1/2">
                          <Link
                            href={`/cars/${lap.car?.uri || lap.car_model}`}
                            className="group flex flex-col items-start sm:items-end flex-grow sm:flex-grow-0"
                          >
                            <p className="text-[9px] text-[var(--muted)] font-bold uppercase tracking-widest mb-0.5 group-hover:text-blue-500 transition-colors">
                              {lap.car?.brand || 'Vehicle'}
                            </p>
                            <div className="flex items-center gap-2">
                              {lap.car?.image_url ? (
                                <img
                                  src={lap.car.image_url}
                                  className="w-8 h-4 object-cover rounded shadow-sm opacity-80 group-hover:opacity-100"
                                  alt="car"
                                />
                              ) : (
                                <CarIcon
                                  size={14}
                                  className="text-[var(--muted)]"
                                />
                              )}
                              <p className="text-[11px] font-black text-[var(--foreground)] uppercase group-hover:text-blue-500 transition-colors truncate max-w-[120px]">
                                {lap.car?.name || lap.car_model}
                              </p>
                            </div>
                          </Link>

                          <div
                            className={`px-4 py-2 rounded-xl text-right shrink-0 border ${isFirst ? 'bg-yellow-500 text-yellow-950 border-yellow-400 font-black shadow-inner' : 'bg-[var(--background)] text-[var(--foreground)] border-[var(--card-border)] font-bold'}`}
                          >
                            <p className="text-[10px] uppercase tracking-widest opacity-80 mb-0.5">
                              Best Lap
                            </p>
                            <p className="text-lg tracking-tighter leading-none font-mono">
                              {formatLapTime(lap.best_lap)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {totalHotlapPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--card-border)]">
                      <button
                        onClick={() =>
                          setHotlapPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={hotlapPage === 1}
                        className={getPaginationClass(hotlapPage === 1)}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">
                        Page {hotlapPage} of {totalHotlapPages}
                      </span>
                      <button
                        onClick={() =>
                          setHotlapPage((prev) =>
                            Math.min(prev + 1, totalHotlapPages),
                          )
                        }
                        disabled={hotlapPage === totalHotlapPages}
                        className={getPaginationClass(
                          hotlapPage === totalHotlapPages,
                        )}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* --- TRACK VETERANS (MILEAGE LEADERBOARD) --- */}
            <div className="pt-8 border-t border-[var(--card-border)]">
              <div className="flex items-center justify-between mb-8 gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-500/10 rounded-xl text-[var(--accent)] border border-purple-500/20 shadow-inner">
                    <Route size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black italic text-[var(--foreground)] uppercase tracking-tighter">
                      Track Veterans
                    </h2>
                    <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">
                      Mileage & Laps Completed
                    </p>
                  </div>
                </div>
              </div>

              {loadingStats ? (
                <div className="py-12 flex justify-center items-center bg-[var(--card)] rounded-3xl border border-[var(--card-border)]">
                  <div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : !track.track_model ? (
                <div className="py-12 text-center border-2 border-dashed border-[var(--card-border)] rounded-3xl bg-[var(--card)]">
                  <Route
                    className="mx-auto text-[var(--muted)] opacity-50 mb-4"
                    size={40}
                  />
                  <p className="text-sm font-black text-[var(--muted)] uppercase tracking-widest italic">
                    Data model sirkuit belum dikonfigurasi.
                  </p>
                </div>
              ) : trackStats.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-[var(--card-border)] rounded-3xl bg-[var(--card)]">
                  <Route
                    className="mx-auto text-[var(--muted)] opacity-50 mb-4"
                    size={40}
                  />
                  <p className="text-sm font-black text-[var(--muted)] uppercase tracking-widest italic">
                    Belum ada data jarak tempuh di sirkuit ini.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {trackStats.map((stat, index) => {
                    const globalRank =
                      (statsPage - 1) * STATS_PER_PAGE + index + 1;
                    const isFirst = globalRank === 1;

                    return (
                      <div
                        key={stat.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all ${
                          isFirst
                            ? 'bg-gradient-to-r from-purple-500/10 to-[var(--background)] border-purple-500/50 shadow-[0_0_20px_var(--accent-glow)] transform hover:-translate-y-1'
                            : 'bg-[var(--card)] border-[var(--card-border)] hover:border-[var(--accent)]'
                        }`}
                      >
                        <div className="flex items-center gap-4 mb-4 sm:mb-0">
                          <div
                            className={`flex items-center justify-center font-black italic w-10 ${isFirst ? 'text-[var(--accent)] text-3xl drop-shadow-md' : 'text-[var(--muted)] text-xl'}`}
                          >
                            #{globalRank}
                          </div>

                          {/* VETERANS DRIVER INFO: CLICKABLE IF USERNAME EXISTS */}
                          {stat.profile?.username ? (
                            <Link
                              href={`/profile/${stat.profile.username}`}
                              className="flex items-center gap-4 group"
                            >
                              <div className="relative">
                                <img
                                  src={
                                    stat.profile.avatar_url ||
                                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${stat.driver_guid}`
                                  }
                                  alt="Driver"
                                  className={`rounded-xl object-cover border-2 transition-colors ${isFirst ? 'w-14 h-14 border-[var(--accent)] shadow-md group-hover:border-purple-400' : 'w-10 h-10 border-[var(--card-border)] group-hover:border-[var(--accent)]'}`}
                                />
                                {isFirst && (
                                  <div className="absolute -top-3 -right-3 bg-[var(--accent)] text-white p-1 rounded-full shadow-lg">
                                    <Medal size={14} />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p
                                  className={`font-black uppercase truncate max-w-[150px] transition-colors ${isFirst ? 'text-lg text-[var(--accent)] group-hover:text-purple-400' : 'text-sm text-[var(--foreground)] group-hover:text-[var(--accent)]'}`}
                                >
                                  {stat.profile.username}
                                </p>
                                <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mt-0.5 group-hover:text-blue-500 transition-colors">
                                  Nismara Racing Driver
                                </p>
                              </div>
                            </Link>
                          ) : (
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <img
                                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${stat.driver_guid}`}
                                  alt="Driver"
                                  className={`rounded-xl object-cover border-2 ${isFirst ? 'w-14 h-14 border-[var(--accent)] shadow-md' : 'w-10 h-10 border-[var(--card-border)]'}`}
                                />
                                {isFirst && (
                                  <div className="absolute -top-3 -right-3 bg-[var(--accent)] text-white p-1 rounded-full shadow-lg">
                                    <Medal size={14} />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p
                                  className={`font-black uppercase truncate max-w-[150px] ${isFirst ? 'text-lg text-[var(--accent)]' : 'text-sm text-[var(--foreground)]'}`}
                                >
                                  Unknown Driver
                                </p>
                                <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mt-0.5">
                                  Nismara Racing Driver
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
                          <div className="text-right">
                            <p className="text-[9px] text-[var(--muted)] font-bold uppercase tracking-widest mb-0.5">
                              Laps Driven
                            </p>
                            <p
                              className={`text-lg font-black tracking-tighter leading-none ${isFirst ? 'text-[var(--foreground)]' : 'text-[var(--foreground)]'}`}
                            >
                              {stat.total_laps?.toLocaleString() || 0}
                            </p>
                          </div>

                          <div
                            className={`px-4 py-2 rounded-xl text-right shrink-0 border ${isFirst ? 'bg-[var(--accent)] text-white border-purple-400 font-black shadow-inner' : 'bg-[var(--background)] text-[var(--foreground)] border-[var(--card-border)] font-bold'}`}
                          >
                            <p className="text-[10px] uppercase tracking-widest opacity-80 mb-0.5">
                              Distance
                            </p>
                            <p className="text-lg tracking-tighter leading-none font-mono">
                              {stat.total_distance_km?.toFixed(1) || '0.0'}{' '}
                              <span className="text-[10px]">KM</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {totalStatsPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--card-border)]">
                      <button
                        onClick={() =>
                          setStatsPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={statsPage === 1}
                        className={getPaginationClass(statsPage === 1)}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">
                        Page {statsPage} of {totalStatsPages}
                      </span>
                      <button
                        onClick={() =>
                          setStatsPage((prev) =>
                            Math.min(prev + 1, totalStatsPages),
                          )
                        }
                        disabled={statsPage === totalStatsPages}
                        className={getPaginationClass(
                          statsPage === totalStatsPages,
                        )}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* --- SIDEBAR (RIGHT COLUMN) --- */}
          <div className="lg:col-span-1 space-y-8 sticky top-32">
            {/* 1. AUTHOR / CREATOR WIDGET */}
            {track.author && (
              <div className="bg-[var(--card)] border border-[var(--card-border)] p-6 rounded-[2rem] shadow-md transition-colors">
                <h3 className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest flex items-center gap-2 mb-5">
                  <User size={14} className="text-[var(--accent)]" /> Track
                  Creator
                </h3>
                {track.author_url ? (
                  <a
                    href={track.author_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 group"
                  >
                    <img
                      src={
                        track.author_img ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${track.author}`
                      }
                      alt={track.author}
                      className="w-14 h-14 rounded-full object-cover border border-[var(--card-border)] group-hover:border-[var(--accent)] transition-colors shadow-sm"
                    />
                    <div>
                      <p className="text-base font-black text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                        {track.author}
                      </p>
                      <p className="text-[10px] text-[var(--muted)] font-bold tracking-widest uppercase flex items-center gap-1 mt-1 group-hover:text-blue-500 transition-colors">
                        Visit Profile <ExternalLink size={10} />
                      </p>
                    </div>
                  </a>
                ) : (
                  <div className="flex items-center gap-4">
                    <img
                      src={
                        track.author_img ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${track.author}`
                      }
                      alt={track.author}
                      className="w-14 h-14 rounded-full object-cover border border-[var(--card-border)] shadow-sm"
                    />
                    <div>
                      <p className="text-base font-black text-[var(--foreground)]">
                        {track.author}
                      </p>
                      <p className="text-[10px] text-[var(--muted)] font-bold tracking-widest uppercase mt-1">
                        Community Modder
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. DOWNLOAD TRACK WIDGET */}
            {track.download_url && (
              <div className="bg-[var(--card)] border border-[var(--card-border)] p-6 rounded-[2rem] shadow-md transition-colors">
                <h3 className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Download size={14} className="text-[var(--accent)]" />{' '}
                  Download Circuit
                </h3>
                <p className="text-[10px] text-[var(--muted)] leading-relaxed mb-4 italic font-medium">
                  Unduh sirkuit ini untuk berlatih secara offline atau membalap
                  di komunitas server publik.
                </p>
                <a
                  href={track.download_url}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-blue-600 to-[var(--accent)] hover:opacity-90 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_var(--accent-glow)] active:scale-[0.98]"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download size={14} /> Download Map
                </a>
              </div>
            )}

            {/* 3. ACTIVE SERVERS WIDGET */}
            <div className="bg-[var(--card)] border border-[var(--card-border)] p-6 md:p-8 rounded-[2rem] shadow-md transition-colors">
              <h3 className="text-xl font-black italic uppercase tracking-tighter mb-6 flex items-center gap-3 text-[var(--foreground)]">
                <Server className="text-green-500" size={24} /> Live Servers
              </h3>
              {activeServers.length === 0 ? (
                <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">
                  No active servers currently running this track.
                </p>
              ) : (
                <div className="space-y-4">
                  {activeServers.map((server) => (
                    <Link
                      href={`/servers/${server.uri || '#'}`}
                      key={server.id}
                      className="group block"
                    >
                      <div className="flex items-center justify-between p-4 bg-[var(--background)] border border-[var(--card-border)] rounded-xl hover:border-green-500 transition-colors shadow-sm">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-[var(--muted)] mb-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            {server.server_tag || 'Global'}
                          </p>
                          <p className="text-sm font-black uppercase text-[var(--foreground)] group-hover:text-green-500 transition-colors truncate max-w-[150px]">
                            {server.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-1">
                            Slots
                          </p>
                          <p className="text-sm font-black text-[var(--foreground)]">
                            {server.max_players || '-'}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* 4. EVENT HISTORY WIDGET */}
            <div className="bg-[var(--card)] border border-[var(--card-border)] p-6 md:p-8 rounded-[2rem] shadow-md transition-colors">
              <h3 className="text-xl font-black italic uppercase tracking-tighter mb-6 flex items-center gap-3 text-[var(--foreground)]">
                <Flag className="text-[var(--muted)]" size={24} /> Track History
              </h3>
              <div className="relative">
                <div className="space-y-3 min-h-[220px]">
                  {pastEvents.length === 0 ? (
                    <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest pt-4">
                      No past events recorded on this track.
                    </p>
                  ) : (
                    currentHistoryEvents.map((event) => {
                      const eventDate = new Date(event.event_date);
                      const formattedDate = eventDate.toLocaleDateString(
                        'en-US',
                        { month: 'short', day: 'numeric', year: 'numeric' },
                      );
                      return (
                        <Link
                          href={`/events/${event.uri}`}
                          key={event.id}
                          className="block p-4 bg-[var(--background)] rounded-xl border border-[var(--card-border)] hover:bg-[var(--card)] hover:border-[var(--accent)] hover:shadow-sm transition cursor-pointer group"
                        >
                          {event.event_tag && (
                            <span className="inline-block text-[8px] text-[var(--accent)] border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-1.5 py-0.5 rounded mb-2 font-black uppercase tracking-wider">
                              {event.event_tag}
                            </span>
                          )}
                          <h5 className="text-sm font-black text-[var(--foreground)] group-hover:text-[var(--accent)] transition leading-tight mb-2">
                            {event.title}
                          </h5>
                          <p className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <Calendar size={12} /> {formattedDate}
                          </p>
                        </Link>
                      );
                    })
                  )}
                </div>

                {/* PAGINATION CONTROLS HISTORY */}
                {totalHistoryPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--card-border)]">
                    <button
                      onClick={() =>
                        setHistoryPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={historyPage === 1}
                      className={getPaginationClass(historyPage === 1)}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">
                      Page {historyPage} of {totalHistoryPages}
                    </span>
                    <button
                      onClick={() =>
                        setHistoryPage((prev) =>
                          Math.min(prev + 1, totalHistoryPages),
                        )
                      }
                      disabled={historyPage === totalHistoryPages}
                      className={getPaginationClass(
                        historyPage === totalHistoryPages,
                      )}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
