'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import {
  Trash2,
  Plus,
  Edit3,
  Car,
  X,
  MapPin,
  Server,
  Search,
  Settings,
} from 'lucide-react';

export default function ServersAdmin() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // ================= DATA STATES =================
  const [servers, setServers] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [allCars, setAllCars] = useState<any[]>([]); // Master data mobil
  const [selectedServer, setSelectedServer] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // ================= FORM STATES =================
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [serverTag, setServerTag] = useState('');
  const [selectedTrackId, setSelectedTrackId] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('');
  const [joinLink, setJoinLink] = useState('');
  const [fullPackUrl, setFullPackUrl] = useState('');
  const [liveApiUrl, setLiveApiUrl] = useState('');

  // ================= MODAL CAR STATES =================
  const [serverCars, setServerCars] = useState<any[]>([]);
  const [carSearch, setCarSearch] = useState('');
  const [isCarModalOpen, setIsCarModalOpen] = useState(false);

  // ================= INITIAL FETCH =================
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

  // ================= SERVER ACTIONS =================
  async function saveServer() {
    if (!name) return alert('Nama Server wajib diisi!');

    const payload = {
      name,
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
      <div className="p-10 text-blue-500 animate-pulse text-center font-black italic">
        NISMARA INFRASTRUCTURE ACCESS...
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-6 text-gray-200">
      <h1 className="text-3xl font-black italic text-white uppercase tracking-tighter mb-8">
        NISMARA <span className="text-purple-500">SERVER CONTROL</span>
      </h1>

      {/* --- FORM SECTION --- */}
      <div className="bg-gray-900 border border-gray-800 p-8 rounded-[2rem] mb-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 blur-[100px] rounded-full"></div>
        <div className="grid lg:grid-cols-3 gap-8 relative z-10">
          <div className="lg:col-span-2 space-y-5">
            <div className="group">
              <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">
                Server Name
              </label>
              <input
                placeholder="e.g. Nismara Public #1 [GT3]"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-4 rounded-2xl bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none transition text-sm font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="group">
                <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">
                  Server Image URL
                </label>
                <input
                  placeholder="Image Link"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-gray-800 border border-gray-700 text-sm"
                />
              </div>
              <div className="group">
                <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">
                  Max Players
                </label>
                <input
                  type="number"
                  placeholder="e.g. 32"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-gray-800 border border-gray-700 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="group">
                <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">
                  Content Manager Join Link
                </label>
                <input
                  placeholder="https://acstuff.ru/s/q:..."
                  value={joinLink}
                  onChange={(e) => setJoinLink(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-gray-800 border border-gray-700 text-sm"
                />
              </div>
              <div className="group">
                <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">
                  Live API URL (Status Check)
                </label>
                <input
                  placeholder="http://ip:port/api/..."
                  value={liveApiUrl}
                  onChange={(e) => setLiveApiUrl(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-gray-800 border border-gray-700 text-sm font-mono"
                />
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="group">
              <label className="text-[10px] text-blue-500 font-black uppercase ml-1">
                Active Circuit
              </label>
              <select
                value={selectedTrackId}
                onChange={(e) => setSelectedTrackId(e.target.value)}
                className="w-full p-4 rounded-2xl bg-gray-800 border border-gray-700 text-sm text-white font-bold"
              >
                <option value="">-- Choose Circuit --</option>
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <input
              placeholder="Full Mod Pack URL"
              value={fullPackUrl}
              onChange={(e) => setFullPackUrl(e.target.value)}
              className="w-full p-4 rounded-2xl bg-gray-800 border border-gray-700 text-sm"
            />
            <input
              placeholder="Server Tag (e.g. PUBLIC)"
              value={serverTag}
              onChange={(e) => setServerTag(e.target.value)}
              className="w-full p-4 rounded-2xl bg-gray-800 border border-gray-700 text-sm uppercase font-bold"
            />

            <button
              onClick={saveServer}
              className="w-full mt-4 py-4 rounded-2xl font-black uppercase tracking-widest bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg active:scale-95 transition"
            >
              {editingId ? 'Update Infrastructure' : 'Deploy Server'}
            </button>
            {editingId && (
              <button
                onClick={resetForm}
                className="w-full py-2 text-gray-500 hover:text-white text-[10px] font-bold uppercase tracking-widest"
              >
                ✕ Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --- SERVER LIST --- */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {servers.map((s) => (
          <div
            key={s.id}
            className="bg-gray-900 border border-gray-800 rounded-[2rem] overflow-hidden flex flex-col group hover:border-purple-500/50 transition duration-500"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-black text-white leading-tight truncate pr-4">
                  {s.name}
                </h3>
                <span className="bg-gray-800 text-[9px] text-gray-400 px-2 py-1 rounded-md font-black uppercase tracking-widest">
                  {s.server_tag}
                </span>
              </div>
              <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest flex items-center gap-1 mb-6 border-l-2 border-purple-500 pl-2">
                <MapPin size={10} /> {s.tracks?.name || 'No Circuit'}
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => startEdit(s)}
                  className="bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl font-bold text-[10px] uppercase transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteServer(s.id)}
                  className="bg-gray-800 hover:bg-red-900/20 text-red-500 py-3 rounded-xl font-bold text-[10px] uppercase transition"
                >
                  Delete
                </button>
                <button
                  onClick={() => openCarManager(s)}
                  className="col-span-2 mt-1 bg-purple-600/10 text-purple-400 border border-purple-600/20 py-3 rounded-xl font-black text-[10px] uppercase flex justify-center items-center gap-2 hover:bg-purple-600 hover:text-white transition"
                >
                  <Car size={14} /> Manage Assigned Cars
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- RELATIONAL CAR MODAL --- */}
      {isCarModalOpen && selectedServer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/20">
              <div className="flex items-center gap-3">
                <Settings className="text-purple-500" size={20} />
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-widest leading-none">
                    Server Entry List
                  </h2>
                  <p className="text-gray-500 text-[9px] font-bold uppercase mt-1">
                    Modifying {selectedServer.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCarModalOpen(false)}
                className="text-gray-400 hover:text-white p-2 bg-gray-800 rounded-xl transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Panel Kiri: Search Master Cars */}
                <div>
                  <h3 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Search size={12} /> Master Database
                  </h3>
                  <input
                    placeholder="Search Brand/Model..."
                    className="w-full p-4 rounded-2xl bg-gray-800 border border-gray-700 text-xs mb-4 outline-none focus:border-blue-500 transition"
                    onChange={(e) => setCarSearch(e.target.value)}
                  />
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
                          className="p-3 bg-black/40 border border-gray-800 rounded-xl flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-6 bg-gray-950 rounded overflow-hidden">
                              {car.image_url && (
                                <img
                                  src={car.image_url}
                                  className="w-full h-full object-cover opacity-70"
                                />
                              )}
                            </div>
                            <div className="overflow-hidden max-w-[120px]">
                              <p className="text-[8px] text-gray-500 font-black uppercase truncate leading-none mb-1">
                                {car.brand}
                              </p>
                              <h4 className="text-[10px] text-gray-200 font-bold truncate uppercase">
                                {car.name}
                              </h4>
                            </div>
                          </div>
                          <button
                            onClick={() => addCarToServer(car.id)}
                            className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition active:scale-90"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Panel Kanan: Current Server Cars */}
                <div>
                  <h3 className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />{' '}
                    Assigned Vehicles ({serverCars.length})
                  </h3>
                  <div className="space-y-2 h-[408px] overflow-y-auto pr-2 custom-scrollbar">
                    {serverCars.map((sc) => (
                      <div
                        key={sc.id}
                        className="p-3 bg-purple-600/5 border border-purple-500/20 rounded-xl flex justify-between items-center group"
                      >
                        <div className="overflow-hidden">
                          <p className="text-[8px] text-purple-400 font-black uppercase tracking-widest leading-none mb-1">
                            {sc.cars?.brand}
                          </p>
                          <h4 className="text-[10px] font-bold text-white uppercase truncate">
                            {sc.cars?.name}
                          </h4>
                        </div>
                        <button
                          onClick={() => removeCarFromServer(sc.id)}
                          className="p-2 text-gray-600 hover:text-red-500 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {serverCars.length === 0 && (
                      <p className="text-center text-gray-600 italic text-[10px] py-20 uppercase font-black">
                        Empty Server
                      </p>
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
