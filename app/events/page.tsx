'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  MapPin,
  Trophy,
  Flag,
  Clock,
} from 'lucide-react';

export default function EventsDirectory() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // States untuk Filter & Pencarian
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('ALL');

  useEffect(() => {
    async function fetchPublicEvents() {
      // Mengambil data event berserta nama sirkuitnya
      const { data, error } = await supabase
        .from('events')
        .select(
          `
          id, 
          title, 
          image_url, 
          event_date,
          timezone,
          event_tag,
          event_class,
          uri,
          tracks (name, city, country)
        `,
        )
        .order('event_date', { ascending: true });

      if (!error && data) {
        setEvents(data);
      }
      setLoading(false);
    }

    fetchPublicEvents();
  }, []);

  // Mendapatkan daftar Tag/Kategori unik untuk dropdown filter (misal: GT3, LEAGUE, PUBLIC)
  const availableTags = useMemo(() => {
    const tags = events.map((e) => e.event_tag).filter(Boolean);
    return ['ALL', ...Array.from(new Set(tags))];
  }, [events]);

  // Logika Pemisahan & Filter Data
  const { upcomingEvents, pastEvents } = useMemo(() => {
    const now = new Date().getTime();

    // Terapkan filter pencarian & kategori terlebih dahulu
    const filtered = events.filter((ev) => {
      const matchSearch =
        ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ev.tracks?.name &&
          ev.tracks.name.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchTag = selectedTag === 'ALL' || ev.event_tag === selectedTag;
      return matchSearch && matchTag;
    });

    // Pisahkan berdasarkan waktu
    const upcoming = filtered.filter(
      (e) => e.event_date && new Date(e.event_date).getTime() >= now,
    );

    // Untuk event masa lalu, kita balik urutannya (yang paling baru selesai ada di atas)
    const past = filtered
      .filter((e) => e.event_date && new Date(e.event_date).getTime() < now)
      .sort(
        (a, b) =>
          new Date(b.event_date).getTime() - new Date(a.event_date).getTime(),
      );

    return { upcomingEvents: upcoming, pastEvents: past };
  }, [events, searchQuery, selectedTag]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center space-y-4 transition-colors duration-300">
        <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-[var(--accent)] font-bold italic tracking-widest uppercase">
          Loading Race Calendar...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto pt-16">
        {/* HEADER & SEARCH SECTION */}
        <div className="mb-12 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6 relative">
          {/* Efek Glow di Header */}
          <div className="absolute -top-10 left-0 w-64 h-64 bg-[var(--accent-glow)] blur-[100px] rounded-full pointer-events-none"></div>

          <div className="relative z-10">
            <h1 className="text-4xl md:text-5xl font-black italic text-[var(--foreground)] uppercase tracking-tighter mb-2">
              Race{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-[var(--accent)]">
                Calendar
              </span>
            </h1>
            <p className="text-[var(--muted)] text-sm font-bold tracking-widest uppercase">
              Official Nismara Racing Events
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto relative z-10">
            <div className="relative group">
              <input
                type="text"
                placeholder="Search event or circuit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-64 p-3 pl-10 rounded-xl bg-[var(--card)] border border-[var(--card-border)] focus:border-[var(--accent)] outline-none transition-all shadow-inner text-sm text-[var(--foreground)]"
              />
              <span className="absolute left-3 top-3.5 text-[var(--muted)] group-focus-within:text-[var(--accent)] transition-colors">
                🔍
              </span>
            </div>

            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full md:w-48 p-3 rounded-xl bg-[var(--card)] border border-[var(--card-border)] focus:border-[var(--accent)] outline-none transition-all shadow-inner text-sm text-[var(--foreground)] font-bold uppercase cursor-pointer"
            >
              {availableTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ================= UPCOMING EVENTS ================= */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <CalendarIcon className="text-[var(--accent)]" size={24} />
            <h2 className="text-2xl font-black text-[var(--foreground)] italic uppercase tracking-wider">
              Upcoming Races
            </h2>
            <div className="h-px bg-gradient-to-r from-[var(--accent)] to-transparent flex-grow ml-4 opacity-30"></div>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="text-center py-16 bg-[var(--card)] rounded-3xl border border-[var(--card-border)] border-dashed">
              <Trophy
                className="mx-auto text-[var(--muted)] mb-4"
                size={48}
                opacity={0.5}
              />
              <p className="text-[var(--muted)] text-lg italic font-bold">
                No upcoming events scheduled right now.
              </p>
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTag('ALL');
                  }}
                  className="mt-4 text-[var(--accent)] hover:opacity-80 text-sm font-bold uppercase tracking-widest underline transition-opacity"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcomingEvents.map((ev) => {
                const eventDate = new Date(ev.event_date);
                const dateStr = eventDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                const timeStr = eventDate.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                });

                return (
                  <Link
                    href={`/events/${ev.uri}`}
                    key={ev.id}
                    className="group block"
                  >
                    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl overflow-hidden hover:border-[var(--accent)] transition-all duration-300 shadow-lg hover:shadow-[0_0_30px_var(--accent-glow)] flex flex-col h-full transform hover:-translate-y-1">
                      {/* Image Section */}
                      <div className="relative aspect-[16/9] bg-[var(--background)] overflow-hidden border-b border-[var(--card-border)]">
                        {ev.image_url ? (
                          <img
                            src={ev.image_url}
                            alt={ev.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[var(--muted)] font-black italic text-xs">
                            NO COVER IMAGE
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--card)] via-[var(--card)]/20 to-transparent"></div>

                        {/* Event Tags */}
                        <div className="absolute top-3 left-3 flex gap-2">
                          {ev.event_tag && (
                            <span className="text-[10px] bg-blue-600 text-white px-2.5 py-1 rounded-md uppercase font-black tracking-widest shadow-lg">
                              {ev.event_tag}
                            </span>
                          )}
                          {ev.event_class && (
                            <span className="text-[10px] bg-[var(--accent)] text-white px-2.5 py-1 rounded-md uppercase font-black tracking-widest shadow-lg">
                              {ev.event_class}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Info Section */}
                      <div className="p-5 flex flex-col flex-grow relative bg-[var(--card)]">
                        {/* Date Badge floating */}
                        <div className="absolute -top-6 right-5 bg-[var(--background)] border border-[var(--card-border)] shadow-xl rounded-xl p-2 text-center min-w-[60px] group-hover:border-[var(--accent)] transition-colors">
                          <span className="block text-[var(--accent)] text-[10px] font-black uppercase leading-none">
                            {eventDate.toLocaleDateString('en-US', {
                              month: 'short',
                            })}
                          </span>
                          <span className="block text-[var(--foreground)] text-xl font-black leading-tight mt-1">
                            {eventDate.getDate()}
                          </span>
                        </div>

                        <h3 className="font-black text-xl text-[var(--foreground)] group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-[var(--accent)] transition-all leading-tight mb-4 pr-14">
                          {ev.title}
                        </h3>

                        <div className="mt-auto space-y-2 pt-4 border-t border-[var(--card-border)]">
                          <div className="flex items-start gap-2 text-[var(--muted)]">
                            <Clock
                              size={14}
                              className="mt-0.5 text-[var(--accent)]"
                            />
                            <p className="text-xs font-bold">
                              {timeStr}{' '}
                              <span className="text-[10px]">
                                {ev.timezone || 'WIB'}
                              </span>
                            </p>
                          </div>
                          <div className="flex items-start gap-2 text-[var(--muted)]">
                            <MapPin
                              size={14}
                              className="mt-0.5 text-blue-500 shrink-0"
                            />
                            <p className="text-xs font-bold truncate">
                              {ev.tracks ? ev.tracks.name : 'TBA Circuit'}
                              {ev.tracks?.country && (
                                <span className="text-[10px] ml-1 opacity-70 font-normal">
                                  ({ev.tracks.country})
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* ================= PAST EVENTS / HISTORY ================= */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Flag className="text-[var(--muted)]" size={24} />
            <h2 className="text-2xl font-black text-[var(--muted)] italic uppercase tracking-wider">
              Race History
            </h2>
            <div className="h-px bg-[var(--card-border)] flex-grow ml-4"></div>
          </div>

          {pastEvents.length === 0 ? (
            <p className="text-[var(--muted)] text-sm italic font-bold">
              No past events found.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastEvents.map((ev) => {
                const eventDate = new Date(ev.event_date);

                return (
                  <Link
                    href={`/events/${ev.uri}`}
                    key={ev.id}
                    className="group block"
                  >
                    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 flex items-center gap-4 hover:bg-[var(--background)] transition-colors opacity-80 hover:opacity-100">
                      {/* Mini Date Box */}
                      <div className="bg-[var(--background)] border border-[var(--card-border)] rounded-lg p-2 text-center w-14 shrink-0 group-hover:border-[var(--accent)] transition-colors">
                        <span className="block text-[var(--muted)] text-[9px] font-black uppercase leading-none mb-1 group-hover:text-[var(--accent)] transition-colors">
                          {eventDate.toLocaleDateString('en-US', {
                            month: 'short',
                          })}
                        </span>
                        <span className="block text-[var(--foreground)] text-lg font-black leading-none">
                          {eventDate.getDate()}
                        </span>
                      </div>

                      <div className="overflow-hidden">
                        <h4 className="text-sm font-bold text-[var(--foreground)] group-hover:text-[var(--accent)] truncate mb-1 transition-colors">
                          {ev.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-[var(--muted)] uppercase font-bold tracking-widest">
                          <span className="flex items-center gap-1">
                            <Flag size={10} /> Finished
                          </span>
                          <span>•</span>
                          <span className="truncate">
                            {ev.tracks?.name || 'Unknown Track'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
