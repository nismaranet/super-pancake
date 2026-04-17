'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function TracksAdmin() {
  const router = useRouter();

  const [tracks, setTracks] = useState<any[]>([]);

  // STATES UNTUK TRACK
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [pitboxes, setPitboxes] = useState('');
  const [runDirection, setRunDirection] = useState('');
  const [year, setYear] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ================= AUTH & FETCH =================
  async function checkUser() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) router.push('/login');
    else setLoading(false);
  }

  async function fetchTracks() {
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setTracks(data);
  }

  // ================= JSON READER LOGIC =================
  function handleJsonUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);

        // Auto-fill form state dari file ui_track.json
        if (!name) setName(json.name || '');
        setDescription(json.description || '');
        setAuthor(json.author || '');
        setCountry(json.country || '');
        setCity(json.city || '');
        setLength(json.length || '');
        setWidth(json.width || '');
        setPitboxes(json.pitboxes || '');
        setRunDirection(json.run || '');
        setYear(json.year || '');

        alert(`✅ Track Data Loaded: ${json.name || 'Unknown'}`);
      } catch (err) {
        alert('❌ Error: Format file JSON tidak valid!');
        console.error(err);
      }
    };
    reader.readAsText(file);
  }

  // ================= CRUD LOGIC =================
  async function saveTrack() {
    if (!name) return alert('Nama sirkuit wajib diisi!');

    const trackData = {
      name,
      image_url: imageUrl,
      download_url: downloadUrl,
      description,
      author,
      country,
      city,
      length,
      width,
      pitboxes,
      run_direction: runDirection,
      year,
    };

    if (editingId) {
      const { error } = await supabase
        .from('tracks')
        .update(trackData)
        .eq('id', editingId);
      if (error) return alert('Gagal update sirkuit: ' + error.message);
    } else {
      const { error } = await supabase.from('tracks').insert([trackData]);
      if (error) return alert('Gagal menambah sirkuit: ' + error.message);
    }

    resetForm();
    fetchTracks();
  }

  async function deleteTrack(id: string) {
    if (!confirm('Hapus sirkuit ini dari database?')) return;
    await supabase.from('tracks').delete().eq('id', id);
    fetchTracks();
  }

  // ================= HELPERS =================
  function startEdit(track: any) {
    setEditingId(track.id);
    setName(track.name || '');
    setImageUrl(track.image_url || '');
    setDownloadUrl(track.download_url || '');
    setDescription(track.description || '');
    setAuthor(track.author || '');
    setCountry(track.country || '');
    setCity(track.city || '');
    setLength(track.length || '');
    setWidth(track.width || '');
    setPitboxes(track.pitboxes || '');
    setRunDirection(track.run_direction || '');
    setYear(track.year || '');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setName('');
    setImageUrl('');
    setDownloadUrl('');
    setDescription('');
    setAuthor('');
    setCountry('');
    setCity('');
    setLength('');
    setWidth('');
    setPitboxes('');
    setRunDirection('');
    setYear('');
    setEditingId(null);
  }

  useEffect(() => {
    checkUser();
    fetchTracks();
  }, []);

  if (loading)
    return (
      <div className="p-10 text-orange-500 animate-pulse text-center italic">
        Syncing Circuits...
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto p-6 text-gray-200">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold italic text-white tracking-tighter uppercase">
          Track Admin
        </h1>
        {editingId && (
          <button
            onClick={resetForm}
            className="text-orange-400 text-sm hover:underline italic"
          >
            ✕ Cancel Edit
          </button>
        )}
      </div>

      {/* FORM SECTION */}
      <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl mb-10 shadow-2xl relative">
        <h2 className="text-orange-500 font-bold mb-6 uppercase tracking-widest text-sm">
          {editingId ? 'Edit Circuit Details' : 'Register New Circuit'}
        </h2>

        {/* JSON UPLOAD */}
        <div className="mb-8 p-4 bg-gray-800/50 border border-dashed border-orange-500/50 rounded-xl">
          <label className="flex flex-col items-center justify-center cursor-pointer">
            <span className="text-xs text-orange-400 uppercase font-bold tracking-widest mb-2">
              ⚡ Auto-Fill from ui_track.json
            </span>
            <span className="text-[10px] text-gray-400 mb-3 text-center">
              Upload ui_track.json to automatically import track length,
              pitboxes, location, and description.
            </span>
            <input
              type="file"
              accept=".json"
              onChange={handleJsonUpload}
              className="text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-orange-600/20 file:text-orange-400 hover:file:bg-orange-600/30 transition-all cursor-pointer"
            />
          </label>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <input
            placeholder="Track Name (e.g. Mandalika)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-orange-500 outline-none"
            required
          />
          <input
            placeholder="Image Map / Preview URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-orange-500 outline-none"
          />
          <input
            placeholder="Country (e.g. Indonesia)"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-orange-500 outline-none"
          />
          <input
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-orange-500 outline-none"
          />

          <div className="grid grid-cols-3 gap-2">
            <input
              placeholder="Length"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              className="p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-orange-500 outline-none text-xs"
            />
            <input
              placeholder="Width"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              className="p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-orange-500 outline-none text-xs"
            />
            <input
              placeholder="Pitboxes"
              value={pitboxes}
              onChange={(e) => setPitboxes(e.target.value)}
              className="p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-orange-500 outline-none text-xs"
            />
          </div>

          <input
            placeholder="Mod Download Link"
            value={downloadUrl}
            onChange={(e) => setDownloadUrl(e.target.value)}
            className="p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-orange-500 outline-none"
          />
        </div>

        <button
          onClick={saveTrack}
          className="w-full mt-6 py-4 rounded-xl font-black uppercase tracking-widest bg-orange-600 hover:bg-orange-700 text-white transition-all"
        >
          {editingId ? 'Update Circuit' : 'Save Circuit'}
        </button>
      </div>

      {/* TRACK LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tracks.map((track) => (
          <div
            key={track.id}
            className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-lg p-4 flex flex-col"
          >
            <div className="aspect-video bg-gray-800 mb-4 rounded-lg overflow-hidden relative">
              {track.image_url ? (
                <img
                  src={track.image_url}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-600">
                  NO IMAGE
                </div>
              )}
            </div>
            <h3 className="font-bold text-white text-lg truncate">
              {track.name}
            </h3>
            <p className="text-xs text-orange-500 mb-4 uppercase">
              {track.city}, {track.country}
            </p>

            <div className="flex gap-2 mt-auto">
              <button
                onClick={() => startEdit(track)}
                className="flex-1 bg-gray-800 py-2 rounded text-xs font-bold uppercase hover:bg-orange-600/20 text-white"
              >
                Edit
              </button>
              <button
                onClick={() => deleteTrack(track.id)}
                className="flex-1 bg-gray-800 py-2 rounded text-xs font-bold uppercase hover:bg-red-500/20 text-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
