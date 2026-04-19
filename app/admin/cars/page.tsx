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
  Car,
  Edit3,
  PlusCircle,
  XCircle,
  UploadCloud,
  FileJson,
  Plus,
  X,
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

  // ================= UPLOAD STATES =================
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingLivery, setIsUploadingLivery] = useState(false);

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
        `*, car_assignments (server_id), car_liveries (id, name, image_url), car_addons (id, title, description, addon_type, download_url)`,
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
      const generatedUri = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setUri(generatedUri);
    }
  };

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
      } finally {
        e.target.value = '';
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
      <div className="flex h-screen items-center justify-center text-orange-500 animate-pulse font-bold tracking-widest uppercase">
        Syncing Garage...
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 text-gray-200">
      {/* HEADER SECTION */}
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-800">
        <div className="p-3 bg-orange-500/10 rounded-xl">
          <Car className="text-orange-500" size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
            Garage Admin
          </h1>
          <p className="text-gray-500 text-sm font-medium">
            Manage vehicles, liveries, addons, and metadata
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* FORM SECTION (LEFT SIDE) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            {/* Header Form */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4 relative z-10">
              <h2 className="flex items-center gap-2 text-white font-bold uppercase text-sm tracking-widest">
                {editingId ? (
                  <>
                    <Edit3 size={16} className="text-yellow-500" /> Edit
                    Specifications
                  </>
                ) : (
                  <>
                    <PlusCircle size={16} className="text-orange-500" />{' '}
                    Register New Vehicle
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
                  Auto-Fill from ui_car.json
                </span>
                <span className="text-[10px] text-gray-500 text-center px-4">
                  Upload to extract Power/Torque curves, brand, class, and
                  description
                </span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleJsonUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="space-y-5 relative z-10">
              {/* Group: Basic Info */}
              <div className="space-y-4 bg-gray-800/30 p-4 rounded-2xl border border-gray-700/50">
                <div className="group">
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-orange-500">
                    Vehicle Name *
                  </label>
                  <input
                    placeholder="e.g. Porsche 911 GT3 R"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-orange-500 outline-none transition text-sm text-white"
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
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-'),
                        )
                      }
                      className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-orange-500 outline-none transition text-xs font-mono text-orange-400"
                    />
                  </div>
                  <div className="group">
                    <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-orange-500">
                      Model Key (Folder)
                    </label>
                    <input
                      placeholder="e.g. ks_porsche"
                      value={modelKey}
                      onChange={(e) => setModelKey(e.target.value)}
                      className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-orange-500 outline-none transition text-xs font-mono text-blue-400"
                      title="Digunakan untuk mencocokkan data ranked / stats dari server"
                    />
                  </div>
                </div>
              </div>

              {/* Group: Links & Images */}
              <div className="space-y-4 bg-gray-800/30 p-4 rounded-2xl border border-gray-700/50">
                <div className="group relative">
                  <FileArchive className="absolute right-3 top-[34px] text-gray-600 w-4 h-4" />
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-orange-500">
                    Download Link (Base Mod) *
                  </label>
                  <input
                    placeholder="URL to .zip / Content Manager"
                    value={downloadUrl}
                    onChange={(e) => setDownloadUrl(e.target.value)}
                    className="w-full mt-1 p-3 pr-10 rounded-xl bg-gray-800 border border-gray-700 focus:border-orange-500 outline-none transition text-sm text-white"
                  />
                </div>
                <div className="group">
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-orange-500">
                    Image Preview (Upload or Link)
                  </label>
                  <div className="flex gap-2 mt-1">
                    <input
                      placeholder="Image Link"
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
                            'cars',
                            setImageUrl,
                            setIsUploadingImage,
                          )
                        }
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Group: Assign Servers */}
              <div className="bg-gray-800/30 p-4 rounded-2xl border border-gray-700/50">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">
                    Deploy to Servers
                  </label>
                  <span className="text-[10px] font-bold bg-orange-500/20 text-orange-400 px-2 py-1 rounded-lg">
                    {selectedServers.length} Selected
                  </span>
                </div>
                <div className="h-44 overflow-y-auto pr-2 custom-scrollbar space-y-1">
                  {servers.map((s) => (
                    <label
                      key={s.id}
                      className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition select-none ${selectedServers.includes(s.id) ? 'bg-orange-600/20 border border-orange-500/30' : 'hover:bg-gray-800 border border-transparent'}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedServers.includes(s.id)}
                        onChange={() => toggleServer(s.id)}
                        className="w-4 h-4 rounded accent-orange-500 bg-gray-900 border-gray-700"
                      />
                      <span
                        className={`text-xs font-medium ${selectedServers.includes(s.id) ? 'text-orange-300' : 'text-gray-400'}`}
                      >
                        {s.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={editingId ? updateCar : addCar}
              className={`w-full mt-6 py-4 rounded-xl font-black uppercase tracking-widest transition duration-300 shadow-lg relative z-10 ${editingId ? 'bg-yellow-500 hover:bg-yellow-400 text-yellow-950 shadow-yellow-500/20' : 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-500/20'}`}
            >
              {editingId ? 'Update Specifications' : 'Save & Deploy Vehicle'}
            </button>
          </div>
        </div>

        {/* LIST SECTION (RIGHT SIDE) */}
        <div className="lg:col-span-7">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {cars.map((car) => (
              <div
                key={car.id}
                className="group bg-gray-900 border border-gray-800 hover:border-orange-500/50 rounded-3xl overflow-hidden transition-all duration-300 shadow-xl flex flex-col"
              >
                <div className="h-32 bg-gray-800 relative overflow-hidden flex items-center justify-center border-b border-gray-800">
                  {car.image_url ? (
                    <img
                      src={car.image_url}
                      alt={car.name}
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <Car className="text-gray-700 w-10 h-10" />
                  )}
                  {car.brand && (
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm border border-gray-600/50 text-white text-[10px] px-2 py-1 rounded-md font-black uppercase tracking-widest">
                      {car.brand}
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition duration-300">
                    <button
                      onClick={() => startEdit(car)}
                      className="p-2 bg-black/60 backdrop-blur-sm border border-yellow-500/50 text-yellow-500 hover:bg-yellow-500 hover:text-black rounded-lg transition"
                      title="Edit"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => deleteCar(car.id)}
                      className="p-2 bg-black/60 backdrop-blur-sm border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-black rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest mb-1">
                    {car.class || 'Unclassified'}
                  </p>
                  <h3 className="text-lg font-black text-white leading-tight mb-4 line-clamp-1">
                    {car.name}
                  </h3>

                  <div className="grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-gray-800/80">
                    <button
                      onClick={() => openLiveryModal(car)}
                      className="bg-purple-600/10 hover:bg-purple-600 text-purple-400 hover:text-white border border-purple-500/30 py-2 rounded-xl text-[10px] uppercase font-bold transition flex items-center justify-center gap-2"
                    >
                      <PaintBucket size={14} /> Liveries (
                      {car.car_liveries?.length || 0})
                    </button>
                    <button
                      onClick={() => openAddonModal(car)}
                      className="bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 py-2 rounded-xl text-[10px] uppercase font-bold transition flex items-center justify-center gap-2"
                    >
                      <Wrench size={14} /> Add-ons (
                      {car.car_addons?.length || 0})
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {cars.length === 0 && !loading && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-800 rounded-3xl">
                <Car className="mx-auto text-gray-600 mb-3" size={40} />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">
                  No Vehicles Found
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= LIVERY MODAL ================= */}
      {isLiveryModalOpen && activeCar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <PaintBucket className="text-purple-500" size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-widest leading-none">
                    Manage Liveries
                  </h2>
                  <p className="text-gray-400 text-xs font-bold uppercase mt-1">
                    Modifying:{' '}
                    <span className="text-purple-400">{activeCar.name}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={closeLiveryModal}
                className="text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-xl transition"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-gray-950/50">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Modal Form Kiri */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-inner">
                  <h3 className="text-xs text-purple-400 font-black uppercase tracking-widest mb-4 border-b border-gray-800 pb-3 flex items-center gap-2">
                    <Plus size={14} /> Add New Livery
                  </h3>
                  <form onSubmit={handleAddLivery} className="space-y-4">
                    <div className="group">
                      <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-purple-500">
                        Livery Name / Folder *
                      </label>
                      <input
                        required
                        placeholder="e.g. 00_official_racing"
                        value={liveryName}
                        onChange={(e) => setLiveryName(e.target.value)}
                        className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-purple-500 outline-none transition text-sm text-white"
                      />
                    </div>
                    <div className="group">
                      <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-purple-500">
                        Image Preview (Upload or Link) *
                      </label>
                      <div className="flex gap-2 mt-1">
                        <input
                          required
                          placeholder="https://..."
                          value={liveryImageUrl}
                          onChange={(e) => setLiveryImageUrl(e.target.value)}
                          className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-purple-500 outline-none transition text-sm text-white"
                        />
                        <label
                          className={`flex items-center justify-center px-4 rounded-xl font-bold text-xs cursor-pointer transition whitespace-nowrap ${isUploadingLivery ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-purple-600/20 text-purple-500 hover:bg-purple-600/40 border border-purple-500/50'}`}
                        >
                          {isUploadingLivery ? (
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
                            disabled={isUploadingLivery}
                            onChange={(e) =>
                              handleFileUpload(
                                e,
                                'liveries',
                                setLiveryImageUrl,
                                setIsUploadingLivery,
                              )
                            }
                          />
                        </label>
                      </div>
                    </div>
                    <button
                      disabled={isSavingLivery}
                      className="w-full py-3 mt-4 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-400 text-white font-bold rounded-xl uppercase tracking-widest text-sm transition"
                    >
                      {isSavingLivery ? 'Saving...' : 'Save Livery'}
                    </button>
                  </form>
                </div>
                {/* Modal List Kanan */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-inner">
                  <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-3">
                    <h3 className="text-xs text-purple-400 font-black uppercase tracking-widest flex items-center gap-2">
                      <PaintBucket size={14} /> Registered
                    </h3>
                    <span className="bg-purple-500/20 text-purple-400 text-[10px] px-2 py-1 rounded-md font-bold">
                      {activeCar.car_liveries?.length || 0} Liveries
                    </span>
                  </div>
                  <div className="space-y-3 h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    {activeCar.car_liveries?.map((livery: any) => (
                      <div
                        key={livery.id}
                        className="p-3 bg-gray-800/50 border border-gray-700/50 hover:border-purple-500/50 rounded-xl flex items-center justify-between group transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-8 bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
                            {livery.image_url ? (
                              <img
                                src={livery.image_url}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <PaintBucket
                                size={14}
                                className="w-full h-full p-2 text-gray-600"
                              />
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-white truncate max-w-[120px]">
                            {livery.name}
                          </h4>
                        </div>
                        <button
                          onClick={() => deleteLivery(livery.id)}
                          className="p-2 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {(!activeCar.car_liveries ||
                      activeCar.car_liveries.length === 0) && (
                      <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
                        <PaintBucket size={40} className="mb-2" />
                        <p className="italic text-xs font-bold uppercase tracking-widest">
                          No Liveries Added
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

      {/* ================= ADDON MODAL ================= */}
      {isAddonModalOpen && activeCar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Wrench className="text-blue-500" size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-widest leading-none">
                    Manage Add-ons
                  </h2>
                  <p className="text-gray-400 text-xs font-bold uppercase mt-1">
                    Modifying:{' '}
                    <span className="text-blue-400">{activeCar.name}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={closeAddonModal}
                className="text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-xl transition"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-gray-950/50">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Modal Form Kiri */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-inner">
                  <h3 className="text-xs text-blue-400 font-black uppercase tracking-widest mb-4 border-b border-gray-800 pb-3 flex items-center gap-2">
                    <Plus size={14} /> Create Add-on
                  </h3>
                  <form onSubmit={handleAddAddon} className="space-y-4">
                    <div className="group">
                      <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-blue-500">
                        Add-on Title *
                      </label>
                      <input
                        required
                        placeholder="e.g. Endurance Lights Patch"
                        value={addonTitle}
                        onChange={(e) => setAddonTitle(e.target.value)}
                        className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none transition text-sm text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="group">
                        <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-blue-500">
                          Category *
                        </label>
                        <select
                          value={addonType}
                          onChange={(e) => setAddonType(e.target.value)}
                          className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none transition text-sm text-white"
                        >
                          <option value="livery_pack">Livery Pack</option>
                          <option value="physics_patch">Physics Patch</option>
                          <option value="setup">Car Setup</option>
                        </select>
                      </div>
                      <div className="group relative">
                        <FileArchive className="absolute right-3 top-[34px] text-gray-600 w-4 h-4" />
                        <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-blue-500">
                          Download Link *
                        </label>
                        <input
                          required
                          placeholder="URL to .zip"
                          value={addonDownloadUrl}
                          onChange={(e) => setAddonDownloadUrl(e.target.value)}
                          className="w-full mt-1 p-3 pr-10 rounded-xl bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none transition text-sm text-white"
                        />
                      </div>
                    </div>
                    <div className="group">
                      <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 transition group-focus-within:text-blue-500">
                        Description / Note
                      </label>
                      <textarea
                        placeholder="e.g. Required for night racing..."
                        value={addonDescription}
                        onChange={(e) => setAddonDescription(e.target.value)}
                        rows={2}
                        className="w-full mt-1 p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none transition text-sm text-white resize-none"
                      />
                    </div>
                    <button
                      disabled={isSavingAddon}
                      className="w-full py-3 mt-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-400 text-white font-bold rounded-xl uppercase tracking-widest text-sm transition"
                    >
                      {isSavingAddon ? 'Saving...' : 'Save Add-on'}
                    </button>
                  </form>
                </div>
                {/* Modal List Kanan */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-inner">
                  <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-3">
                    <h3 className="text-xs text-blue-400 font-black uppercase tracking-widest flex items-center gap-2">
                      <Wrench size={14} /> Registered
                    </h3>
                    <span className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-1 rounded-md font-bold">
                      {activeCar.car_addons?.length || 0} Items
                    </span>
                  </div>
                  <div className="space-y-3 h-[330px] overflow-y-auto pr-2 custom-scrollbar">
                    {activeCar.car_addons?.map((addon: any) => (
                      <div
                        key={addon.id}
                        className="p-3 bg-gray-800/50 border border-gray-700/50 hover:border-blue-500/50 rounded-xl flex items-center justify-between group transition"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {addon.addon_type === 'livery_pack' ? (
                              <PaintBucket
                                size={12}
                                className="text-purple-400"
                              />
                            ) : addon.addon_type === 'setup' ? (
                              <Settings2 size={12} className="text-green-400" />
                            ) : (
                              <Wrench size={12} className="text-blue-400" />
                            )}
                            <h4 className="font-bold text-xs text-white">
                              {addon.title}
                            </h4>
                          </div>
                          <p className="text-[10px] text-gray-500 font-mono truncate max-w-[200px]">
                            {addon.download_url}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteAddon(addon.id)}
                          className="p-2 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {(!activeCar.car_addons ||
                      activeCar.car_addons.length === 0) && (
                      <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
                        <Wrench size={40} className="mb-2" />
                        <p className="italic text-xs font-bold uppercase tracking-widest">
                          No Add-ons Available
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
