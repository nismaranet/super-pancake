'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Settings2,
  PaintBucket,
  FileArchive,
  Wrench,
  Download,
} from 'lucide-react';

export default function CarDetailPage() {
  const params = useParams();
  const carUri = params.uri as string;

  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLivery, setSelectedLivery] = useState<any>(null);

  useEffect(() => {
    async function fetchCarDetails() {
      // PERUBAHAN: Menambahkan pengambilan data `car_addons`
      const { data, error } = await supabase
        .from('cars')
        .select(
          `
          *,
          car_liveries (id, name, image_url),
          car_addons (id, title, description, addon_type, download_url)
        `,
        )
        .eq('uri', carUri)
        .single();

      if (!error && data) {
        // Urutkan addons berdasarkan tanggal dibuat (opsional)
        if (data.car_addons) {
          data.car_addons.sort(
            (a: any, b: any) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime(),
          );
        }

        setCar(data);
        // Set livery pertama sebagai default jika ada
        if (data.car_liveries?.length > 0) {
          setSelectedLivery(data.car_liveries[0]);
        }
      }
      setLoading(false);
    }

    if (carUri) fetchCarDetails();
  }, [carUri]);

  // Memformat data array JSON (Torque & Power) menjadi format object yang dimengerti Recharts
  const chartData = useMemo(() => {
    if (!car || !car.torque_curve || !car.power_curve) return [];

    const dataMap = new Map();

    car.torque_curve.forEach(([rpm, torque]: [number, number]) => {
      dataMap.set(rpm, { rpm, torque: Math.round(torque) });
    });

    car.power_curve.forEach(([rpm, power]: [number, number]) => {
      if (dataMap.has(rpm)) {
        dataMap.get(rpm).power = Math.round(power);
      } else {
        dataMap.set(rpm, { rpm, power: Math.round(power) });
      }
    });

    return Array.from(dataMap.values()).sort((a, b) => a.rpm - b.rpm);
  }, [car]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-purple-500 animate-pulse font-bold italic bg-[#050505]">
        Loading Vehicle Data...
      </div>
    );
  if (!car)
    return (
      <div className="min-h-screen flex items-center justify-center text-white font-bold text-2xl bg-[#050505]">
        Vehicle not found.
      </div>
    );

  // Filter Addons
  const liveryPacks =
    car.car_addons?.filter((a: any) => a.addon_type === 'livery_pack') || [];
  const patchesAndSetups =
    car.car_addons?.filter((a: any) => a.addon_type !== 'livery_pack') || [];

  // Gambar utama yang ditampilkan: Livery yang dipilih ATAU gambar default mobil
  const displayImage = selectedLivery
    ? selectedLivery.image_url
    : car.image_url;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* --- HEADER & MAIN IMAGE --- */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Bagian Kiri: Gambar & Pilihan Livery */}
          <div className="space-y-4">
            <div className="aspect-video bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl relative">
              {displayImage ? (
                <img
                  src={displayImage}
                  alt={car.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold italic">
                  NO PREVIEW
                </div>
              )}
              <div className="absolute top-4 left-4 bg-purple-600 text-white text-xs font-black px-3 py-1 rounded uppercase tracking-widest shadow-lg">
                {car.class || 'UNCLASSIFIED'}
              </div>
            </div>

            {/* Pilihan Livery untuk Registrasi */}
            {car.car_liveries?.length > 0 && (
              <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800">
                <h3 className="text-xs uppercase text-gray-500 font-bold tracking-widest mb-3">
                  Select Entry Livery
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                  {car.car_liveries.map((livery: any) => (
                    <button
                      key={livery.id}
                      onClick={() => setSelectedLivery(livery)}
                      className={`flex-shrink-0 relative w-24 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedLivery?.id === livery.id
                          ? 'border-purple-500 shadow-[0_0_10px_rgba(234,88,12,0.5)]'
                          : 'border-gray-700 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={livery.image_url}
                        alt={livery.name}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
                <p className="text-center text-purple-400 font-bold mt-2 text-sm">
                  {selectedLivery?.name || 'No livery selected'}
                </p>
              </div>
            )}
          </div>

          {/* Bagian Kanan: Info Kendaraan & Spesifikasi */}
          <div className="flex flex-col">
            <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter mb-1">
              {car.name}
            </h1>
            <p className="text-purple-500 font-bold uppercase tracking-widest text-sm mb-6">
              {car.brand} • {car.country}
            </p>

            {car.description && (
              <div
                className="text-gray-400 text-sm mb-8 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: car.description }}
              />
            )}

            {car.specs && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {Object.entries(car.specs).map(([key, value]) => (
                  <div
                    key={key}
                    className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex flex-col justify-center items-center text-center shadow-inner"
                  >
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">
                      {key}
                    </span>
                    <span className="text-lg font-black text-white">
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Tombol Download Utama (Base Mod) */}
            <a
              href={car.download_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto w-full block text-center bg-purple-600 hover:bg-purple-500 text-white py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] active:scale-[0.98]"
            >
              Download Base Mod
            </a>
          </div>
        </div>

        {/* --- ADDONS & PATCHES SECTION --- */}
        {(patchesAndSetups.length > 0 || liveryPacks.length > 0) && (
          <div className="grid md:grid-cols-2 gap-8 pt-4">
            {/* Bagian Patches & Setups (Oranye) */}
            {patchesAndSetups.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 p-6 md:p-8 rounded-2xl shadow-xl">
                <h3 className="text-xl font-black italic uppercase tracking-tighter mb-6 flex items-center gap-3 text-white">
                  <Wrench className="text-orange-500" size={24} />
                  Mandatory Patches & Setups
                </h3>
                <div className="space-y-4">
                  {patchesAndSetups.map((patch: any) => (
                    <div
                      key={patch.id}
                      className="bg-orange-500/10 border border-orange-500/20 p-5 rounded-2xl flex flex-col justify-between"
                    >
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Settings2 size={16} className="text-orange-400" />
                          <h4 className="font-black uppercase text-sm text-white">
                            {patch.title}
                          </h4>
                        </div>
                        <p className="text-[10px] font-bold text-orange-300/80 uppercase tracking-widest leading-relaxed">
                          {patch.description ||
                            'Update file required for server compatibility.'}
                        </p>
                      </div>
                      <a
                        href={patch.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full bg-orange-600 hover:bg-orange-500 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-lg shadow-orange-500/20"
                      >
                        <Download size={14} /> Download Patch
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bagian Livery Packs (Ungu) */}
            {liveryPacks.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 p-6 md:p-8 rounded-2xl shadow-xl">
                <h3 className="text-xl font-black italic uppercase tracking-tighter mb-6 flex items-center gap-3 text-white">
                  <FileArchive className="text-purple-500" size={24} />
                  Additional Livery Packs
                </h3>
                <div className="space-y-4">
                  {liveryPacks.map((pack: any) => (
                    <div
                      key={pack.id}
                      className="bg-purple-500/10 border border-purple-500/20 p-5 rounded-2xl flex flex-col justify-between"
                    >
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <PaintBucket size={16} className="text-purple-400" />
                          <h4 className="font-black uppercase text-sm text-white">
                            {pack.title}
                          </h4>
                        </div>
                        <p className="text-[10px] font-bold text-purple-300/80 uppercase tracking-widest leading-relaxed">
                          {pack.description ||
                            'Extract contents to your skins folder.'}
                        </p>
                      </div>
                      <a
                        href={pack.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full bg-purple-600 hover:bg-purple-500 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-lg shadow-purple-500/20"
                      >
                        <Download size={14} /> Download Pack
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Spacer jika salah satu kosong agar grid tetap rapi */}
            {patchesAndSetups.length === 0 && (
              <div className="hidden md:block"></div>
            )}
            {liveryPacks.length === 0 && (
              <div className="hidden md:block"></div>
            )}
          </div>
        )}

        {/* --- CHART SECTION: Dyno Curve --- */}
        {chartData.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 p-6 md:p-8 rounded-2xl shadow-2xl relative overflow-hidden mt-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-600/5 blur-[100px] rounded-full pointer-events-none"></div>

            <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter mb-2">
              Engine Telemetry
            </h2>
            <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-8">
              Power & Torque vs Engine Speed (RPM)
            </p>

            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#374151"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="rpm"
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    tickFormatter={(value) => `${value}`}
                    type="number"
                    domain={['dataMin', 'dataMax']}
                  />

                  <YAxis
                    yAxisId="left"
                    stroke="#F97316"
                    tick={{ fill: '#F97316', fontSize: 12 }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#3B82F6"
                    tick={{ fill: '#3B82F6', fontSize: 12 }}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111827',
                      borderColor: '#374151',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                    itemStyle={{ fontWeight: 'bold' }}
                    labelFormatter={(label) => `${label} RPM`}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />

                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="power"
                    name="Power (BHP)"
                    stroke="#F97316"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{
                      r: 6,
                      fill: '#F97316',
                      stroke: '#111827',
                      strokeWidth: 2,
                    }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="torque"
                    name="Torque (Nm)"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{
                      r: 6,
                      fill: '#3B82F6',
                      stroke: '#111827',
                      strokeWidth: 2,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
