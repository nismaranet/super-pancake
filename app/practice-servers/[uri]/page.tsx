import { supabase } from '@/lib/supabaseClient';
import LiveServerInfo from '@/components/LiveServerInfo';
import {
  Car,
  MapPin,
  Download,
  ChevronRight,
  ChevronLeft,
  Info,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export default async function PracticeServerPage({ params }: any) {
  const resolvedParams = await params;
  const uri = resolvedParams.uri;

  // FETCH: Data Practice beserta relasi mobilnya (Many-to-Many)
  const { data: practice } = await supabase
    .from('practices')
    .select(
      `
      *,
      practice_cars (
        cars (*)
      )
    `,
    )
    .eq('uri', uri)
    .single();

  const { data: trackDetails } = await supabase
    .from('tracks')
    .select('*')
    .eq('id', practice?.track_id)
    .single();

  if (!practice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <p className="text-[var(--muted)] font-bold italic uppercase tracking-widest">
          Server Not Found
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pt-28 pb-12 px-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* BREADCRUMB / BACK */}
        <Link
          href="/practice-servers"
          className="inline-flex items-center gap-2 text-[var(--muted)] hover:text-[var(--accent)] transition-colors mb-8 font-bold text-sm uppercase tracking-wider"
        >
          <ChevronLeft size={16} /> Back to Practice List
        </Link>

        {/* HEADER SECTION */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-[var(--accent)] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-lg shadow-[var(--accent)]/20">
              Practice Session
            </span>
            <div className="h-[1px] flex-grow bg-[var(--glass-border)]"></div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none mb-2">
                {practice.name}
              </h1>
              <p className="text-[var(--muted)] font-medium max-w-2xl">
                Latih kemampuan mengemudi Anda di lintasan resmi Nismara Racing.
                Catatkan waktu terbaik dan bandingkan dengan driver lain.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN: TRACK DETAILS */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass rounded-3xl overflow-hidden border-[var(--glass-border)] shadow-xl">
              <div className="relative aspect-video">
                <img
                  src={trackDetails?.image_url || '/placeholder-track.jpg'}
                  alt={trackDetails?.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] to-transparent"></div>
                <div className="absolute bottom-4 left-6">
                  <div className="flex items-center gap-2 text-[var(--accent)] mb-1">
                    <MapPin size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {trackDetails?.city || 'Unknown Location'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black italic uppercase tracking-tight leading-none text-white">
                    {trackDetails?.name || 'Unknown Track'}
                  </h3>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-white/5 rounded-xl border border-[var(--glass-border)]">
                    <p className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest mb-1">
                      Length
                    </p>
                    <p className="font-bold">
                      {trackDetails?.length || '--'} m
                    </p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-[var(--glass-border)]">
                    <p className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest mb-1">
                      Country
                    </p>
                    <p className="font-bold uppercase text-[var(--accent)]">
                      {trackDetails?.country || '--'}
                    </p>
                  </div>
                </div>

                <a
                  href={`/tracks/${trackDetails?.uri}`}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[var(--accent)] text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:opacity-90 transition-all shadow-lg shadow-[var(--accent)]/20"
                >
                  <ChevronRight size={14} /> View Track Details
                </a>
                <a
                  href={practice?.join_link}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-red-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:opacity-90 transition-all shadow-lg shadow-[var(--accent)]/20"
                >
                  <ArrowRight size={14} /> Join Practice Session
                </a>
              </div>
            </div>

            {/* SESSION INFO CARD */}
            <div className="glass rounded-3xl p-6 border-[var(--glass-border)]">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Info size={14} className="text-[var(--accent)]" /> Session Info
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-[var(--glass-border)]">
                  <span className="text-[var(--muted)] font-medium">Type</span>
                  <span className="font-bold uppercase tracking-tighter italic">
                    {practice.server_tag || 'Standard'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[var(--glass-border)]">
                  <span className="text-[var(--muted)] font-medium">
                    Max Players
                  </span>
                  <span className="font-bold uppercase tracking-tighter italic">
                    {practice.max_players || 16}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[var(--glass-border)]">
                  <span className="text-[var(--muted)] font-medium">
                    Created
                  </span>
                  <span className="text-green-500 font-bold uppercase text-[10px]">
                    {new Date(practice.created_at).toLocaleDateString(
                      undefined,
                      {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      },
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: CAR LIST */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                <Info className="text-[var(--accent)]" /> Live Server Data
              </h3>
            </div>

            <div className="mb-10">
              <LiveServerInfo serverId={practice.live_api_url} />
            </div>

            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                <Car className="text-[var(--accent)]" /> Available Vehicles
              </h3>
              <div className="px-3 py-1 bg-white/5 border border-[var(--glass-border)] rounded-lg text-[10px] font-bold text-[var(--muted)] uppercase">
                {practice.practice_cars?.length || 0} Models
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {practice.practice_cars && practice.practice_cars.length > 0 ? (
                practice.practice_cars.map((pc: any) => {
                  const car = pc.cars;
                  return (
                    <div
                      key={car.id}
                      className="group glass rounded-3xl border-[var(--glass-border)] overflow-hidden hover:border-[var(--accent)]/50 transition-all duration-500"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-black/40">
                        <img
                          src={car.image_url || '/placeholder-car.jpg'}
                          alt={car.name}
                          className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute top-4 right-4">
                          <span className="bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest text-white">
                            {car.brand || 'Racing Spec'}
                          </span>
                        </div>
                      </div>

                      <div className="p-6 bg-gradient-to-b from-transparent to-white/5">
                        <h4 className="text-xl font-black italic uppercase tracking-tighter mb-4 leading-none group-hover:text-[var(--accent)] transition-colors">
                          {car.name}
                        </h4>

                        <div className="grid grid-cols-1 gap-2">
                          <Link
                            href={`/cars/${car.uri}`}
                            className="bg-[var(--accent)] hover:opacity-90 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition shadow-lg shadow-[var(--accent)]/20 text-center"
                          >
                            View Car Details
                          </Link>

                          {car.skin_url && (
                            <a
                              href={car.skin_url}
                              className="bg-transparent border border-[var(--glass-border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--foreground)] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition text-center"
                            >
                              Download Official Skin
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-20 text-center glass rounded-3xl border-dashed border-[var(--glass-border)]">
                  <p className="text-[var(--muted)] italic font-mono uppercase tracking-widest text-sm">
                    No vehicles assigned to this session.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
