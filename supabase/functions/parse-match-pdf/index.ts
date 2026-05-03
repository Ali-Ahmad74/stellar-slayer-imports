import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a cricket scorecard parser. The PDF is from the "Cricket Scorer" app.
CONVENTION: "First Innings" is OUR team batting (Stellar Slayers). "Second Innings" is the OPPONENT batting.
Extract data and return ONLY valid JSON matching the requested schema. Do NOT include markdown fences.
- Use YYYY-MM-DD for match_date.
- result must be one of: "won", "lost", "draw".
- our_batting = batters in First Innings (our team).
- our_bowling = bowlers in Second Innings (us bowling at opponent).
- our_fielding = fielders who took catches/stumpings/runouts in Second Innings (parse from dismissal text like "c Muzammil b Bowler").
- fall_of_wickets = First Innings FOW only (our team's wickets falling).
- partnerships = First Innings partnerships only.
- If a field is unknown, use sensible defaults (0 for numbers, null for strings, [] for arrays).
- Player names: keep exactly as printed, trim whitespace.
Return ONLY the JSON object — no explanation.`;

const USER_PROMPT = `Extract match data from this cricket scorecard PDF and return ONLY a JSON object with this exact structure:
{
  "match_date": "YYYY-MM-DD",
  "venue": "string",
  "opponent_name": "string",
  "our_score": 0,
  "opponent_score": 0,
  "our_wickets": 0,
  "opponent_wickets": 0,
  "overs": 20,
  "result": "won|lost|draw",
  "our_batting": [{ "name": "string", "runs": 0, "balls": 0, "fours": 0, "sixes": 0, "out": true, "dismissal_type": "string|null", "batting_position": 1 }],
  "our_bowling": [{ "name": "string", "overs": 0, "runs_conceded": 0, "wickets": 0, "maidens": 0, "wides": 0, "no_balls": 0 }],
  "our_fielding": [{ "name": "string", "catches": 0 }],
  "fall_of_wickets": [{ "wicket_number": 1, "runs_at_fall": 0, "over": "0.0", "batsman_out": "string" }],
  "partnerships": [{ "wicket_number": 1, "player1_name": "string", "player2_name": "string", "runs": 0 }]
}`;

function stripJsonFences(s: string): string {
  let t = s.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  }
  // Find first { and last }
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first >= 0 && last > first) t = t.slice(first, last + 1);
  return t;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing auth header");
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) throw new Error("Unauthorized");

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) throw new Error("Admin access required");

    const { pdf_base64, filename } = await req.json();
    if (!pdf_base64 || typeof pdf_base64 !== "string") {
      throw new Error("pdf_base64 is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const dataUrl = pdf_base64.startsWith("data:")
      ? pdf_base64
      : `data:application/pdf;base64,${pdf_base64}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: USER_PROMPT },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (aiResp.status === 429) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please wait and try again." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (aiResp.status === 402) {
      return new Response(
        JSON.stringify({ error: "AI credits exhausted. Add credits in Workspace → Usage." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!aiResp.ok) {
      const txt = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, txt);
      throw new Error(`AI gateway error ${aiResp.status}`);
    }

    const aiJson = await aiResp.json();
    const content: string = aiJson?.choices?.[0]?.message?.content ?? "";
    if (!content) throw new Error("AI returned empty response");

    let parsed: unknown;
    try {
      parsed = JSON.parse(stripJsonFences(content));
    } catch (e) {
      console.error("JSON parse failed. Raw:", content.slice(0, 500));
      throw new Error("Failed to parse AI response as JSON");
    }

    return new Response(
      JSON.stringify({ success: true, filename, data: parsed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("parse-match-pdf error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});