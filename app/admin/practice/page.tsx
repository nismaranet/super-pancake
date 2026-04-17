'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function PracticeAdmin() {
  const router = useRouter();

  const [practice, setPractice] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]); // STATE BARU UNTUK TRACKS
  const [allCars, setAllCars] = useState<any[]>([]);
  const [selectedCars, setSelectedCars] = useState<string[]>([]);

  // INPUT STATES
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [serverTag, setServerTag] = useState('');
  const [selectedTrackId, setSelectedTrackId] = useState(''); // RELASI TRACK ID
  const [maxPlayers, setMaxPlayers] = useState('');
  const [joinLink, setJoinLink] = useState('');
  const [fullPackUrl, setFullPackUrl] = useState('');
  const [liveApiUrl, setLiveApiUrl] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

    // Fetch list of tracks
    const { data: trackData } = await supabase
      .from('tracks')
      .select('id, name')
      .order('name', { ascending: true });

    if (pracData) setPractice(pracData);
    if (carsData) setAllCars(carsData);
    if (trackData) setTracks(trackData);
  }

  const toggleCar = (id: string) => {
    setSelectedCars((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  async function addPractice() {
    if (!name) return alert('Nama server wajib diisi!');

    const { data, error } = await supabase
      .from('practices')
      .insert([
        {
          name,
          image_url: imageUrl,
          server_tag: serverTag,
          track_id: selectedTrackId || null, // MENGGUNAKAN TRACK ID
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
        image_url: imageUrl,
        server_tag: serverTag,
        track_id: selectedTrackId || null, // MENGGUNAKAN TRACK ID
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
    setImageUrl(p.image_url || '');
    setServerTag(p.server_tag || '');
    setSelectedTrackId(p.track_id || ''); // SET RELASI TRACK ID
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
      <div className="p-10 text-blue-500 animate-pulse text-center">
        Loading Practice Servers...
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto p-6 text-gray-200">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold italic text-white uppercase tracking-tighter">
          Practice Admin
        </h1>
      </div>

      <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl mb-10 relative overflow-hidden">
        <h2 className="text-blue-500 font-bold mb-6 uppercase text-sm">
          {editingId ? 'Edit Practice Server' : 'New Practice Server'}
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <input
              placeholder="Server Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 outline-none text-sm"
            />
            <input
              placeholder="Image URL"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 outline-none text-sm"
            />

            {/* DROPDOWN TRACK */}
            <select
              value={selectedTrackId}
              onChange={(e) => setSelectedTrackId(e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none transition text-sm text-white"
            >
              <option value="">-- No Circuit Assigned --</option>
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            <input
              placeholder="Server Tag"
              value={serverTag}
              onChange={(e) => setServerTag(e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 outline-none text-sm"
            />
            <input
              type="number"
              placeholder="Max Players"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 outline-none text-sm"
            />
          </div>

          <div className="space-y-4">
            <input
              placeholder="Join Link"
              value={joinLink}
              onChange={(e) => setJoinLink(e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 outline-none text-sm"
            />
            <input
              placeholder="Full Pack Link"
              value={fullPackUrl}
              onChange={(e) => setFullPackUrl(e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 outline-none text-sm"
            />
            <input
              placeholder="Live API Link"
              value={liveApiUrl}
              onChange={(e) => setLiveApiUrl(e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 outline-none text-sm"
            />

            <div className="h-40 overflow-y-auto border border-gray-700 rounded-xl p-2 custom-scrollbar">
              <p className="text-[10px] text-gray-500 font-bold mb-2 uppercase">
                Allowed Cars
              </p>
              {allCars.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2 p-1 text-xs text-gray-300"
                >
                  <input
                    type="checkbox"
                    checked={selectedCars.includes(c.id)}
                    onChange={() => toggleCar(c.id)}
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={editingId ? updatePractice : addPractice}
          className="w-full mt-6 py-4 rounded-xl bg-blue-600 font-black text-white uppercase"
        >
          {editingId ? 'Update Server' : 'Create Server'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {practice.map((p) => (
          <div
            key={p.id}
            className="bg-gray-900 border border-gray-800 p-5 rounded-2xl"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{p.name}</h3>
                {/* AMBIL NAMA TRACK DARI RELASI */}
                <p className="text-xs text-gray-500">
                  {p.tracks?.name || 'No Circuit Set'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(p)}
                  className="text-yellow-500"
                >
                  ✏️
                </button>
                <button
                  onClick={() => deletePractice(p.id)}
                  className="text-red-500"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
