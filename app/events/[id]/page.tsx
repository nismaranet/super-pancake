import { supabase } from '@/lib/supabaseClient';
import EventResult from '@/components/EventResult';
import EventRegistration from '@/components/EventRegistration';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Clock,
  Info,
  Users,
  ChevronRight,
  Timer,
  ExternalLink,
  Car,
} from 'lucide-react';

export default async function EventDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 1. Fetch Event & Track
  const { data: event } = await supabase
    .from('events')
    .select('*, tracks (*)')
    .eq('id', id)
    .single();

  // 2. Fetch Eligible Cars
  const { data: eventCars } = await supabase
    .from('event_cars')
    .select(`id, car_id, cars (id, name, brand, image_url)`)
    .eq('event_id', id);

  // 3. Fetch Participants & Profiles
  const { data: participantsData } = await supabase
    .from('event_participants')
    .select('*')
    .eq('event_id', id)
    .order('created_at', { ascending: true });

  let participants = participantsData || [];

  if (participants.length > 0) {
    const userIds = participants.map((p) => p.user_id).filter(Boolean);
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      participants = participants.map((p) => {
        const profile = profiles?.find((pr) => pr.id === p.user_id);
        return { ...p, profile };
      });
    }
  }

  if (!event) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950 text-blue-500 font-black uppercase italic tracking-widest">
        Event Not Found
      </div>
    );
  }

  const eventDate = new Date(event.event_date);
  const now = new Date();
  const isPassed = now > eventDate;
  const maxParticipants = event.max_participants || 40;

  // LOGIKA DYNAMIC LAYOUT: Sidebar hanya muncul jika event belum selesai
  const showSidebar = !isPassed;

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 pb-20">
      {/* --- HERO BANNER --- */}
      <div className="relative h-[40vh] md:h-[60vh] overflow-hidden">
        {event.image_url ? (
          <img
            src={event.image_url}
            className="w-full h-full object-cover opacity-50"
            alt="Banner"
          />
        ) : (
          <div className="w-full h-full bg-gray-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />

        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${isPassed ? 'border-gray-700 text-gray-500' : 'border-blue-500/50 text-blue-400 bg-blue-500/10'}`}
              >
                {isPassed ? 'Race Finished' : 'Upcoming Event'}
              </span>
              <span className="bg-purple-600 text-white px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                {event.event_tag || 'Special Event'}
              </span>
            </div>
            <h1 className="text-4xl md:text-7xl font-black italic text-white uppercase tracking-tighter leading-none mb-6 max-w-4xl">
              {event.title}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        {/* GRID UTAMA - DYNAMIC LAYOUT */}
        <div
          className={
            showSidebar
              ? 'grid lg:grid-cols-3 gap-10 items-start relative'
              : 'space-y-16 relative'
          }
        >
          {/* --- MAIN CONTENT (FULL WIDTH JIKA TIDAK ADA SIDEBAR) --- */}
          <div
            className={
              showSidebar
                ? 'lg:col-span-2 space-y-16 pb-12'
                : 'space-y-16 pb-12'
            }
          >
            {/* Quick Stats Grid (DIHAPUS max-w-4xl-nya) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-900/50 border border-gray-800 p-5 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">
                    Date
                  </p>
                  <p className="text-sm font-black text-white">
                    {eventDate.toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 p-5 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">
                    Time
                  </p>
                  <p className="text-sm font-black text-white">
                    {eventDate.toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    {event.timezone}
                  </p>
                </div>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 p-5 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                  <Timer size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">
                    Class
                  </p>
                  <p className="text-sm font-black text-white uppercase">
                    {event.event_class || 'Open'}
                  </p>
                </div>
              </div>
            </div>

            {/* Circuit Card (DIHAPUS max-w-4xl-nya) */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-[2rem] overflow-hidden shadow-xl">
              <div className="relative h-48 bg-gray-800">
                {event.tracks?.image_url && (
                  <img
                    src={event.tracks.image_url}
                    className="w-full h-full object-cover opacity-40"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
                <div className="absolute bottom-6 left-8">
                  <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">
                    {event.tracks?.name || 'TBA'}
                  </h2>
                  <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest flex items-center gap-1">
                    <MapPin size={10} /> {event.tracks?.city},{' '}
                    {event.tracks?.country}
                  </p>
                </div>
              </div>
              <div className="p-8 grid grid-cols-3 gap-6 text-center border-t border-gray-800/50">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">
                    Length
                  </p>
                  <p className="text-md font-black text-white">
                    {event.tracks?.length || '-'}
                  </p>
                </div>
                <div className="border-x border-gray-800">
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">
                    Pitboxes
                  </p>
                  <p className="text-md font-black text-white">
                    {event.tracks?.pitboxes || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">
                    Direction
                  </p>
                  <p className="text-md font-black text-white uppercase">
                    {event.tracks?.run_direction || '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Briefing */}
            {!isPassed && event.description && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Info size={18} className="text-blue-500" />
                  <h3 className="text-lg font-black italic text-white uppercase tracking-tighter">
                    Event Briefing
                  </h3>
                </div>
                <div
                  className="bg-gray-900/30 border border-gray-800 p-8 rounded-[2rem] text-gray-400 text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: event.description }}
                />
              </div>
            )}

            {/* Results (Lebar Penuh jika balapan selesai) */}
            {isPassed && (
              <div className="space-y-4">
                <EventResult results={event.results || []} />
              </div>
            )}

            {/* --- APPROVED VEHICLES (DYNAMIC GRID) --- */}
            <div className="pt-8 border-t border-white/5">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                  <Car size={24} />
                </div>
                <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">
                  Approved Vehicles
                </h2>
              </div>

              <div
                className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${!showSidebar ? 'lg:grid-cols-4' : ''} gap-4`}
              >
                {eventCars?.map((item: any) => (
                  <Link
                    href={`/cars/${item.cars.id}`}
                    key={item.id}
                    className="flex flex-col bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden group hover:border-blue-500/50 transition-all"
                  >
                    <div className="h-32 bg-gray-950 relative overflow-hidden">
                      {item.cars.image_url ? (
                        <img
                          src={item.cars.image_url}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          alt={item.cars.name}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-gray-600 italic uppercase">
                          No Image
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
                      <div className="absolute top-3 right-3 bg-black/60 p-1.5 rounded-lg backdrop-blur-md">
                        <ExternalLink
                          size={14}
                          className="text-gray-400 group-hover:text-blue-400 transition-colors"
                        />
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mb-1">
                        {item.cars.brand}
                      </p>
                      <h4 className="text-sm font-black text-gray-200 uppercase truncate group-hover:text-blue-400 transition-colors">
                        {item.cars.name}
                      </h4>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* --- ENTRY LIST (DYNAMIC GRID) --- */}
            <div className="pt-8 border-t border-white/5">
              <div className="flex justify-between items-end mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
                    <Users size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">
                      Entry List
                    </h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                      Registered Drivers
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black italic tracking-tighter text-white">
                    {participants.length}{' '}
                    <span className="text-gray-600 text-xl">
                      / {maxParticipants}
                    </span>
                  </p>
                </div>
              </div>

              {participants.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-gray-800 rounded-3xl">
                  <Users className="mx-auto text-gray-700 mb-4" size={48} />
                  <p className="text-sm font-black text-gray-500 uppercase tracking-widest italic">
                    Belum ada pembalap yang terdaftar
                  </p>
                </div>
              ) : (
                <div
                  className={`grid grid-cols-1 sm:grid-cols-2 ${!showSidebar ? 'lg:grid-cols-3' : ''} gap-6`}
                >
                  {participants.map((p) => (
                    <div
                      key={p.id}
                      className="relative p-5 bg-gray-900/40 border border-gray-800 rounded-2xl group hover:border-purple-500/30 transition-colors flex flex-col gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img
                            src={
                              p.profile?.avatar_url ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.driver_name}`
                            }
                            className="w-14 h-14 rounded-2xl object-cover border border-white/10"
                            alt={p.driver_name}
                          />
                          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gray-950 rounded-lg flex items-center justify-center font-black italic text-blue-500 text-[10px] border border-gray-800">
                            {p.driver_number}
                          </div>
                        </div>
                        <div className="flex-grow overflow-hidden">
                          {p.profile?.username ? (
                            <Link
                              href={`/profile/${p.profile.username}`}
                              className="font-black text-sm uppercase text-white hover:text-purple-400 transition-colors truncate block"
                            >
                              {p.driver_name}
                            </Link>
                          ) : (
                            <span className="font-black text-sm uppercase text-white truncate block">
                              {p.driver_name}
                            </span>
                          )}
                          <p className="text-[10px] text-gray-500 font-bold uppercase truncate tracking-widest mt-0.5">
                            {p.team_name}
                          </p>
                        </div>
                      </div>
                      <div className="bg-black/50 p-3 rounded-xl border border-white/5 flex items-center gap-3">
                        {p.car_image ? (
                          <img
                            src={p.car_image}
                            className="w-10 h-6 object-cover rounded shadow"
                            alt="Car"
                          />
                        ) : (
                          <Car size={16} className="text-gray-600" />
                        )}
                        <span className="text-[10px] font-bold text-gray-300 uppercase truncate">
                          {p.car_name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* --- RIGHT CONTENT (STICKY SIDEBAR) --- */}
          {showSidebar && (
            <div className="lg:col-span-1 sticky top-32 space-y-6 z-10">
              <EventRegistration
                eventId={id}
                eventCars={eventCars}
                isPassed={isPassed}
                isRegistrationOpen={event.is_registration_open}
                maxParticipants={maxParticipants}
                currentParticipants={participants.length}
              />

              {!isPassed && event.practice_server && (
                <a
                  href={event.practice_server}
                  className="flex items-center justify-between w-full p-6 bg-gray-900/80 border border-gray-700 hover:bg-gray-800 text-white rounded-2xl shadow-xl transition-all group"
                >
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">
                      Live Server
                    </p>
                    <p className="text-lg font-black uppercase tracking-tighter leading-none">
                      Join Practice
                    </p>
                  </div>
                  <ChevronRight className="group-hover:translate-x-1 transition-transform text-gray-500" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
