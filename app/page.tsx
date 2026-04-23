'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import EventCountdown from '@/components/EventCountdown';
import Link from 'next/link';
import {
  ChevronRight,
  ChevronLeft,
  Calendar,
  Users,
  Trophy,
  Zap,
} from 'lucide-react';

// Daftar gambar untuk Hero Carousel
const HERO_IMAGES = [
  'https://i.imgur.com/WTq93jI.png',
  'https://i.imgur.com/eWlUsE0.png',
  'https://i.imgur.com/9HMmPZf.png',
];

export default function Home() {
  const [servers, setServers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [carData, setCarData] = useState<any[]>([]);
  const [userData, setUserData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentHero, setCurrentHero] = useState(0);

  // LOGIKA CAROUSEL AUTO-PLAY
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHero((prev) =>
        prev === HERO_IMAGES.length - 1 ? 0 : prev + 1,
      );
    }, 10000); // Ganti gambar setiap 10 detik
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchData() {
      const now = new Date().toISOString();

      const { data: sData } = await supabase
        .from('servers')
        .select('*')
        .limit(3);

      // LOGIKA: Ambil hanya event yang event_date >= waktu sekarang
      const { data: eData } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', now)
        .order('event_date', { ascending: true })
        .limit(3);

      const { data: cData } = await supabase.from('cars').select('*');

      const { data: uData } = await supabase.from('profiles').select('*');

      if (sData) setServers(sData);
      if (eData) setEvents(eData);
      if (cData) setCarData(cData);
      if (uData) setUserData(uData);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="min-h-screen text-[var(--foreground)]">
      {/* --- HERO SECTION WITH CAROUSEL --- */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden border-b border-[var(--card-border)]">
        {HERO_IMAGES.map((img, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 z-0 transition-all duration-1000 ease-in-out transform ${
              idx === currentHero
                ? 'opacity-70 dark:opacity-70 scale-100'
                : 'opacity-0 scale-110'
            }`}
          >
            <img
              src={img}
              className="w-full h-full object-cover"
              alt="Racing Background"
            />
          </div>
        ))}

        {/* Overlay Gradien menyesuaikan background theme */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-transparent to-transparent z-[1]"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--background)] via-transparent to-[var(--background)] opacity-40 dark:opacity-60 z-[1]"></div>

        <div className="relative z-10 text-center px-6">
          <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/30 px-4 py-1.5 rounded-full mb-6 animate-bounce shadow-sm">
            <Zap size={14} className="text-blue-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-500">
              From the skies and the roads to the racing line
            </span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 italic uppercase leading-none">
            NISMARA{' '}
            <span className="text-orange-500 dark:text-sky-600 bg-clip-text bg-gradient-to-r dark:from-blue-400 dark:to-[var(--accent)]">
              RACING
            </span>
          </h1>
          <p className="text-black-600 dark:text-white-300 text-sm md:text-lg max-w-2xl mx-auto mb-10 font-bold uppercase tracking-widest leading-relaxed">
            Where virtual excellence meets the track. Experience the next
            chapter of Nismara Group in Assetto Corsa.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/servers"
              className="bg-gradient-to-r from-blue-600 to-[var(--accent)] hover:opacity-90 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest transition-all transform hover:-translate-y-1 shadow-[0_0_20px_var(--accent-glow)]"
            >
              Explore Servers
            </Link>
            <a
              href="#events"
              className="bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] hover:bg-[var(--accent-glow)] text-[var(--foreground)] px-10 py-4 rounded-2xl font-black uppercase tracking-widest transition-all"
            >
              Race Calendar
            </a>
          </div>
        </div>

        {/* Carousel Indicators */}
        <div className="absolute bottom-10 flex gap-2">
          {HERO_IMAGES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentHero(idx)}
              className={`h-1 transition-all rounded-full ${idx === currentHero ? 'w-8 bg-[var(--accent)]' : 'w-2 bg-[var(--muted)] opacity-50'}`}
            />
          ))}
        </div>
      </section>

      {/* --- QUICK STATS --- */}
      <section className="py-12 border-b border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: 'Network Uptime', val: '99.9%', color: 'text-blue-500' },
            {
              label: 'Active Servers',
              val: servers.length,
              color: 'text-[var(--foreground)]',
            },
            {
              label: 'Car Database',
              val: carData.length,
              color: 'text-[var(--foreground)]',
            },
            {
              label: 'User Registered',
              val: userData.length,
              color: 'text-[var(--foreground)]',
            },
          ].map((stat, i) => (
            <div key={i} className="text-center group cursor-default">
              <p
                className={`text-3xl font-black italic ${stat.color} group-hover:scale-110 transition`}
              >
                {stat.val}
              </p>
              <p className="text-[var(--muted)] text-[10px] font-black uppercase tracking-[0.2em] mt-2">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* --- ABOUT SECTION --- */}
      <section className="py-24 relative overflow-hidden">
        {/* Dekorasi Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--accent-glow)] rounded-full blur-[120px] -z-10"></div>

        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Kolom Kiri: Branding/Visual */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-24 h-24 border-t-2 border-l-2 border-[var(--accent)] opacity-50"></div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 border-b-2 border-r-2 border-blue-500 opacity-50"></div>

              <div className="p-2 bg-[var(--card)] backdrop-blur-md border border-[var(--card-border)] rounded-[2.5rem]">
                <img
                  src="https://i.imgur.com/eWlUsE0.png"
                  alt="Nismara Group Ecosystem"
                  className="rounded-[2rem] grayscale hover:grayscale-0 transition duration-700 object-cover h-[400px] w-full"
                />
              </div>

              {/* Floating Tag */}
              <div className="absolute -bottom-6 -left-6 bg-gradient-to-br from-blue-600 to-[var(--accent)] p-6 rounded-3xl shadow-xl hidden md:block text-white">
                <p className="text-3xl font-black italic leading-none">
                  EST. 2024
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-80">
                  Virtual Excellence
                </p>
              </div>
            </div>

            {/* Kolom Kanan: Narasi */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-[2px] bg-blue-500"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">
                  Who We Are
                </span>
              </div>

              <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none text-[var(--foreground)]">
                Beyond Just <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-[var(--accent)]">
                  Sim Racing
                </span>
              </h2>

              <div className="space-y-6 text-[var(--muted)] font-medium leading-relaxed">
                <p>
                  <strong className="text-[var(--foreground)]">
                    Nismara Racing
                  </strong>{' '}
                  adalah komunitas Sim Racing di Indonesia yang berfokus pada
                  ekosistem{' '}
                  <strong className="text-blue-500 text-sm">
                    Assetto Corsa
                  </strong>
                  . Kami bukan sekadar penyelenggara balap; kami adalah wadah
                  bagi para driver virtual untuk mengasah skill dan kompetisi
                  yang sehat.
                </p>

                <p>
                  Sebagai bagian dari{' '}
                  <strong className="text-[var(--foreground)]">
                    Nismara Group
                  </strong>
                  , sebuah perusahaan virtual (VTC) yang telah lama berkecimpung
                  di dunia simulasi. Kami membawa standar profesionalisme dari
                  divisi simulator lainnya ke dalam lintasan balap:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  <div className="flex items-start gap-3 p-4 bg-[var(--card)] rounded-2xl border border-[var(--card-border)]">
                    <div className="text-blue-500 mt-1">
                      <Users size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-[var(--foreground)] mb-1">
                        Logistics
                      </h4>
                      <p className="text-[10px]">ETS2 & ATS Division</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-[var(--card)] rounded-2xl border border-[var(--card-border)]">
                    <div className="text-[var(--accent)] mt-1">
                      <Zap size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-[var(--foreground)] mb-1">
                        Airliner
                      </h4>
                      <p className="text-[10px]">MSFS Division</p>
                    </div>
                  </div>
                </div>

                <p className="text-sm italic border-l-2 border-[var(--accent)] pl-4 py-2 text-[var(--foreground)]">
                  "Kini saatnya Nismara menguasai aspal. Dari logistik jalan
                  raya hingga navigasi udara, kini kami hadir untuk mendominasi
                  setiap tikungan di lintasan balap."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-24">
        {/* --- SERVERS SECTION --- */}
        <div
          id="servers"
          className="flex flex-col md:flex-row md:items-end justify-between mb-16 px-4 gap-6"
        >
          <div className="group cursor-default">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-[2px] bg-[var(--accent)]"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--accent)]">
                Server List
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-[var(--foreground)]">
              Live{' '}
              <span
                className="text-transparent bg-clip-text"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, var(--accent), #3b82f6)',
                }}
              >
                Servers
              </span>
            </h2>
          </div>

          {/* TOMBOL VIEW ALL SERVERS */}
          <Link
            href="/servers"
            className="flex items-center gap-3 px-6 py-3 bg-[var(--glass-bg)] hover:bg-[var(--accent-glow)] border border-[var(--glass-border)] rounded-2xl transition-all duration-300 group/btn"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)] group-hover/btn:text-[var(--foreground)] transition-colors">
              Explore All Servers
            </span>
            <div className="p-1 bg-[var(--card-border)] rounded-lg group-hover/btn:bg-[var(--accent)] transition-colors">
              <ChevronRight
                size={14}
                className="text-[var(--foreground)] group-hover/btn:text-white"
              />
            </div>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-32">
          {servers?.map((server) => (
            <Link
              key={server.id}
              href={`/servers/${server.uri}`}
              className="group relative"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-[var(--accent)] rounded-[2rem] opacity-0 group-hover:opacity-20 blur transition duration-500"></div>
              <div className="relative bg-[var(--card)] backdrop-blur-md border border-[var(--card-border)] rounded-[2rem] overflow-hidden transition-all duration-300 shadow-sm">
                <div className="h-44 relative overflow-hidden bg-[var(--background)]">
                  <img
                    src={server.image_url || 'https://picsum.photos/600/300'}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-700 opacity-100"
                    alt={server.name}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--card)] to-transparent"></div>
                  <div className="absolute bottom-4 left-6 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--foreground)]">
                      Online Now
                    </span>
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="text-xl font-black italic text-[var(--foreground)] mb-1 uppercase group-hover:text-blue-500 transition">
                    {server.name}
                  </h3>
                  <p className="text-[var(--muted)] text-[10px] font-black uppercase tracking-widest">
                    {server.server_tag || 'Global Instance'}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* --- EVENTS SECTION --- */}
        <div
          id="events"
          className="flex flex-col md:flex-row md:items-end justify-between mb-16 px-4 gap-6"
        >
          <div className="group cursor-default">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-[2px] bg-[var(--accent)]"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--accent)]">
                Race Calendar
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-[var(--foreground)]">
              Upcoming{' '}
              <span
                className="text-transparent bg-clip-text"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, var(--accent), #3b82f6)',
                }}
              >
                Events
              </span>
            </h2>
          </div>

          {/* TOMBOL VIEW ALL EVENTS */}
          <Link
            href="/events"
            className="flex items-center gap-3 px-6 py-3 bg-[var(--glass-bg)] hover:bg-[var(--accent-glow)] border border-[var(--glass-border)] rounded-2xl transition-all duration-300 group/btn"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)] group-hover/btn:text-[var(--foreground)] transition-colors">
              Explore All Events
            </span>
            <div className="p-1 bg-[var(--card-border)] rounded-lg group-hover/btn:bg-[var(--accent)] transition-colors">
              <ChevronRight
                size={14}
                className="text-[var(--foreground)] group-hover/btn:text-white"
              />
            </div>
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-20 bg-[var(--card)] border border-dashed border-[var(--card-border)] rounded-[3rem] mx-4">
            <Trophy
              size={48}
              className="mx-auto text-[var(--muted)] mb-4 opacity-50"
            />
            <p className="text-[var(--muted)] font-bold italic uppercase tracking-widest text-xs">
              No active grid at the moment
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-10 px-4">
            {events.map((event) => {
              const dateObj = new Date(event.event_date);
              const jamWIB = dateObj.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              });
              const tanggalWIB = dateObj.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              return (
                <Link
                  key={event.id}
                  href={`/events/${event.uri}`}
                  className="group relative"
                >
                  {/* Efek Cahaya Lilac di Belakang Card saat Hover */}
                  <div className="absolute -inset-1 bg-[var(--accent-glow)] rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition duration-500"></div>

                  <div className="relative bg-[var(--card)] backdrop-blur-xl border border-[var(--card-border)] rounded-[3rem] overflow-hidden transition-all duration-500 transform group-hover:-translate-y-3 hover:border-[var(--accent)] shadow-lg">
                    {/* Image Header dengan Overlay */}
                    <div className="relative h-60 overflow-hidden bg-[var(--background)]">
                      <img
                        src={
                          event.image_url ||
                          'https://images.unsplash.com/photo-1511919884226-fd3cad34687c'
                        }
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-1000"
                        alt={event.title}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--card)] via-transparent to-transparent"></div>

                      {/* Badge Tag */}
                      <div className="absolute top-6 left-6">
                        <div className="bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] text-[var(--foreground)] text-[9px] px-3 py-1.5 rounded-full font-black uppercase tracking-[0.2em]">
                          {event.event_tag || 'Official Race'}
                        </div>
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-8">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-black text-2xl italic text-[var(--foreground)] uppercase leading-none tracking-tighter group-hover:text-[var(--accent)] transition-colors">
                          {event.title}
                        </h3>
                      </div>

                      {/* Time & Date Display */}
                      <div className="flex flex-col gap-3 mb-8">
                        <div className="flex items-center gap-3 text-[var(--muted)]">
                          <div className="p-2 bg-[var(--accent-glow)] rounded-lg border border-[var(--card-border)]">
                            <Calendar
                              size={14}
                              className="text-[var(--accent)]"
                            />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">
                              Race Date
                            </p>
                            <p className="text-xs font-bold uppercase text-[var(--foreground)]">
                              {tanggalWIB}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-[var(--muted)]">
                          <div className="p-2 bg-blue-500/10 rounded-lg border border-[var(--card-border)]">
                            <Zap size={14} className="text-blue-500" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">
                              Green Flag
                            </p>
                            <p className="text-xs font-bold uppercase text-blue-500">
                              {jamWIB} WIB
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Countdown Section */}
                      <div className="bg-[var(--background)] rounded-2xl p-5 border border-[var(--card-border)] group-hover:border-[var(--accent)] transition-colors">
                        <EventCountdown date={event.event_date} />
                      </div>

                      <div className="mt-8 pt-6 border-t border-[var(--card-border)] flex justify-center">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--muted)] group-hover:text-[var(--foreground)] transition-colors">
                          View Detail Event →
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
  );
}
