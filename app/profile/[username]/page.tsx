'use client';

// 1. Tambahkan import `use` dari 'react'
import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy,
  ShieldCheck,
  Activity,
  Medal,
  ChevronRight,
  Settings,
  Car as CarIcon,
  Calendar,
  Flag,
  Map as MapIcon,
  TrendingUp,
  ChevronLeft,
  AlertTriangle,
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

// 2. Ubah tipe params menjadi Promise
export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const router = useRouter();

  // 3. Unwrap (buka) params menggunakan `use()`
  const resolvedParams = use(params);
  const currentUsername = resolvedParams.username;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  const [isOwner, setIsOwner] = useState(false);

  const [srHistory, setSrHistory] = useState<any[]>([]);
  const [eventAttendance, setEventAttendance] = useState<any[]>([]);
  const [carAffinity, setCarAffinity] = useState<any[]>([]);
  const [trackRecords, setTrackRecords] = useState<any[]>([]);
  const [careerStats, setCareerStats] = useState({
    starts: 0,
    wins: 0,
    podiums: 0,
  });

  // --- PAGINATION STATES ---
  const [carPage, setCarPage] = useState(1);
  const [trackPage, setTrackPage] = useState(1);
  const [eventPage, setEventPage] = useState(1);
  const [logPage, setLogPage] = useState(1);

  const ITEMS_PER_PAGE_CARS = 6;
  const ITEMS_PER_PAGE_TRACKS = 4;
  const ITEMS_PER_PAGE_EVENTS = 5;
  const ITEMS_PER_PAGE_LOGS = 5;

  useEffect(() => {
    fetchCompleteProfile();
    // 4. Gunakan currentUsername yang sudah di-unwrap pada dependency array
  }, [currentUsername]);

  async function fetchCompleteProfile() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // 5. Gunakan currentUsername pada query Supabase
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', currentUsername)
        .single();

      if (profileError || !profileData) {
        router.push('/');
        return;
      }

      setProfile(profileData);

      if (session?.user?.id === profileData.id) {
        setIsOwner(true);
      }

      const [{ data: carsDB }, { data: tracksDB }] = await Promise.all([
        supabase.from('cars').select('id, name, image_url, model_key, class'),
        supabase.from('tracks').select('id, name, image_url, track_model'),
      ]);

      const { data: statsData } = await supabase
        .from('event_driver_stats')
        .select('*, events(id, title, event_date)')
        .eq('user_id', profileData.id)
        .order('created_at', { ascending: false });

      if (statsData) setSrHistory(statsData);

      const { data: allEvents } = await supabase
        .from('events')
        .select('*, tracks(*)');

      if (allEvents && profileData.steam_guid) {
        const steamId = profileData.steam_guid;
        const attended: any[] = [];
        const carsMap: Record<string, any> = {};
        const recordsMap: Record<string, any> = {};
        let totalWins = 0;
        let totalPodiums = 0;

        allEvents.forEach((ev) => {
          let hasParticipated = false;
          if (!ev.results) return;

          ev.results.forEach((session: any) => {
            const finishPos = session.url.Result?.findIndex(
              (r: any) => r.DriverGuid === steamId,
            );

            if (finishPos !== -1) {
              hasParticipated = true;
              const res = session.url.Result[finishPos];
              const isRace = session.session.toLowerCase().includes('race');

              if (isRace) {
                if (finishPos === 0) totalWins++;
                if (finishPos <= 2) totalPodiums++;
              }

              const cKey = res.CarModel;
              if (!carsMap[cKey]) {
                const dbCar = carsDB?.find((c) => c.model_key === cKey);
                carsMap[cKey] = {
                  count: 0,
                  name: dbCar?.name || cKey,
                  img: dbCar?.image_url,
                  id: dbCar?.id,
                  carClass: dbCar?.class,
                };
              }
              carsMap[cKey].count++;

              const track = ev.tracks;
              if (track && res.BestLap > 0) {
                if (
                  !recordsMap[track.id] ||
                  res.BestLap < recordsMap[track.id].time
                ) {
                  recordsMap[track.id] = {
                    time: res.BestLap,
                    trackName: track.name,
                    img: track.image_url,
                    car: carsMap[cKey].name,
                    id: track.id,
                  };
                }
              }
            }
          });

          if (hasParticipated) {
            const isRanked = statsData?.some((s) => s.event_id === ev.id);
            attended.push({ ...ev, isRanked });
          }
        });

        setEventAttendance(
          attended.sort(
            (a, b) =>
              new Date(b.event_date).getTime() -
              new Date(a.event_date).getTime(),
          ),
        );
        setCareerStats({
          starts: attended.length,
          wins: totalWins,
          podiums: totalPodiums,
        });
        setCarAffinity(
          Object.values(carsMap).sort((a, b) => b.count - a.count),
        );
        setTrackRecords(Object.values(recordsMap));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-purple-500"></div>
      </div>
    );

  const rank = getRankDetails(profile?.safety_rating || 0);
  const xpInLevel = (profile?.total_xp || 0) % 1000;
  const xpPercentage = (xpInLevel / 1000) * 100;

  const paginatedCars = carAffinity.slice(
    (carPage - 1) * ITEMS_PER_PAGE_CARS,
    carPage * ITEMS_PER_PAGE_CARS,
  );
  const paginatedTracks = trackRecords.slice(
    (trackPage - 1) * ITEMS_PER_PAGE_TRACKS,
    trackPage * ITEMS_PER_PAGE_TRACKS,
  );
  const paginatedEvents = eventAttendance.slice(
    (eventPage - 1) * ITEMS_PER_PAGE_EVENTS,
    eventPage * ITEMS_PER_PAGE_EVENTS,
  );
  const paginatedLogs = srHistory.slice(
    (logPage - 1) * ITEMS_PER_PAGE_LOGS,
    logPage * ITEMS_PER_PAGE_LOGS,
  );

  return (
    <div className="min-h-screen text-white font-sans pb-24">
      {/* --- HEADER --- */}
      <section className="relative pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-10 items-center md:items-start">
          <div className="w-44 h-44 rounded-[3rem] overflow-hidden border-2 border-white/10 ring-8 ring-purple-600/10 shadow-2xl shrink-0">
            <img
              src={
                profile?.avatar_url ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username}`
              }
              className="w-full h-full object-cover"
              alt=""
            />
          </div>

          <div className="flex-1 text-center md:text-left pt-2 w-full">
            <div className="flex flex-col md:flex-row md:items-center gap-5 mb-8">
              <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter italic break-all">
                {profile?.display_name || profile?.username}
              </h1>
              <div
                className={`px-6 py-2 rounded-xl text-xs font-black border ${rank.border} ${rank.bg} ${rank.color} tracking-[0.3em] backdrop-blur-md self-center md:self-start mt-2 md:mt-0`}
              >
                {rank.label} CLASS
              </div>
            </div>

            <div className="w-full max-w-xl bg-white/5 p-6 rounded-[2.5rem] border border-white/10 backdrop-blur-md relative overflow-hidden mx-auto md:mx-0">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-[10px] font-black uppercase text-purple-400 tracking-widest mb-1">
                    Driver Progression
                  </p>
                  <h3 className="text-2xl font-black italic uppercase">
                    Level {profile?.driver_level || 1}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black italic text-blue-400">
                    {profile?.total_xp || 0}{' '}
                    <span className="text-[10px] text-gray-500 not-italic uppercase">
                      Total XP
                    </span>
                  </p>
                </div>
              </div>
              <div className="h-5 w-full bg-black/40 rounded-full p-[4px] border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 via-lilac-400 to-blue-500 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.6)]"
                  style={{
                    width: `${Math.min(100, Math.max(0, xpPercentage))}%`,
                  }}
                ></div>
              </div>
              <p className="text-[9px] mt-3 font-bold text-gray-500 uppercase tracking-widest text-center">
                {1000 - xpInLevel} XP remaining to next level
              </p>
            </div>
          </div>

          {isOwner && (
            <Link
              href="/profile/settings"
              className="p-4 bg-white/5 hover:bg-purple-600/20 rounded-2xl border border-white/10 transition-all self-center md:self-start shrink-0"
            >
              <Settings size={24} className="text-purple-300" />
            </Link>
          )}
        </div>
      </section>

      {!profile?.steam_guid && isOwner && (
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <div className="bg-orange-500/10 border border-orange-500/20 p-5 rounded-[2rem] flex flex-col md:flex-row items-center gap-5 backdrop-blur-md shadow-lg">
            <div className="p-3 bg-orange-500/20 rounded-2xl shrink-0">
              <AlertTriangle className="text-orange-500" size={28} />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h4 className="text-sm font-black text-orange-400 uppercase tracking-widest">
                Steam GUID Belum Terhubung
              </h4>
              <p className="text-[11px] text-orange-300/80 font-bold mt-1 max-w-2xl">
                Sistem tidak dapat melacak partisipasi event, kemenangan, maupun
                waktu putaranmu. Hubungkan Steam GUID kamu sekarang agar
                statistik balapanmu muncul di profil ini.
              </p>
            </div>
            <Link
              href="/profile/settings"
              className="bg-orange-500 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-600 hover:scale-105 active:scale-95 transition-all whitespace-nowrap shadow-lg shadow-orange-500/20 shrink-0"
            >
              Atur Steam GUID
            </Link>
          </div>
        </div>
      )}

      <section className="px-6 mb-20">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard
            icon={<ShieldCheck size={24} />}
            label="Safety Rating"
            value={(profile?.safety_rating || 0).toFixed(2)}
            color="text-purple-400"
          />
          <StatCard
            icon={<Flag size={24} />}
            label="Starts"
            value={careerStats.starts}
            color="text-zinc-400"
          />
          <StatCard
            icon={<Trophy size={24} />}
            label="Wins (P1)"
            value={careerStats.wins}
            color="text-yellow-400"
            highlight
          />
          <StatCard
            icon={<Medal size={24} />}
            label="Podiums (P2/3)"
            value={careerStats.podiums}
            color="text-blue-400"
          />
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 space-y-24 mb-24">
        {carAffinity.length > 0 && (
          <section>
            <SectionTitle icon={<CarIcon size={24} />} title="Car Affinity" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
              {paginatedCars.map((car, i) => (
                <Link
                  key={i}
                  href={car.id ? `/cars/${car.id}` : '#'}
                  className="group bg-[#120821]/40 border border-white/10 rounded-[3rem] overflow-hidden hover:border-purple-500/50 transition-all shadow-xl"
                >
                  <div className="h-52 bg-zinc-900 overflow-hidden relative">
                    <img
                      src={car.img || '/car-placeholder.png'}
                      className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700"
                      alt=""
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#120821] to-transparent opacity-60"></div>
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm border border-white/10 px-3 py-1 rounded-full text-[9px] font-black tracking-widest text-white uppercase">
                      {car.carClass || 'UNKNOWN'}
                    </div>
                  </div>
                  <div className="p-8 flex justify-between items-end relative -mt-10">
                    <div className="max-w-[60%]">
                      <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">
                        Most Used
                      </p>
                      <h4 className="text-lg font-black italic uppercase truncate">
                        {car.name}
                      </h4>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black italic text-blue-300">
                        {car.count}
                      </p>
                      <p className="text-[8px] font-bold text-gray-500 uppercase">
                        Sessions
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <PaginationControl
              currentPage={carPage}
              totalItems={carAffinity.length}
              itemsPerPage={ITEMS_PER_PAGE_CARS}
              onPageChange={setCarPage}
            />
          </section>
        )}

        {trackRecords.length > 0 && (
          <section>
            <SectionTitle
              icon={<MapIcon size={24} />}
              title="Circuit Records"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
              {paginatedTracks.map((tr, i) => (
                <Link
                  key={i}
                  href={`/tracks/${tr.id}`}
                  className="group relative h-64 rounded-[3.5rem] overflow-hidden border border-white/5 hover:border-blue-500/50 transition-all shadow-2xl"
                >
                  <img
                    src={tr.img || '/track-placeholder.jpg'}
                    className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-all duration-700"
                    alt=""
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/40 to-transparent"></div>
                  <div className="relative h-full p-10 flex flex-col justify-end">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-2">
                      {tr.trackName}
                    </p>
                    <div className="flex justify-between items-end">
                      <h4 className="text-5xl font-black italic tracking-tighter">
                        {formatTime(tr.time)}
                      </h4>
                      <span className="text-[10px] font-bold text-white/40 uppercase italic max-w-[40%] text-right truncate">
                        Using {tr.car}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <PaginationControl
              currentPage={trackPage}
              totalItems={trackRecords.length}
              itemsPerPage={ITEMS_PER_PAGE_TRACKS}
              onPageChange={setTrackPage}
            />
          </section>
        )}

        {(eventAttendance.length > 0 || srHistory.length > 0) && (
          <section className="space-y-16">
            {eventAttendance.length > 0 && (
              <div>
                <SectionTitle
                  icon={<Calendar size={24} />}
                  title="Event Participation"
                />
                <div className="grid gap-4 mt-8">
                  {paginatedEvents.map((ev) => (
                    <Link
                      key={ev.id}
                      href={`/events/${ev.id}`}
                      className="group flex flex-col md:flex-row items-start md:items-center gap-6 p-6 bg-white/5 border border-white/5 rounded-[2rem] hover:bg-purple-600/10 hover:border-purple-500/40 transition-all"
                    >
                      <div className="flex items-center gap-6 w-full">
                        <img
                          src={ev.image_url || '/placeholder.jpg'}
                          className="w-24 h-14 object-cover rounded-xl"
                          alt=""
                        />
                        <div className="flex-1">
                          <h4 className="text-lg font-black italic uppercase group-hover:text-purple-400 transition truncate">
                            {ev.title}
                          </h4>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                            {new Date(ev.event_date).toLocaleDateString(
                              'id-ID',
                              {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              },
                            )}
                          </p>
                        </div>
                        <div
                          className={`hidden md:block px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${ev.isRanked ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-white/5 text-gray-500 border border-white/10'}`}
                        >
                          {ev.isRanked ? 'RANKED' : 'UNRANKED / PENDING'}
                        </div>
                        <ChevronRight className="text-gray-800 group-hover:text-white hidden md:block" />
                      </div>
                      <div
                        className={`md:hidden px-4 py-1.5 w-full text-center rounded-xl text-[9px] font-black uppercase tracking-widest mt-2 ${ev.isRanked ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-white/5 text-gray-500 border border-white/10'}`}
                      >
                        {ev.isRanked ? 'RANKED' : 'UNRANKED / PENDING'}
                      </div>
                    </Link>
                  ))}
                </div>
                <PaginationControl
                  currentPage={eventPage}
                  totalItems={eventAttendance.length}
                  itemsPerPage={ITEMS_PER_PAGE_EVENTS}
                  onPageChange={setEventPage}
                />
              </div>
            )}

            {srHistory.length > 0 && (
              <div>
                <SectionTitle
                  icon={<TrendingUp size={24} />}
                  title="Detailed Safety Log"
                />
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-md mt-8 overflow-x-auto">
                  <table className="w-full text-left min-w-[600px]">
                    <thead className="bg-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-purple-300/50">
                      <tr>
                        <th className="px-10 py-7">Event</th>
                        <th className="px-6 py-7 text-center">
                          Incidents (Cuts/Coll)
                        </th>
                        <th className="px-6 py-7 text-center">SR Change</th>
                        <th className="px-10 py-7 text-right">XP Gained</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {paginatedLogs.map((log) => (
                        <tr
                          key={log.id}
                          className="hover:bg-white/[0.02] transition"
                        >
                          <td className="px-10 py-7">
                            <Link
                              href={`/events/${log.events?.id}`}
                              className="text-sm font-black italic uppercase hover:text-purple-400 transition"
                            >
                              {log.events?.title}
                            </Link>
                          </td>
                          <td className="px-6 py-7">
                            <div className="flex justify-center gap-6 text-[11px] font-black">
                              <span className="text-yellow-500">
                                C: {log.cuts}
                              </span>
                              <span className="text-orange-500">
                                X: {log.collisions}
                              </span>
                            </div>
                          </td>
                          <td
                            className={`px-6 py-7 text-center font-black italic text-base ${log.sr_change >= 0 ? 'text-green-400' : 'text-red-400'}`}
                          >
                            {log.sr_change >= 0 ? '+' : ''}
                            {log.sr_change.toFixed(2)}
                          </td>
                          <td className="px-10 py-7 text-right text-blue-400 font-black">
                            +{log.xp_gained} XP
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <PaginationControl
                  currentPage={logPage}
                  totalItems={srHistory.length}
                  itemsPerPage={ITEMS_PER_PAGE_LOGS}
                  onPageChange={setLogPage}
                />
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

// --- SUBCOMPONENTS ---

function StatCard({ icon, label, value, color, highlight }: any) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center bg-[#120821]/60 backdrop-blur-2xl border ${highlight ? 'border-yellow-500/40 shadow-[0_0_30px_rgba(234,179,8,0.15)]' : 'border-white/10'} p-6 md:p-8 rounded-[3rem] transition-all`}
    >
      <div
        className={`flex flex-col md:flex-row items-center gap-2 mb-3 md:mb-5 ${color}`}
      >
        {icon}{' '}
        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
          {label}
        </span>
      </div>
      <div className="w-full flex justify-center items-center">
        <h2
          className={`text-4xl md:text-5xl font-black italic tracking-tighter break-all md:break-words ${highlight ? 'text-yellow-400' : 'text-white'}`}
        >
          {value}
        </h2>
      </div>
    </div>
  );
}

function SectionTitle({ icon, title }: any) {
  return (
    <div className="flex items-center gap-4 md:gap-5 border-b border-white/10 pb-4 md:pb-6">
      <div className="p-2 md:p-3 bg-purple-500/10 rounded-2xl text-purple-400">
        {icon}
      </div>
      <h3 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter">
        {title}
      </h3>
    </div>
  );
}

function PaginationControl({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}: any) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-6 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-purple-600/30 hover:border-purple-500/50 transition-all disabled:opacity-20 disabled:hover:bg-white/5"
      >
        <ChevronLeft size={20} />
      </button>
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
        Page <span className="text-white">{currentPage}</span> of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-purple-600/30 hover:border-purple-500/50 transition-all disabled:opacity-20 disabled:hover:bg-white/5"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}

function formatTime(ms: number) {
  if (!ms || ms <= 0) return '--:--.---';
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(3);
  return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
}
