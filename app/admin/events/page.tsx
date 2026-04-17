'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Editor from '@/components/Editor';
import {
  Trash2,
  Plus,
  Edit3,
  Car,
  X,
  MapPin,
  ChevronRight,
  Search,
  Zap,
  Clock,
  ChevronLeft,
  AlertCircle,
  Upload,
  FileJson,
  Users,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
} from 'lucide-react';

export default function EventsAdmin() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [maxParticipants, setMaxParticipants] = useState(40);

  const [pastPage, setPastPage] = useState(1);
  const itemsPerPage = 5;

  // ================= DATA STATES =================
  const [events, setEvents] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [availableCars, setAvailableCars] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // ================= FORM STATES =================
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [timezone, setTimezone] = useState('WIB');
  const [selectedTrackId, setSelectedTrackId] = useState('');
  const [practiceServer, setPracticeServer] = useState('');
  const [eventClass, setEventClass] = useState('');
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(true); // <--- NEW STATE
  const [results, setResults] = useState<any[]>([]);

  // ================= MODAL STATES =================
  const [currentEventCars, setCurrentEventCars] = useState<any[]>([]);
  const [carSearch, setCarSearch] = useState('');

  const [selectedParticipantEvent, setSelectedParticipantEvent] =
    useState<any>(null);
  const [eventParticipants, setEventParticipants] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: eventsData } = await supabase
        .from('events')
        .select('*, tracks(name)')
        .order('event_date', { ascending: false });

      const { data: tracksData } = await supabase.from('tracks').select('*');
      const { data: carsData } = await supabase.from('cars').select('*');

      setEvents(eventsData || []);
      setTracks(tracksData || []);
      setAvailableCars(carsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ================= VEHICLE METHODS =================
  const fetchEventCars = async (eventId: string) => {
    const { data } = await supabase
      .from('event_cars')
      .select('*, cars(name, brand)')
      .eq('event_id', eventId);
    setCurrentEventCars(data || []);
  };

  const addVehicle = async (carId: string) => {
    if (!selectedEvent) return;
    await supabase
      .from('event_cars')
      .insert([{ event_id: selectedEvent.id, car_id: carId }]);
    fetchEventCars(selectedEvent.id);
  };

  const removeVehicle = async (id: string) => {
    await supabase.from('event_cars').delete().eq('id', id);
    fetchEventCars(selectedEvent.id);
  };

  // ================= PARTICIPANT METHODS =================
  const fetchEventParticipants = async (eventId: string) => {
    const { data } = await supabase
      .from('event_participants')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });
    setEventParticipants(data || []);
  };

  const removeParticipant = async (
    participantId: string,
    driverName: string,
  ) => {
    if (confirm(`Keluarkan ${driverName} dari event ini?`)) {
      await supabase
        .from('event_participants')
        .delete()
        .eq('id', participantId);
      fetchEventParticipants(selectedParticipantEvent.id);
    }
  };

  // ================= JSON FILE UPLOAD =================
  const handleFileUpload = (index: number, file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const jsonContent = JSON.parse(content);
        updateResultSession(index, 'url', jsonContent);
      } catch (err) {
        alert('File yang diupload bukan format JSON yang valid!');
      }
    };
    reader.readAsText(file);
  };

  const addResultSession = () =>
    setResults([...results, { session: '', url: '' }]);
  const removeResultSession = (index: number) =>
    setResults(results.filter((_, i) => i !== index));
  const updateResultSession = (index: number, field: string, value: any) => {
    const newResults = [...results];
    newResults[index][field] = value;
    setResults(newResults);
  };

  // ================= EVENT METHODS =================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const eventData = {
      title,
      description,
      event_tag: tag,
      image_url: imageUrl,
      event_date: eventDate,
      timezone,
      event_class: eventClass,
      track_id: selectedTrackId,
      practice_server: practiceServer,
      max_participants: maxParticipants,
      is_registration_open: isRegistrationOpen, // <--- SAVE FLAG
      results: results,
    };

    if (editingId) {
      const { error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', editingId);
      if (!error) {
        setEditingId(null);
        resetForm();
        fetchData();
      }
    } else {
      const { error } = await supabase.from('events').insert([eventData]);
      if (!error) {
        resetForm();
        fetchData();
      }
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTag('');
    setImageUrl('');
    setEventDate('');
    setTimezone('WIB');
    setSelectedTrackId('');
    setPracticeServer('');
    setEventClass('');
    setMaxParticipants(20);
    setIsRegistrationOpen(true);
    setResults([]);
    setEditingId(null);
  };

  const handleEdit = (event: any) => {
    setEditingId(event.id);
    setTitle(event.title || '');
    setDescription(event.description || '');
    setTag(event.event_tag || '');
    setImageUrl(event.image_url || '');
    setEventDate(event.event_date || '');
    setTimezone(event.timezone || 'WIB');
    setSelectedTrackId(event.track_id || '');
    setPracticeServer(event.practice_server || '');
    setEventClass(event.event_class || '');
    setMaxParticipants(event.max_participants || '');
    setIsRegistrationOpen(event.is_registration_open ?? true);
    setResults(event.results || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      await supabase.from('events').delete().eq('id', id);
      fetchData();
    }
  };

  // ================= RANKED PROCESS =================
  const handleProcessRanked = async (eventId: string) => {
    const { data: eventCheck } = await supabase
      .from('events')
      .select('results, is_processed')
      .eq('id', eventId)
      .single();
    if (eventCheck?.is_processed) return alert('Event ini sudah diproses!');
    if (!window.confirm('Proses Safety Rating & XP untuk event ini?')) return;

    try {
      if (!eventCheck?.results)
        throw new Error('Data results tidak ditemukan.');
      const allSessions = eventCheck.results as any[];
      const userUpdates: Record<
        string,
        {
          xp: number;
          laps: number;
          collisions: number;
          cuts: number;
          wins: number;
          podiums: number;
        }
      > = {};

      allSessions.forEach((sessionObj) => {
        const json = sessionObj.url;
        const isRace = sessionObj.session.toLowerCase().includes('race');
        const events = json.Events || [];

        json.Result.forEach((res: any, index: number) => {
          const guid = res.DriverGuid;
          if (!guid) return;
          if (!userUpdates[guid])
            userUpdates[guid] = {
              xp: 0,
              laps: 0,
              collisions: 0,
              cuts: 0,
              wins: 0,
              podiums: 0,
            };

          userUpdates[guid].laps += res.NumLaps || 0;
          let gainedXP = (res.NumLaps || 0) * 15;

          if (isRace) {
            if (index === 0) gainedXP += 100;
            else if (index === 1) gainedXP += 50;
            else if (index === 2) gainedXP += 25;

            // Standar Motorsport: P1 masuk hitungan Win & Podium
            if (index === 0) userUpdates[guid].wins += 1;
            if (index <= 2) userUpdates[guid].podiums += 1;
          }

          userUpdates[guid].xp += gainedXP;
          userUpdates[guid].collisions += events.filter(
            (e: any) =>
              (e.CarId === res.CarId || e.OtherCarId === res.CarId) &&
              e.Type === 'COLLISION_WITH_CAR',
          ).length;
          userUpdates[guid].cuts +=
            json.Laps?.filter((l: any) => l.DriverGuid === guid).reduce(
              (sum: number, l: any) => sum + (l.Cuts || 0),
              0,
            ) || 0;
        });
      });

      for (const [guid, stats] of Object.entries(userUpdates)) {
        const { data: profile } = await supabase
          .from('profiles')
          .select(
            'id, total_xp, safety_rating, total_starts, total_wins, total_podiums',
          )
          .eq('steam_guid', guid)
          .maybeSingle();
        if (!profile) continue;

        const rawPenalty = stats.collisions * 0.5 + stats.cuts * 0.1;
        const lapDivider = Math.max(1, stats.laps / 5);
        const finalSrChange = parseFloat(
          (1 - rawPenalty / lapDivider).toFixed(2),
        );

        await supabase.from('event_driver_stats').insert({
          user_id: profile.id,
          event_id: eventId,
          laps_completed: stats.laps,
          collisions: stats.collisions,
          cuts: stats.cuts,
          xp_gained: stats.xp,
          sr_change: finalSrChange,
        });
        await supabase
          .from('profiles')
          .update({
            total_xp: (profile.total_xp || 0) + stats.xp,
            safety_rating: Math.max(
              0,
              Math.min(100, (profile.safety_rating || 2.5) + finalSrChange),
            ),
            total_starts: (profile.total_starts || 0) + 1,
            total_wins: (profile.total_wins || 0) + stats.wins,
            total_podiums: (profile.total_podiums || 0) + stats.podiums,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id);
      }

      await supabase
        .from('events')
        .update({ is_processed: true })
        .eq('id', eventId);
      alert('Proses Selesai!');
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const now = new Date();
  const ongoingEvents = events
    .filter((e) => e.event_date && new Date(e.event_date) >= now)
    .sort(
      (a, b) =>
        new Date(a.event_date).getTime() - new Date(b.event_date).getTime(),
    );
  const pastEvents = events.filter(
    (e) => e.event_date && new Date(e.event_date) < now,
  );

  return (
    <div className="p-8 pb-24">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Manage Events</h1>
        <button
          onClick={resetForm}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
        >
          <Plus size={18} /> New Event
        </button>
      </div>

      {/* FORM EVENT */}
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-6 rounded-xl mb-8 space-y-4 shadow-xl border border-white/5"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase">
              Event Title
            </label>
            <input
              type="text"
              className="w-full bg-gray-900 border border-white/5 p-2 rounded-lg outline-none focus:border-blue-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase">
              Tag / Category
            </label>
            <input
              type="text"
              className="w-full bg-gray-900 border border-white/5 p-2 rounded-lg outline-none focus:border-blue-500"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2 md:col-span-1">
            <label className="text-xs font-bold text-gray-400 uppercase">
              Date & Time
            </label>
            <input
              type="datetime-local"
              className="w-full bg-gray-900 border border-white/5 p-2 rounded-lg outline-none focus:border-blue-500"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2 md:col-span-1">
            <label className="text-xs font-bold text-gray-400 uppercase">
              Timezone
            </label>
            <select
              className="w-full bg-gray-900 border border-white/5 p-2 rounded-lg outline-none focus:border-blue-500"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              <option value="WIB">WIB (UTC+7)</option>
              <option value="WITA">WITA (UTC+8)</option>
              <option value="WIT">WIT (UTC+9)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase">
              Max Participants
            </label>
            <input
              type="number"
              className="w-full bg-gray-900 border border-white/5 p-2 rounded-lg outline-none focus:border-blue-500"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
              required
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-gray-400 uppercase">
              Track
            </label>
            <select
              className="w-full bg-gray-900 border border-white/5 p-2 rounded-lg outline-none focus:border-blue-500"
              value={selectedTrackId}
              onChange={(e) => setSelectedTrackId(e.target.value)}
              required
            >
              <option value="">Select Track</option>
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div className="space-y-2 md:col-span-1">
            <label className="text-xs font-bold text-gray-400 uppercase">
              Event Class
            </label>
            <input
              type="text"
              className="w-full bg-gray-900 border border-white/5 p-2 rounded-lg outline-none focus:border-blue-500"
              value={eventClass}
              onChange={(e) => setEventClass(e.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-gray-400 uppercase">
              Practice Server URL / IP
            </label>
            <input
              type="text"
              className="w-full bg-gray-900 border border-white/5 p-2 rounded-lg outline-none focus:border-blue-500"
              value={practiceServer}
              onChange={(e) => setPracticeServer(e.target.value)}
            />
          </div>

          {/* TOGGLE REGISTRATION */}
          <div className="md:col-span-1 flex flex-col justify-center bg-gray-900 border border-white/5 p-3 rounded-lg mt-5 md:mt-0">
            <label className="text-[10px] font-bold text-gray-400 uppercase flex justify-between w-full mb-1">
              Registration Status
              <span
                className={
                  isRegistrationOpen ? 'text-green-400' : 'text-red-400'
                }
              >
                {isRegistrationOpen ? 'OPEN' : 'CLOSED'}
              </span>
            </label>
            <button
              type="button"
              onClick={() => setIsRegistrationOpen(!isRegistrationOpen)}
              className="flex items-center text-white"
            >
              {isRegistrationOpen ? (
                <ToggleRight size={32} className="text-green-500" />
              ) : (
                <ToggleLeft size={32} className="text-gray-600" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase">
            Image URL Banner
          </label>
          <input
            type="text"
            className="w-full bg-gray-900 border border-white/5 p-2 rounded-lg outline-none focus:border-blue-500"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>

        <Editor value={description} onChange={setDescription} />

        {editingId && (
          <div className="bg-gray-950/50 p-6 rounded-2xl border border-white/5 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black uppercase italic text-blue-500">
                Event Results (JSON)
              </h3>
              <button
                type="button"
                onClick={addResultSession}
                className="text-[10px] bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg font-black uppercase tracking-widest"
              >
                + Add Session
              </button>
            </div>
            <div className="space-y-6">
              {results.map((res: any, index: number) => (
                <div
                  key={index}
                  className="p-5 bg-black/40 rounded-xl border border-white/5 relative group"
                >
                  <button
                    type="button"
                    onClick={() => removeResultSession(index)}
                    className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">
                        Session Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. RACE 1"
                        className="w-full bg-gray-900 border border-white/10 p-3 rounded-lg text-xs font-black uppercase"
                        value={res.session}
                        onChange={(e) =>
                          updateResultSession(index, 'session', e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">
                        JSON File
                      </label>
                      <div
                        className={`relative border-2 border-dashed rounded-lg p-3 flex flex-col items-center justify-center transition-all ${res.url ? 'border-green-500/50 bg-green-500/5' : 'border-white/10'}`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleFileUpload(index, e.dataTransfer.files[0]);
                        }}
                      >
                        <input
                          type="file"
                          accept=".json"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) =>
                            e.target.files &&
                            handleFileUpload(index, e.target.files[0])
                          }
                        />
                        {res.url ? (
                          <div className="flex items-center gap-2 text-green-400">
                            <FileJson size={14} />{' '}
                            <span className="text-[10px] font-bold">
                              File Loaded
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-500">
                            <Upload size={14} />{' '}
                            <span className="text-[10px]">
                              Drop JSON or Click
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-bold uppercase tracking-widest"
          >
            {editingId ? 'Update Event' : 'Create Event'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-6 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold uppercase tracking-widest"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* EVENT LISTS */}
      <div className="space-y-12">
        <div>
          <h2 className="text-xl font-black italic uppercase mb-6 flex items-center gap-2">
            <Zap size={20} className="text-blue-500" /> Ongoing Events
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ongoingEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={() => handleEdit(event)}
                onDelete={() => handleDelete(event.id)}
                onManageVehicles={() => {
                  setSelectedEvent(event);
                  fetchEventCars(event.id);
                }}
                onManageParticipants={() => {
                  setSelectedParticipantEvent(event);
                  fetchEventParticipants(event.id);
                }} // <--- ACTION BARU
              />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-black italic uppercase mb-6 flex items-center gap-2">
            <Clock size={20} className="text-gray-500" /> Past Events
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events
              .filter((e) => e.event_date && new Date(e.event_date) < now)
              .slice((pastPage - 1) * itemsPerPage, pastPage * itemsPerPage)
              .map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isPast
                  onProcess={() => handleProcessRanked(event.id)}
                  onEdit={() => handleEdit(event)}
                  onDelete={() => handleDelete(event.id)}
                  onManageVehicles={() => {
                    setSelectedEvent(event);
                    fetchEventCars(event.id);
                  }}
                  onManageParticipants={() => {
                    setSelectedParticipantEvent(event);
                    fetchEventParticipants(event.id);
                  }}
                />
              ))}
          </div>
        </div>
      </div>

      {/* MODAL 1: MANAGE VEHICLES */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#120821] border border-white/10 w-full max-w-3xl rounded-[2rem] overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black italic uppercase">
                  Manage Vehicles
                </h3>
                <p className="text-sm text-gray-400">{selectedEvent.title}</p>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">
                  Added ({currentEventCars.length})
                </h4>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {currentEventCars.map((ec) => (
                    <div
                      key={ec.id}
                      className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5"
                    >
                      <span className="text-sm font-bold truncate pr-4">
                        {ec.cars?.name}
                      </span>
                      <button
                        onClick={() => removeVehicle(ec.id)}
                        className="text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">
                  Available
                </h4>
                <input
                  type="text"
                  placeholder="Search cars..."
                  value={carSearch}
                  onChange={(e) => setCarSearch(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 p-2.5 rounded-xl text-sm mb-4"
                />
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-2">
                  {availableCars
                    .filter(
                      (c) => !currentEventCars.some((ec) => ec.car_id === c.id),
                    )
                    .filter((c) =>
                      c.name.toLowerCase().includes(carSearch.toLowerCase()),
                    )
                    .map((car) => (
                      <div
                        key={car.id}
                        className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5 group hover:border-white/20"
                      >
                        <span className="text-sm font-bold truncate pr-4">
                          {car.name}
                        </span>
                        <button
                          onClick={() => addVehicle(car.id)}
                          className="text-blue-500 bg-blue-500/10 p-1.5 rounded-lg opacity-0 group-hover:opacity-100"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: MANAGE PARTICIPANTS */}
      {selectedParticipantEvent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-[#120821] border border-white/10 w-full max-w-2xl rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header Modal */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <div>
                <h3 className="text-xl font-black italic uppercase flex items-center gap-2">
                  <Users className="text-blue-500" /> Entry List Management
                </h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                  {selectedParticipantEvent.title}
                </p>
              </div>
              <button
                onClick={() => setSelectedParticipantEvent(null)}
                className="text-gray-400 hover:text-white bg-white/5 p-2 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            {/* List Partisipan */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  Total Registered: {eventParticipants.length}
                </span>
                {!selectedParticipantEvent.is_registration_open && (
                  <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest">
                    Registrasi Ditutup
                  </span>
                )}
              </div>

              {eventParticipants.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-white/10 rounded-2xl">
                  <ShieldAlert
                    className="mx-auto text-gray-600 mb-2"
                    size={32}
                  />
                  <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                    Belum ada pembalap terdaftar.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {eventParticipants.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5 group hover:border-blue-500/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center font-black italic text-blue-500 border border-white/5">
                          {p.driver_number}
                        </div>
                        <div>
                          <h4 className="font-black text-sm uppercase text-white">
                            {p.driver_name}
                          </h4>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                            Team: {p.team_name} • Car: {p.car_name}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => removeParticipant(p.id, p.driver_name)}
                        className="p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-colors border border-red-500/20 opacity-0 group-hover:opacity-100"
                        title="Kick Driver"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EventCard({
  event,
  isPast,
  onEdit,
  onDelete,
  onManageVehicles,
  onManageParticipants,
  onProcess,
}: any) {
  return (
    <div
      className={`bg-gray-800/50 border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition group ${isPast && !event.is_processed ? 'ring-1 ring-orange-500/50' : ''}`}
    >
      <div className="h-32 bg-gray-900 relative overflow-hidden">
        <img
          src={event.image_url || '/placeholder.jpg'}
          className={`w-full h-full object-cover transition duration-500 ${isPast ? 'opacity-40 grayscale' : 'group-hover:scale-105'}`}
          alt=""
        />

        {/* Registration Badge Overlay */}
        {!isPast && (
          <div
            className={`absolute top-2 left-2 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest shadow-lg ${event.is_registration_open ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}
          >
            {event.is_registration_open ? 'Reg Open' : 'Reg Closed'}
          </div>
        )}

        {isPast && !event.is_processed && (
          <div className="absolute top-2 right-2 bg-orange-500 text-black text-[9px] font-black uppercase px-2 py-1 rounded shadow-lg flex items-center gap-1">
            <AlertCircle size={10} /> Pending Process
          </div>
        )}
        {event.is_processed && (
          <div className="absolute top-2 right-2 bg-green-500/80 backdrop-blur-sm text-white text-[9px] font-black uppercase px-2 py-1 rounded flex items-center gap-1">
            <Zap size={10} /> Processed
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex gap-2 mb-3">
          <span className="text-[9px] font-black uppercase tracking-widest text-blue-400 bg-blue-400/10 px-2 py-1 rounded-md">
            {event.event_class}
          </span>
          {event.event_tag && (
            <span className="text-[9px] font-black uppercase tracking-widest text-purple-400 bg-purple-400/10 px-2 py-1 rounded-md">
              {event.event_tag}
            </span>
          )}
        </div>
        <h3
          className={`text-lg font-black uppercase italic tracking-tight mb-2 ${isPast ? 'text-gray-400' : 'text-white'}`}
        >
          {event.title}
        </h3>
        <p className="text-[10px] text-gray-500 font-bold flex items-center gap-1.5 uppercase mb-1">
          <Clock size={12} />{' '}
          {new Date(event.event_date).toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
          })}
        </p>

        <div className="flex items-center gap-2 mt-5 pt-5 border-t border-white/5">
          {isPast && !event.is_processed && (
            <button
              onClick={onProcess}
              className="flex-1 flex justify-center items-center gap-2 bg-orange-500/10 text-orange-500 border border-orange-500/20 px-3 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-orange-500 hover:text-white transition-all"
            >
              <Zap size={14} /> Calculate
            </button>
          )}

          {/* Tombol Manage Participants */}
          <button
            onClick={onManageParticipants}
            className="p-2.5 bg-blue-500/10 hover:bg-blue-600 rounded-xl text-blue-400 hover:text-white border border-blue-500/20 transition-colors"
            title="Manage Entry List"
          >
            <Users size={16} />
          </button>

          <button
            onClick={onManageVehicles}
            className="p-2.5 bg-gray-900/50 hover:bg-emerald-600 rounded-xl text-gray-400 hover:text-white transition-colors"
            title="Manage Vehicles"
          >
            <Car size={16} />
          </button>
          <button
            onClick={onEdit}
            className="p-2.5 bg-gray-900/50 hover:bg-purple-600 rounded-xl text-gray-400 hover:text-white transition-colors"
            title="Edit Event"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={onDelete}
            className="p-2.5 bg-gray-900/50 hover:bg-red-600 rounded-xl text-gray-400 hover:text-white transition-colors"
            title="Delete Event"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
