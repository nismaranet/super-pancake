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
  const id = resolvedParams.id;

  // 1. Fetch Data Server - Sekarang join dengan tabel tracks
  const { data: server } = await supabase
    .from('servers')
    .select('*, tracks(*)')
    .eq('id', id)
    .single();

  // 2. Fetch Data Mobil lewat tabel jembatan (server_cars)
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
        download_url
      )
    `,
    )
    .eq('server_id', id);

  const cars = assignments?.map((a: any) => a.cars) || [];

  if (!server)
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-blue-500 font-black italic uppercase tracking-widest">
        Server Infrastructure Not Found
      </div>
    );

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 pb-20">
      {/* --- HERO HEADER --- */}
      <div className="relative h-[35vh] md:h-[45vh] overflow-hidden">
        {server.image_url ? (
          <img
            src={server.image_url}
            className="w-full h-full object-cover opacity-40"
            alt="Server Banner"
          />
        ) : (
          <div className="w-full h-full bg-gray-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />

        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border border-blue-500/50 text-blue-400 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                Live Instance
              </span>
              <span className="bg-purple-600 text-white px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                {server.server_tag || 'Public'}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black italic text-white uppercase tracking-tighter leading-none mb-4">
              {server.name}
            </h1>
            <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
              <span className="flex items-center gap-2">
                <Users size={14} className="text-blue-500" />{' '}
                {server.max_players || 0} Player Slots
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* KOLOM KIRI (Live Info & Cars) */}
          <div className="lg:col-span-2 space-y-12">
            {/* Live Server Telemetry */}
            {server.live_api_url && (
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></div>
                  <h3 className="text-lg font-black italic text-white uppercase tracking-tighter">
                    Live Telemetry
                  </h3>
                </div>
                <LiveServerInfo apiUrl={server.live_api_url} />
              </section>
            )}

            {/* List Mobil di Server */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <Car size={20} className="text-blue-500" />
                <h3 className="text-lg font-black italic text-white uppercase tracking-tighter">
                  Assigned Vehicles
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cars.map((car: any) => (
                  <div
                    key={car.id}
                    className="group bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden hover:border-blue-500/50 transition duration-300"
                  >
                    <div className="h-32 overflow-hidden relative">
                      <img
                        src={car.image_url || 'https://picsum.photos/400/200'}
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition duration-700"
                        alt={car.name}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <div className="overflow-hidden">
                        <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest leading-none mb-1">
                          {car.brand}
                        </p>
                        <h4 className="font-bold text-white uppercase text-xs truncate group-hover:text-blue-400 transition-colors">
                          {car.name}
                        </h4>
                      </div>
                      <Link
                        href={`/cars/${car.id}`}
                        className="p-2 bg-gray-800 hover:bg-blue-600 text-white rounded-lg transition active:scale-90"
                      >
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* KOLOM KANAN (Circuit & Actions) */}
          <div className="space-y-8">
            {/* Join Server Action */}
            {server.join_link && (
              <a
                href={server.join_link}
                className="block w-full p-6 bg-gradient-to-br from-blue-600 to-purple-700 hover:from-blue-500 hover:to-purple-600 text-white rounded-2xl text-center shadow-[0_15px_30px_rgba(59,130,246,0.2)] transition-all transform hover:-translate-y-1 active:scale-95 group"
              >
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70 mb-1">
                    Direct Entry
                  </span>
                  <span className="text-lg font-black uppercase tracking-tighter flex items-center gap-2">
                    Connect to Server{' '}
                    <ChevronRight
                      size={20}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </span>
                </div>
              </a>
            )}

            {/* CIRCUIT INFO (RELATIONAL) */}
            <section className="bg-gray-900 border border-gray-800 rounded-[2rem] overflow-hidden shadow-xl">
              <div className="p-6 border-b border-gray-800">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <MapPin size={14} className="text-purple-500" /> Circuit
                  Details
                </h3>
                <div className="relative h-32 rounded-xl overflow-hidden mb-4 bg-gray-800">
                  {server.tracks?.image_url ? (
                    <img
                      src={server.tracks.image_url}
                      className="w-full h-full object-cover opacity-60"
                      alt="Circuit Layout"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center italic text-[10px] text-gray-700">
                      No Preview
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
                  <div className="absolute bottom-3 left-4">
                    <h4 className="text-md font-black italic text-white uppercase tracking-tighter truncate">
                      {server.tracks?.name || 'TBA'}
                    </h4>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-black/30 rounded-xl border border-gray-800">
                    <span className="block text-[8px] text-gray-500 uppercase font-bold mb-1 tracking-widest">
                      Length
                    </span>
                    <span className="text-xs font-black text-blue-400">
                      {server.tracks?.length || '-'}
                    </span>
                  </div>
                  <div className="p-3 bg-black/30 rounded-xl border border-gray-800">
                    <span className="block text-[8px] text-gray-500 uppercase font-bold mb-1 tracking-widest">
                      Pitboxes
                    </span>
                    <span className="text-xs font-black text-purple-400">
                      {server.tracks?.pitboxes || '-'}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/tracks/${server.tracks?.id}`}
                  className="block text-center py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-700 transition-all"
                >
                  View Circuit Data
                </Link>
              </div>
            </section>

            {/* MOD PACKS */}
            {server.full_pack_url && (
              <section className="bg-gray-900 border border-gray-800 p-6 rounded-[2rem] shadow-xl">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Download size={14} className="text-blue-500" /> Required
                  Content
                </h3>
                <p className="text-[10px] text-gray-400 leading-relaxed mb-4 italic">
                  Download this pack to ensure you have all eligible vehicles
                  and track skins installed.
                </p>
                <a
                  href={server.full_pack_url}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white border border-blue-600/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  <Download size={14} /> Get Full Mod Pack
                </a>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
