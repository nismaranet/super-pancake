import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CONFIG REWARD UNRANKED (Disesuaikan kembali)
const REWARD = {
  BASE_PARTICIPATION_NRC: -10, // Biaya pendaftaran (Nilai minus)
  NRC_PER_LAP: 1.5,
  XP_PER_LAP: 5,
  SR_CLEAN_LAP: 0.1,
  // --- HADIAH BASE JUARA (DIKEMBALIKAN) ---
  PODIUM_1_NRC: 200, PODIUM_1_XP: 100,
  PODIUM_2_NRC: 100, PODIUM_2_XP: 50,
  PODIUM_3_NRC: 50,  PODIUM_3_XP: 25
};

const FINES = {
  COLLISION_CAR_NRC: -10, COLLISION_ENV_NRC: -2, CUT_NRC: -2,
  COLLISION_CAR_SR: -0.15, COLLISION_ENV_SR: -0.02, CUT_SR: -0.02
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: SOURCES } = await supabase.from('hotlap_sync_sources').select('*').eq('is_active', true);
    if (!SOURCES || SOURCES.length === 0) return new Response("No active sync sources", { status: 200 });

    for (const source of SOURCES) {
      console.log(`[CHECK] Mengambil list dari: ${source.name}`);
      
      const listUrl = `${source.api_base_url}/api/results/list.json?server=${source.instance_id}`;
      const res = await fetch(listUrl);
      if (!res.ok) continue;

      const data = await res.json();
      const recentSessions = data.results.slice(0, 10);

      for (const session of recentSessions) {
        const sessionId = `${source.name}_${session.results_json_url}`;

        const { data: alreadyProcessed } = await supabase.from('processed_sessions').select('session_id').eq('session_id', sessionId).single();
        if (alreadyProcessed) continue;

        const sessionRes = await fetch(`${source.api_base_url}${session.results_json_url}`);
        if (!sessionRes.ok) continue;
  
        const detail = await sessionRes.json();

        const carToDriverMap = new Map();
        if (detail.Cars) {
          detail.Cars.forEach((car: any) => {
            carToDriverMap.set(car.CarId, car.DriverGuid);
          });
        }

        if (detail.Laps && detail.Laps.length > 0) {
          const cond = detail.Laps[0].Conditions;
          await supabase.from('session_conditions').insert({
            session_id: sessionId,
            ambient_temperature: cond?.AmbientTemp || 0,
            road_temp: cond?.Road || 0,
            wind_speed: cond?.WindSpeed || 0,
            wind_direction: cond?.WindDirection || 0,
            rain_intensity: cond?.RainIntensity || 0,
            rain_wetness: cond?.RainWetness || 0,
          });
        }

        if (detail.Result && detail.Result.Length > 0) {
          const positionFinish = detail.Result.indexOf(detail.Result) + 1;
          const leaderboardData = detail.Result.map((res: any) => ({
            session_id: sessionId,
            steam_guild: res.DriverGuid,
            car_model: res.CarModel,
            best_lap: res.BestLap,
            total_time: res.TotalTime,
            num_laps: res.NumLaps,
            grid_position: res.positionFinish,
            status: res.Disqualified ? 'DSQ' : 'FINISH'
          }));
          await supabase.from('session_result').upsert(leaderboardData, { onConflict: 'session_id, steam_guild' });
        }

        if (detail.Events && detail.Events.length > 0) {
          const incidentData = detail.Events
          .filter((e: any) => e.Type === 'COLLISION_WITH_CAR' || e.Type === 'COLLISION_WITH_ENV')
            .map((e: any) => ({
              session_id: sessionId,
              incident_type: e.Type,
              impact_speed: e.ImpactSpeed,
              driver_1_guid: carToDriverMap.get(e.CarId),
              driver_2_guid: e.OtherCarId !== -1 ? carToDriverMap.get(e.OtherCarId) : null,
              timestamp_ms: e.RelPosition 
            }));
          
            if (incidentData.length > 0) {
              await supabase.from('session_incidents').insert(incidentData);
            }
          }

        const activeTrackModel = detail.TrackName;

        // Tarik data track untuk length
        const { data: trackData } = await supabase.from('tracks').select('length').eq('track_model', activeTrackModel).single();
        const trackLengthKm = trackData?.length ? parseFloat(trackData.length) / 1000 : 0;

        // --- HITUNG PRIZE POOL DARI PESERTA ---
        const participantCount = detail.Result?.length || 0;
        const totalPrizePool = participantCount * Math.abs(REWARD.BASE_PARTICIPATION_NRC);

        for (const dr of (detail.Result || [])) {
          if (!dr.DriverGuid) continue;

          const { data: profileMember } = await supabase.from('profiles').select('*').eq('steam_guid', dr.DriverGuid).single();
          if (!profileMember) continue;

          // Posisi Driver (1-based index)
          const position = detail.Result.indexOf(dr) + 1;
          const isRace = detail.Type === "RACE";
          const isQualify = detail.Type === "QUALIFY";
          const isPractice = detail.Type === "PRACTICE";

          // Hitung Insiden
          const incidents = { col_car: 0, col_env: 0, cuts: 0 };
          detail.Events?.forEach((ev: any) => {
            const evGuid = ev.Driver?.Guid || ev.Driver?.GuidsList?.[0];
            if (evGuid === dr.DriverGuid) {
              if (ev.Type === "COLLISION_WITH_CAR") incidents.col_car++;
              if (ev.Type === "COLLISION_WITH_ENV") incidents.col_env++;
            }
          });
          detail.Laps?.forEach((lap: any) => {
            if (lap.DriverGuid === dr.DriverGuid) incidents.cuts += (lap.Cuts || 0);
          });

          // LOGIKA HADIAH JUARA & POOL
          let nrcFromPool = 0;
          let basePodiumNrc = 0;
          let basePodiumXp = 0;

          if (isRace) {
            if (position === 1) {
              nrcFromPool = totalPrizePool * 0.5;
              basePodiumNrc = REWARD.PODIUM_1_NRC;
              basePodiumXp = REWARD.PODIUM_1_XP;
            } else if (position === 2) {
              nrcFromPool = totalPrizePool * 0.3;
              basePodiumNrc = REWARD.PODIUM_2_NRC;
              basePodiumXp = REWARD.PODIUM_2_XP;
            } else if (position === 3) {
              nrcFromPool = totalPrizePool * 0.2;
              basePodiumNrc = REWARD.PODIUM_3_NRC;
              basePodiumXp = REWARD.PODIUM_3_XP;
            }
          }

          if (isQualify) {
            REWARD.BASE_PARTICIPATION_NRC = 0;
            if (position === 1) {
              basePodiumNrc = REWARD.PODIUM_1_NRC / 2;
              basePodiumXp = REWARD.PODIUM_1_XP / 2;
            } else if (position === 2) {
              basePodiumNrc = REWARD.PODIUM_2_NRC / 2;
              basePodiumXp = REWARD.PODIUM_2_XP / 2;
            } else if (position === 3) {
              basePodiumNrc = REWARD.PODIUM_3_NRC / 2;
              basePodiumXp = REWARD.PODIUM_3_XP / 2;
            }
          }

          const xpGained = (dr.NumLaps * REWARD.XP_PER_LAP) + basePodiumXp;
          const nrcChange = REWARD.BASE_PARTICIPATION_NRC + 
                            (dr.NumLaps * REWARD.NRC_PER_LAP) + 
                            basePodiumNrc + 
                            nrcFromPool + 
                            (incidents.col_car * FINES.COLLISION_CAR_NRC) + 
                            (incidents.col_env * FINES.COLLISION_ENV_NRC) + 
                            (incidents.cuts * FINES.CUT_NRC);
          
          const srChange = (dr.NumLaps * REWARD.SR_CLEAN_LAP) + 
                           (incidents.col_car * FINES.COLLISION_CAR_SR) + 
                           (incidents.col_env * FINES.COLLISION_ENV_SR) + 
                           (incidents.cuts * FINES.CUT_SR);

          if (isPractice) {
            const nrcChange = dr.NumLaps * REWARD.NRC_PER_LAP / 2;
            const xpGained = dr.NumLaps * REWARD.XP_PER_LAP / 2;
            const srChange = 0; // Tidak ada perubahan SR untuk latihan
          }


            if (xpGained > 0 && profileMember) {
            // A. Cari tahu apakah driver ini adalah member aktif di sebuah tim
            const { data: teamMember } = await supabase
              .from('team_members')
              .select('team_id')
              .eq('profile_id', profileMember.id)
              .eq('status', 'active')
              .maybeSingle();

            if (teamMember && teamMember.team_id) {
            // B. Ambil total_xp tim saat ini
            const { data: teamData } = await supabase
              .from('teams')
              .select('total_xp')
              .eq('id', teamMember.team_id)
              .single();

            if (teamData) {
              const newTeamXp = teamData.total_xp + xpGained;

              // C. Update XP langsung ke tabel teams
              await supabase
                .from('teams')
                .update({ total_xp: newTeamXp })
                .eq('id', teamMember.team_id);
              
              // D. KALKULASI STATISTIK TIM (Replikasi logika dari Frontend)
              // Ambil profil semua member aktif di tim ini untuk dihitung rata-ratanya
              const { data: membersData } = await supabase
                .from('team_members')
                .select('profiles(total_distance_km, safety_rating)')
                .eq('team_id', teamMember.team_id)
                .eq('status', 'active');

              let totalDist = 0;
              let srSum = 0;
              let validDrivers = 0;

              if (membersData) {
                membersData.forEach((m: any) => {
                  // Sama seperti di frontend, handle Supabase array relationship
                  const prof = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
                  if (prof) {
                    validDrivers++;
                    totalDist += prof.total_distance_km || 0;
                    srSum += prof.safety_rating || 0;
                  }
                });
              }

              const calculatedAvgSR = validDrivers > 0 ? Number((srSum / validDrivers).toFixed(2)) : 0;

              // E. UPSERT KE TABEL TEAM_DAILY_STATS
              const today = new Date().toISOString().split('T')[0]; // Dapatkan YYYY-MM-DD
              
              const { error: historyErr } = await supabase.from('team_daily_stats').upsert({
                team_id: teamMember.team_id,
                record_date: today,
                total_distance_km: totalDist,
                avg_safety_rating: calculatedAvgSR,
                total_xp: newTeamXp
              }, { onConflict: 'team_id, record_date' });

              if (historyErr) {
                console.error(`[ERROR TEAM HISTORY]`, historyErr.message);
              } else {
                console.log(`[TEAM] Daily Stats Saved! Team: ${teamMember.team_id} | XP: ${newTeamXp} | AvgSR: ${calculatedAvgSR}`);
              }
            }
          }

          // 1. Update Profile
          await supabase.from('profiles').update({
            total_starts: (profileMember.total_starts || 0) + (isRace ? 1 : 0),
            total_wins: (profileMember.total_wins || 0) + (isRace && position === 1 ? 1 : 0),
            total_podiums: (profileMember.total_podiums || 0) + (isRace && position <= 3 ? 1 : 0),
            total_distance_km: (profileMember.total_distance_km || 0) + (dr.NumLaps * trackLengthKm),
            total_playing_time: (profileMember.total_playing_time || 0) + Math.floor(dr.TotalTime / 1000),
            total_xp: (profileMember.total_xp || 0) + xpGained,
            nrc_coin: (profileMember.nrc_coin || 0) + nrcChange,
            safety_rating: Math.max(0, Math.min(100, (profileMember.safety_rating || 2.5) + srChange)),
            updated_at: new Date().toISOString()
          }).eq('steam_guid', dr.DriverGuid);

          // 2. Insert History
          await supabase.from('race_earnings_history').insert({
            steam_guid: dr.DriverGuid,
            session_id: sessionId,
            session_type: 'unranked',
            track_model: activeTrackModel,
            car_model: dr.CarModel,
            laps_completed: dr.NumLaps,
            xp_gained: xpGained,
            nrc_change: nrcChange,
            sr_change: srChange,
            incidents_car: incidents.col_car,
            incidents_env: incidents.col_env,
            track_cuts: incidents.cuts,
            playing_time: Math.floor(dr.TotalTime / 1000),
            distance_km: dr.NumLaps * trackLengthKm
          });
          
          // 3. Upsert Hotlap
          if (dr.BestLap > 0 && dr.BestLap < 900000) {
            await supabase.from('hotlap_data').upsert({
              driver_guid: dr.DriverGuid, track_model: activeTrackModel, car_model: dr.CarModel,
              best_lap: dr.BestLap, server_name: source.name, updated_at: new Date().toISOString()
            }, { onConflict: 'driver_guid, track_model, car_model' });
          }

          // 4. Update Track Stats
          const { data: curTrackStats } = await supabase.from('driver_track_stats').select('total_laps, total_distance_km').eq('driver_guid', dr.DriverGuid).eq('track_model', activeTrackModel).single();
          await supabase.from('driver_track_stats').upsert({
            driver_guid: dr.DriverGuid, track_model: activeTrackModel,
            total_laps: (curTrackStats?.total_laps || 0) + dr.NumLaps,
            total_distance_km: (curTrackStats?.total_distance_km || 0) + (dr.NumLaps * trackLengthKm)
          }, { onConflict: 'driver_guid, track_model' });
          
        }
      }

      // 6. Tandai Sesi Selesai Diproses
      await supabase.from('processed_sessions').insert({ session_id: sessionId });
      console.log(`[DONE] Selesai memproses sesi: ${sessionId}`);
      
    } 
  } 
  return new Response(JSON.stringify({ status: "success", message: "Auto-sync publik selesai" }), { 
    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
  });

  } catch (error: any) {
    console.error("Cron Job Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});