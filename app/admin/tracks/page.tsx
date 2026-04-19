'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import {
  Map,
  Trash2,
  Edit3,
  Image as ImageIcon,
  MapPin,
  FileJson,
  Link as LinkIcon,
  Ruler,
  Flag,
  Settings2,
  PlusCircle,
  XCircle,
  UploadCloud,
} from 'lucide-react';

export default function TracksAdmin() {
  const router = useRouter();

  // ================= DATA STATES =================
  const [tracks, setTracks] = useState<any[]>([]);

  // ================= FORM STATES =================
  const [name, setName] = useState('');
  const [uri, setUri] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');
  const [authorUrl, setAuthorUrl] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [pitboxes, setPitboxes] = useState('');
  const [runDirection, setRunDirection] = useState('');
  const [year, setYear] = useState('');

  // ================= UPLOAD STATES =================
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // ================= APP STATES =================
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

  // ================= JSON READER LOGIC =================
  function handleJsonUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);

        if (!name) setName(json.name || '');
        setDescription(json.description || '');
        setAuthor(json.author || '');
        setAuthorUrl(json.url || '');
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
      } finally {
        e.target.value = ''; // Reset input agar bisa re-upload file yg sama
      }
    };
    reader.readAsText(file);
  }

  // ================= CRUD LOGIC =================
  async function saveTrack() {
    if (!name) return alert('Nama sirkuit wajib diisi!');

    const trackData = {
      name,
      uri,
      image_url: imageUrl,
      download_url: downloadUrl,
      description,
      author,
      author_url: authorUrl,
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
    setUri(track.uri || '');
    setImageUrl(track.image_url || '');
    setDownloadUrl(track.download_url || '');
    setDescription(track.description || '');
    setAuthor(track.author || '');
    setAuthorUrl(track.author_url || '');
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
    setUri('');
    setImageUrl('');
    setDownloadUrl('');
    setDescription('');
    setAuthor('');
    setAuthorUrl('');
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
      <div className="flex h-screen items-center justify-center text-orange-500 animate-pulse font-bold tracking-widest uppercase">
        Loading Circuits...
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 text-gray-200">
      {/* HEADER SECTION */}
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-800">
        <div className="p-3 bg-orange-500/10 rounded-xl">
          <Map className="text-orange-500" size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
            Track Manager
          </h1>
          <p className="text-gray-500 text-sm font-medium">
            Manage your racing circuits and environments
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
                    <Edit3 size={16} className="text-yellow-500" /> Edit Circuit
                    Details
                  </>
                ) : (
                  <>
                    <PlusCircle size={16} className="text-orange-500" />{' '}
                    Register New Circuit
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

            {/* JSON UPLOAD TILE */}
            <div className="mb-6 relative group overflow-hidden bg-orange-950/20 border border-dashed border-orange-500/30 hover:border-orange-500/60 rounded-2xl p-4 transition duration-300">
              <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                <FileJson
                  className="text-orange-500/50 group-hover:text-orange-500 mb-2 transition"
                  size={32}
                />
                <span className="text-xs text-orange-400 uppercase font-black tracking-widest mb-1 text-center">
                  Auto-Fill from JSON
                </span>
                <span className="text-[10px] text-gray-500 text-center px-4">
                  Upload `ui_track.json` to extract length, pitboxes, location,
                  etc.
                </span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleJsonUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="space-y-5">
              {/* Group: Basic Info */}
              <div className="space-y-4 bg-gray-800/30 p-4 rounded-2xl border border-gray-700/50">
                <div className="group">
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-orange-500">
                    Track Name
                  </label>
                  <input
                    placeholder="e.g. Mandalika International Circuit"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-orange-500 outline-none transition text-sm text-white"
                    required
                  />
                </div>

                <div className="group">
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-orange-500">
                    Track Uri
                  </label>
                  <input
                    placeholder="e.g. mandalika-international-circuit"
                    value={uri}
                    onChange={(e) => setUri(e.target.value)}
                    className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-orange-500 outline-none transition text-sm text-white"
                    required
                  />
                </div>

                <div className="group">
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-orange-500">
                    Track Image / Map (Upload or Link)
                  </label>
                  <div className="flex gap-2 mt-1">
                    <input
                      placeholder="https://img.nismara.my.id/..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-orange-500 outline-none transition text-sm text-white"
                    />
                    <label
                      className={`flex items-center justify-center px-4 rounded-xl font-bold text-xs cursor-pointer transition whitespace-nowrap ${isUploadingImage ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-orange-600/20 text-orange-500 hover:bg-orange-600/40 border border-orange-500/50'}`}
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
                            'tracks',
                            setImageUrl,
                            setIsUploadingImage,
                          )
                        }
                      />
                    </label>
                  </div>
                </div>

                <div className="group relative">
                  <LinkIcon className="absolute right-3 top-[34px] text-gray-600 w-4 h-4" />
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-orange-500">
                    Mod Download Link
                  </label>
                  <input
                    value={downloadUrl}
                    onChange={(e) => setDownloadUrl(e.target.value)}
                    className="w-full mt-1 p-3 pr-10 rounded-xl bg-gray-800 border border-gray-700 focus:border-orange-500 outline-none transition text-sm text-white"
                  />
                </div>
              </div>

              {/* Group: Author */}
              <div className="grid grid-cols-2 gap-4 bg-gray-800/30 p-4 rounded-2xl border border-gray-700/50">
                <div className="group">
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-orange-500">
                    Author
                  </label>
                  <input
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-orange-500 outline-none transition text-sm text-white"
                  />
                </div>
                <div className="group">
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-orange-500">
                    Author URL
                  </label>
                  <input
                    value={authorUrl}
                    onChange={(e) => setAuthorUrl(e.target.value)}
                    className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-orange-500 outline-none transition text-sm text-white"
                  />
                </div>
              </div>

              {/* Group: Location */}
              <div className="grid grid-cols-2 gap-4 bg-gray-800/30 p-4 rounded-2xl border border-gray-700/50">
                <div className="group">
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-orange-500">
                    Country
                  </label>
                  <input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-orange-500 outline-none transition text-sm text-white"
                  />
                </div>
                <div className="group">
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-orange-500">
                    City
                  </label>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-orange-500 outline-none transition text-sm text-white"
                  />
                </div>
              </div>

              {/* Group: Specs */}
              <div className="grid grid-cols-3 gap-3 bg-gray-800/30 p-4 rounded-2xl border border-gray-700/50">
                <div className="group">
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-orange-500">
                    Length
                  </label>
                  <input
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    placeholder="e.g. 4300m"
                    className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-orange-500 outline-none transition text-xs text-white"
                  />
                </div>
                <div className="group">
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-orange-500">
                    Width
                  </label>
                  <input
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder="e.g. 15m"
                    className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-orange-500 outline-none transition text-xs text-white"
                  />
                </div>
                <div className="group">
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-orange-500">
                    Pitboxes
                  </label>
                  <input
                    value={pitboxes}
                    onChange={(e) => setPitboxes(e.target.value)}
                    type="number"
                    placeholder="e.g. 32"
                    className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-orange-500 outline-none transition text-xs text-white"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={saveTrack}
              className={`w-full mt-6 py-4 rounded-xl font-black uppercase tracking-widest transition duration-300 shadow-lg ${editingId ? 'bg-yellow-500 hover:bg-yellow-400 text-yellow-950 shadow-yellow-500/20' : 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-500/20'}`}
            >
              {editingId ? 'Update Circuit Data' : 'Save Circuit Data'}
            </button>
          </div>
        </div>

        {/* LIST SECTION (RIGHT SIDE) */}
        <div className="lg:col-span-7">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="group bg-gray-900 border border-gray-800 hover:border-orange-500/50 rounded-3xl overflow-hidden transition-all duration-300 shadow-xl flex flex-col"
              >
                {/* Image Banner */}
                <div className="h-40 bg-gray-800 relative overflow-hidden flex items-center justify-center border-b border-gray-800">
                  {track.image_url ? (
                    <img
                      src={track.image_url}
                      alt={track.name}
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <Map className="text-gray-700 w-12 h-12" />
                  )}
                  {/* Action Buttons Overlay */}
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition duration-300">
                    <button
                      onClick={() => startEdit(track)}
                      className="p-2 bg-black/60 backdrop-blur-sm border border-yellow-500/50 text-yellow-500 hover:bg-yellow-500 hover:text-black rounded-lg transition"
                      title="Edit"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => deleteTrack(track.id)}
                      className="p-2 bg-black/60 backdrop-blur-sm border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-black rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {/* Country/City Badge */}
                  {track.country && (
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm border border-gray-600/50 text-white text-[10px] px-2 py-1 rounded-md font-bold uppercase flex items-center gap-1">
                      <Flag size={10} className="text-orange-400" />
                      {track.city ? `${track.city}, ` : ''}
                      {track.country}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-black text-white leading-tight mb-3 line-clamp-1">
                    {track.name}
                  </h3>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-800/50 p-2 rounded-lg">
                      <Ruler size={14} className="text-orange-500" />
                      <span className="truncate">{track.length || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-800/50 p-2 rounded-lg">
                      <MapPin size={14} className="text-orange-500" />
                      <span>
                        {track.pitboxes ? `${track.pitboxes} Pits` : '-'}
                      </span>
                    </div>
                  </div>

                  {track.author && (
                    <div className="mt-auto pt-4 border-t border-gray-800/80 flex items-center justify-between">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        Author
                      </span>
                      <span className="text-gray-400 text-xs italic">
                        {track.author}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {tracks.length === 0 && !loading && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-800 rounded-3xl">
                <Map className="mx-auto text-gray-600 mb-3" size={40} />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">
                  No Circuits Found
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
