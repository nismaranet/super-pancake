import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const REWARD_RANKED = {
  BASE_PARTICIPATION_NRC: -10,
  NRC_PER_LAP: 10,
  XP_PER_LAP: 15,
  SR_CLEAN_LAP: 0.2,
  PODIUM_1_NRC: 300, PODIUM_1_XP: 100,
  PODIUM_2_NRC: 100, PODIUM_2_XP: 50,
  PODIUM_3_NRC: 50,  PODIUM_3_XP: 25
};

const FINES_RANKED = {
  COLLISION_CAR_NRC: -10, COLLISION_ENV_NRC: -2, CUT_NRC: -2,
  COLLISION_CAR_SR: -0.15, COLLISION_ENV_SR: -0.02, CUT_SR: -0.05
};

Deno.serve(async (req) => {
  // Tangani preflight dari browser
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { event_id } = await req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
       throw new Error("Missing Supabase Environment Variables");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Ambil Data Event
    const { data: event, error: eventErr } = await supabase.from('events').select('results, track_id, is_processed').eq('id', event_id).single();
    if (eventErr) throw new Error(`Gagal membaca event: ${eventErr.message}`);
    if (!event || !event.results) throw new Error("Event tidak ditemukan atau belum memiliki file hasil balapan (JSON)");
    if (event.is_processed) throw new Error("Event ini sudah pernah diproses sebelumnya!");

    // 2. Ambil Data Trek (Mencegah Crash jika panjang trek kosong)
    const { data: trackData } = await supabase.from('tracks').select('track_model, length').eq('id', event.track_id).single();
    
    let trackLengthKm = 0;
    if (trackData && trackData.length) {
        // Membersihkan string, misal "4.3 km" jadi 4.3
        const parsed = parseFloat(String(trackData.length).replace(/[^0-9.]/g, ''));
        if (!isNaN(parsed)) trackLengthKm = parsed / 1000; 
    }
    const activeTrackModel = trackData?.track_model || "unknown";

    // 3. Akumulasi Data dari Semua Sesi JSON
    const allSessions = event.results as any[];
    const userUpdates: Record<string, any> = {};

    allSessions.forEach((sessionObj) => {
      const detail = sessionObj.url;
      if (!detail) return;
      const isRace = sessionObj.session?.toLowerCase().includes('race') || false;

      // Hitung Insiden (Tabrakan)
      detail.Events?.forEach((ev: any) => {
        const guid = ev.Driver?.Guid || ev.Driver?.GuidsList?.[0];
        if (!guid) return;
        if (!userUpdates[guid]) userUpdates[guid] = { laps: 0, col_car: 0, col_env: 0, cuts: 0, total_time_ms: 0, best_lap: 999999, car_model: '', podium_pos: 0 };
        
        if (ev.Type === "COLLISION_WITH_CAR") userUpdates[guid].col_car++;
        if (ev.Type === "COLLISION_WITH_ENV") userUpdates[guid].col_env++;
      });

      // Hitung Pemotongan Lintasan (Cuts)
      detail.Laps?.forEach((lap: any) => {
        const guid = lap.DriverGuid || detail.Cars?.find((c: any) => c.CarId === lap.CarId)?.Driver?.Guid;
        if (!guid) return;
        if (!userUpdates[guid]) userUpdates[guid] = { laps: 0, col_car: 0, col_env: 0, cuts: 0, total_time_ms: 0, best_lap: 999999, car_model: '', podium_pos: 0 };
        userUpdates[guid].cuts += (lap.Cuts || 0);
      });

      // Hitung Posisi, Laps, dan Waktu
      detail.Result?.forEach((res: any, index: number) => {
        const guid = res.DriverGuid;
        if (!guid) return;
        if (!userUpdates[guid]) userUpdates[guid] = { laps: 0, col_car: 0, col_env: 0, cuts: 0, total_time_ms: 0, best_lap: 999999, car_model: '', podium_pos: 0 };

        userUpdates[guid].laps += (res.NumLaps || 0);
        userUpdates[guid].total_time_ms += (res.TotalTime || 0);
        userUpdates[guid].car_model = res.CarModel;
        
        if (res.BestLap > 0 && res.BestLap < userUpdates[guid].best_lap) {
          userUpdates[guid].best_lap = res.BestLap;
        }

        // Posisi Podium hanya dihitung dari sesi Balapan Utama (RACE)
        if (isRace && index <= 2) {
          userUpdates[guid].podium_pos = index + 1;
        }
      });
    });

    const participantCount = Object.keys(userUpdates).length;
    if (participantCount === 0) throw new Error("Tidak ada data driver valid (Steam GUID) yang ditemukan di hasil balapan.");

    // Kalkulasi total uang pendaftaran untuk Prize Pool
    const totalPrizePool = participantCount * Math.abs(REWARD_RANKED.BASE_PARTICIPATION_NRC);

    // 4. Update Profil Pemain (Satu per Satu)
    for (const [guid, stats] of Object.entries(userUpdates)) {
      
      // Mengisolasi proses per-user agar jika 1 gagal, yang lain tetap jalan
      try {
        // PERINTAH PENTING: Hanya proses jika profil sudah terdaftar (Steam GUID ditemukan)
        const { data: profile, error: profileErr } = await supabase.from('profiles').select('*').eq('steam_guid', guid).single();
        if (profileErr || !profile) continue; // Skip & Abaikan user yang belum bikin akun di web

        let nrcFromPool = 0, basePodiumNrc = 0, basePodiumXp = 0;

        if (stats.podium_pos === 1) { nrcFromPool = totalPrizePool * 0.5; basePodiumNrc = REWARD_RANKED.PODIUM_1_NRC; basePodiumXp = REWARD_RANKED.PODIUM_1_XP; }
        else if (stats.podium_pos === 2) { nrcFromPool = totalPrizePool * 0.3; basePodiumNrc = REWARD_RANKED.PODIUM_2_NRC; basePodiumXp = REWARD_RANKED.PODIUM_2_XP; }
        else if (stats.podium_pos === 3) { nrcFromPool = totalPrizePool * 0.2; basePodiumNrc = REWARD_RANKED.PODIUM_3_NRC; basePodiumXp = REWARD_RANKED.PODIUM_3_XP; }

        const xpGained = (stats.laps * REWARD_RANKED.XP_PER_LAP) + basePodiumXp;
        const nrcChange = REWARD_RANKED.BASE_PARTICIPATION_NRC + (stats.laps * REWARD_RANKED.NRC_PER_LAP) + basePodiumNrc + nrcFromPool + (stats.col_car * FINES_RANKED.COLLISION_CAR_NRC) + (stats.col_env * FINES_RANKED.COLLISION_ENV_NRC) + (stats.cuts * FINES_RANKED.CUT_NRC);
        const srChange = (stats.laps * REWARD_RANKED.SR_CLEAN_LAP) + (stats.col_car * FINES_RANKED.COLLISION_CAR_SR) + (stats.col_env * FINES_RANKED.COLLISION_ENV_SR) + (stats.cuts * FINES_RANKED.CUT_SR);

        await supabase.from('profiles').update({
          total_xp: (profile.total_xp || 0) + xpGained,
          nrc_coin: (profile.nrc_coin || 0) + nrcChange,
          safety_rating: Math.max(0, Math.min(100, (profile.safety_rating || 2.5) + srChange)),
          total_starts: (profile.total_starts || 0) + (stats.laps > 0 ? 1 : 0),
          total_wins: (profile.total_wins || 0) + (stats.podium_pos === 1 ? 1 : 0),
          total_podiums: (profile.total_podiums || 0) + (stats.podium_pos > 0 ? 1 : 0),
          total_distance_km: (profile.total_distance_km || 0) + (stats.laps * trackLengthKm),
          total_playing_time: (profile.total_playing_time || 0) + Math.floor(stats.total_time_ms / 1000),
          updated_at: new Date().toISOString()
        }).eq('steam_guid', guid);

        if (stats.best_lap < 900000) {
          await supabase.from('hotlap_data').upsert({
            driver_guid: guid, track_model: activeTrackModel, car_model: stats.car_model, best_lap: stats.best_lap, server_name: 'Ranked Event', updated_at: new Date().toISOString()
          }, { onConflict: 'driver_guid, track_model, car_model' });
        }

        const { data: currentTrackStats } = await supabase.from('driver_track_stats').select('total_laps, total_distance_km').eq('driver_guid', guid).eq('track_model', activeTrackModel).single();
        if (currentTrackStats || stats.laps > 0) {
            await supabase.from('driver_track_stats').upsert({
              driver_guid: guid, track_model: activeTrackModel, total_laps: (currentTrackStats?.total_laps || 0) + stats.laps, total_distance_km: (currentTrackStats?.total_distance_km || 0) + (stats.laps * trackLengthKm)
            }, { onConflict: 'driver_guid, track_model' });
        }

        await supabase.from('race_earnings_history').insert({
          steam_guid: guid,
          session_id: String(event_id), // Diubah ke string untuk menjaga kompatibilitas kolom lama
          event_id: event_id,           // Foreign Key resmi yang baru dibuat
          session_type: 'ranked',
          track_model: activeTrackModel,
          car_model: stats.car_model,
          laps_completed: stats.laps,
          xp_gained: xpGained,
          nrc_change: nrcChange,
          sr_change: srChange,
          incidents_car: stats.col_car,
          incidents_env: stats.col_env,
          track_cuts: stats.cuts
        });

      } catch (innerErr) {
        console.error(`Error saat memproses profil pemain (GUID: ${guid}):`, innerErr);
        // Lanjut ke pemain berikutnya tanpa menghentikan sistem
      }
    }

    // Tandai event selesai
    await supabase.from('events').update({ is_processed: true }).eq('id', event_id);
    
    return new Response(JSON.stringify({ status: "success" }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (err: any) {
    // Memberikan balasan 400 tapi MENGIRIMKAN isi error-nya agar bisa dibaca di Log
    console.error("Critical Function Error:", err);
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});