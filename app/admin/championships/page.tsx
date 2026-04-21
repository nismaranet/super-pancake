'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Trophy,
  Plus,
  Trash2,
  Edit3,
  Settings2,
  CheckCircle2,
  XCircle,
  Coins,
  CarFront,
  X,
  Save,
} from 'lucide-react';

export default function ChampionshipsAdmin() {
  const [loading, setLoading] = useState(true);
  const [championships, setChampionships] = useState<any[]>([]);

  // ================= STATES FOR CHAMPIONSHIP =================
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [entryFee, setEntryFee] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);

  // ================= CLASS CARS MANAGEMENT =================
  const [allCars, setAllCars] = useState<any[]>([]);
  const [selectedClassForCars, setSelectedClassForCars] = useState<any>(null); // State untuk buka panel mobil
  const [classCars, setClassCars] = useState<any[]>([]); // Mobil yang sudah masuk ke kelas
  const [selectedCarToAdd, setSelectedCarToAdd] = useState('');

  // Default format JSON agar admin mudah mengedit
  const defaultPoints = JSON.stringify(
    {
      positions: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
      fastest_lap: 1,
      pole_position: 0,
    },
    null,
    2,
  );
  const defaultPointsR2 = JSON.stringify(
    {
      positions: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
      fastest_lap: 1,
      pole_position: 0,
    },
    null,
    2,
  );
  const [pointsSystemR1, setPointsSystemR1] = useState(defaultPoints);
  const [pointsSystemR2, setPointsSystemR2] = useState(defaultPointsR2);

  // ================= STATES FOR CLASSES MODAL =================
  const [manageClassId, setManageClassId] = useState<string | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [className, setClassName] = useState('');
  const [classColor, setClassColor] = useState('#a78bfa');

  useEffect(() => {
    fetchChampionships();
    fetchAllCars();
  }, []);

  const fetchAllCars = async () => {
    const { data } = await supabase
      .from('cars')
      .select('id, brand, name')
      .order('brand', { ascending: true });
    if (data) setAllCars(data);
  };

  const fetchChampionships = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('championships')
      .select('*, championship_classes(*)')
      .order('created_at', { ascending: false });

    if (!error && data) setChampionships(data);
    setLoading(false);
  };

  const openCarManager = async (cls: any) => {
    setSelectedClassForCars(cls);
    // Ambil mobil yang sudah terdaftar di kelas ini
    const { data } = await supabase
      .from('championship_class_cars')
      .select('id, car_id, cars(id, brand, name)')
      .eq('class_id', cls.id);
    if (data) setClassCars(data);
  };

  const handleAssignCar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCarToAdd || !selectedClassForCars) return;

    const { data, error } = await supabase
      .from('championship_class_cars')
      .insert([{ class_id: selectedClassForCars.id, car_id: selectedCarToAdd }])
      .select('id, car_id, cars(id, brand, name)');

    if (error)
      alert(
        'Mobil sudah ada di kelas ini atau terjadi error: ' + error.message,
      );
    else {
      setClassCars([...classCars, data[0]]);
      setSelectedCarToAdd('');
    }
  };

  const handleRemoveCar = async (id: string) => {
    await supabase.from('championship_class_cars').delete().eq('id', id);
    setClassCars(classCars.filter((c) => c.id !== id));
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setEntryFee(0);
    setIsActive(true);
    setPointsSystemR1(defaultPoints);
    setPointsSystemR2(defaultPointsR2);
  };

  const handleEdit = (champ: any) => {
    setEditingId(champ.id);
    setName(champ.name);
    setDescription(champ.description || '');
    setEntryFee(champ.entry_fee || 0);
    setIsActive(champ.is_active);
    setPointsSystemR1(JSON.stringify(champ.points_r1, null, 2));
    setPointsSystemR2(JSON.stringify(champ.points_r2, null, 2));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return alert('Nama Championship wajib diisi!');

    // Validasi JSON
    let parsedPointsR1, parsedPointsR2;
    try {
      parsedPointsR1 = JSON.parse(pointsSystemR1);
      parsedPointsR2 = JSON.parse(pointsSystemR2);
    } catch (err) {
      return alert(
        'Format Points System (JSON) tidak valid! Pastikan menggunakan format yang benar.',
      );
    }

    const payload = {
      name,
      description,
      entry_fee: entryFee,
      is_active: isActive,
      points_r1: parsedPointsR1,
      points_r2: parsedPointsR2,
    };

    if (editingId) {
      const { error } = await supabase
        .from('championships')
        .update(payload)
        .eq('id', editingId);
      if (error) alert(error.message);
    } else {
      const { error } = await supabase.from('championships').insert([payload]);
      if (error) alert(error.message);
    }

    resetForm();
    fetchChampionships();
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        'Yakin ingin menghapus Championship ini? Semua data klasemen akan hilang!',
      )
    )
      return;
    const { error } = await supabase
      .from('championships')
      .delete()
      .eq('id', id);
    if (error) alert(error.message);
    else fetchChampionships();
  };

  // ================= CLASSES MANAGEMENT =================
  const openClassModal = (champ: any) => {
    setManageClassId(champ.id);
    setClasses(champ.championship_classes || []);
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className || !manageClassId) return;

    const { data, error } = await supabase
      .from('championship_classes')
      .insert([
        {
          championship_id: manageClassId,
          name: className,
          color_hex: classColor,
        },
      ])
      .select();

    if (error) alert(error.message);
    else {
      setClasses([...classes, data[0]]);
      setClassName('');
      fetchChampionships(); // Refresh background data
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm('Hapus kelas ini?')) return;
    const { error } = await supabase
      .from('championship_classes')
      .delete()
      .eq('id', id);
    if (!error) {
      setClasses(classes.filter((c) => c.id !== id));
      fetchChampionships();
    }
  };

  if (loading)
    return (
      <div className="p-8 text-white font-black animate-pulse">
        Loading Championships...
      </div>
    );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-3 mb-8">
        <Trophy size={32} className="text-purple-500" />
        <h1 className="text-3xl font-black italic text-white uppercase tracking-tighter">
          Championships
        </h1>
      </div>

      {/* FORM INPUT CHAMPIONSHIP */}
      <form
        onSubmit={handleSave}
        className="bg-gray-900/50 border border-gray-800 p-6 rounded-3xl space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">
                Championship Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Nismara Endurance Season 1"
                className="w-full mt-1 p-4 rounded-xl bg-gray-800/50 border border-gray-700 text-white focus:border-purple-500 outline-none transition"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Brief details about the season..."
                className="w-full mt-1 p-4 rounded-xl bg-gray-800/50 border border-gray-700 text-white focus:border-purple-500 outline-none transition resize-y"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">
                  Entry Fee (NRC)
                </label>
                <div className="relative mt-1">
                  <Coins
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-500"
                  />
                  <input
                    type="number"
                    value={entryFee}
                    onChange={(e) => setEntryFee(parseInt(e.target.value) || 0)}
                    className="w-full pl-11 p-4 rounded-xl bg-gray-800/50 border border-gray-700 text-white focus:border-purple-500 outline-none transition"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">
                  Status
                </label>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`w-full mt-1 p-4 rounded-xl font-black uppercase tracking-widest transition flex justify-center items-center gap-2 border ${isActive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}
                >
                  {isActive ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <XCircle size={18} />
                  )}{' '}
                  {isActive ? 'Active' : 'Archived'}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1 flex items-center gap-2">
              <Settings2 size={12} /> Points System RACE 1 (JSON Format)
            </label>
            <textarea
              value={pointsSystemR1}
              onChange={(e) => setPointsSystemR1(e.target.value)}
              rows={9}
              className="w-full mt-1 p-4 rounded-xl bg-[#0d1117] border border-gray-700 text-green-400 font-mono text-xs focus:border-purple-500 outline-none transition resize-y"
            />
            <p className="text-[9px] text-gray-500 italic ml-1">
              Pastikan format array dan key ditulis dalam kutipan ganda (").
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1 flex items-center gap-2">
              <Settings2 size={12} /> Points System RACE 2 (JSON Format)
            </label>
            <textarea
              value={pointsSystemR2}
              onChange={(e) => setPointsSystemR2(e.target.value)}
              rows={9}
              className="w-full mt-1 p-4 rounded-xl bg-[#0d1117] border border-gray-700 text-green-400 font-mono text-xs focus:border-purple-500 outline-none transition resize-y"
            />
            <p className="text-[9px] text-gray-500 italic ml-1">
              Pastikan format array dan key ditulis dalam kutipan ganda (").
            </p>
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t border-gray-800">
          <button
            type="submit"
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl font-black uppercase tracking-widest transition flex justify-center items-center gap-2"
          >
            <Save size={18} />{' '}
            {editingId ? 'Update Championship' : 'Create Championship'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-8 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-black uppercase tracking-widest transition"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* LIST CHAMPIONSHIPS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {championships.map((champ) => (
          <div
            key={champ.id}
            className={`bg-gray-900/50 border rounded-3xl p-6 transition-all ${champ.is_active ? 'border-purple-500/30 shadow-[0_0_15px_rgba(167,139,250,0.1)]' : 'border-gray-800 opacity-70'}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tighter truncate">
                  {champ.name}
                </h3>
                <span
                  className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${champ.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-400'}`}
                >
                  {champ.is_active ? 'Active Season' : 'Archived'}
                </span>
              </div>
              <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-lg">
                <Coins size={12} className="text-yellow-500" />
                <span className="text-xs font-bold text-white">
                  {champ.entry_fee} NRC
                </span>
              </div>
            </div>

            {/* Render Classes Tags */}
            <div className="mb-6 flex flex-wrap gap-2">
              {champ.championship_classes?.length > 0 ? (
                champ.championship_classes.map((cls: any) => (
                  <span
                    key={cls.id}
                    style={{ borderColor: cls.color_hex, color: cls.color_hex }}
                    className="px-2 py-1 border bg-black/20 rounded text-[9px] font-black uppercase tracking-widest"
                  >
                    {cls.name}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-600 italic">
                  No classes defined
                </span>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-800/50">
              <button
                onClick={() => openClassModal(champ)}
                className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition"
                title="Manage Classes"
              >
                <CarFront size={18} />
              </button>
              <button
                onClick={() => handleEdit(champ)}
                className="p-2 bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white rounded-lg transition"
                title="Edit"
              >
                <Edit3 size={18} />
              </button>
              <button
                onClick={() => handleDelete(champ.id)}
                className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition"
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL MANAGE CLASSES */}
      {/* MODAL MANAGE CLASSES & CARS */}
      {manageClassId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl transition-all">
            <div className="p-8">
              {/* HEADER MODAL */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">
                    {selectedClassForCars
                      ? `Cars for ${selectedClassForCars.name}`
                      : 'Manage Classes'}
                  </h3>
                  {selectedClassForCars && (
                    <button
                      onClick={() => setSelectedClassForCars(null)}
                      className="text-[10px] text-blue-400 uppercase font-bold tracking-widest hover:underline flex items-center gap-1 mt-1"
                    >
                      ← Back to Classes
                    </button>
                  )}
                </div>
                <button
                  onClick={() => {
                    setManageClassId(null);
                    setSelectedClassForCars(null);
                  }}
                  className="p-2 hover:bg-gray-800 rounded-full text-gray-500"
                >
                  <X size={20} />
                </button>
              </div>

              {/* VIEW 1: MANAGE CLASSES */}
              {!selectedClassForCars ? (
                <>
                  <form onSubmit={handleAddClass} className="flex gap-2 mb-6">
                    <input
                      type="color"
                      value={classColor}
                      onChange={(e) => setClassColor(e.target.value)}
                      className="w-12 h-12 rounded-xl bg-gray-800 border-none cursor-pointer"
                    />
                    <input
                      type="text"
                      required
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      placeholder="New Class Name (e.g. GT3)"
                      className="flex-1 p-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:border-purple-500 outline-none text-sm uppercase font-bold"
                    />
                    <button
                      type="submit"
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 rounded-xl transition"
                    >
                      <Plus size={20} />
                    </button>
                  </form>

                  <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                    {classes.map((cls) => (
                      <div
                        key={cls.id}
                        className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl border border-gray-800"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: cls.color_hex }}
                          />
                          <span className="text-sm font-black text-white uppercase tracking-widest">
                            {cls.name}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openCarManager(cls)}
                            className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-lg uppercase font-bold hover:bg-blue-500 hover:text-white transition"
                          >
                            <CarFront size={12} className="inline mr-1" /> Cars
                          </button>
                          <button
                            onClick={() => handleDeleteClass(cls.id)}
                            className="text-red-500 hover:text-red-400 p-2 bg-red-500/10 rounded-lg"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {classes.length === 0 && (
                      <p className="text-center text-gray-500 text-xs italic py-4">
                        Belum ada kelas.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                /* VIEW 2: MANAGE CARS PER CLASS */
                <>
                  <form onSubmit={handleAssignCar} className="flex gap-2 mb-6">
                    <select
                      value={selectedCarToAdd}
                      onChange={(e) => setSelectedCarToAdd(e.target.value)}
                      className="flex-1 p-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:border-purple-500 outline-none text-sm"
                    >
                      <option value="">-- Pilih Mobil --</option>
                      {allCars.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.brand} {c.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 rounded-xl transition"
                    >
                      <Plus size={20} />
                    </button>
                  </form>

                  <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                    {classCars.map((cc) => (
                      <div
                        key={cc.id}
                        className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl border border-gray-800"
                      >
                        <div>
                          <p className="text-[9px] text-purple-400 font-bold uppercase tracking-widest leading-none">
                            {cc.cars.brand}
                          </p>
                          <p className="text-xs font-black text-white uppercase">
                            {cc.cars.name}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveCar(cc.id)}
                          className="text-red-500 hover:text-red-400 p-2 bg-red-500/10 rounded-lg"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    {classCars.length === 0 && (
                      <p className="text-center text-gray-500 text-xs italic py-4">
                        Belum ada mobil yang diizinkan di kelas ini.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
