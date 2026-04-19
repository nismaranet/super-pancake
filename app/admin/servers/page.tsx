'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import {
  Server,
  Trash2,
  Edit3,
  Image as ImageIcon,
  MapPin,
  Users,
  Settings2,
  PlusCircle,
  XCircle,
  UploadCloud,
  Link as LinkIcon,
  Car,
  Search,
  Plus,
  X,
  Activity,
} from 'lucide-react';

export default function ServersAdmin() {
  const router = useRouter();

  // ================= DATA STATES =================
  const [servers, setServers] = useState<any[]>([]);
  const [uri, setUri] = useState('');
  const [tracks, setTracks] = useState<any[]>([]);
  const [allCars, setAllCars] = useState<any[]>([]); // Master data mobil
  const [selectedServer, setSelectedServer] = useState<any>(null);

  // ================= FORM STATES =================
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [serverTag, setServerTag] = useState('');
  const [selectedTrackId, setSelectedTrackId] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('');
  const [joinLink, setJoinLink] = useState('');
  const [fullPackUrl, setFullPackUrl] = useState('');
  const [liveApiUrl, setLiveApiUrl] = useState('');

  // ================= UPLOAD STATES =================
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // ================= MODAL CAR STATES =================
  const [serverCars, setServerCars] = useState<any[]>([]);
  const [carSearch, setCarSearch] = useState('');
  const [isCarModalOpen, setIsCarModalOpen] = useState(false);

  // ================= APP STATES =================
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ================= AUTH & FETCH =================
  async function checkUser() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) router.push('/login');
    else setLoading(false);
  }

  async function fetchData() {
    // Ambil Servers (join tracks), Tracks, dan Master Cars
    const { data: sData } = await supabase
      .from('servers')
      .select('*, tracks(name)')
      .order('created_at', { ascending: false });
    const { data: tData } = await supabase
      .from('tracks')
      .select('id, name')
      .order('name', { ascending: true });
    const { data: cData } = await supabase
      .from('cars')
      .select('id, name, brand, image_url')
      .order('brand', { ascending: true });

    if (sData) setServers(sData);
    if (tData) setTracks(tData);
    if (cData) setAllCars(cData);
  }

  useEffect(() => {
    checkUser();
    fetchData();
  }, []);

  // ================= UPLOAD HANDLER =================
  async function handleFileUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    folder: string,
    setUrlCallback: (url: string) => void,
    setLoadingCallback: (status: boolean) => void,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingCallback(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          folder: folder, // Akan masuk ke folder 'servers' di R2
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

      setUrlCallback(publicUrl); // Mengatur input text menjadi URL my.id
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(error.message);
    } finally {
      setLoadingCallback(false);
      e.target.value = '';
    }
  }

  // ================= SERVER ACTIONS =================
  async function saveServer() {
    if (!name) return alert('Nama Server wajib diisi!');

    const payload = {
      name,
      uri: setUri,
      image_url: imageUrl,
      server_tag: serverTag,
      track_id: selectedTrackId || null,
      max_players: parseInt(maxPlayers) || 0,
      join_link: joinLink,
      full_pack_url: fullPackUrl,
      live_api_url: liveApiUrl,
    };

    if (editingId) {
      await supabase.from('servers').update(payload).eq('id', editingId);
    } else {
      await supabase.from('servers').insert([payload]);
    }
    resetForm();
    fetchData();
  }

  async function deleteServer(id: string) {
    if (!confirm('Hapus server ini?')) return;
    await supabase.from('servers').delete().eq('id', id);
    fetchData();
  }

  function startEdit(s: any) {
    setEditingId(s.id);
    setName(s.name || '');
    setUri(s.uri || '');
    setImageUrl(s.image_url || '');
    setServerTag(s.server_tag || '');
    setSelectedTrackId(s.track_id || '');
    setMaxPlayers(s.max_players?.toString() || '');
    setJoinLink(s.join_link || '');
    setFullPackUrl(s.full_pack_url || '');
    setLiveApiUrl(s.live_api_url || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setName('');
    setUri('');
    setImageUrl('');
    setServerTag('');
    setSelectedTrackId('');
    setMaxPlayers('');
    setJoinLink('');
    setFullPackUrl('');
    setLiveApiUrl('');
  }

  // ================= RELATIONAL CAR ACTIONS =================
  async function openCarManager(server: any) {
    setSelectedServer(server);
    const { data } = await supabase
      .from('server_cars')
      .select('id, car_id, cars(name, brand, image_url)')
      .eq('server_id', server.id);
    setServerCars(data || []);
    setIsCarModalOpen(true);
  }

  async function addCarToServer(carId: string) {
    const isExist = serverCars.some((sc) => sc.car_id === carId);
    if (isExist) return alert('Mobil ini sudah ada di server.');

    const { error } = await supabase.from('server_cars').insert([
      {
        server_id: selectedServer.id,
        car_id: carId,
      },
    ]);

    if (!error) openCarManager(selectedServer);
  }

  async function removeCarFromServer(id: string) {
    await supabase.from('server_cars').delete().eq('id', id);
    openCarManager(selectedServer);
  }

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-purple-500 animate-pulse font-bold tracking-widest uppercase">
        Loading Infrastructure...
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 text-gray-200">
      {/* HEADER SECTION */}
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-800">
        <div className="p-3 bg-purple-500/10 rounded-xl">
          <Server className="text-purple-500" size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
            Server Manager
          </h1>
          <p className="text-gray-500 text-sm font-medium">
            Manage your dedicated racing servers and assign vehicles
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* FORM SECTION (LEFT SIDE) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            {/* Dekorasi Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 blur-[100px] rounded-full pointer-events-none"></div>

            {/* Header Form */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4 relative z-10">
              <h2 className="flex items-center gap-2 text-white font-bold uppercase text-sm tracking-widest">
                {editingId ? (
                  <>
                    <Edit3 size={16} className="text-yellow-500" /> Edit
                    Configuration
                  </>
                ) : (
                  <>
                    <PlusCircle size={16} className="text-purple-500" /> Deploy
                    New Server
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
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-purple-500">
                    Server Name
                  </label>
                  <input
                    placeholder="e.g. Nismara Public #1 [GT3]"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-purple-500 outline-none transition text-sm text-white"
                  />
                </div>

                <div className="group">
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-purple-500">
                    Setting Uri
                  </label>
                  <input
                    placeholder="e.g. gt3-series"
                    value={uri}
                    onChange={(e) => setUri(e.target.value)}
                    className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-purple-500 outline-none transition text-sm text-white"
                  />
                </div>

                <div className="group">
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-purple-500">
                    Active Circuit
                  </label>
                  <select
                    value={selectedTrackId}
                    onChange={(e) => setSelectedTrackId(e.target.value)}
                    className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-purple-500 outline-none transition text-sm text-white"
                  >
                    <option value="">-- Choose Circuit --</option>
                    {tracks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="group">
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-purple-500">
                    Server Image (Upload or Link)
                  </label>
                  <div className="flex gap-2 mt-1">
                    <input
                      placeholder="https://img.nismara.my.id/..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-purple-500 outline-none transition text-sm text-white"
                    />
                    <label
                      className={`flex items-center justify-center px-4 rounded-xl font-bold text-xs cursor-pointer transition whitespace-nowrap ${isUploadingImage ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-purple-600/20 text-purple-500 hover:bg-purple-600/40 border border-purple-500/50'}`}
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
                        onChange={(e) =>
                          handleFileUpload(
                            e,
                            'servers',
                            setImageUrl,
                            setIsUploadingImage,
                          )
                        }
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Group: Server Settings */}
              <div className="grid grid-cols-2 gap-4 bg-gray-800/30 p-4 rounded-2xl border border-gray-700/50">
                <div className="group">
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-purple-500">
                    Server Tag
                  </label>
                  <input
                    placeholder="e.g. PUBLIC"
                    value={serverTag}
                    onChange={(e) => setServerTag(e.target.value)}
                    className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-purple-500 outline-none transition text-sm text-white uppercase font-bold"
                  />
                </div>
                <div className="group">
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-purple-500">
                    Max Players
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 32"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(e.target.value)}
                    className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-purple-500 outline-none transition text-sm text-white"
                  />
                </div>
              </div>

              {/* Group: Links & API */}
              <div className="space-y-4 bg-gray-800/30 p-4 rounded-2xl border border-gray-700/50">
                <div className="group relative">
                  <LinkIcon className="absolute right-3 top-[34px] text-gray-600 w-4 h-4" />
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-purple-500">
                    Content Manager Join Link
                  </label>
                  <input
                    value={joinLink}
                    onChange={(e) => setJoinLink(e.target.value)}
                    placeholder="https://acstuff.ru/s/q:..."
                    className="w-full mt-1 p-3 pr-10 rounded-xl bg-gray-800 border border-gray-700 focus:border-purple-500 outline-none transition text-sm text-white"
                  />
                </div>
                <div className="group relative">
                  <Activity className="absolute right-3 top-[34px] text-gray-600 w-4 h-4" />
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-purple-500">
                    Live API URL (Status Check)
                  </label>
                  <input
                    value={liveApiUrl}
                    onChange={(e) => setLiveApiUrl(e.target.value)}
                    placeholder="http://ip:port/api/..."
                    className="w-full mt-1 p-3 pr-10 rounded-xl bg-gray-800 border border-gray-700 focus:border-purple-500 outline-none transition text-sm text-white font-mono"
                  />
                </div>
                <div className="group relative">
                  <Settings2 className="absolute right-3 top-[34px] text-gray-600 w-4 h-4" />
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-purple-500">
                    Full Mod Pack URL
                  </label>
                  <input
                    value={fullPackUrl}
                    onChange={(e) => setFullPackUrl(e.target.value)}
                    className="w-full mt-1 p-3 pr-10 rounded-xl bg-gray-800 border border-gray-700 focus:border-purple-500 outline-none transition text-sm text-white"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={saveServer}
              className={`w-full mt-6 py-4 rounded-xl font-black uppercase tracking-widest transition duration-300 shadow-lg relative z-10 ${editingId ? 'bg-yellow-500 hover:bg-yellow-400 text-yellow-950 shadow-yellow-500/20' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20'}`}
            >
              {editingId ? 'Update Infrastructure' : 'Deploy Server'}
            </button>
          </div>
        </div>

        {/* LIST SECTION (RIGHT SIDE) */}
        <div className="lg:col-span-7">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {servers.map((s) => (
              <div
                key={s.id}
                className="group bg-gray-900 border border-gray-800 hover:border-purple-500/50 rounded-3xl overflow-hidden transition-all duration-300 shadow-xl flex flex-col"
              >
                {/* Image Banner */}
                <div className="h-32 bg-gray-800 relative overflow-hidden flex items-center justify-center border-b border-gray-800">
                  {s.image_url ? (
                    <img
                      src={s.image_url}
                      alt={s.name}
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <Server className="text-gray-700 w-10 h-10" />
                  )}
                  {/* Overlay Tag */}
                  {s.server_tag && (
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm border border-gray-600/50 text-white text-[10px] px-2 py-1 rounded-md font-black uppercase tracking-widest">
                      {s.server_tag}
                    </div>
                  )}
                  {/* Action Buttons Overlay */}
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition duration-300">
                    <button
                      onClick={() => startEdit(s)}
                      className="p-2 bg-black/60 backdrop-blur-sm border border-yellow-500/50 text-yellow-500 hover:bg-yellow-500 hover:text-black rounded-lg transition"
                      title="Edit"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => deleteServer(s.id)}
                      className="p-2 bg-black/60 backdrop-blur-sm border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-black rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-black text-white leading-tight mb-3">
                    {s.name}
                  </h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <MapPin size={14} className="text-purple-500" />
                      <span className="truncate">
                        {s.tracks?.name || 'No Circuit Assigned'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Users size={14} className="text-purple-500" />
                      <span>
                        {s.max_players
                          ? `${s.max_players} Slots`
                          : 'Unlimited Slots'}
                      </span>
                    </div>
                  </div>

                  {/* Assign Cars Button (Bottom) */}
                  <div className="mt-auto pt-4 border-t border-gray-800/80">
                    <button
                      onClick={() => openCarManager(s)}
                      className="w-full bg-purple-600/10 text-purple-400 border border-purple-500/30 py-3 rounded-xl font-bold text-xs uppercase flex justify-center items-center gap-2 hover:bg-purple-600 hover:text-white transition duration-300"
                    >
                      <Car size={16} /> Manage Assigned Cars
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {servers.length === 0 && !loading && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-800 rounded-3xl">
                <Server className="mx-auto text-gray-600 mb-3" size={40} />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">
                  No Servers Found
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- RELATIONAL CAR MODAL (TETAP SAMA TAPI DIPERBAIKI BORDERNYA) --- */}
      {isCarModalOpen && selectedServer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Settings2 className="text-purple-500" size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-widest leading-none">
                    Server Entry List
                  </h2>
                  <p className="text-gray-400 text-xs font-bold uppercase mt-1">
                    Modifying:{' '}
                    <span className="text-purple-400">
                      {selectedServer.name}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCarModalOpen(false)}
                className="text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-xl transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-gray-950/50">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Panel Kiri: Search Master Cars */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-inner">
                  <h3 className="text-xs text-gray-400 font-black uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-gray-800 pb-3">
                    <Search size={14} className="text-blue-500" /> Master
                    Database
                  </h3>
                  <div className="relative mb-4">
                    <input
                      placeholder="Search Brand or Model..."
                      className="w-full p-3 pl-10 rounded-xl bg-gray-800 border border-gray-700 text-sm outline-none focus:border-blue-500 transition text-white"
                      onChange={(e) => setCarSearch(e.target.value)}
                    />
                    <Search
                      size={14}
                      className="absolute left-3 top-[14px] text-gray-500"
                    />
                  </div>
                  <div className="space-y-2 h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {allCars
                      .filter(
                        (c) =>
                          c.name
                            .toLowerCase()
                            .includes(carSearch.toLowerCase()) ||
                          c.brand
                            .toLowerCase()
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
                              <p className="text-[9px] text-blue-400 font-black uppercase truncate leading-none mb-1">
                                {car.brand}
                              </p>
                              <h4 className="text-xs text-gray-200 font-bold truncate uppercase">
                                {car.name}
                              </h4>
                            </div>
                          </div>
                          <button
                            onClick={() => addCarToServer(car.id)}
                            className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white rounded-lg transition active:scale-90"
                            title="Add to Server"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Panel Kanan: Current Server Cars */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-inner">
                  <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-3">
                    <h3 className="text-xs text-purple-400 font-black uppercase tracking-widest flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                      Assigned Vehicles
                    </h3>
                    <span className="bg-purple-500/20 text-purple-400 text-[10px] px-2 py-1 rounded-md font-bold">
                      {serverCars.length} Cars
                    </span>
                  </div>
                  <div className="space-y-2 h-[410px] overflow-y-auto pr-2 custom-scrollbar">
                    {serverCars.map((sc) => (
                      <div
                        key={sc.id}
                        className="p-3 bg-purple-900/10 border border-purple-500/20 hover:border-purple-500/50 rounded-xl flex justify-between items-center group transition"
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
                            <p className="text-[9px] text-purple-400 font-black uppercase tracking-widest leading-none mb-1">
                              {sc.cars?.brand}
                            </p>
                            <h4 className="text-xs font-bold text-white uppercase truncate">
                              {sc.cars?.name}
                            </h4>
                          </div>
                        </div>
                        <button
                          onClick={() => removeCarFromServer(sc.id)}
                          className="p-2 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-lg transition"
                          title="Remove from Server"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {serverCars.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
                        <Car size={40} className="mb-2" />
                        <p className="italic text-xs font-bold uppercase tracking-widest">
                          No Cars Assigned
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
