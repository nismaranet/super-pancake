import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const REWARD = {
  BASE_PARTICIPATION_NRC: -10,
  NRC_PER_LAP: 1.5,
  XP_PER_LAP: 5,
  SR_CLEAN_LAP: 0.04,
  PODIUM_1_NRC: 200, PODIUM_1_XP: 100,
  PODIUM_2_NRC: 100, PODIUM_2_XP: 50,
  PODIUM_3_NRC: 50,  PODIUM_3_XP: 25
};

const FINES = {
  COLLISION_CAR_NRC: -20, COLLISION_ENV_NRC: -2, CUT_NRC: -2,
  COLLISION_CAR_SR: -0.20, COLLISION_ENV_SR: -0.02, CUT_SR: -0.05
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
      
      const rawText = await res.text(); // Ambil text mentah

      if (!res.ok) {
        console.error(`[SKIP] ${source.name} error ${res.status}: ${rawText.slice(0, 100)}`);
        continue;
      }

      let data;
      try {
        data = JSON.parse(rawText);
      } catch (e) {
        console.error(`[SKIP] ${source.name} bukan JSON valid: ${rawText.slice(0, 100)}`);
        continue;
      }

      if (!data.results || !Array.isArray(data.results)) continue;

      const recentSessions = data.results.slice(0, 10);

      for (const session of recentSessions) {
        const sessionId = `${source.name}_${session.results_json_url}`;

        const { data: alreadyProcessed } = await supabase.from('processed_sessions').select('session_id').eq('session_id', sessionId).single();
        if (alreadyProcessed) continue;

        const sessionRes = await fetch(`${source.api_base_url}${session.results_json_url}`);
        if (!sessionRes.ok) continue;
  
        const detail = await sessionRes.json();
        const activeTrackModel = detail.TrackName;

        const { data: trackData } = await supabase.from('tracks').select('length').eq('track_model', activeTrackModel).single();
        const trackLengthKm = trackData?.length ? parseFloat(trackData.length) / 1000 : 0;

        const participantCount = detail.Result?.length || 0;
        const totalPrizePool = participantCount * Math.abs(REWARD.BASE_PARTICIPATION_NRC);

        for (const dr of (detail.Result || [])) {
          if (!dr.DriverGuid) continue;

          const { data: profileMember } = await supabase.from('profiles').select('*').eq('steam_guid', dr.DriverGuid).single();
          if (!profileMember) continue;

          const position = detail.Result.indexOf(dr) + 1;
          const isRace = detail.Type === "RACE";
          const isQualify = detail.Type === "QUALIFY";
          const isPractice = detail.Type === "PRACTICE";

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

          let xpGained = (dr.NumLaps * REWARD.XP_PER_LAP) + basePodiumXp;
          let nrcChange = (isQualify ? 0 : REWARD.BASE_PARTICIPATION_NRC) + 
                            (dr.NumLaps * REWARD.NRC_PER_LAP) + 
                            basePodiumNrc + 
                            nrcFromPool + 
                            (incidents.col_car * FINES.COLLISION_CAR_NRC) + 
                            (incidents.col_env * FINES.COLLISION_ENV_NRC) + 
                            (incidents.cuts * FINES.CUT_NRC);
          
          let srChange = (dr.NumLaps * REWARD.SR_CLEAN_LAP) + 
                           (incidents.col_car * FINES.COLLISION_CAR_SR) + 
                           (incidents.col_env * FINES.COLLISION_ENV_SR) + 
                           (incidents.cuts * FINES.CUT_SR);

          if (isPractice) {
            nrcChange = dr.NumLaps * REWARD.NRC_PER_LAP / 2;
            xpGained = dr.NumLaps * REWARD.XP_PER_LAP / 2;
            srChange = 0;
          }

          if (participantCount < 2) {
            srChange = 0;
            nrcChange = dr.NumLaps * REWARD.NRC_PER_LAP / 2;
            xpGained = dr.NumLaps * REWARD.XP_PER_LAP / 2;
          }

          // --- UPDATE TEAM XP & STATS ---
          if (xpGained > 0) {
            const { data: teamMember } = await supabase.from('team_members').select('team_id').eq('profile_id', profileMember.id).eq('status', 'active').maybeSingle();
            if (teamMember?.team_id) {
              const { data: teamData } = await supabase.from('teams').select('total_xp').eq('id', teamMember.team_id).single();
              if (teamData) {
                const newTeamXp = teamData.total_xp + xpGained;
                await supabase.from('teams').update({ total_xp: newTeamXp }).eq('id', teamMember.team_id);
                
                const { data: membersData } = await supabase.from('team_members').select('profiles(total_distance_km, safety_rating)').eq('team_id', teamMember.team_id).eq('status', 'active');
                let totalDist = 0; let srSum = 0; let validDrivers = 0;

                membersData?.forEach((m: any) => {
                  const prof = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
                  if (prof) {
                    validDrivers++;
                    totalDist += prof.total_distance_km || 0;
                    srSum += prof.safety_rating || 0;
                  }
                });

                const calculatedAvgSR = validDrivers > 0 ? Number((srSum / validDrivers).toFixed(2)) : 0;
                const today = new Date().toISOString().split('T')[0];
                await supabase.from('team_daily_stats').upsert({
                  team_id: teamMember.team_id, record_date: today,
                  total_distance_km: totalDist, avg_safety_rating: calculatedAvgSR, total_xp: newTeamXp
                }, { onConflict: 'team_id, record_date' });
              }
            }
          }

          // --- UPDATE USER STATS ---
          await supabase.from('user_daily_stats').upsert({
            user_id: profileMember.steam_guid,
            record_date: new Date().toISOString().split('T')[0],
            total_distance_km: dr.NumLaps * trackLengthKm,
            laps_completed: dr.NumLaps,
            playing_time: Math.floor(dr.TotalTime / 1000),
            xp_gained: xpGained, nrc_change: nrcChange, sr_change: srChange,
            incidents_car: incidents.col_car, incidents_env: incidents.col_env, track_cuts: incidents.cuts
          }, { onConflict: 'user_id, record_date' });

          // --- INSERT SESSION RESULT ---
          const { data: resultData } = await supabase.from('session_results').select('*').eq('session_id', sessionId).eq('profile_id', profileMember.steam_guid).single();
          await supabase.from('session_results').insert({
            session_id: sessionId,
            profile_id: profileMember?.steam_guid,
            car_model: dr.CarModel,
            best_lap_ms: dr.BestLap,
            total_time_ms: dr.TotalTime,
            num_laps: dr.NumLaps,
            grid_position: dr.GridPosition,
            finish_position: position,
            track: activeTrackModel,
            num_laps: dr.NumLaps,
            type: isRace ? 'RACE' : isQualify ? 'QUALIFY' : 'PRACTICE',
            status: dr.Disqualified === true ? 'DSQ' : 'FINISH'
          });

          if (resultData) {
                console.error(`[ERROR RESULT DATA]`, resultData.message);
              } else {
                console.log(`[RESULT] Result Stats Saved! Driver: ${profileMember.steam_guid} | Session: ${sessionId} | Position: #${position}`);
              }

          // --- UPDATE PROFILE ---
          await supabase.from('profiles').update({
            total_starts: (profileMember.total_starts || 0) + (isRace ? 1 : 0),
            total_wins: (profileMember.total_wins || 0) + (isRace && position === 1 ? 1 : 0),
            total_podiums: (profileMember.total_podiums || 0) + (isRace && position <= 3 ? 1 : 0),
            total_distance_km: (profileMember.total_distance_km || 0) + (dr.NumLaps * trackLengthKm),
            total_playing_time: (profileMember.total_playing_time || 0) + Math.floor(dr.TotalTime / 1000),
            total_xp: (profileMember.total_xp || 0) + xpGained,
            nrc_coin: (profileMember.nrc_coin || 0) + nrcChange,
            safety_rating: Math.max(0, Math.min(10.0, (profileMember.safety_rating || 2.5) + srChange)),
            updated_at: new Date().toISOString()
          }).eq('steam_guid', dr.DriverGuid);

          // --- RACE EARNING HISTORY ---
                    // 2. Insert History
          await supabase.from('race_earnings_history').insert({
            steam_guid: dr.DriverGuid,
            session_id: sessionId,
            session_type: isRace ? 'RACE' : isQualify ? 'QUALIFY' : 'PRACTICE',
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

          // --- HOTLAP DATA ---
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
        await supabase.from('processed_sessions').insert({ session_id: sessionId });
        console.log(`[DONE] Selesai memproses sesi: ${sessionId}`);
      }
    } 

    return new Response(JSON.stringify({ status: "success" }), { 
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