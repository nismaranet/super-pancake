'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function CircuitDetailPage() {
  const params = useParams();
  const trackId = params.id as string;

  // ================= STATES =================
  const [track, setTrack] = useState<any>(null);
  const [activeServers, setActiveServers] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [pastEvents, setPastEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // STATE UNTUK PAGINASI HISTORY
  const [historyPage, setHistoryPage] = useState(1);
  const itemsPerPage = 3; // Batas jumlah event history per halaman

  useEffect(() => {
    async function fetchAllData() {
      if (!trackId) return;

      // 1. Ambil data sirkuit
      const { data: trackData, error: trackError } = await supabase
        .from('tracks')
        .select('*')
        .eq('id', trackId)
        .single();

      // 2. Ambil data server yang menggunakan sirkuit ini
      const { data: serverData } = await supabase
        .from('servers')
        .select('id, name, max_players, server_tag, join_link')
        .eq('track_id', trackId);

      // 3. Ambil data event yang akan diselenggarakan di sirkuit ini
      const { data: eventData } = await supabase
        .from('events')
        .select('id, title, event_date, event_tag')
        .eq('track_id', trackId);

      if (!trackError && trackData) {
        setTrack(trackData);
      }

      if (serverData) setActiveServers(serverData);

      // LOGIKA PEMISAHAN EVENT (UPCOMING vs HISTORY)
      if (eventData) {
        const now = new Date().getTime();

        const upcoming = eventData
          .filter(
            (e) => e.event_date && new Date(e.event_date).getTime() >= now,
          )
          .sort(
            (a, b) =>
              new Date(a.event_date).getTime() -
              new Date(b.event_date).getTime(),
          );

        const past = eventData
          .filter((e) => e.event_date && new Date(e.event_date).getTime() < now)
          .sort(
            (a, b) =>
              new Date(b.event_date).getTime() -
              new Date(a.event_date).getTime(),
          );

        setUpcomingEvents(upcoming);
        setPastEvents(past);
      }

      setLoading(false);
    }

    fetchAllData();
  }, [trackId]);

  // KALKULASI PAGINASI
  const totalHistoryPages = Math.ceil(pastEvents.length / itemsPerPage);
  const currentPastEvents = pastEvents.slice(
    (historyPage - 1) * itemsPerPage,
    historyPage * itemsPerPage,
  );

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-purple-500 animate-pulse font-bold italic uppercase tracking-widest">
        Loading Circuit Data...
      </div>
    );
  if (!track)
    return (
      <div className="min-h-screen flex items-center justify-center text-white font-bold text-2xl">
        Circuit not found.
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER & HERO SECTION */}
        <div className="relative aspect-[21/9] bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 shadow-2xl">
          {track.image_url ? (
            <img
              src={track.image_url}
              alt={track.name}
              className="w-full h-full object-cover opacity-60"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-700 text-xl font-bold">
              MAP PREVIEW UNAVAILABLE
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/60 to-transparent"></div>

          <div className="absolute bottom-0 left-0 p-8 md:p-12">
            <p className="text-purple-500 font-bold uppercase tracking-widest text-sm mb-2 drop-shadow-md">
              📍 {track.city}, {track.country}
            </p>
            <h1 className="text-4xl md:text-6xl font-black italic text-white uppercase tracking-tighter drop-shadow-xl">
              {track.name}
            </h1>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* KOLOM KIRI: Informasi, Download, & History Event */}
          <div className="lg:col-span-2 space-y-8">
            {/* Spesifikasi Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl text-center shadow-inner">
                <span className="block text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">
                  Length
                </span>
                <span className="text-lg font-black text-white">
                  {track.length || '-'}
                </span>
              </div>
              <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl text-center shadow-inner">
                <span className="block text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">
                  Width
                </span>
                <span className="text-lg font-black text-white">
                  {track.width || '-'}
                </span>
              </div>
              <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl text-center shadow-inner">
                <span className="block text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">
                  Pitboxes
                </span>
                <span className="text-lg font-black text-white">
                  {track.pitboxes || '-'}
                </span>
              </div>
              <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl text-center shadow-inner">
                <span className="block text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">
                  Direction
                </span>
                <span className="text-lg font-black text-white uppercase">
                  {track.run_direction || '-'}
                </span>
              </div>
            </div>

            {/* Deskripsi dari JSON */}
            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-lg">
              <h3 className="text-xs uppercase text-purple-500 font-bold tracking-widest mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                About The Circuit
              </h3>
              {track.description ? (
                <div
                  className="text-gray-400 text-sm leading-relaxed space-y-4"
                  dangerouslySetInnerHTML={{ __html: track.description }}
                />
              ) : (
                <p className="text-gray-600 italic text-sm">
                  No description available for this circuit.
                </p>
              )}
            </div>

            {/* Tombol Download */}
            {track.download_url && (
              <a
                href={track.download_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(234,88,12,0.3)] active:scale-[0.98]"
              >
                Download Track Mod
              </a>
            )}

            {/* DAFTAR EVENT SELESAI (HISTORY) - DIPINDAH KE KIRI & DIBERI PAGINASI */}
            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-800">
                <h3 className="text-sm font-black italic text-gray-400 uppercase tracking-wider">
                  🏁 Event History
                </h3>
                <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-1 rounded font-bold uppercase tracking-widest">
                  Total: {pastEvents.length} Events
                </span>
              </div>

              <div className="space-y-4">
                {pastEvents.length === 0 ? (
                  <div className="p-6 border border-dashed border-gray-800/50 rounded-xl text-center">
                    <p className="text-gray-700 text-xs font-bold italic">
                      No past events recorded
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-3">
                      {currentPastEvents.map((event) => {
                        const eventDate = new Date(event.event_date);
                        const formattedDate = eventDate.toLocaleDateString(
                          'en-US',
                          { day: 'numeric', month: 'short', year: 'numeric' },
                        );

                        return (
                          <Link
                            href={`/events/${event.id}`}
                            key={event.id}
                            className="block p-4 bg-gray-800/30 rounded-xl border border-gray-700/50 opacity-80 hover:opacity-100 hover:border-gray-500 transition group"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                {event.event_tag && (
                                  <span className="inline-block text-[8px] text-gray-500 border border-gray-600 px-1.5 py-0.5 rounded mb-2 font-bold uppercase tracking-wider">
                                    {event.event_tag}
                                  </span>
                                )}
                                <h5 className="text-sm font-bold text-gray-400 group-hover:text-gray-200 transition leading-tight mb-2">
                                  {event.title}
                                </h5>
                                <p className="text-[10px] text-gray-600 flex items-center gap-1.5 font-bold">
                                  🏁 Finished • {formattedDate}
                                </p>
                              </div>
                              <span className="text-gray-600 group-hover:text-gray-400 transition text-xs mt-1">
                                View Details →
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>

                    {/* Kontrol Paginasi (Hanya muncul jika lebih dari 1 halaman) */}
                    {totalHistoryPages > 1 && (
                      <div className="flex items-center justify-between pt-4 mt-2">
                        <button
                          onClick={() =>
                            setHistoryPage((prev) => Math.max(1, prev - 1))
                          }
                          disabled={historyPage === 1}
                          className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                          Previous
                        </button>
                        <span className="text-[10px] text-gray-500 font-bold tracking-widest">
                          PAGE {historyPage} OF {totalHistoryPages}
                        </span>
                        <button
                          onClick={() =>
                            setHistoryPage((prev) =>
                              Math.min(totalHistoryPages, prev + 1),
                            )
                          }
                          disabled={historyPage === totalHistoryPages}
                          className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: Active Events / Servers */}
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl h-max shadow-lg sticky top-8">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-800">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                </span>
                <h3 className="text-sm font-black italic text-white uppercase tracking-wider">
                  Live Activity
                </h3>
              </div>

              {/* 1. DAFTAR SERVER AKTIF */}
              <div className="mb-8">
                <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">
                  Hosted Servers
                </h4>
                <div className="space-y-3">
                  {activeServers.length === 0 ? (
                    <div className="p-4 border border-dashed border-gray-800 rounded-xl text-center">
                      <p className="text-gray-600 text-[11px] font-bold italic">
                        No active servers right now
                      </p>
                    </div>
                  ) : (
                    activeServers.map((server) => (
                      <Link
                        href={`/servers/${server.id}`}
                        key={server.id}
                        className="block p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-purple-500/50 hover:bg-gray-800 transition group cursor-pointer"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="text-sm font-bold text-white group-hover:text-purple-400 transition leading-tight pr-2">
                            {server.name}
                          </h5>
                          {server.server_tag && (
                            <span className="text-[8px] bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded font-black uppercase tracking-wider shrink-0">
                              {server.server_tag}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-end mt-3">
                          <span className="text-[10px] text-gray-400">
                            Slots: {server.max_players || 'N/A'}
                          </span>
                          {server.join_link ? (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                window.open(server.join_link, '_blank');
                              }}
                              className="text-[10px] bg-purple-600/10 text-purple-500 px-2 py-1 rounded font-bold hover:bg-purple-600 hover:text-white transition uppercase"
                            >
                              Join
                            </button>
                          ) : (
                            <span className="text-[10px] text-green-500 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>{' '}
                              Online
                            </span>
                          )}
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              {/* 2. DAFTAR EVENT MENDATANG */}
              <div>
                <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">
                  Scheduled Events
                </h4>
                <div className="space-y-3">
                  {upcomingEvents.length === 0 ? (
                    <div className="p-4 border border-dashed border-gray-800 rounded-xl text-center">
                      <p className="text-gray-600 text-[11px] font-bold italic">
                        No upcoming events scheduled
                      </p>
                    </div>
                  ) : (
                    upcomingEvents.map((event) => {
                      const eventDate = new Date(event.event_date);
                      const formattedDate = eventDate.toLocaleDateString(
                        'en-US',
                        {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        },
                      );

                      return (
                        <Link
                          href={`/events/${event.id}`}
                          key={event.id}
                          className="block p-4 bg-purple-600/5 rounded-xl border border-purple-500/20 hover:bg-purple-600/10 hover:border-purple-500 transition cursor-pointer group"
                        >
                          {event.event_tag && (
                            <span className="inline-block text-[8px] text-purple-400 border border-purple-500/30 px-1.5 py-0.5 rounded mb-2 font-black uppercase tracking-wider">
                              {event.event_tag}
                            </span>
                          )}
                          <h5 className="text-sm font-black text-white group-hover:text-purple-400 transition leading-tight mb-2">
                            {event.title}
                          </h5>
                          <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                            🗓️ {formattedDate}
                          </p>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
