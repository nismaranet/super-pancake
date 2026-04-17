'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import {
  Settings2,
  PaintBucket,
  FileArchive,
  Wrench,
  Trash2,
  Link as LinkIcon,
} from 'lucide-react';

export default function CarsAdmin() {
  const router = useRouter();

  const [cars, setCars] = useState<any[]>([]);
  const [servers, setServers] = useState<any[]>([]);

  // ================= CAR STATES =================
  const [name, setName] = useState('');
  const [uri, setUri] = useState('');
  const [modelKey, setModelKey] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedServers, setSelectedServers] = useState<string[]>([]);

  // STATES UNTUK TELEMETRY & JSON
  const [brand, setBrand] = useState('');
  const [carClass, setCarClass] = useState('');
  const [country, setCountry] = useState('');
  const [description, setDescription] = useState('');
  const [specs, setSpecs] = useState<any>(null);
  const [torqueCurve, setTorqueCurve] = useState<any>(null);
  const [powerCurve, setPowerCurve] = useState<any>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ================= LIVERY STATES =================
  const [isLiveryModalOpen, setIsLiveryModalOpen] = useState(false);
  const [activeCar, setActiveCar] = useState<any>(null);
  const [liveryName, setLiveryName] = useState('');
  const [liveryImageUrl, setLiveryImageUrl] = useState('');
  const [isSavingLivery, setIsSavingLivery] = useState(false);

  // ================= ADD-ONS STATES =================
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [addonTitle, setAddonTitle] = useState('');
  const [addonDescription, setAddonDescription] = useState('');
  const [addonType, setAddonType] = useState('livery_pack'); // livery_pack, physics_patch, setup
  const [addonDownloadUrl, setAddonDownloadUrl] = useState('');
  const [isSavingAddon, setIsSavingAddon] = useState(false);

  // ================= AUTH & FETCH =================
  async function checkUser() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) router.push('/login');
    else setLoading(false);
  }

  async function fetchData() {
    const { data: carsData } = await supabase
      .from('cars')
      .select(
        `
        *,
        car_assignments (server_id),
        car_liveries (id, name, image_url),
        car_addons (id, title, description, addon_type, download_url)
      `,
      )
      .order('created_at', { ascending: false });

    const { data: serverData } = await supabase.from('servers').select('*');

    setCars(carsData || []);
    setServers(serverData || []);

    if (activeCar) {
      const updatedCar = carsData?.find((c) => c.id === activeCar.id);
      if (updatedCar) setActiveCar(updatedCar);
    }
  }

  // ================= AUTO-GENERATE URI =================
  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingId) {
      // Auto-generate slug (uri) from name
      const generatedUri = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setUri(generatedUri);
    }
  };

  // ================= JSON READER LOGIC =================
  function handleJsonUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);

        if (!name) handleNameChange(json.name || '');
        setBrand(json.brand || '');
        setCarClass(json.class || '');
        setCountry(json.country || '');
        setDescription(json.description || '');
        setSpecs(json.specs || null);
        setTorqueCurve(json.torqueCurve || null);
        setPowerCurve(json.powerCurve || null);

        alert(
          `✅ Telemetry Loaded: ${json.brand || 'Unknown'} - ${json.class || 'Unknown'}`,
        );
      } catch (err) {
        alert('❌ Error: Format file JSON tidak valid!');
        console.error(err);
      }
    };
    reader.readAsText(file);
  }

  // ================= CAR LOGIC HANDLERS =================
  const toggleServer = (id: string) => {
    setSelectedServers((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  async function addCar() {
    if (!name || !downloadUrl || !uri || selectedServers.length === 0) {
      return alert(
        'Nama, URI, Link Download, dan Minimal 1 Server wajib diisi!',
      );
    }

    const newCarData = {
      name,
      uri,
      model_key: modelKey,
      download_url: downloadUrl,
      image_url: imageUrl,
      brand,
      class: carClass,
      country,
      description,
      specs,
      torque_curve: torqueCurve,
      power_curve: powerCurve,
    };

    const { data: newCar, error: carError } = await supabase
      .from('cars')
      .insert([newCarData])
      .select()
      .single();

    if (carError) {
      if (carError.code === '23505')
        return alert(
          'URI ini sudah dipakai oleh mobil lain. Silakan ubah URI!',
        );
      return alert('Gagal menambah mobil: ' + carError.message);
    }

    const assignments = selectedServers.map((sId) => ({
      car_id: newCar.id,
      server_id: sId,
    }));

    await supabase.from('car_assignments').insert(assignments);

    resetForm();
    fetchData();
  }

  async function updateCar() {
    if (!editingId) return;

    const updateData = {
      name,
      uri,
      model_key: modelKey,
      download_url: downloadUrl,
      image_url: imageUrl,
      brand,
      class: carClass,
      country,
      description,
      specs,
      torque_curve: torqueCurve,
      power_curve: powerCurve,
    };

    const { error: carError } = await supabase
      .from('cars')
      .update(updateData)
      .eq('id', editingId);

    if (carError) {
      if (carError.code === '23505')
        return alert(
          'URI ini sudah dipakai oleh mobil lain. Silakan ubah URI!',
        );
      return alert('Gagal update info mobil');
    }

    await supabase.from('car_assignments').delete().eq('car_id', editingId);

    const assignments = selectedServers.map((sId) => ({
      car_id: editingId,
      server_id: sId,
    }));

    await supabase.from('car_assignments').insert(assignments);

    setEditingId(null);
    resetForm();
    fetchData();
  }

  async function deleteCar(id: string) {
    if (
      !confirm(
        'Hapus mobil ini? Semua relasi server, livery, dan add-ons juga akan terhapus.',
      )
    )
      return;
    await supabase.from('cars').delete().eq('id', id);
    fetchData();
  }

  // ================= LIVERY LOGIC HANDLERS =================
  function openLiveryModal(car: any) {
    setActiveCar(car);
    setIsLiveryModalOpen(true);
  }
  function closeLiveryModal() {
    setIsLiveryModalOpen(false);
    setActiveCar(null);
    setLiveryName('');
    setLiveryImageUrl('');
  }

  async function handleAddLivery(e: React.FormEvent) {
    e.preventDefault();
    if (!liveryImageUrl || !liveryName || !activeCar)
      return alert('Nama dan URL Gambar wajib diisi!');
    setIsSavingLivery(true);
    try {
      const { error } = await supabase
        .from('car_liveries')
        .insert([
          { car_id: activeCar.id, name: liveryName, image_url: liveryImageUrl },
        ]);
      if (error) throw error;
      setLiveryName('');
      setLiveryImageUrl('');
      fetchData();
    } catch (error: any) {
      alert('Gagal menyimpan livery: ' + error.message);
    } finally {
      setIsSavingLivery(false);
    }
  }

  async function deleteLivery(liveryId: string) {
    if (!confirm('Hapus livery ini?')) return;
    await supabase.from('car_liveries').delete().eq('id', liveryId);
    fetchData();
  }

  // ================= ADDONS LOGIC HANDLERS =================
  function openAddonModal(car: any) {
    setActiveCar(car);
    setIsAddonModalOpen(true);
  }
  function closeAddonModal() {
    setIsAddonModalOpen(false);
    setActiveCar(null);
    setAddonTitle('');
    setAddonDescription('');
    setAddonDownloadUrl('');
    setAddonType('livery_pack');
  }

  async function handleAddAddon(e: React.FormEvent) {
    e.preventDefault();
    if (!addonTitle || !addonDownloadUrl || !addonType || !activeCar)
      return alert('Semua form bertanda * wajib diisi!');
    setIsSavingAddon(true);
    try {
      const { error } = await supabase.from('car_addons').insert([
        {
          car_id: activeCar.id,
          title: addonTitle,
          description: addonDescription,
          addon_type: addonType,
          download_url: addonDownloadUrl,
        },
      ]);
      if (error) throw error;
      setAddonTitle('');
      setAddonDescription('');
      setAddonDownloadUrl('');
      fetchData();
    } catch (error: any) {
      alert('Gagal menyimpan Add-on: ' + error.message);
    } finally {
      setIsSavingAddon(false);
    }
  }

  async function deleteAddon(addonId: string) {
    if (!confirm('Hapus add-on ini?')) return;
    await supabase.from('car_addons').delete().eq('id', addonId);
    fetchData();
  }

  // ================= HELPERS =================
  function startEdit(car: any) {
    setEditingId(car.id);
    setName(car.name);
    setUri(car.uri || '');
    setModelKey(car.model_key || '');
    setDownloadUrl(car.download_url);
    setImageUrl(car.image_url || '');
    setBrand(car.brand || '');
    setCarClass(car.class || '');
    setCountry(car.country || '');
    setDescription(car.description || '');
    setSpecs(car.specs || null);
    setTorqueCurve(car.torque_curve || null);
    setPowerCurve(car.power_curve || null);
    const currentServerIds =
      car.car_assignments?.map((a: any) => a.server_id) || [];
    setSelectedServers(currentServerIds);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setName('');
    setUri('');
    setModelKey('');
    setDownloadUrl('');
    setImageUrl('');
    setSelectedServers([]);
    setBrand('');
    setCarClass('');
    setCountry('');
    setDescription('');
    setSpecs(null);
    setTorqueCurve(null);
    setPowerCurve(null);
    setEditingId(null);
  }

  useEffect(() => {
    checkUser();
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="p-10 text-orange-500 animate-pulse text-center italic">
        Syncing Garage...
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto p-6 text-gray-200 pb-24">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold italic text-white tracking-tighter uppercase">
          Garage Admin
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

      {/* FORM SECTION CARS */}
      <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl mb-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/10 blur-3xl rounded-full -mr-10 -mt-10"></div>

        <h2 className="text-orange-500 font-bold mb-6 uppercase tracking-widest text-sm flex items-center gap-2">
          <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
          {editingId ? 'Edit Specifications' : 'Register New Vehicle'}
        </h2>

        {/* JSON UPLOAD SECTION */}
        <div className="mb-8 p-4 bg-gray-800/50 border border-dashed border-orange-500/50 rounded-xl">
          <label className="flex flex-col items-center justify-center cursor-pointer">
            <span className="text-xs text-orange-400 uppercase font-bold tracking-widest mb-2">
              ⚡ Auto-Fill from ui_car.json
            </span>
            <span className="text-[10px] text-gray-400 mb-3 text-center">
              Upload the ui_car.json file to automatically import Power/Torque
              curves, brand, class, and description.
            </span>
            <input
              type="file"
              accept=".json"
              onChange={handleJsonUpload}
              className="text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-orange-600/20 file:text-orange-400 hover:file:bg-orange-600/30 transition-all cursor-pointer"
            />
          </label>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="group">
              <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-orange-500">
                Vehicle Name *
              </label>
              <input
                placeholder="e.g. Porsche 911 GT3 R"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-orange-500 outline-none transition shadow-inner"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="group">
                <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-orange-500 flex items-center gap-1">
                  <LinkIcon size={10} /> URI (SEO Slug) *
                </label>
                <input
                  placeholder="porsche-911-gt3-r"
                  value={uri}
                  onChange={(e) =>
                    setUri(
                      e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    )
                  }
                  className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-orange-500 outline-none transition shadow-inner font-mono text-xs text-orange-400"
                />
              </div>
              <div className="group">
                <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-orange-500">
                  Model Key (Folder Name)
                </label>
                <input
                  placeholder="e.g. ks_porsche_911_gt3_r"
                  value={modelKey}
                  onChange={(e) => setModelKey(e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-orange-500 outline-none transition shadow-inner font-mono text-xs text-blue-400"
                  title="Digunakan untuk mencocokkan data ranked / stats dari server"
                />
              </div>
            </div>

            <div className="group">
              <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-orange-500">
                Download Link (Base Mod) *
              </label>
              <input
                placeholder="URL to .zip / Content Manager"
                value={downloadUrl}
                onChange={(e) => setDownloadUrl(e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-orange-500 outline-none transition shadow-inner"
              />
            </div>
            <div className="group">
              <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-orange-500">
                Image Preview URL
              </label>
              <input
                placeholder="Image Link"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-orange-500 outline-none transition shadow-inner"
              />
            </div>
          </div>

          <div className="flex flex-col h-full">
            <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 mb-2 tracking-widest">
              Assign to Servers *
            </label>
            <div className="grid grid-cols-1 gap-2 overflow-y-auto max-h-[260px] pr-2 custom-scrollbar">
              {servers.map((s) => (
                <button
                  key={s.id}
                  onClick={() => toggleServer(s.id)}
                  type="button"
                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex justify-between items-center ${
                    selectedServers.includes(s.id)
                      ? 'bg-orange-600/20 border-orange-500 text-orange-400 shadow-[0_0_15px_rgba(234,88,12,0.1)]'
                      : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-500'
                  }`}
                >
                  {s.name}
                  {selectedServers.includes(s.id) && (
                    <span className="text-[10px]">✅</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={editingId ? updateCar : addCar}
          className={`w-full mt-8 py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-xl active:scale-[0.98] ${editingId ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : 'bg-orange-600 hover:bg-orange-700 text-white'}`}
        >
          {editingId ? 'Update Configuration' : 'Deploy to Selected Servers'}
        </button>
      </div>

      {/* LIST SECTION */}
      <h2 className="text-xl font-bold italic mb-6 text-white uppercase tracking-tighter">
        Current Fleet
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cars.map((car) => (
          <div
            key={car.id}
            className="group bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-orange-500/50 transition-all flex flex-col shadow-lg"
          >
            <div className="relative h-32 bg-gray-800 overflow-hidden">
              {car.image_url ? (
                <img
                  src={car.image_url}
                  alt={car.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-700 font-black italic text-[10px]">
                  NO IMAGE
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
              <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1">
                {car.car_assignments?.slice(0, 2).map((a: any) => {
                  const sName = servers.find(
                    (sv) => sv.id === a.server_id,
                  )?.name;
                  return (
                    <span
                      key={a.server_id}
                      className="text-[7px] bg-black/60 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/20 backdrop-blur-sm uppercase font-bold"
                    >
                      {sName}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="p-4 flex flex-col flex-grow">
              <h3 className="font-bold text-white group-hover:text-orange-400 transition truncate leading-none mb-1">
                {car.name}
              </h3>
              <p className="text-[10px] text-gray-500 mb-4 flex items-center gap-2">
                <span className="font-mono text-blue-400 bg-blue-400/10 px-1 rounded">
                  {car.model_key || 'No Key'}
                </span>
              </p>

              <div className="grid grid-cols-2 gap-2 mt-auto mb-2">
                <button
                  onClick={() => startEdit(car)}
                  className="bg-gray-800 hover:bg-orange-500/20 text-white py-2 rounded-lg text-[10px] font-bold border border-gray-700 transition uppercase"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteCar(car.id)}
                  className="bg-gray-800 hover:bg-red-500/20 text-red-500 py-2 rounded-lg text-[10px] font-bold border border-gray-700 transition uppercase"
                >
                  Delete
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => openLiveryModal(car)}
                  className="flex items-center justify-center gap-1.5 w-full bg-purple-600/10 hover:bg-purple-600 text-purple-400 hover:text-white py-2 rounded-lg text-[10px] font-bold border border-purple-600/30 transition uppercase"
                >
                  <PaintBucket size={12} /> Liveries
                </button>
                <button
                  onClick={() => openAddonModal(car)}
                  className="flex items-center justify-center gap-1.5 w-full bg-orange-600/10 hover:bg-orange-600 text-orange-500 hover:text-white py-2 rounded-lg text-[10px] font-bold border border-orange-600/30 transition uppercase"
                >
                  <FileArchive size={12} /> Add-ons
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL 1: MANAGE LIVERIES */}
      {isLiveryModalOpen && activeCar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900">
              <div>
                <h2 className="text-xl font-bold text-white italic uppercase tracking-tighter">
                  Liveries Setup
                </h2>
                <p className="text-purple-400 text-xs font-bold">
                  {activeCar.name}
                </p>
              </div>
              <button
                onClick={closeLiveryModal}
                className="text-gray-500 hover:text-white text-2xl leading-none"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <form
                onSubmit={handleAddLivery}
                className="mb-8 bg-gray-800/50 p-4 rounded-xl border border-gray-700"
              >
                <h3 className="text-xs text-gray-400 uppercase font-bold mb-4 tracking-widest">
                  Register New Livery
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    placeholder="Livery Name (e.g. Red Bull)"
                    value={liveryName}
                    onChange={(e) => setLiveryName(e.target.value)}
                    className="w-full p-3 text-sm rounded-lg bg-gray-900 border border-gray-700 focus:border-purple-500 outline-none"
                    required
                  />
                  <input
                    type="url"
                    placeholder="Image URL (Preview)"
                    value={liveryImageUrl}
                    onChange={(e) => setLiveryImageUrl(e.target.value)}
                    className="w-full p-3 text-sm rounded-lg bg-gray-900 border border-gray-700 focus:border-purple-500 outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSavingLivery}
                  className="mt-4 w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition"
                >
                  {isSavingLivery ? 'Saving...' : 'Save Livery'}
                </button>
              </form>
              <h3 className="text-xs text-gray-400 uppercase font-bold mb-4 tracking-widest">
                Available Liveries ({activeCar.car_liveries?.length || 0})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {activeCar.car_liveries?.map((livery: any) => (
                  <div
                    key={livery.id}
                    className="relative group bg-gray-800 rounded-lg overflow-hidden border border-gray-700"
                  >
                    <div className="aspect-video bg-gray-900 relative">
                      <img
                        src={livery.image_url}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => deleteLivery(livery.id)}
                        className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div className="p-2 text-center bg-gray-900">
                      <p className="text-xs font-bold text-gray-300 truncate">
                        {livery.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: MANAGE ADD-ONS */}
      {isAddonModalOpen && activeCar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900">
              <div>
                <h2 className="text-xl font-bold text-white italic uppercase tracking-tighter">
                  Add-ons Management
                </h2>
                <p className="text-orange-500 text-xs font-bold">
                  {activeCar.name}
                </p>
              </div>
              <button
                onClick={closeAddonModal}
                className="text-gray-500 hover:text-white text-2xl leading-none"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <form
                onSubmit={handleAddAddon}
                className="mb-8 bg-gray-800/50 p-4 rounded-xl border border-gray-700 space-y-4"
              >
                <h3 className="text-xs text-gray-400 uppercase font-bold mb-4 tracking-widest">
                  Register New Add-on / Patch
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">
                      Add-on Title *
                    </label>
                    <input
                      placeholder="e.g. Server Data Patch"
                      value={addonTitle}
                      onChange={(e) => setAddonTitle(e.target.value)}
                      className="w-full p-3 text-sm rounded-lg bg-gray-900 border border-gray-700 focus:border-orange-500 outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">
                      Type *
                    </label>
                    <select
                      value={addonType}
                      onChange={(e) => setAddonType(e.target.value)}
                      className="w-full p-3 text-sm rounded-lg bg-gray-900 border border-gray-700 focus:border-orange-500 outline-none"
                    >
                      <option value="livery_pack">🎨 Livery Pack</option>
                      <option value="physics_patch">
                        ⚙️ Physics / Data Patch
                      </option>
                      <option value="setup">🔧 Car Setup</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">
                    Download Link *
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={addonDownloadUrl}
                    onChange={(e) => setAddonDownloadUrl(e.target.value)}
                    className="w-full p-3 text-sm rounded-lg bg-gray-900 border border-gray-700 focus:border-orange-500 outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">
                    Instruction / Description
                  </label>
                  <input
                    placeholder="e.g. Extract to skins folder"
                    value={addonDescription}
                    onChange={(e) => setAddonDescription(e.target.value)}
                    className="w-full p-3 text-sm rounded-lg bg-gray-900 border border-gray-700 focus:border-orange-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSavingAddon}
                  className="mt-4 w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:text-gray-500 text-white py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition"
                >
                  {isSavingAddon ? 'Saving...' : 'Deploy Add-on'}
                </button>
              </form>

              <h3 className="text-xs text-gray-400 uppercase font-bold mb-4 tracking-widest">
                Active Add-ons ({activeCar.car_addons?.length || 0})
              </h3>
              <div className="space-y-3">
                {activeCar.car_addons?.map((addon: any) => (
                  <div
                    key={addon.id}
                    className="flex justify-between items-center bg-gray-800 p-4 rounded-xl border border-gray-700"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {addon.addon_type === 'livery_pack' ? (
                          <PaintBucket size={14} className="text-purple-400" />
                        ) : (
                          <Wrench size={14} className="text-orange-400" />
                        )}
                        <h4 className="font-bold text-sm text-white">
                          {addon.title}
                        </h4>
                      </div>
                      <p className="text-[10px] text-gray-400 font-mono truncate max-w-[300px]">
                        {addon.download_url}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteAddon(addon.id)}
                      className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {activeCar.car_addons?.length === 0 && (
                  <div className="text-center p-8 border border-dashed border-gray-700 rounded-xl text-gray-600 text-sm italic">
                    No add-ons registered.
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
