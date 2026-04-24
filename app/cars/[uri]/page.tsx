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
      <div className="min-h-screen flex items-center justify-center text-[var(--accent)] animate-pulse font-bold italic bg-[var(--background)] transition-colors duration-300">
        Loading Vehicle Data...
      </div>
    );
  if (!car)
    return (
      <div className="min-h-screen flex items-center justify-center text-[var(--foreground)] font-bold text-2xl bg-[var(--background)] transition-colors duration-300">
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
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-8 pt-16">
        {/* --- HEADER & MAIN IMAGE --- */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Bagian Kiri: Gambar & Pilihan Livery */}
          <div className="space-y-4">
            <div className="aspect-video bg-[var(--background)] rounded-2xl overflow-hidden border border-[var(--card-border)] shadow-lg relative transition-colors">
              {displayImage ? (
                <img
                  src={displayImage}
                  alt={car.name}
                  className="w-full h-full object-cover transition-opacity duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--muted)] font-bold italic">
                  NO PREVIEW
                </div>
              )}
              <div className="absolute top-4 left-4 bg-[var(--accent)] text-white text-xs font-black px-3 py-1 rounded uppercase tracking-widest shadow-lg">
                {car.class || 'UNCLASSIFIED'}
              </div>
            </div>

            {/* Pilihan Livery untuk Registrasi */}
            {car.car_liveries?.length > 0 && (
              <div className="bg-[var(--card)] p-4 rounded-2xl border border-[var(--card-border)] shadow-sm transition-colors">
                <h3 className="text-xs uppercase text-[var(--muted)] font-bold tracking-widest mb-3">
                  Select Entry Livery
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                  {car.car_liveries.map((livery: any) => (
                    <button
                      key={livery.id}
                      onClick={() => setSelectedLivery(livery)}
                      className={`flex-shrink-0 relative w-24 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedLivery?.id === livery.id
                          ? 'border-[var(--accent)] shadow-[0_0_15px_var(--accent-glow)] scale-105'
                          : 'border-[var(--card-border)] opacity-60 hover:opacity-100 hover:border-[var(--muted)]'
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
                <p className="text-center text-[var(--accent)] font-bold mt-2 text-sm">
                  {selectedLivery?.name || 'No livery selected'}
                </p>
              </div>
            )}
          </div>

          {/* Bagian Kanan: Info Kendaraan & Spesifikasi */}
          <div className="flex flex-col">
            <h1 className="text-4xl font-black italic text-[var(--foreground)] uppercase tracking-tighter mb-1 transition-colors">
              {car.name}
            </h1>
            <p className="text-blue-500 font-bold uppercase tracking-widest text-sm mb-6">
              {car.brand} {car.country ? `• ${car.country}` : ''}
            </p>

            {car.description && (
              <div
                className="text-[var(--muted)] text-sm mb-8 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: car.description }}
              />
            )}

            {car.specs && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {Object.entries(car.specs).map(([key, value]) => (
                  <div
                    key={key}
                    className="bg-[var(--card)] border border-[var(--card-border)] p-4 rounded-xl flex flex-col justify-center items-center text-center shadow-sm transition-colors"
                  >
                    <span className="text-[10px] text-[var(--muted)] uppercase font-bold tracking-widest mb-1">
                      {key}
                    </span>
                    <span className="text-lg font-black text-[var(--foreground)]">
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
              className="mt-auto w-full block text-center bg-gradient-to-r from-blue-600 to-[var(--accent)] hover:opacity-90 text-white py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-[0_0_20px_var(--accent-glow)] active:scale-[0.98]"
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
              <div className="bg-[var(--card)] border border-[var(--card-border)] p-6 md:p-8 rounded-2xl shadow-md transition-colors">
                <h3 className="text-xl font-black italic uppercase tracking-tighter mb-6 flex items-center gap-3 text-[var(--foreground)]">
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
                          <Settings2 size={16} className="text-orange-500" />
                          <h4 className="font-black uppercase text-sm text-[var(--foreground)]">
                            {patch.title}
                          </h4>
                        </div>
                        <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest leading-relaxed">
                          {patch.description ||
                            'Update file required for server compatibility.'}
                        </p>
                      </div>
                      <a
                        href={patch.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-sm"
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
              <div className="bg-[var(--card)] border border-[var(--card-border)] p-6 md:p-8 rounded-2xl shadow-md transition-colors">
                <h3 className="text-xl font-black italic uppercase tracking-tighter mb-6 flex items-center gap-3 text-[var(--foreground)]">
                  <FileArchive className="text-[var(--accent)]" size={24} />
                  Additional Livery Packs
                </h3>
                <div className="space-y-4">
                  {liveryPacks.map((pack: any) => (
                    <div
                      key={pack.id}
                      className="bg-[var(--accent-glow)] border border-[var(--accent)]/30 p-5 rounded-2xl flex flex-col justify-between"
                    >
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <PaintBucket
                            size={16}
                            className="text-[var(--accent)]"
                          />
                          <h4 className="font-black uppercase text-sm text-[var(--foreground)]">
                            {pack.title}
                          </h4>
                        </div>
                        <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest leading-relaxed">
                          {pack.description ||
                            'Extract contents to your skins folder.'}
                        </p>
                      </div>
                      <a
                        href={pack.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full bg-[var(--accent)] hover:opacity-90 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-sm"
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
          <div className="bg-[var(--card)] border border-[var(--card-border)] p-6 md:p-8 rounded-2xl shadow-md relative overflow-hidden mt-8 transition-colors">
            {/* Glow effect menyesuaikan dengan tema */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/10 blur-[100px] rounded-full pointer-events-none"></div>

            <h2 className="text-2xl font-black italic text-[var(--foreground)] uppercase tracking-tighter mb-2">
              Engine Telemetry
            </h2>
            <p className="text-xs text-[var(--muted)] font-bold tracking-widest uppercase mb-8">
              Power & Torque vs Engine Speed (RPM)
            </p>

            <div className="w-full h-[400px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--card-border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="rpm"
                    stroke="var(--muted)"
                    tick={{ fill: 'var(--muted)', fontSize: 12 }}
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
                      backgroundColor: 'var(--card)',
                      borderColor: 'var(--card-border)',
                      borderRadius: '12px',
                      color: 'var(--foreground)',
                      boxShadow:
                        '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    }}
                    itemStyle={{ fontWeight: 'bold' }}
                    labelFormatter={(label) => `${label} RPM`}
                    labelStyle={{ color: 'var(--muted)', marginBottom: '8px' }}
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
                      stroke: 'var(--card)',
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
                      stroke: 'var(--card)',
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
