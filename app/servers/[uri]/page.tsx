import { supabase } from '@/lib/supabaseClient';
import LiveServerInfo from '@/components/LiveServerInfo';
import Link from 'next/link';
import {
  Server,
  MapPin,
  Users,
  Download,
  ChevronRight,
  Gamepad2,
  Globe,
  Info,
  Car,
} from 'lucide-react';

export default async function ServerPage({ params }: any) {
  const resolvedParams = await params;
  const uri = resolvedParams.uri;

  // 1. Fetch Data Server - Join dengan tabel tracks
  const { data: server } = await supabase
    .from('servers')
    .select('*, tracks(*)')
    .eq('uri', uri)
    .single();

  // 2. Fetch Data Mobil lewat tabel jembatan (server_cars)
  // Menambahkan pemanggilan "uri" agar bisa di-link dengan benar
  const { data: assignments } = await supabase
    .from('server_cars')
    .select(
      `
      car_id,
      cars (
        id,
        name,
        brand,
        image_url,
        download_url,
        uri
      )
    `,
    )
    .eq('server_id', server.id);

  const cars = assignments?.map((a: any) => a.cars) || [];

  const { data: tracks } = await supabase
    .from('tracks')
    .select('*')
    .eq('id', server.track_id)
    .single();

  if (!server)
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center text-blue-500 font-black italic uppercase tracking-widest transition-colors duration-300">
        Server Not Found
      </div>
    );

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-20 transition-colors duration-300">
      {/* --- HERO HEADER --- */}
      <div className="relative h-[35vh] md:h-[45vh] overflow-hidden bg-[var(--background)]">
        {server.image_url ? (
          <img
            src={server.image_url}
            className="w-full h-full object-cover opacity-80"
            alt="Server Banner"
          />
        ) : (
          <div className="w-full h-full bg-[var(--card)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/60 to-transparent" />

        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border border-blue-500/50 text-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                Live Instance
              </span>
              <span className="bg-[var(--accent)] text-white px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shadow-md">
                {server.server_tag || 'Public'}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black italic text-[var(--foreground)] uppercase tracking-tighter leading-none mb-4">
              {server.name}
            </h1>
            <div className="flex flex-wrap gap-4 items-center text-[10px] text-[var(--muted)] font-bold uppercase tracking-widest">
              <span className="flex items-center gap-1.5 bg-[var(--card)] border border-[var(--card-border)] px-3 py-1.5 rounded-lg shadow-sm">
                <MapPin size={12} className="text-blue-500" />
                {server.tracks?.name || 'TBA Track'}
              </span>
              <span className="flex items-center gap-1.5 bg-[var(--card)] border border-[var(--card-border)] px-3 py-1.5 rounded-lg shadow-sm">
                <Users size={12} className="text-blue-500" />
                {server.max_players || 0} Slots
              </span>
              <span className="flex items-center gap-1.5 bg-[var(--card)] border border-[var(--card-border)] px-3 py-1.5 rounded-lg shadow-sm">
                <Globe size={12} className="text-blue-500" />
                {server.ip_address || 'Hidden IP'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        <div className="grid lg:grid-cols-3 gap-10">
          {/* KOLOM KIRI (Live Server Component & Details) */}
          <div className="lg:col-span-2 space-y-12">
            {/* LIVE SERVER INFO COMPONENT */}
            <LiveServerInfo server={server} />

            {/* SERVER DESCRIPTION */}
            {server.description && (
              <section className="bg-[var(--card)] border border-[var(--card-border)] p-8 rounded-[2rem] shadow-sm transition-colors">
                <h2 className="text-xl font-black italic text-[var(--foreground)] uppercase tracking-tighter mb-4 flex items-center gap-3">
                  <Info size={20} className="text-blue-500" />
                  Server Briefing
                </h2>
                <div
                  className="text-[var(--muted)] text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: server.description }}
                />
              </section>
            )}

            {/* ASSIGNED VEHICLES */}
            <section className="pt-4 border-t border-[var(--card-border)]">
              <h2 className="text-2xl font-black italic text-[var(--foreground)] uppercase tracking-tighter flex items-center gap-3 mb-8">
                <Car className="text-blue-500" size={24} /> Approved Vehicles
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {cars.map((car: any) => (
                  <Link
                    href={`/cars/${car.uri || car.id}`}
                    key={car.id}
                    className="group flex flex-col bg-[var(--card)] border border-[var(--card-border)] rounded-2xl overflow-hidden hover:border-blue-500 transition-all shadow-sm transform hover:-translate-y-1"
                  >
                    <div className="h-32 bg-[var(--background)] relative overflow-hidden">
                      {car.image_url ? (
                        <img
                          src={car.image_url}
                          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                          alt={car.name}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--muted)] font-black italic text-[10px]">
                          NO PREVIEW
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--card)] via-transparent to-transparent" />

                      {/* Icon View Detail */}
                      <div className="absolute top-2 right-2 bg-[var(--glass-bg)] border border-[var(--glass-border)] p-1.5 rounded-lg backdrop-blur-md">
                        <ChevronRight
                          size={14}
                          className="text-[var(--foreground)] group-hover:text-blue-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="p-4 flex-grow flex flex-col justify-end bg-[var(--card)] relative z-10">
                      <p className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-widest leading-none mb-1 truncate">
                        {car.brand || 'CUSTOM'}
                      </p>
                      <h4 className="text-sm font-black text-[var(--foreground)] uppercase truncate group-hover:text-blue-500 transition-colors">
                        {car.name}
                      </h4>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          {/* KOLOM KANAN (SIDEBAR: Track Info & Mod Packs) */}
          <div className="space-y-8 lg:col-span-1 sticky top-32">
            {/* TRACK INFO */}
            <section className="bg-[var(--card)] border border-[var(--card-border)] p-6 md:p-8 rounded-[2rem] shadow-md transition-colors">
              <h3 className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest flex items-center gap-2 mb-6">
                <MapPin size={14} className="text-blue-500" /> Active Circuit
              </h3>

              <div className="relative h-32 rounded-xl overflow-hidden mb-6 bg-[var(--background)] border border-[var(--card-border)]">
                {server.tracks?.image_url ? (
                  <img
                    src={server.tracks.image_url}
                    className="w-full h-full object-cover opacity-80"
                    alt={server.tracks?.name}
                  />
                ) : (
                  <div className="w-full h-full bg-[var(--card)] flex items-center justify-center text-[10px] text-[var(--muted)] font-black italic uppercase">
                    Map Unavailable
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--card)] via-[var(--card)]/40 to-transparent" />
                <p className="absolute top-3 right-4 text-xs font-black text-[var(--foreground)] uppercase tracking-widest drop-shadow-md">
                  {server.tracks?.country || 'N/A'}
                </p>
              </div>

              <div className="text-center">
                <p className="text-xl font-black text-[var(--foreground)] italic uppercase leading-tight mb-2">
                  {server.tracks?.name || 'TBA Track'}
                </p>
                <p className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-widest mb-6">
                  {server.tracks?.length || '-'} meter •
                  {server.tracks?.pitboxes || '0'} Pitboxes
                </p>

                {server.track_id && (
                  <Link
                    href={`/tracks/${tracks?.uri || '#'}`}
                    key={server.track_id}
                    className="block text-center py-3 bg-[var(--background)] hover:bg-[var(--accent-glow)] text-[var(--foreground)] rounded-xl text-[10px] font-black uppercase tracking-widest border border-[var(--card-border)] hover:border-[var(--accent)] transition-all"
                  >
                    View Circuit Data
                  </Link>
                )}
              </div>
            </section>

            {/* MOD PACKS */}
            {server.full_pack_url && (
              <section className="bg-[var(--card)] border border-[var(--card-border)] p-6 rounded-[2rem] shadow-md transition-colors">
                <h3 className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Download size={14} className="text-blue-500" /> Required
                  Content
                </h3>
                <p className="text-[10px] text-[var(--muted)] leading-relaxed mb-4 italic font-medium">
                  Download this pack to ensure you have all eligible vehicles
                  and track skins installed before joining the server.
                </p>
                <a
                  href={server.full_pack_url}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] active:scale-[0.98]"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download Mod Pack
                </a>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
