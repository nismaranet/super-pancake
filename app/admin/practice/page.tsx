'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import {
  Server,
  Trash2,
  Edit3,
  Image as ImageIcon,
  Link as LinkIcon,
  MapPin,
  Users,
  Settings2,
  PlusCircle,
  XCircle,
} from 'lucide-react';

export default function PracticeAdmin() {
  const router = useRouter();

  // ================= DATA STATES =================
  const [practice, setPractice] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [allCars, setAllCars] = useState<any[]>([]);
  const [selectedCars, setSelectedCars] = useState<string[]>([]);

  // ================= FORM STATES =================
  const [name, setName] = useState('');
  const [uri, setUri] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [serverTag, setServerTag] = useState('');
  const [selectedTrackId, setSelectedTrackId] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('');
  const [joinLink, setJoinLink] = useState('');
  const [fullPackUrl, setFullPackUrl] = useState('');
  const [liveApiUrl, setLiveApiUrl] = useState('');

  // ================= UPLOAD STATES =================
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // ================= APP STATES =================
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ================= AUTH & FETCH =================
  async function checkUser() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.push('/login');
    } else {
      setLoading(false);
    }
  }

  async function fetchData() {
    const { data: pracData } = await supabase
      .from('practices')
      .select('*, tracks(name), practice_cars(car_id)')
      .order('created_at', { ascending: false });

    const { data: carsData } = await supabase.from('cars').select('id, name');

    const { data: trackData } = await supabase
      .from('tracks')
      .select('id, name')
      .order('name', { ascending: true });

    if (pracData) setPractice(pracData);
    if (carsData) setAllCars(carsData);
    if (trackData) setTracks(trackData);
  }

  // ================= HANDLERS =================
  const toggleCar = (id: string) => {
    setSelectedCars((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

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
          folder: folder,
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

      setUrlCallback(publicUrl);
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(error.message);
    } finally {
      setLoadingCallback(false);
      e.target.value = '';
    }
  }

  // ================= CRUD LOGIC =================
  async function addPractice() {
    if (!name) return alert('Nama server wajib diisi!');

    const { data, error } = await supabase
      .from('practices')
      .insert([
        {
          name,
          uri,
          image_url: imageUrl,
          server_tag: serverTag,
          track_id: selectedTrackId || null,
          max_players: maxPlayers ? parseInt(maxPlayers) : null,
          join_link: joinLink,
          full_pack_url: fullPackUrl,
          live_api_url: liveApiUrl,
        },
      ])
      .select()
      .single();

    if (error) return alert('Gagal: ' + error.message);

    if (selectedCars.length > 0) {
      const inserts = selectedCars.map((cId) => ({
        practice_id: data.id,
        car_id: cId,
      }));
      await supabase.from('practice_cars').insert(inserts);
    }

    resetForm();
    fetchData();
  }

  async function updatePractice() {
    if (!editingId) return;

    const { error } = await supabase
      .from('practices')
      .update({
        name,
        uri,
        image_url: imageUrl,
        server_tag: serverTag,
        track_id: selectedTrackId || null,
        max_players: maxPlayers ? parseInt(maxPlayers) : null,
        join_link: joinLink,
        full_pack_url: fullPackUrl,
        live_api_url: liveApiUrl,
      })
      .eq('id', editingId);

    if (error) return alert('Gagal update: ' + error.message);

    await supabase.from('practice_cars').delete().eq('practice_id', editingId);
    if (selectedCars.length > 0) {
      const inserts = selectedCars.map((cId) => ({
        practice_id: editingId,
        car_id: cId,
      }));
      await supabase.from('practice_cars').insert(inserts);
    }

    setEditingId(null);
    resetForm();
    fetchData();
  }

  async function deletePractice(id: string) {
    if (!confirm('Hapus practice server ini?')) return;
    await supabase.from('practices').delete().eq('id', id);
    fetchData();
  }

  function startEdit(p: any) {
    setEditingId(p.id);
    setName(p.name || '');
    setUri(p.uri || '');
    setImageUrl(p.image_url || '');
    setServerTag(p.server_tag || '');
    setSelectedTrackId(p.track_id || '');
    setMaxPlayers(p.max_players ? p.max_players.toString() : '');
    setJoinLink(p.join_link || '');
    setFullPackUrl(p.full_pack_url || '');
    setLiveApiUrl(p.live_api_url || '');

    const assignedCars = p.practice_cars?.map((c: any) => c.car_id) || [];
    setSelectedCars(assignedCars);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setName('');
    setUri('');
    setImageUrl('');
    setServerTag('');
    setSelectedTrackId('');
    setMaxPlayers('');
    setJoinLink('');
    setFullPackUrl('');
    setLiveApiUrl('');
    setSelectedCars([]);
    setEditingId(null);
  }

  useEffect(() => {
    checkUser();
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-blue-500 animate-pulse font-bold tracking-widest uppercase">
        Loading Practice Servers...
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 text-gray-200">
      {/* HEADER SECTION */}
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-800">
        <div className="p-3 bg-blue-500/10 rounded-xl">
          <Server className="text-blue-500" size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
            Practice Servers
          </h1>
          <p className="text-gray-500 text-sm font-medium">
            Manage your open practice and test servers
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* FORM SECTION (LEFT SIDE) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            {/* Header Form */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
              <h2 className="flex items-center gap-2 text-white font-bold uppercase text-sm tracking-widest">
                {editingId ? (
                  <>
                    <Edit3 size={16} className="text-yellow-500" /> Edit Server
                  </>
                ) : (
                  <>
                    <PlusCircle size={16} className="text-blue-500" /> New
                    Server
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

            <div className="space-y-5">
              {/* Group: Basic Info */}
              <div className="space-y-4 bg-gray-800/30 p-4 rounded-2xl border border-gray-700/50">
                <div className="group">
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-blue-500">
                    Server Name
                  </label>
                  <input
                    placeholder="e.g. Internal Championship Practice"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none transition text-sm text-white placeholder-gray-600"
                  />
                </div>

                <div className="group">
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-blue-500">
                    Setting Uri
                  </label>
                  <input
                    placeholder="e.g. internal-championship"
                    value={uri}
                    onChange={(e) => setUri(e.target.value)}
                    className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none transition text-sm text-white placeholder-gray-600"
                  />
                </div>

                <div className="group">
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-blue-500">
                    Circuit / Track
                  </label>
                  <select
                    value={selectedTrackId}
                    onChange={(e) => setSelectedTrackId(e.target.value)}
                    className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none transition text-sm text-white"
                  >
                    <option value="">-- No Circuit Assigned --</option>
                    {tracks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="group">
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-blue-500">
                    Server Image (Upload or Link)
                  </label>
                  <div className="flex gap-2 mt-1">
                    <input
                      placeholder="https://img.nismara.my.id/..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none transition text-sm text-white placeholder-gray-600"
                    />
                    <label
                      className={`flex items-center justify-center px-4 rounded-xl font-bold text-xs cursor-pointer transition whitespace-nowrap ${isUploadingImage ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-blue-600/20 text-blue-500 hover:bg-blue-600/40 border border-blue-500/50'}`}
                    >
                      {isUploadingImage ? '...' : 'Upload'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingImage}
                        onChange={(e) =>
                          handleFileUpload(
                            e,
                            'practices',
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
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-blue-500">
                    Server Tag
                  </label>
                  <input
                    placeholder="e.g. GT3"
                    value={serverTag}
                    onChange={(e) => setServerTag(e.target.value)}
                    className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none transition text-sm text-white"
                  />
                </div>
                <div className="group">
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-blue-500">
                    Max Players
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 24"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(e.target.value)}
                    className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none transition text-sm text-white"
                  />
                </div>
              </div>

              {/* Group: Links & Resources */}
              <div className="space-y-4 bg-gray-800/30 p-4 rounded-2xl border border-gray-700/50">
                <div className="group relative">
                  <LinkIcon className="absolute right-3 top-[34px] text-gray-600 w-4 h-4" />
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-blue-500">
                    Join Link (Content Manager)
                  </label>
                  <input
                    value={joinLink}
                    onChange={(e) => setJoinLink(e.target.value)}
                    className="w-full mt-1 p-3 pr-10 rounded-xl bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none transition text-sm text-white"
                  />
                </div>
                <div className="group relative">
                  <LinkIcon className="absolute right-3 top-[34px] text-gray-600 w-4 h-4" />
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-blue-500">
                    Full Pack URL (Mods)
                  </label>
                  <input
                    value={fullPackUrl}
                    onChange={(e) => setFullPackUrl(e.target.value)}
                    className="w-full mt-1 p-3 pr-10 rounded-xl bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none transition text-sm text-white"
                  />
                </div>
                <div className="group relative">
                  <Settings2 className="absolute right-3 top-[34px] text-gray-600 w-4 h-4" />
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-blue-500">
                    Live API URL (Emperor)
                  </label>
                  <input
                    value={liveApiUrl}
                    onChange={(e) => setLiveApiUrl(e.target.value)}
                    className="w-full mt-1 p-3 pr-10 rounded-xl bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none transition text-sm text-white"
                  />
                </div>
              </div>

              {/* Group: Allowed Cars */}
              <div className="bg-gray-800/30 p-4 rounded-2xl border border-gray-700/50">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">
                    Allowed Cars Roster
                  </label>
                  <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-2 py-1 rounded-lg">
                    {selectedCars.length} Selected
                  </span>
                </div>
                <div className="h-44 overflow-y-auto pr-2 custom-scrollbar space-y-1">
                  {allCars.map((c) => (
                    <label
                      key={c.id}
                      className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition select-none ${selectedCars.includes(c.id) ? 'bg-blue-600/20 border border-blue-500/30' : 'hover:bg-gray-800 border border-transparent'}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCars.includes(c.id)}
                        onChange={() => toggleCar(c.id)}
                        className="w-4 h-4 rounded accent-blue-500 bg-gray-900 border-gray-700"
                      />
                      <span
                        className={`text-xs font-medium ${selectedCars.includes(c.id) ? 'text-blue-300' : 'text-gray-400'}`}
                      >
                        {c.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={editingId ? updatePractice : addPractice}
              className={`w-full mt-6 py-4 rounded-xl font-black uppercase tracking-widest transition duration-300 shadow-lg ${editingId ? 'bg-yellow-500 hover:bg-yellow-400 text-yellow-950 shadow-yellow-500/20' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'}`}
            >
              {editingId
                ? 'Update Server Configuration'
                : 'Create Practice Server'}
            </button>
          </div>
        </div>

        {/* LIST SECTION (RIGHT SIDE) */}
        <div className="lg:col-span-7">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {practice.map((p) => (
              <div
                key={p.id}
                className="group bg-gray-900 border border-gray-800 hover:border-blue-500/50 rounded-3xl overflow-hidden transition-all duration-300 shadow-xl"
              >
                {/* Image Banner */}
                <div className="h-32 bg-gray-800 relative overflow-hidden flex items-center justify-center border-b border-gray-800">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <ImageIcon className="text-gray-700 w-10 h-10" />
                  )}
                  {/* Overlay Tag */}
                  {p.server_tag && (
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm border border-gray-600/50 text-white text-[10px] px-2 py-1 rounded-md font-black uppercase tracking-widest">
                      {p.server_tag}
                    </div>
                  )}
                  {/* Action Buttons Overlay */}
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition duration-300">
                    <button
                      onClick={() => startEdit(p)}
                      className="p-2 bg-black/60 backdrop-blur-sm border border-yellow-500/50 text-yellow-500 hover:bg-yellow-500 hover:text-black rounded-lg transition"
                      title="Edit"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => deletePractice(p.id)}
                      className="p-2 bg-black/60 backdrop-blur-sm border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-black rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-black text-white leading-tight mb-3">
                    {p.name}
                  </h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <MapPin size={14} className="text-blue-500" />
                      <span className="truncate">
                        {p.tracks?.name || 'No Circuit Set'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Users size={14} className="text-blue-500" />
                      <span>
                        {p.max_players
                          ? `${p.max_players} Slots`
                          : 'Unlimited Slots'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                      Cars Allowed
                    </span>
                    <span className="bg-blue-500/10 text-blue-400 text-[10px] font-black px-2 py-1 rounded-md">
                      {p.practice_cars?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {practice.length === 0 && !loading && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-800 rounded-3xl">
                <Server className="mx-auto text-gray-600 mb-3" size={40} />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">
                  No Practice Servers Found
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
