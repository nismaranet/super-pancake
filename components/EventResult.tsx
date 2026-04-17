'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Pastikan path ini sesuai

export default function EventResult({ results }: { results: any[] }) {
  const [activeTab, setActiveTab] = useState(0);
  const [data, setData] = useState<any[]>([]);
  const [carsMaster, setCarsMaster] = useState<any[]>([]);

  // 1. Ambil data master mobil dari database saat komponen pertama kali dimuat
  useEffect(() => {
    async function fetchCars() {
      const { data: cars } = await supabase
        .from('cars')
        .select('model_key, name');
      if (cars) setCarsMaster(cars);
    }
    fetchCars();
  }, []);

  useEffect(() => {
    if (
      results &&
      results[activeTab] &&
      results[activeTab].url &&
      carsMaster.length > 0
    ) {
      try {
        const rawData = results[activeTab].url;
        const json =
          typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

        const processedData = json.Result.map((res: any) => {
          const carInfo = json.Cars.find((c: any) => c.CarId === res.CarId);

          // MENCARI NAMA MOBIL DARI DATABASE
          // Kita cocokkan 'CarModel' dari JSON dengan 'model_key' di database
          const dbCar = carsMaster.find((c) => c.model_key === res.CarModel);
          const realCarName = dbCar ? dbCar.name : res.CarModel; // fallback ke ID jika tidak ketemu

          return {
            ...res,
            TeamName: carInfo?.Driver.Team || 'Independent',
            DisplayName: realCarName, // Nama resmi dari DB
          };
        });

        const sessionName = results[activeTab].session.toLowerCase();
        const isQualify = sessionName.includes('qualify');

        // LOGIKA SORTING YANG BENAR
        const sorted = processedData.sort((a: any, b: any) => {
          if (isQualify) {
            const lapA = a.BestLap <= 0 ? 999999999 : a.BestLap;
            const lapB = b.BestLap <= 0 ? 999999999 : b.BestLap;
            return lapA - lapB;
          } else {
            // Urutkan berdasarkan Laps terbanyak dulu, baru TotalTime
            if (a.NumLaps !== b.NumLaps) return b.NumLaps - a.NumLaps;
            return a.TotalTime - b.TotalTime;
          }
        });

        setData(sorted);
      } catch (err) {
        console.error('Error processing results:', err);
        setData([]);
      }
    }
  }, [results, activeTab, carsMaster]); // Tambahkan carsMaster sebagai dependency

  if (!results || results.length === 0) return null;

  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-6">
        <div className="flex flex-col mb-12">
          <h2 className="text-4xl font-black italic uppercase mb-4 tracking-tighter">
            Session <span className="text-blue-600">Results</span>
          </h2>

          <div className="flex gap-2 bg-gray-900/50 p-1.5 rounded-2xl border border-white/5 self-start">
            {results.map((res, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === index
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {res.session}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gray-900/30 border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-gray-900/50">
                <th className="px-6 py-5 text-[10px] font-black uppercase text-gray-500">
                  Pos
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-gray-500">
                  Driver
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-gray-500">
                  Vehicle
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-gray-500 text-center">
                  Laps
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-gray-500">
                  Best Lap
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-gray-500 text-right text-blue-500">
                  Gap/Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {data.map((row, i) => {
                const isQualify = results[activeTab].session
                  .toLowerCase()
                  .includes('qualify');

                let gapDisplay = '';
                if (i === 0) {
                  gapDisplay = 'WINNER';
                } else if (isQualify) {
                  const gap = row.BestLap - data[0].BestLap;
                  gapDisplay =
                    row.BestLap <= 0 ? 'DNS' : `+${(gap / 1000).toFixed(3)}s`;
                } else {
                  if (row.NumLaps < data[0].NumLaps) {
                    gapDisplay = `-${data[0].NumLaps - row.NumLaps} LAP`;
                  } else {
                    const gap = row.TotalTime - data[0].TotalTime;
                    gapDisplay = `+${(gap / 1000).toFixed(3)}s`;
                  }
                }

                return (
                  <tr
                    key={i}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-6 py-5">
                      <span
                        className={`text-lg font-black italic ${i === 0 ? 'text-yellow-500' : 'text-gray-700'}`}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div>
                        <p className="font-black uppercase italic text-sm group-hover:text-blue-400 transition-all">
                          {row.DriverName}
                        </p>
                        <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                          {row.TeamName}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-[11px] font-black uppercase text-gray-300">
                      {row.DisplayName}
                    </td>
                    <td className="px-6 py-5 text-center font-mono text-xs text-gray-500">
                      {row.NumLaps}
                    </td>
                    <td className="px-6 py-5 font-mono text-xs text-white">
                      {formatTime(row.BestLap)}
                    </td>
                    <td className="px-6 py-5 text-right font-mono text-[10px] font-bold">
                      <span
                        className={
                          i === 0 ? 'text-yellow-500' : 'text-gray-500'
                        }
                      >
                        {gapDisplay}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function formatTime(ms: number) {
  if (!ms || ms <= 0 || ms >= 999999999) return '--:--.---';
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(3);
  return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
}
