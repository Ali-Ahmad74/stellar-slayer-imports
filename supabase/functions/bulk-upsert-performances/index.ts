import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing auth header");

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) throw new Error("Unauthorized");

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) throw new Error("Admin access required");

    const { match_id, rows } = await req.json();

    if (!match_id || !rows || !Array.isArray(rows)) {
      throw new Error("Invalid payload");
    }

    // Delete existing entries for this match
    await Promise.all([
      supabase.from("batting_inputs").delete().eq("match_id", match_id),
      supabase.from("bowling_inputs").delete().eq("match_id", match_id),
      supabase.from("fielding_inputs").delete().eq("match_id", match_id),
      supabase.from("match_attendance").delete().eq("match_id", match_id),
    ]);

    // Get season_id from match
    const { data: matchData } = await supabase
      .from("matches")
      .select("season_id")
      .eq("id", match_id)
      .maybeSingle();

    const season_id = matchData?.season_id || null;

    const battingRows: any[] = [];
    const bowlingRows: any[] = [];
    const fieldingRows: any[] = [];
    const attendanceRows: any[] = [];

    for (const row of rows) {
      const { player_id, batting, bowling, fielding } = row;

      // Auto-attendance: player is included = attended
      attendanceRows.push({
        match_id,
        player_id,
        attended: true,
      });

      if (batting) {
        battingRows.push({
          match_id,
          player_id,
          season_id,
          runs: batting.runs || 0,
          balls: batting.balls || 0,
          fours: batting.fours || 0,
          sixes: batting.sixes || 0,
          out: batting.out || false,
          dismissal_type: batting.dismissal_type || null,
          batting_position: batting.batting_position || null,
          balls_to_fifty: batting.balls_to_fifty || null,
          balls_to_hundred: batting.balls_to_hundred || null,
        });
      }

      if (bowling) {
        bowlingRows.push({
          match_id,
          player_id,
          season_id,
          balls: bowling.balls || 0,
          runs_conceded: bowling.runs_conceded || 0,
          wickets: bowling.wickets || 0,
          maidens: bowling.maidens || 0,
          wides: bowling.wides || 0,
          no_balls: bowling.no_balls || 0,
          fours_conceded: bowling.fours_conceded || 0,
          sixes_conceded: bowling.sixes_conceded || 0,
          dot_balls: bowling.dot_balls || 0,
          hat_tricks: bowling.hat_tricks || 0,
        });
      }

      if (fielding) {
        fieldingRows.push({
          match_id,
          player_id,
          season_id,
          catches: fielding.catches || 0,
          runouts: fielding.runouts || 0,
          stumpings: fielding.stumpings || 0,
          dropped_catches: fielding.dropped_catches || 0,
        });
      }
    }

    // Insert all in parallel
    const results = await Promise.all([
      battingRows.length > 0 ? supabase.from("batting_inputs").insert(battingRows) : null,
      bowlingRows.length > 0 ? supabase.from("bowling_inputs").insert(bowlingRows) : null,
      fieldingRows.length > 0 ? supabase.from("fielding_inputs").insert(fieldingRows) : null,
      attendanceRows.length > 0 ? supabase.from("match_attendance").insert(attendanceRows) : null,
    ]);

    // Check for errors
    for (const result of results) {
      if (result?.error) throw result.error;
    }

    // Auto-calculate partnerships from batting positions
    const battingWithPos = battingRows
      .filter((b: any) => b.batting_position != null && b.batting_position > 0)
      .sort((a: any, b: any) => a.batting_position - b.batting_position);

    if (battingWithPos.length >= 2) {
      // Delete existing partnerships
      await supabase.from("match_partnerships").delete().eq("match_id", match_id);

      const partnerships: any[] = [];
      for (let i = 0; i < battingWithPos.length - 1; i++) {
        const p1 = battingWithPos[i];
        const p2 = battingWithPos[i + 1];
        partnerships.push({
          match_id,
          wicket_number: i + 1,
          player1_id: p1.player_id,
          player2_id: p2.player_id,
          runs: (p1.runs || 0) + (p2.runs || 0),
          balls: (p1.balls || 0) + (p2.balls || 0),
        });
      }

      if (partnerships.length > 0) {
        await supabase.from("match_partnerships").insert(partnerships);
      }
    }

    return new Response(JSON.stringify({ success: true, count: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
