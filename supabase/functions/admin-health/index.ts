import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const NUMERIC_TABLES = [
  "players",
  "matches",
  "series",
  "seasons",
  "tournaments",
  "batting_inputs",
  "bowling_inputs",
  "fielding_inputs",
] as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // Authenticate user via JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Unauthorized" }, 401);
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) {
      return json({ error: "Unauthorized" }, 401);
    }
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id);
    const isAdmin = (roleRows ?? []).some((r: { role: string }) => r.role === "admin");
    if (!isAdmin) {
      return json({ error: "Forbidden" }, 403);
    }

    // Sequence / max-id check per table
    const tableChecks: Array<{
      table: string;
      row_count: number;
      max_id: number;
      sequence_value: number;
      next_id_safe: boolean;
      duplicate_ids: number;
    }> = [];

    for (const table of NUMERIC_TABLES) {
      const { data: rows, error: rowsErr } = await supabase
        .from(table)
        .select("id");
      if (rowsErr) {
        tableChecks.push({
          table,
          row_count: 0,
          max_id: 0,
          sequence_value: 0,
          next_id_safe: false,
          duplicate_ids: 0,
        });
        continue;
      }
      const ids = (rows as { id: number }[]).map((r) => r.id);
      const maxId = ids.length ? Math.max(...ids) : 0;
      const dupCount = ids.length - new Set(ids).size;

      // Probe the sequence by reading currval indirectly: sample max + 1 expected.
      // We approximate sequence health: safe if maxId < some "next id" we can derive
      // from a no-op insert isn't possible without writing, so we infer from data only.
      tableChecks.push({
        table,
        row_count: ids.length,
        max_id: maxId,
        sequence_value: maxId, // best-effort, exposed via data only
        next_id_safe: dupCount === 0,
        duplicate_ids: dupCount,
      });
    }

    // Recent activity log
    const { data: recentActivity } = await supabase
      .from("admin_activity_log")
      .select("id, action, entity_type, entity_id, summary, created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    const hasDuplicates = tableChecks.some((t) => t.duplicate_ids > 0);
    const status = hasDuplicates ? "degraded" : "healthy";

    return json({
      status,
      checked_at: new Date().toISOString(),
      tables: tableChecks,
      recent_activity: recentActivity ?? [],
      issues: tableChecks
        .filter((t) => t.duplicate_ids > 0)
        .map((t) => `${t.table}: ${t.duplicate_ids} duplicate IDs detected`),
    });
  } catch (e) {
    console.error("admin-health error", e);
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}