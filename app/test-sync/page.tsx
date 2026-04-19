import { createSupabaseServer } from '@/lib/supabaseServer';
import { User, MapPin, Car, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

export default async function TestSyncPage() {
  const supabase = await createSupabaseServer();

  // Ambil data hotlap terbaru tanpa join profil dulu untuk memastikan data mentah muncul
  const { data: hotlaps, error } = await supabase
    .from('hotlap_data')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(20);

  // Ambil data profil untuk mapping manual (lebih aman jika join bermasalah)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('steam_guid, display_name, avatar_url');

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Header Section */}
      <div className="max-w-6xl mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter text-yellow-500">
            SYNC MONITOR <span className="text-white">/ V0.2</span>
          </h1>
          <p className="text-zinc-500 mt-2 font-medium">Memantau data hasil sinkronisasi ACSM ke Database.</p>
        </div>
        <div className="flex gap-3">
           <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl flex items-center gap-2 text-sm text-zinc-400">
            <RefreshCw className="w-4 h-4 animate-spin text-green-500" />
            Auto-sync Active
          </div>
        </div>
      </div>

      {/* Error Handling UI */}
      {error && (
        <div className="max-w-6xl mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/50 rounded-2xl flex items-center gap-3 text-red-500">
          <AlertCircle className="w-5 h-5" />
          <div className="text-sm">
            <p className="font-bold">Database Error:</p>
            <p>{error.message}</p>
          </div>
        </div>
      )}

      {/* Stats Table */}
      <div className="max-w-6xl mx-auto bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-800/50 text-zinc-400 text-[10px] uppercase tracking-[0.2em]">
                <th className="px-6 py-5">Driver Info</th>
                <th className="px-6 py-5">Track & Car Model</th>
                <th className="px-6 py-5 text-right">Best Lap Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {hotlaps && hotlaps.length > 0 ? (
                hotlaps.map((lap, i) => {
                  // Cari profil yang cocok berdasarkan driver_guid
                  const profile = profiles?.find(p => p.steam_guid === lap.driver_guid);
                  
                  return (
                    <tr key={i} className="hover:bg-yellow-500/[0.02] transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex-shrink-0 overflow-hidden flex items-center justify-center">
                            {profile?.avatar_url ? (
                              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-6 h-6 text-zinc-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-zinc-100 group-hover:text-yellow-500 transition-colors">
                              {profile?.display_name || 'Driver Not Registered'}
                            </div>
                            <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                              GUID: {lap.driver_guid}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-zinc-200">
                            <MapPin className="w-3.5 h-3.5 text-red-500" />
                            <span className="text-sm font-bold uppercase tracking-tight">{lap.track_model.replace(/_/g, ' ')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-zinc-500">
                            <Car className="w-3.5 h-3.5" />
                            <span className="text-xs">{lap.car_model}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="text-2xl font-mono font-black text-yellow-500 tabular-nums">
                          {formatLapTime(lap.best_lap)}
                        </div>
                        <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] text-zinc-500 italic">
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                          Synced {new Date(lap.updated_at).toLocaleTimeString()}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-32 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="w-10 h-10 text-zinc-800 animate-spin-slow" />
                      <p className="text-zinc-600 italic font-medium">Menunggu data masuk dari Edge Function...</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function formatLapTime(ms: number) {
  if (!ms) return "--:--.---";
  const m = Math.floor(ms / 60000);
  const s = ((ms % 60000) / 1000).toFixed(3);
  return `${m}:${s.padStart(6, '0')}`;
}