import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createSupabaseServer } from '@/lib/supabaseServer';
import { decodeSessionId } from '@/lib/encoded';
import { cookies } from 'next/headers';

function formatTime(ms: number | null | undefined) {
  if (!ms) return '-';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds
    .toString()
    .padStart(3, '0')}`;
}

export default async function SessionResultPage({
  params,
}: {
  params: Promise<{ uri: string }>;
}) {
  const resolvedParams = await params;
  const sessionId = decodeSessionId(resolvedParams.uri);

  // Memanggil createSupabaseServer dengan await sesuai perbaikan sebelumnya
  const supabase = await createSupabaseServer();

  // 1. Ambil data session_results
  const { data: results, error: resultsError } = await supabase
    .from('session_results')
    .select(
      `
      *,
      profiles:profile_id (
        id, display_name, username, avatar_url, steam_guid
      )
    `,
    )
    .eq('session_id', sessionId)
    .order('finish_position', { ascending: true });

  if (resultsError || !results || results.length === 0) {
    return notFound();
  }

  // 2. Ambil data earnings
  const { data: earnings } = await supabase
    .from('race_earnings_history')
    .select('*')
    .eq('session_id', sessionId);

  const trackName = results[0]?.track || 'Unknown Track';
  const sessionType = results[0]?.type || 'Race';

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] relative overflow-hidden pb-20">
      {/* Background Glow Effect */}
      <div className="bg-glow-spot -top-24 -left-24 opacity-30 animate-pulse-slow" />
      <div
        className="bg-glow-spot top-1/2 -right-24 opacity-20"
        style={{ backgroundColor: 'var(--secondary-glow)' }}
      />

      <div className="max-w-7xl mx-auto px-4 py-12 relative z-10 space-y-10">
        {/* Header Section */}
        <div className="glass rounded-3xl p-8 border-[var(--card-border)] shadow-2xl">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-glow)] border border-[var(--accent)]/20">
                <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
                  {sessionType} Result
                </span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none">
                {trackName.replace(/_/g, ' ')}
              </h1>
              <p className="text-[var(--muted)] font-mono text-xs opacity-70">
                SESSION ID: {sessionId}
              </p>
            </div>
          </div>
        </div>

        {/* TABLE 1: RACE PERFORMANCE */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-1 h-6 bg-[var(--accent)] rounded-full" />
            <h2 className="text-xl font-black uppercase italic tracking-tight">
              Race Performance
            </h2>
          </div>
          <div className="glass rounded-3xl overflow-hidden border-[var(--card-border)] shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[var(--accent-glow)] border-b border-[var(--card-border)]">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)] w-16 text-center">
                      Pos
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">
                      Driver
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">
                      Vehicle
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)] text-center">
                      Laps
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)] text-right">
                      Best Lap
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)] text-right">
                      Total Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]">
                  {results.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-[var(--accent-glow)] transition-colors group"
                    >
                      <td className="px-6 py-5 text-center">
                        <span
                          className={`text-xl font-black italic ${row.finish_position <= 3 ? 'text-[var(--accent)]' : 'text-[var(--muted)] opacity-50'}`}
                        >
                          #{row.finish_position}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <Link
                          href={`/profile/${row.profiles?.username}`}
                          className="font-bold group-hover:text-[var(--accent)] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[var(--card-border)] group-hover:border-[var(--accent)]">
                              {row.profiles?.avatar_url ? (
                                <img
                                  src={row.profiles.avatar_url}
                                  sizes="(max-width: 256px) 100vw, (max-width: 512px) 50vw, 33vw"
                                  alt="Avatar"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-[var(--card)]" />
                              )}
                            </div>
                            <span className="font-bold group-hover:text-[var(--accent)] transition-colors">
                              {row.profiles?.display_name || 'Driver'}
                            </span>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-5 text-sm font-medium uppercase text-[var(--muted)]">
                        {row.car_model?.replace(/_/g, ' ')}
                      </td>
                      <td className="px-6 py-5 text-center font-mono font-bold text-[var(--muted)]">
                        {row.num_laps}
                      </td>
                      <td className="px-6 py-5 text-right font-mono font-bold">
                        {row.is_fastest_lap && (
                          <span className="text-[10px] bg-purple-600 text-white px-1.5 py-0.5 rounded italic mr-2">
                            FL
                          </span>
                        )}
                        <span
                          className={
                            row.is_fastest_lap ? 'text-[var(--accent)]' : ''
                          }
                        >
                          {formatTime(row.best_lap_ms)}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right font-mono text-[var(--muted)]">
                        {formatTime(row.total_time_ms)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* TABLE 2: INCIDENTS & ECONOMY */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-1 h-6 bg-red-500 rounded-full" />
            <h2 className="text-xl font-black uppercase italic tracking-tight">
              Incidents & Rewards
            </h2>
          </div>
          <div className="glass rounded-3xl overflow-hidden border-[var(--card-border)] shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-red-500/5 border-b border-[var(--card-border)]">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">
                      Driver
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)] text-center">
                      Cuts
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)] text-center">
                      Coll Env
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)] text-center">
                      Coll Car
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)] text-right">
                      XP Earned
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)] text-right">
                      SR Change
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)] text-right">
                      NRC
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]">
                  {results.map((row) => {
                    const e = earnings?.find(
                      (item) =>
                        item.steam_guid === (row.profiles as any)?.steam_guid,
                    );
                    return (
                      <tr
                        key={`inc-${row.id}`}
                        className="hover:bg-red-500/5 transition-colors"
                      >
                        <td className="px-6 py-5 font-bold">
                          {row.profiles?.display_name}
                        </td>
                        <td className="px-6 py-5 text-center font-mono text-orange-500 font-bold">
                          {e?.track_cuts || 0}
                        </td>
                        <td className="px-6 py-5 text-center font-mono text-red-400">
                          {e?.incidents_env || 0}
                        </td>
                        <td className="px-6 py-5 text-center font-mono text-red-600 font-black">
                          {e?.incidents_car || 0}
                        </td>
                        <td className="px-6 py-5 text-right font-bold text-[var(--accent)]">
                          +{e?.xp_gained || 0} XP
                        </td>
                        <td className="px-6 py-5 text-right font-mono font-bold">
                          <span
                            className={
                              e?.sr_change && e.sr_change > 0
                                ? 'text-emerald-500'
                                : 'text-red-500'
                            }
                          >
                            {e?.sr_change && e.sr_change > 0 ? '+' : ''}
                            {e?.sr_change?.toFixed(2) || '0.00'}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right font-black text-blue-500">
                          +{e?.nrc_change || 0}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* BOTTOM STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="glass p-8 rounded-3xl border-[var(--card-border)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg
                className="w-12 h-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                ></path>
              </svg>
            </div>
            <p className="text-[var(--muted)] text-[10px] font-black uppercase tracking-widest mb-1">
              Total Distance
            </p>
            <h3 className="text-3xl font-black italic">
              {earnings
                ?.reduce((acc, curr) => acc + (curr.distance_km || 0), 0)
                .toFixed(2)}{' '}
              <span className="text-sm not-italic opacity-50">KM</span>
            </h3>
          </div>

          <div className="glass p-8 rounded-3xl border-[var(--card-border)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-red-500">
              <svg
                className="w-12 h-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                ></path>
              </svg>
            </div>
            <p className="text-[var(--muted)] text-[10px] font-black uppercase tracking-widest mb-1">
              Total Incidents
            </p>
            <h3 className="text-3xl font-black italic text-red-500">
              {earnings?.reduce(
                (acc, curr) =>
                  acc + (curr.incidents_car || 0) + (curr.incidents_env || 0),
                0,
              )}
            </h3>
          </div>

          <div className="glass p-8 rounded-3xl border-[var(--card-border)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-emerald-500">
              <svg
                className="w-12 h-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
            <p className="text-[var(--muted)] text-[10px] font-black uppercase tracking-widest mb-1">
              Avg SR Change
            </p>
            <h3 className="text-3xl font-black italic text-emerald-500">
              +
              {(
                earnings?.reduce(
                  (acc, curr) => acc + (curr.sr_change || 0),
                  0,
                ) || 0 / (earnings?.length || 1)
              ).toFixed(2)}
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}
