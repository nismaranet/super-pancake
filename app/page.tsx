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

      if (sData) setServers(sData);
      if (eData) setEvents(eData);
      if (cData) setCarData(cData);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-transparent text-white">
      {/* --- HERO SECTION WITH CAROUSEL --- */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden border-b border-white/5">
        {HERO_IMAGES.map((img, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 z-0 transition-all duration-1000 ease-in-out transform ${
              idx === currentHero
                ? 'opacity-40 scale-100'
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

        {/* Overlay Gradien Lilac/Purple sesuai tema baru */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/60 via-transparent to-[#050505]/60"></div>

        <div className="relative z-10 text-center px-6">
          <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/30 px-4 py-1.5 rounded-full mb-6 animate-bounce">
            <Zap size={14} className="text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
              From the skies and the roads to the racing line
            </span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 italic uppercase leading-none">
            NISMARA{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
              RACING
            </span>
          </h1>
          <p className="text-gray-400 text-sm md:text-lg max-w-2xl mx-auto mb-10 font-bold uppercase tracking-widest leading-relaxed">
            Where virtual excellence meets the track. Experience the next
            chapter of Nismara Group in Assetto Corsa.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/servers"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest transition-all transform hover:-translate-y-1 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
            >
              Explore Servers
            </Link>
            <a
              href="#events"
              className="bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 px-10 py-4 rounded-2xl font-black uppercase tracking-widest transition-all"
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
              className={`h-1 transition-all rounded-full ${idx === currentHero ? 'w-8 bg-blue-500' : 'w-2 bg-gray-600'}`}
            />
          ))}
        </div>
      </section>

      {/* --- QUICK STATS --- */}
      <section className="py-12 border-b border-white/5 bg-white/5 backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: 'Network Uptime', val: '99.9%', color: 'text-blue-500' },
            {
              label: 'Active Servers',
              val: servers.length,
              color: 'text-white',
            },
            { label: 'Car Database', val: carData.length, color: 'text-white' },
            { label: 'Events', val: events.length, color: 'text-white' },
          ].map((stat, i) => (
            <div key={i} className="text-center group cursor-default">
              <p
                className={`text-3xl font-black italic ${stat.color} group-hover:scale-110 transition`}
              >
                {stat.val}
              </p>
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* --- ABOUT SECTION --- */}
      <section className="py-24 relative overflow-hidden">
        {/* Dekorasi Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] -z-10"></div>

        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Kolom Kiri: Branding/Visual */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-24 h-24 border-t-2 border-l-2 border-purple-500/50"></div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 border-b-2 border-r-2 border-blue-500/50"></div>

              <div className="p-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem]">
                <img
                  src="https://i.imgur.com/eWlUsE0.png"
                  alt="Nismara Group Ecosystem"
                  className="rounded-[2rem] grayscale hover:grayscale-0 transition duration-700 object-cover h-[400px] w-full"
                />
              </div>

              {/* Floating Tag */}
              <div className="absolute -bottom-6 -left-6 bg-gradient-to-br from-blue-600 to-purple-600 p-6 rounded-3xl shadow-xl hidden md:block">
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
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400">
                  Who We Are
                </span>
              </div>

              <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">
                Beyond Just <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  Sim Racing
                </span>
              </h2>

              <div className="space-y-6 text-gray-400 font-medium leading-relaxed">
                <p>
                  <strong className="text-white">Nismara Racing</strong> adalah
                  komunitas Sim Racing di Indonesia yang berfokus pada ekosistem{' '}
                  <strong className="text-blue-400 text-sm">
                    Assetto Corsa
                  </strong>
                  . Kami bukan sekadar penyelenggara balap; kami adalah wadah
                  bagi para driver virtual untuk mengasah skill dan kompetisi
                  yang sehat.
                </p>

                <p>
                  Sebagai bagian dari{' '}
                  <strong className="text-white">Nismara Group</strong>, sebuah
                  perusahaan virtual (VTC) yang telah lama berkecimpung di dunia
                  simulasi. Kami membawa standar profesionalisme dari divisi
                  simulator lainnya ke dalam lintasan balap:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  <div className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="text-blue-500 mt-1">
                      <Users size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-white mb-1">
                        Logistics
                      </h4>
                      <p className="text-[10px]">ETS2 & ATS Division</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="text-purple-500 mt-1">
                      <Zap size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-white mb-1">
                        Airliner
                      </h4>
                      <p className="text-[10px]">MSFS Division</p>
                    </div>
                  </div>
                </div>

                <p className="text-sm italic border-l-2 border-purple-500 pl-4 py-2">
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
          id="events"
          className="flex flex-col md:flex-row md:items-end justify-between mb-16 px-4 gap-6"
        >
          <div className="group cursor-default">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-[2px] bg-purple-500"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-400">
                Server List
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
              Live{' '}
              <span
                className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-200"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, #a855f7, #e9d5ff)',
                }}
              >
                Servers
              </span>
            </h2>
          </div>

          {/* TOMBOL VIEW ALL EVENTS */}
          <Link
            href="/servers"
            className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-purple-600/20 border border-white/10 hover:border-purple-500/50 rounded-2xl transition-all duration-300 group/btn"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover/btn:text-white transition-colors">
              Explore All Servers
            </span>
            <div className="p-1 bg-white/10 rounded-lg group-hover/btn:bg-purple-500 transition-colors">
              <ChevronRight size={14} className="text-white" />
            </div>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-32">
          {servers?.map((server) => (
            <Link
              key={server.id}
              href={`/servers/${server.id}`}
              className="group relative"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[2rem] opacity-0 group-hover:opacity-20 blur transition duration-500"></div>
              <div className="relative bg-gray-900/40 backdrop-blur-md border border-white/5 rounded-[2rem] overflow-hidden transition-all duration-300">
                <div className="h-44 relative overflow-hidden">
                  <img
                    src={server.image_url || 'https://picsum.photos/600/300'}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-700 opacity-100"
                    alt={server.name}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
                  <div className="absolute bottom-4 left-6 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">
                      Online Now
                    </span>
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="text-xl font-black italic text-white mb-1 uppercase group-hover:text-blue-400 transition">
                    {server.name}
                  </h3>
                  <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">
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
              <div className="w-8 h-[2px] bg-purple-500"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-400">
                Race Calendar
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
              Upcoming{' '}
              <span
                className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-200"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, #a855f7, #e9d5ff)',
                }}
              >
                Events
              </span>
            </h2>
          </div>

          {/* TOMBOL VIEW ALL EVENTS */}
          <Link
            href="/events"
            className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-purple-600/20 border border-white/10 hover:border-purple-500/50 rounded-2xl transition-all duration-300 group/btn"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover/btn:text-white transition-colors">
              Explore All Events
            </span>
            <div className="p-1 bg-white/10 rounded-lg group-hover/btn:bg-purple-500 transition-colors">
              <ChevronRight size={14} className="text-white" />
            </div>
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-20 bg-white/5 border border-dashed border-white/10 rounded-[3rem] mx-4">
            <Trophy
              size={48}
              className="mx-auto text-gray-700 mb-4 opacity-30"
            />
            <p className="text-gray-500 font-bold italic uppercase tracking-widest text-xs">
              No active grid at the moment
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-10 px-4">
            {events.map((event) => {
              // Konversi ke Waktu Indonesia Barat (WIB)
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
                  href={`/events/${event.id}`}
                  className="group relative"
                >
                  {/* Efek Cahaya Lilac di Belakang Card saat Hover */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition duration-500"></div>

                  <div className="relative bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 rounded-[3rem] overflow-hidden transition-all duration-500 transform group-hover:-translate-y-3 group-hover:border-purple-500/50 shadow-2xl">
                    {/* Image Header dengan Overlay */}
                    <div className="relative h-60 overflow-hidden">
                      <img
                        src={
                          event.image_url ||
                          'https://images.unsplash.com/photo-1511919884226-fd3cad34687c'
                        }
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-1000"
                        alt={event.title}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent"></div>

                      {/* Badge Tag */}
                      <div className="absolute top-6 left-6">
                        <div className="bg-black/60 backdrop-blur-md border border-white/10 text-white text-[9px] px-3 py-1.5 rounded-full font-black uppercase tracking-[0.2em]">
                          {event.event_tag || 'Official Race'}
                        </div>
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-8">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-black text-2xl italic text-white uppercase leading-none tracking-tighter group-hover:text-purple-400 transition-colors">
                          {event.title}
                        </h3>
                      </div>

                      {/* Time & Date Display */}
                      <div className="flex flex-col gap-3 mb-8">
                        <div className="flex items-center gap-3 text-gray-300">
                          <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                            <Calendar size={14} className="text-purple-400" />
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest leading-none mb-1">
                              Race Date
                            </p>
                            <p className="text-xs font-bold uppercase">
                              {tanggalWIB}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-gray-300">
                          <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <Zap size={14} className="text-blue-400" />
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest leading-none mb-1">
                              Green Flag
                            </p>
                            <p className="text-xs font-bold uppercase text-blue-400">
                              {jamWIB} WIB
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Countdown Section */}
                      <div className="bg-white/5 rounded-2xl p-5 border border-white/5 group-hover:border-purple-500/20 transition-colors">
                        <EventCountdown date={event.event_date} />
                      </div>

                      <div className="mt-8 pt-6 border-t border-white/5 flex justify-center">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 group-hover:text-white transition-colors">
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
