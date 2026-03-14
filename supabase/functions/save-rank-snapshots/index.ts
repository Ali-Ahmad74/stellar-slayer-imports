import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get snapshot_type from body (monthly or yearly), default monthly
    let snapshotType = "monthly";
    try {
      const body = await req.json();
      if (body?.snapshot_type) snapshotType = body.snapshot_type;
    } catch { /* no body is fine */ }

    const today = new Date().toISOString().split("T")[0];

    // Fetch all players
    const { data: players } = await supabase.from("players").select("id");
    if (!players || players.length === 0) {
      return new Response(JSON.stringify({ message: "No players found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all performance data
    const [battingRes, bowlingRes, fieldingRes] = await Promise.all([
      supabase.from("batting_inputs").select("player_id, runs, balls, fours, sixes, out, match_id"),
      supabase.from("bowling_inputs").select("player_id, balls, runs_conceded, wickets, maidens, wides, no_balls, match_id"),
      supabase.from("fielding_inputs").select("player_id, catches, runouts, stumpings, dropped_catches, match_id"),
    ]);

    // Fetch scoring settings
    const { data: scoringArr } = await supabase.from("scoring_settings").select("*").limit(1);
    const s = scoringArr?.[0] ?? {};

    // Aggregate stats per player
    interface Stats {
      runs: number; balls: number; fours: number; sixes: number; timesOut: number;
      thirties: number; fifties: number; hundreds: number;
      bBalls: number; runsConceded: number; wickets: number; maidens: number; wides: number; noBalls: number;
      threeFers: number; fiveFers: number;
      catches: number; runouts: number; stumpings: number; droppedCatches: number;
      matches: Set<number>;
    }

    const statsMap = new Map<number, Stats>();
    const ensure = (pid: number): Stats => {
      let st = statsMap.get(pid);
      if (!st) {
        st = { runs: 0, balls: 0, fours: 0, sixes: 0, timesOut: 0, thirties: 0, fifties: 0, hundreds: 0, bBalls: 0, runsConceded: 0, wickets: 0, maidens: 0, wides: 0, noBalls: 0, threeFers: 0, fiveFers: 0, catches: 0, runouts: 0, stumpings: 0, droppedCatches: 0, matches: new Set() };
        statsMap.set(pid, st);
      }
      return st;
    };

    for (const r of battingRes.data || []) {
      const st = ensure(r.player_id);
      st.runs += r.runs || 0; st.balls += r.balls || 0; st.fours += r.fours || 0; st.sixes += r.sixes || 0;
      if (r.out) st.timesOut++;
      const runs = r.runs || 0;
      if (runs >= 100) st.hundreds++; else if (runs >= 50) st.fifties++; else if (runs >= 30) st.thirties++;
      st.matches.add(r.match_id);
    }
    for (const r of bowlingRes.data || []) {
      const st = ensure(r.player_id);
      st.bBalls += r.balls || 0; st.runsConceded += r.runs_conceded || 0; st.wickets += r.wickets || 0;
      st.maidens += r.maidens || 0; st.wides += r.wides || 0; st.noBalls += r.no_balls || 0;
      const w = r.wickets || 0;
      if (w >= 5) st.fiveFers++; else if (w >= 3) st.threeFers++;
      st.matches.add(r.match_id);
    }
    for (const r of fieldingRes.data || []) {
      const st = ensure(r.player_id);
      st.catches += r.catches || 0; st.runouts += r.runouts || 0; st.stumpings += r.stumpings || 0;
      st.droppedCatches += r.dropped_catches || 0;
      st.matches.add(r.match_id);
    }

    // Calculate points
    const calcPoints = (st: Stats) => {
      let bat = 0;
      bat += st.runs * Number(s.batting_run_points ?? 1);
      bat += st.fours * Number(s.batting_four_points ?? 2);
      bat += st.sixes * Number(s.batting_six_points ?? 3);
      bat += st.thirties * Number(s.batting_thirty_bonus ?? 5);
      bat += st.fifties * Number(s.batting_fifty_bonus ?? 10);
      bat += st.hundreds * Number(s.batting_hundred_bonus ?? 20);
      if (st.balls > 0) {
        const sr = (st.runs / st.balls) * 100;
        bat += Math.max(0, Math.min(Number(s.batting_sr_bonus_cap ?? 30), (sr - 100) / Number(s.batting_sr_bonus_divisor ?? 5)));
      }

      let bowl = 0;
      bowl += st.wickets * Number(s.bowling_wicket_points ?? 10);
      bowl += st.maidens * Number(s.bowling_maiden_points ?? 5);
      bowl += st.threeFers * Number(s.bowling_threefer_bonus ?? 5);
      bowl += st.fiveFers * Number(s.bowling_fivefer_bonus ?? 10);
      bowl -= st.noBalls * Number(s.bowling_noball_penalty ?? 1);
      bowl -= st.wides * Number(s.bowling_wide_penalty ?? 1);
      if (st.bBalls > 0) {
        const eco = st.runsConceded / (st.bBalls / 6);
        bowl += Math.max(0, Math.min(Number(s.bowling_eco_bonus_cap ?? 25), (Number(s.bowling_eco_target ?? 8) - eco) * Number(s.bowling_eco_bonus_multiplier ?? 3)));
      }

      let field = 0;
      field += st.catches * Number(s.fielding_catch_points ?? 5);
      field += st.runouts * Number(s.fielding_runout_points ?? 7);
      field += st.stumpings * Number(s.fielding_stumping_points ?? 7);
      field -= st.droppedCatches * Number(s.fielding_dropped_catch_penalty ?? 5);

      bat = Math.max(0, bat); bowl = Math.max(0, bowl); field = Math.max(0, field);
      const total = bat * Number(s.batting_weight ?? 0.4) + bowl * Number(s.bowling_weight ?? 0.35) + field * Number(s.fielding_weight ?? 0.25);
      return { bat: Math.round(bat * 10) / 10, bowl: Math.round(bowl * 10) / 10, field: Math.round(field * 10) / 10, total: Math.round(total * 10) / 10 };
    };

    // Build sorted rankings
    const ranked: { playerId: number; bat: number; bowl: number; field: number; total: number }[] = [];
    for (const [pid, st] of statsMap) {
      if (st.matches.size === 0) continue;
      const pts = calcPoints(st);
      ranked.push({ playerId: pid, ...pts });
    }
    ranked.sort((a, b) => b.total - a.total);

    // Also sort by batting/bowling/fielding for category ranks
    const batSorted = [...ranked].sort((a, b) => b.bat - a.bat);
    const bowlSorted = [...ranked].sort((a, b) => b.bowl - a.bowl);
    const fieldSorted = [...ranked].sort((a, b) => b.field - a.field);

    const batRankMap = new Map<number, number>();
    batSorted.forEach((r, i) => batRankMap.set(r.playerId, i + 1));
    const bowlRankMap = new Map<number, number>();
    bowlSorted.forEach((r, i) => bowlRankMap.set(r.playerId, i + 1));
    const fieldRankMap = new Map<number, number>();
    fieldSorted.forEach((r, i) => fieldRankMap.set(r.playerId, i + 1));

    // Get active season
    const { data: activeSeason } = await supabase.from("seasons").select("id").eq("is_active", true).limit(1).maybeSingle();

    // Insert snapshots
    const snapshots = ranked.map((r, i) => ({
      player_id: r.playerId,
      overall_rank: i + 1,
      batting_rank: batRankMap.get(r.playerId) ?? null,
      bowling_rank: bowlRankMap.get(r.playerId) ?? null,
      fielding_rank: fieldRankMap.get(r.playerId) ?? null,
      snapshot_date: today,
      season_id: activeSeason?.id ?? null,
    }));

    if (snapshots.length > 0) {
      const { error } = await supabase.from("rank_snapshots").insert(snapshots);
      if (error) throw error;
    }

    return new Response(
      JSON.stringify({ message: `${snapshotType} snapshot saved`, players: snapshots.length, date: today }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
