import { supabase } from '@/lib/supabaseClient';
import EventResult from '@/components/EventResult';
import EventRegistration from '@/components/EventRegistration';
import ReactMarkdown from 'react-markdown';
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
  params: Promise<{ uri: string }>;
}) {
  const { uri } = await params;

  // 1. Fetch Event & Track
  const { data: event } = await supabase
    .from('events')
    .select('*, tracks (*)')
    .eq('uri', uri)
    .single();

  // 2. Fetch Eligible Cars
  const { data: eventCars } = await supabase
    .from('event_cars')
    .select(`id, car_id, cars (id, name, brand, image_url, uri)`)
    .eq('event_id', event.id);

  const { data: practices } = await supabase
    .from('practices')
    .select('*')
    .eq('id', event.practice_server)
    .single();

  // 3. Fetch Participants & Profiles
  const { data: participantsData } = await supabase
    .from('event_participants')
    .select('*')
    .eq('event_id', event.id)
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
      <div className="h-screen flex items-center justify-center bg-[var(--background)] text-[var(--accent)] font-black uppercase italic tracking-widest transition-colors duration-300">
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
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-20 transition-colors duration-300">
      {/* --- HERO BANNER --- */}
      <div className="relative h-[40vh] md:h-[60vh] overflow-hidden">
        {event.image_url ? (
          <img
            src={event.image_url}
            className="w-full h-full object-cover opacity-50"
            alt="Banner"
          />
        ) : (
          <div className="w-full h-full bg-[var(--card)]" />
        )}
        {/* Gradient Overlay Menyesuaikan Theme */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/60 to-transparent" />

        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${
                  isPassed
                    ? 'border-[var(--card-border)] text-[var(--muted)]'
                    : 'border-blue-500/50 text-blue-500 bg-blue-500/10'
                }`}
              >
                {isPassed ? 'Race Finished' : 'Upcoming Event'}
              </span>
              <span className="bg-[var(--accent)] text-white px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shadow-lg">
                {event.event_tag || 'Special Event'}
              </span>
            </div>
            <h1 className="text-4xl md:text-7xl font-black italic text-[var(--foreground)] uppercase tracking-tighter leading-none mb-6 max-w-4xl drop-shadow-md">
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
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[var(--card)] border border-[var(--card-border)] p-5 rounded-2xl flex items-center gap-4 transition-colors hover:border-[var(--accent)] shadow-sm">
                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-[var(--muted)] uppercase font-bold">
                    Date
                  </p>
                  <p className="text-sm font-black text-[var(--foreground)]">
                    {eventDate.toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <div className="bg-[var(--card)] border border-[var(--card-border)] p-5 rounded-2xl flex items-center gap-4 transition-colors hover:border-[var(--accent)] shadow-sm">
                <div className="p-3 bg-purple-500/10 rounded-xl text-[var(--accent)]">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-[var(--muted)] uppercase font-bold">
                    Time
                  </p>
                  <p className="text-sm font-black text-[var(--foreground)]">
                    {eventDate.toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    {event.timezone}
                  </p>
                </div>
              </div>
              <div className="bg-[var(--card)] border border-[var(--card-border)] p-5 rounded-2xl flex items-center gap-4 transition-colors hover:border-[var(--accent)] shadow-sm">
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                  <Timer size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-[var(--muted)] uppercase font-bold">
                    Class
                  </p>
                  <p className="text-sm font-black text-[var(--foreground)] uppercase">
                    {event.event_class || 'Open'}
                  </p>
                </div>
              </div>
            </div>

            {/* Circuit Card */}
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-[2rem] overflow-hidden shadow-md transition-colors">
              <div className="relative h-48 bg-[var(--background)]">
                {event.tracks?.image_url && (
                  <img
                    src={event.tracks.image_url}
                    className="w-full h-full object-cover opacity-40 mix-blend-luminosity hover:mix-blend-normal transition duration-500"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--card)] to-transparent" />
                <div className="absolute bottom-6 left-8">
                  <h2 className="text-3xl font-black italic text-[var(--foreground)] uppercase tracking-tighter">
                    {event.tracks?.name || 'TBA'}
                  </h2>
                  <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest flex items-center gap-1">
                    <MapPin size={10} /> {event.tracks?.city},{' '}
                    {event.tracks?.country}
                  </p>
                </div>
              </div>
              <div className="p-8 grid grid-cols-3 gap-6 text-center border-t border-[var(--card-border)]">
                <div>
                  <p className="text-[10px] text-[var(--muted)] uppercase font-bold mb-1">
                    Length
                  </p>
                  <p className="text-md font-black text-[var(--foreground)]">
                    {event.tracks?.length || '-'}
                  </p>
                </div>
                <div className="border-x border-[var(--card-border)]">
                  <p className="text-[10px] text-[var(--muted)] uppercase font-bold mb-1">
                    Pitboxes
                  </p>
                  <p className="text-md font-black text-[var(--foreground)]">
                    {event.tracks?.pitboxes || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--muted)] uppercase font-bold mb-1">
                    Direction
                  </p>
                  <p className="text-md font-black text-[var(--foreground)] uppercase">
                    {event.tracks?.run_direction || '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* EVENT DESCRIPTION SECTION */}
            {!isPassed && event.description && (
              <section className="bg-[var(--card)] border border-[var(--card-border)] p-8 rounded-[2rem] shadow-sm transition-all overflow-hidden relative group">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-transparent opacity-50" />

                <h2 className="text-xl font-black italic text-[var(--foreground)] uppercase tracking-tighter mb-6 flex items-center gap-3">
                  <Info size={20} className="text-purple-500" />
                  Race Information & Briefing
                </h2>

                <div
                  className="prose prose-sm max-w-none text-[var(--muted)] leading-relaxed
                  prose-headings:text-[var(--foreground)] prose-headings:italic prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter
                  prose-strong:text-purple-400 prose-strong:font-bold
                  prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-a:font-bold
                  prose-ul:list-disc prose-ul:ml-5
                  prose-ol:list-decimal prose-ol:ml-5
                  prose-li:marker:text-purple-500
                  whitespace-pre-wrap"
                >
                  <ReactMarkdown>{event.description}</ReactMarkdown>
                </div>
              </section>
            )}

            {/* Results */}
            {isPassed && (
              <div className="space-y-4">
                <EventResult results={event.results || []} />
              </div>
            )}

            {/* --- APPROVED VEHICLES (DYNAMIC GRID) --- */}
            <div className="pt-8 border-t border-[var(--card-border)]">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                  <Car size={24} />
                </div>
                <h2 className="text-2xl font-black italic text-[var(--foreground)] uppercase tracking-tighter">
                  Approved Vehicles
                </h2>
              </div>

              <div
                className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${!showSidebar ? 'lg:grid-cols-4' : ''} gap-4`}
              >
                {eventCars?.map((item: any) => (
                  <Link
                    href={`/cars/${item.cars.uri}`}
                    key={item.car_id}
                    className="flex flex-col bg-[var(--card)] border border-[var(--card-border)] rounded-2xl overflow-hidden group hover:border-blue-500 transition-all shadow-sm"
                  >
                    <div className="h-32 bg-[var(--background)] relative overflow-hidden">
                      {item.cars.image_url ? (
                        <img
                          src={item.cars.image_url}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          alt={item.cars.name}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-[var(--muted)] italic uppercase">
                          No Image
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--card)] to-transparent" />
                      <div className="absolute top-3 right-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] p-1.5 rounded-lg backdrop-blur-md">
                        <ExternalLink
                          size={14}
                          className="text-[var(--foreground)] group-hover:text-blue-500 transition-colors"
                        />
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-widest leading-none mb-1">
                        {item.cars.brand}
                      </p>
                      <h4 className="text-sm font-black text-[var(--foreground)] uppercase truncate group-hover:text-blue-500 transition-colors">
                        {item.cars.name}
                      </h4>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* --- ENTRY LIST (DYNAMIC GRID) --- */}
            <div className="pt-8 border-t border-[var(--card-border)]">
              <div className="flex justify-between items-end mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-500/10 rounded-xl text-[var(--accent)]">
                    <Users size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black italic text-[var(--foreground)] uppercase tracking-tighter">
                      Entry List
                    </h2>
                    <p className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-widest">
                      Registered Drivers
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black italic tracking-tighter text-[var(--foreground)]">
                    {participants.length}{' '}
                    <span className="text-[var(--muted)] text-xl font-bold">
                      / {maxParticipants}
                    </span>
                  </p>
                </div>
              </div>

              {participants.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-[var(--card-border)] rounded-3xl bg-[var(--card)]">
                  <Users
                    className="mx-auto text-[var(--muted)] opacity-50 mb-4"
                    size={48}
                  />
                  <p className="text-sm font-black text-[var(--muted)] uppercase tracking-widest italic">
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
                      className="relative p-5 bg-[var(--card)] border border-[var(--card-border)] rounded-2xl group hover:border-[var(--accent)] hover:shadow-md transition-all flex flex-col gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img
                            src={
                              p.profile?.avatar_url ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.driver_name}`
                            }
                            className="w-14 h-14 rounded-2xl object-cover border border-[var(--card-border)]"
                            alt={p.driver_name}
                          />
                          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[var(--background)] rounded-lg flex items-center justify-center font-black italic text-blue-500 text-[10px] border border-[var(--card-border)] shadow-sm">
                            {p.driver_number}
                          </div>
                        </div>
                        <div className="flex-grow overflow-hidden">
                          {p.profile?.username ? (
                            <Link
                              href={`/profile/${p.profile.username}`}
                              className="font-black text-sm uppercase text-[var(--foreground)] hover:text-[var(--accent)] transition-colors truncate block"
                            >
                              {p.driver_name}
                            </Link>
                          ) : (
                            <span className="font-black text-sm uppercase text-[var(--foreground)] truncate block">
                              {p.driver_name}
                            </span>
                          )}
                          <p className="text-[10px] text-[var(--muted)] font-bold uppercase truncate tracking-widest mt-0.5">
                            {p.team_name}
                          </p>
                        </div>
                      </div>
                      <div className="bg-[var(--background)] p-3 rounded-xl border border-[var(--card-border)] flex items-center gap-3">
                        {p.car_image ? (
                          <img
                            src={p.car_image}
                            className="w-10 h-6 object-cover rounded shadow-sm"
                            alt="Car"
                          />
                        ) : (
                          <Car size={16} className="text-[var(--muted)]" />
                        )}
                        <span className="text-[10px] font-bold text-[var(--foreground)] uppercase truncate">
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
                eventId={event.id}
                eventName={event.title}
                eventCars={eventCars}
                isPassed={isPassed}
                entryFee={event.entry_fee}
                isRegistrationOpen={event.is_registration_open}
                maxParticipants={maxParticipants}
                currentParticipants={participants.length}
              />

              {!isPassed && event.practice_server && (
                <a
                  href={`/practice-servers/${practices.uri}`}
                  key={event.practice_server}
                  className="flex items-center justify-between w-full p-6 bg-[var(--card)] border border-[var(--card-border)] hover:bg-[var(--background)] hover:border-[var(--accent)] rounded-2xl shadow-md transition-all group"
                >
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)] mb-1">
                      Live Server
                    </p>
                    <p className="text-lg font-black uppercase tracking-tighter text-[var(--foreground)] leading-none">
                      Join Practice
                    </p>
                  </div>
                  <ChevronRight className="group-hover:translate-x-1 transition-transform text-[var(--foreground)]" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
