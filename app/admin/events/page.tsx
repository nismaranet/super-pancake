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
  Search,
  Zap,
  Clock,
  UploadCloud,
  FileJson,
  Users,
  ShieldAlert,
  PlusCircle,
  XCircle,
  Calendar,
  Link as LinkIcon,
  Flag,
  Play,
  ToggleLeft,
  ToggleRight,
  CalendarDays,
} from 'lucide-react';

export default function EventsAdmin() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // ================= DATA STATES =================
  const [events, setEvents] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [availableCars, setAvailableCars] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [practices, setPractices] = useState<any[]>([]);

  // ================= FORM STATES =================
  const [title, setTitle] = useState('');
  const [uri, setUri] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [timezone, setTimezone] = useState('WIB');
  const [selectedTrackId, setSelectedTrackId] = useState('');
  const [selectedPracticeServer, setSelectedPracticeServer] = useState('');
  const [eventClass, setEventClass] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(40);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);
  const [results, setResults] = useState<any[]>([]);

  // ================= UPLOAD STATES =================
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // ================= MODAL STATES =================
  const [currentEventCars, setCurrentEventCars] = useState<any[]>([]);
  const [carSearch, setCarSearch] = useState('');
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);

  const [selectedParticipantEvent, setSelectedParticipantEvent] =
    useState<any>(null);
  const [eventParticipants, setEventParticipants] = useState<any[]>([]);
  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);

  // ================= INITIAL FETCH =================
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
      const { data: practiceData } = await supabase
        .from('practices')
        .select('*')
        .order('name', { ascending: true });
      const { data: carsData } = await supabase
        .from('cars')
        .select('id, name, brand, image_url')
        .order('brand', { ascending: true });

      setEvents(eventsData || []);
      setTracks(tracksData || []);
      setAvailableCars(carsData || []);
      setPractices(practiceData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ================= SLUG GENERATION =================
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingId) {
      setUri(generateSlug(val));
    }
  };

  // ================= IMAGE UPLOAD R2 =================
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          folder: 'events',
        }),
      });

      if (!res.ok) throw new Error('Gagal mendapatkan izin upload API');
      const { signedUrl, publicUrl } = await res.json();

      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadRes.ok) throw new Error('Gagal mengunggah file ke R2');
      setImageUrl(publicUrl);
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(error.message);
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  }

  // ================= VEHICLE METHODS =================
  const fetchEventCars = async (eventId: string) => {
    const { data } = await supabase
      .from('event_cars')
      .select('*, cars(name, brand, image_url)')
      .eq('event_id', eventId);
    setCurrentEventCars(data || []);
  };

  const openVehicleModal = (event: any) => {
    setSelectedEvent(event);
    fetchEventCars(event.id);
    setIsVehicleModalOpen(true);
  };

  const addVehicle = async (carId: string) => {
    if (!selectedEvent) return;
    const isExist = currentEventCars.some((c) => c.car_id === carId);
    if (isExist) return alert('Mobil ini sudah terdaftar di event.');

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

  const openParticipantModal = (event: any) => {
    setSelectedParticipantEvent(event);
    fetchEventParticipants(event.id);
    setIsParticipantModalOpen(true);
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
  const handleFileUpload = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const jsonContent = JSON.parse(content);
        updateResultSession(index, 'url', jsonContent);
      } catch (err) {
        alert('File yang diupload bukan format JSON yang valid!');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset input
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
      uri,
      description,
      event_tag: tag,
      image_url: imageUrl,
      event_date: eventDate,
      timezone,
      event_class: eventClass,
      track_id: selectedTrackId,
      practice_server: selectedPracticeServer,
      max_participants: maxParticipants,
      is_registration_open: isRegistrationOpen,
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
      } else alert(error.message);
    } else {
      const { error } = await supabase.from('events').insert([eventData]);
      if (!error) {
        resetForm();
        fetchData();
      } else alert(error.message);
    }
  };

  const resetForm = () => {
    setTitle('');
    setUri('');
    setDescription('');
    setTag('');
    setImageUrl('');
    setEventDate('');
    setTimezone('WIB');
    setSelectedTrackId('');
    setSelectedPracticeServer('');
    setEventClass('');
    setMaxParticipants(40);
    setIsRegistrationOpen(true);
    setResults([]);
    setEditingId(null);
  };

  const handleEdit = (event: any) => {
    setEditingId(event.id);
    setTitle(event.title || '');
    setUri(event.uri || '');
    setDescription(event.description || '');
    setTag(event.event_tag || '');
    setImageUrl(event.image_url || '');
    setEventDate(event.event_date || '');
    setTimezone(event.timezone || 'WIB');
    setSelectedTrackId(event.track_id || '');
    setSelectedPracticeServer(event.practice_server || '');
    setEventClass(event.event_class || '');
    setMaxParticipants(event.max_participants || 40);
    setIsRegistrationOpen(event.is_registration_open ?? true);
    setResults(event.results || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus event balap ini secara permanen?')) {
      await supabase.from('events').delete().eq('id', id);
      fetchData();
    }
  };

  // ================= RANKED PROCESS =================
  const handleProcessRanked = async (eventId: string) => {
    const { data: eventCheck } = await supabase
      .from('events')
      .select('is_processed')
      .eq('id', eventId)
      .single();

    if (eventCheck?.is_processed) return alert('Event ini sudah diproses!');
    if (
      !window.confirm(
        'Proses Kalkulasi NRC, Safety Rating & XP Ranked untuk event ini?',
      )
    )
      return;

    try {
      setLoading(true); // Opsional jika kamu punya state loading

      // Tembak ke Edge Function yang baru kita buat
      const { error } = await supabase.functions.invoke('process-ranked', {
        body: { event_id: eventId },
      });

      if (error) throw error;

      alert('Kalkulasi Ranked dan Safety Rating Selesai!');
      fetchData(); // Memperbarui UI list event
    } catch (err: any) {
      alert('Gagal memproses event: ' + err.message);
    } finally {
      setLoading(false);
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

  if (loading && events.length === 0)
    return (
      <div className="flex h-screen items-center justify-center text-emerald-500 animate-pulse font-bold tracking-widest uppercase">
        Fetching Race Calendar...
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 text-gray-200">
      {/* HEADER SECTION */}
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-800">
        <div className="p-3 bg-emerald-500/10 rounded-xl">
          <CalendarDays className="text-emerald-500" size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
            Event Calendar
          </h1>
          <p className="text-gray-500 text-sm font-medium">
            Manage racing events, grids, and rank processing
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* FORM SECTION (LEFT SIDE) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-600/5 blur-[100px] rounded-full pointer-events-none"></div>

            <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4 relative z-10">
              <h2 className="flex items-center gap-2 text-white font-bold uppercase text-sm tracking-widest">
                {editingId ? (
                  <>
                    <Edit3 size={16} className="text-yellow-500" /> Reschedule
                    Event
                  </>
                ) : (
                  <>
                    <PlusCircle size={16} className="text-emerald-500" /> Create
                    Event
                  </>
                )}
              </h2>
              {editingId && (
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-red-500 transition"
                >
                  <XCircle size={20} />
                </button>
              )}
            </div>

            <div className="space-y-5 relative z-10">
              {/* Group: Basic Info */}
              <div className="space-y-4 bg-gray-800/30 p-4 rounded-2xl border border-gray-700/50">
                <div className="group">
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-emerald-500">
                    Event Title *
                  </label>
                  <input
                    required
                    placeholder="e.g. Endurance 3H"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-emerald-500 outline-none transition text-sm text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="group">
                    <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-emerald-500 flex items-center gap-1">
                      <LinkIcon size={10} /> URI Slug
                    </label>
                    <input
                      placeholder="endurance-3h"
                      value={uri}
                      onChange={(e) =>
                        setUri(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-'),
                        )
                      }
                      className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-emerald-500 outline-none transition text-xs font-mono text-emerald-400"
                    />
                  </div>
                  <div className="group">
                    <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-emerald-500">
                      Event Class
                    </label>
                    <input
                      placeholder="e.g. GT3"
                      value={eventClass}
                      onChange={(e) => setEventClass(e.target.value)}
                      className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-emerald-500 outline-none transition text-xs text-white uppercase font-bold"
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-emerald-500">
                    Event Image (Upload or Link)
                  </label>
                  <div className="flex gap-2 mt-1">
                    <input
                      placeholder="https://..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-emerald-500 outline-none transition text-sm text-white"
                    />
                    <label
                      className={`flex items-center justify-center px-4 rounded-xl font-bold text-xs cursor-pointer transition whitespace-nowrap ${isUploadingImage ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-emerald-600/20 text-emerald-500 hover:bg-emerald-600/40 border border-emerald-500/50'}`}
                    >
                      {isUploadingImage ? (
                        '...'
                      ) : (
                        <>
                          <UploadCloud size={14} className="mr-1" /> Upload
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingImage}
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Group: Date & Location */}
              <div className="grid grid-cols-2 gap-4 bg-gray-800/30 p-4 rounded-2xl border border-gray-700/50">
                <div className="group">
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-emerald-500 flex items-center gap-1">
                    <Clock size={10} /> Date & Time *
                  </label>
                  <input
                    required
                    type="datetime-local"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-emerald-500 outline-none transition text-xs text-white"
                  />
                </div>
                <div className="group">
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-emerald-500">
                    Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-emerald-500 outline-none transition text-xs text-white"
                  >
                    <option value="WIB">WIB (UTC+7)</option>
                    <option value="WITA">WITA (UTC+8)</option>
                    <option value="WIT">WIT (UTC+9)</option>
                  </select>
                </div>
                <div className="group col-span-2">
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-emerald-500 flex items-center gap-1">
                    <MapPin size={10} /> Venue / Track *
                  </label>
                  <select
                    required
                    value={selectedTrackId}
                    onChange={(e) => setSelectedTrackId(e.target.value)}
                    className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-emerald-500 outline-none transition text-xs text-white"
                  >
                    <option value="">-- Choose Track --</option>
                    {tracks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Group: Setup & Tags */}
              <div className="grid grid-cols-2 gap-4 bg-gray-800/30 p-4 rounded-2xl border border-gray-700/50">
                <div className="group">
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-emerald-500 flex items-center gap-1">
                    <Users size={10} /> Grid Size
                  </label>
                  <input
                    type="number"
                    required
                    value={maxParticipants}
                    onChange={(e) =>
                      setMaxParticipants(parseInt(e.target.value))
                    }
                    className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-emerald-500 outline-none transition text-xs text-white"
                  />
                </div>
                <div className="group">
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-emerald-500">
                    Tag
                  </label>
                  <input
                    placeholder="e.g. SPECIAL"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-emerald-500 outline-none transition text-xs text-white"
                  />
                </div>
                <div className="group col-span-2">
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-emerald-500">
                    Practice Server Assigment
                  </label>
                  <select
                    value={selectedPracticeServer}
                    onChange={(e) => setSelectedPracticeServer(e.target.value)}
                    className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-emerald-500 outline-none transition text-xs text-white"
                  >
                    <option value="">-- Choose Practice Server --</option>
                    {practices.map((server) => (
                      <option key={server.id} value={server.id}>
                        {server.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Toggle Registration */}
              <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-2xl border border-gray-700/50">
                <div className="flex items-center gap-2">
                  <ShieldAlert
                    size={16}
                    className={
                      isRegistrationOpen ? 'text-emerald-500' : 'text-gray-500'
                    }
                  />
                  <div>
                    <span className="text-xs font-bold text-gray-300 uppercase block">
                      Registration Gate
                    </span>
                    <span className="text-[9px] text-gray-500">
                      Enable/Disable user signup for this event.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRegistrationOpen(!isRegistrationOpen)}
                  className="transition hover:scale-105 active:scale-95"
                >
                  {isRegistrationOpen ? (
                    <ToggleRight size={32} className="text-emerald-500" />
                  ) : (
                    <ToggleLeft size={32} className="text-gray-600" />
                  )}
                </button>
              </div>

              {/* Group: Editor */}
              <div className="group bg-gray-800/30 p-4 rounded-2xl border border-gray-700/50">
                <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-emerald-500 mb-2 block">
                  Event Regulations / Description
                </label>
                <div className="rounded-xl overflow-hidden border border-gray-700 focus-within:border-emerald-500 transition">
                  <Editor value={description} onChange={setDescription} />
                </div>
              </div>

              {/* Group: JSON Results */}
              <div className="bg-gray-800/30 p-4 rounded-2xl border border-gray-700/50">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">
                    AC JSON Results
                  </label>
                  <button
                    type="button"
                    onClick={addResultSession}
                    className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-emerald-500 hover:text-white transition"
                  >
                    <Plus size={12} /> Session
                  </button>
                </div>
                <div className="space-y-2">
                  {results.map((res, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 bg-gray-900 rounded-xl border border-gray-700"
                    >
                      <input
                        placeholder="Session (e.g. Race 1)"
                        value={res.session}
                        onChange={(e) =>
                          updateResultSession(idx, 'session', e.target.value)
                        }
                        className="w-1/3 bg-gray-800 p-2 rounded-lg text-xs outline-none focus:border-emerald-500 text-white"
                      />
                      <label
                        className={`flex-1 flex items-center justify-center gap-2 p-2 bg-gray-800 border border-dashed rounded-lg text-xs cursor-pointer transition ${res.url ? 'border-emerald-500/50 text-emerald-400' : 'border-gray-600 text-gray-400 hover:border-emerald-500 hover:text-emerald-500'}`}
                      >
                        <FileJson size={14} />{' '}
                        {res.url ? 'JSON Loaded' : 'Upload result.json'}
                        <input
                          type="file"
                          accept=".json"
                          className="hidden"
                          onChange={(e) => handleFileUpload(idx, e)}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => removeResultSession(idx)}
                        className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {results.length === 0 && (
                    <p className="text-[10px] text-gray-500 italic text-center py-2">
                      No results attached.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className={`w-full mt-6 py-4 rounded-xl font-black uppercase tracking-widest transition duration-300 shadow-lg relative z-10 ${editingId ? 'bg-yellow-500 hover:bg-yellow-400 text-yellow-950 shadow-yellow-500/20' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'}`}
            >
              {editingId ? 'Update Event Schedule' : 'Launch Event'}
            </button>
          </div>
        </div>

        {/* LIST SECTION (RIGHT SIDE) */}
        <div className="lg:col-span-7">
          <h3 className="text-sm font-black text-white uppercase mb-4 tracking-widest flex items-center gap-2">
            <Play size={16} className="text-emerald-500" /> Upcoming / Ongoing
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
            {ongoingEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                openVehicleModal={openVehicleModal}
                openParticipantModal={openParticipantModal}
                handleProcessRanked={handleProcessRanked}
              />
            ))}
            {ongoingEvents.length === 0 && (
              <div className="col-span-full py-10 text-center border-2 border-dashed border-gray-800 rounded-3xl">
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
                  No Scheduled Events
                </p>
              </div>
            )}
          </div>

          <h3 className="text-sm font-black text-white uppercase mb-4 tracking-widest flex items-center gap-2">
            <Flag size={16} className="text-gray-500" /> Past Events
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {pastEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                openVehicleModal={openVehicleModal}
                openParticipantModal={openParticipantModal}
                handleProcessRanked={handleProcessRanked}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ================= VEHICLE MODAL ================= */}
      {isVehicleModalOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Car className="text-emerald-500" size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-widest leading-none">
                    Vehicle Entry Requirements
                  </h2>
                  <p className="text-gray-400 text-xs font-bold uppercase mt-1">
                    Event:{' '}
                    <span className="text-emerald-400">
                      {selectedEvent.title}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsVehicleModalOpen(false)}
                className="text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-xl transition"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-gray-950/50">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Left: Master Database */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-inner">
                  <h3 className="text-xs text-gray-400 font-black uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-gray-800 pb-3">
                    <Search size={14} className="text-emerald-500" /> Master
                    Database
                  </h3>
                  <div className="relative mb-4">
                    <input
                      placeholder="Search Brand or Model..."
                      className="w-full p-3 pl-10 rounded-xl bg-gray-800 border border-gray-700 text-sm outline-none focus:border-emerald-500 transition text-white"
                      onChange={(e) => setCarSearch(e.target.value)}
                    />
                    <Search
                      size={14}
                      className="absolute left-3 top-[14px] text-gray-500"
                    />
                  </div>
                  <div className="space-y-2 h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {availableCars
                      .filter(
                        (c) =>
                          c.name
                            .toLowerCase()
                            .includes(carSearch.toLowerCase()) ||
                          c.brand
                            ?.toLowerCase()
                            .includes(carSearch.toLowerCase()),
                      )
                      .map((car) => (
                        <div
                          key={car.id}
                          className="p-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 rounded-xl flex items-center justify-between group transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-8 bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
                              {car.image_url ? (
                                <img
                                  src={car.image_url}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Car
                                  size={14}
                                  className="w-full h-full p-2 text-gray-600"
                                />
                              )}
                            </div>
                            <div className="overflow-hidden max-w-[140px]">
                              <p className="text-[9px] text-emerald-400 font-black uppercase truncate leading-none mb-1">
                                {car.brand}
                              </p>
                              <h4 className="text-xs text-gray-200 font-bold truncate uppercase">
                                {car.name}
                              </h4>
                            </div>
                          </div>
                          <button
                            onClick={() => addVehicle(car.id)}
                            className="p-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white rounded-lg transition active:scale-90"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
                {/* Right: Assigned Cars */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-inner">
                  <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-3">
                    <h3 className="text-xs text-emerald-400 font-black uppercase tracking-widest flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />{' '}
                      Allowed Vehicles
                    </h3>
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-1 rounded-md font-bold">
                      {currentEventCars.length} Cars
                    </span>
                  </div>
                  <div className="space-y-2 h-[410px] overflow-y-auto pr-2 custom-scrollbar">
                    {currentEventCars.map((sc) => (
                      <div
                        key={sc.id}
                        className="p-3 bg-emerald-900/10 border border-emerald-500/20 hover:border-emerald-500/50 rounded-xl flex justify-between items-center group transition"
                      >
                        <div className="overflow-hidden flex items-center gap-3">
                          <div className="w-12 h-8 bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
                            {sc.cars?.image_url ? (
                              <img
                                src={sc.cars.image_url}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Car
                                size={14}
                                className="w-full h-full p-2 text-gray-600"
                              />
                            )}
                          </div>
                          <div>
                            <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest leading-none mb-1">
                              {sc.cars?.brand}
                            </p>
                            <h4 className="text-xs font-bold text-white uppercase truncate">
                              {sc.cars?.name}
                            </h4>
                          </div>
                        </div>
                        <button
                          onClick={() => removeVehicle(sc.id)}
                          className="p-2 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-lg transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= PARTICIPANT MODAL ================= */}
      {isParticipantModalOpen && selectedParticipantEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Users className="text-blue-500" size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-widest leading-none">
                    Entry List Registration
                  </h2>
                  <p className="text-gray-400 text-xs font-bold uppercase mt-1">
                    Grid Size:{' '}
                    <span className="text-blue-400">
                      {eventParticipants.length} /{' '}
                      {selectedParticipantEvent.max_participants}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsParticipantModalOpen(false)}
                className="text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-xl transition"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-gray-950/50">
              <div className="space-y-2">
                {eventParticipants.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 bg-gray-800/50 border border-gray-700/50 hover:border-blue-500/50 rounded-xl flex items-center justify-between group transition"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-white uppercase tracking-wider">
                        {p.driver_name}
                      </h4>
                      <p className="text-[10px] text-gray-500 font-mono mt-1">
                        GUID: {p.steam_guid}
                      </p>
                    </div>
                    <button
                      onClick={() => removeParticipant(p.id, p.driver_name)}
                      className="p-2 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-lg transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {eventParticipants.length === 0 && (
                  <div className="py-12 text-center">
                    <Users size={40} className="mx-auto text-gray-600 mb-3" />
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
                      No registered drivers yet
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ================= CARD COMPONENT UNTUK LIST EVENT =================
function EventCard({
  event,
  handleEdit,
  handleDelete,
  openVehicleModal,
  openParticipantModal,
  handleProcessRanked,
}: any) {
  const isProcessed = event.is_processed;

  return (
    <div className="group bg-gray-900 border border-gray-800 hover:border-emerald-500/50 rounded-3xl overflow-hidden transition-all duration-300 shadow-xl flex flex-col relative">
      <div className="h-36 bg-gray-800 relative overflow-hidden flex items-center justify-center border-b border-gray-800">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition duration-500"
          />
        ) : (
          <CalendarDays className="text-gray-700 w-10 h-10" />
        )}
        {event.event_class && (
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm border border-gray-600/50 text-white text-[10px] px-2 py-1 rounded-md font-black uppercase tracking-widest">
            {event.event_class}
          </div>
        )}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition duration-300">
          <button
            onClick={() => handleEdit(event)}
            className="p-2 bg-black/60 backdrop-blur-sm border border-yellow-500/50 text-yellow-500 hover:bg-yellow-500 hover:text-black rounded-lg transition"
            title="Edit"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={() => handleDelete(event.id)}
            className="p-2 bg-black/60 backdrop-blur-sm border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-black rounded-lg transition"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
        {/* Status Registration di kanan bawah foto */}
        <div className="absolute bottom-3 right-3">
          {event.is_registration_open ? (
            <span className="bg-emerald-500/80 backdrop-blur-sm text-white text-[9px] px-2 py-1 rounded font-bold uppercase">
              REG OPEN
            </span>
          ) : (
            <span className="bg-red-500/80 backdrop-blur-sm text-white text-[9px] px-2 py-1 rounded font-bold uppercase">
              REG CLOSED
            </span>
          )}
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-lg font-black text-white leading-tight mb-3 line-clamp-1">
          {event.title}
        </h3>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Clock size={14} className="text-emerald-500" />
            <span className="truncate">
              {new Date(event.event_date).toLocaleString('id-ID', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}{' '}
              {event.timezone}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <MapPin size={14} className="text-emerald-500" />
            <span className="truncate">
              {event.tracks?.name || 'No Circuit'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-gray-800/80">
          <button
            onClick={() => openVehicleModal(event)}
            className="bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 py-2 rounded-xl text-[10px] uppercase font-bold transition flex items-center justify-center gap-2"
          >
            <Car size={14} /> Vehicles
          </button>
          <button
            onClick={() => openParticipantModal(event)}
            className="bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 py-2 rounded-xl text-[10px] uppercase font-bold transition flex items-center justify-center gap-2"
          >
            <Users size={14} /> Participants
          </button>
        </div>

        {/* Kalkulator Ranked - Akan menonjol jika ada file JSON */}
        {event.results?.length > 0 && (
          <div className="mt-2">
            {isProcessed ? (
              <div className="w-full bg-gray-800/50 text-gray-400 py-2 rounded-xl text-[10px] uppercase font-bold flex items-center justify-center gap-2 border border-gray-700">
                <Zap size={14} /> Ranked Calculated
              </div>
            ) : (
              <button
                onClick={() => handleProcessRanked(event.id)}
                className="w-full bg-yellow-500/10 hover:bg-yellow-500 text-yellow-500 hover:text-black border border-yellow-500/50 py-2 rounded-xl text-[10px] uppercase font-black transition flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/10"
              >
                <Zap size={14} /> Process Safety Rating
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
