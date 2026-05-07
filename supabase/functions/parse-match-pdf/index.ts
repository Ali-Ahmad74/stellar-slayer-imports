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
- our_fielding = fielders who took catches/stumpings/runouts in Second Innings.
  Parse "c Name b Bowler" → catches; "st Name b Bowler" → stumpings; "run out (Name)" or "run out (NameA/NameB)" → runouts (credit each named).
- fall_of_wickets = First Innings FOW only (our team's wickets falling).
- partnerships = First Innings partnerships only.
- our_ball_by_ball = ball-by-ball commentary for the FIRST innings (our team batting). Read every delivery
  printed in the over-by-over / commentary section. For each delivery include: over (e.g. "12.3"),
  batter (striker name as printed), bowler, runs (batter runs only, exclude extras), is_wicket (true if
  a wicket fell on this ball), is_legal (false for wide/no-ball, true otherwise), extras_type
  ("wide"|"no_ball"|"bye"|"leg_bye"|null), extras_runs (number, default 0). If commentary is missing
  return [].
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
  "our_fielding": [{ "name": "string", "catches": 0, "stumpings": 0, "runouts": 0 }],
  "fall_of_wickets": [{ "wicket_number": 1, "runs_at_fall": 0, "over": "0.0", "batsman_out": "string" }],
  "partnerships": [{ "wicket_number": 1, "player1_name": "string", "player2_name": "string", "runs": 0 }],
  "our_ball_by_ball": [{ "over": "0.1", "batter": "string", "bowler": "string", "runs": 0, "is_wicket": false, "is_legal": true, "extras_type": null, "extras_runs": 0 }]
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

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const AI_GATEWAY_MODEL = "google/gemini-3-flash-preview";
const MAX_AI_GATEWAY_ATTEMPTS = 3;

const MATCH_DATA_SCHEMA = {
  type: "object",
  properties: {
    match_date: { type: "string" },
    venue: { type: "string" },
    opponent_name: { type: "string" },
    our_score: { type: "number" },
    opponent_score: { type: "number" },
    our_wickets: { type: "number" },
    opponent_wickets: { type: "number" },
    overs: { type: "number" },
    result: { type: "string", enum: ["won", "lost", "draw"] },
    our_batting: { type: "array", items: { type: "object" } },
    our_bowling: { type: "array", items: { type: "object" } },
    our_fielding: { type: "array", items: { type: "object" } },
    fall_of_wickets: { type: "array", items: { type: "object" } },
    partnerships: { type: "array", items: { type: "object" } },
    our_ball_by_ball: { type: "array", items: { type: "object" } },
  },
  required: [
    "match_date",
    "venue",
    "opponent_name",
    "our_score",
    "opponent_score",
    "our_wickets",
    "opponent_wickets",
    "overs",
    "result",
    "our_batting",
    "our_bowling",
    "our_fielding",
    "fall_of_wickets",
    "partnerships",
    "our_ball_by_ball",
  ],
} as const;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function retryDelayMs(resp: Response, attempt: number): number {
  const retryAfter = resp.headers.get("retry-after");
  const retryAfterSeconds = retryAfter ? Number(retryAfter) : NaN;
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return Math.min(retryAfterSeconds * 1000, 15000);
  }
  return Math.min(1000 * 2 ** attempt, 15000);
}

async function callAiGateway(apiKey: string, rawBase64: string, filename?: string): Promise<Response> {
  let lastRateLimitBody = "";

  for (let attempt = 0; attempt < MAX_AI_GATEWAY_ATTEMPTS; attempt++) {
    const resp = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_GATEWAY_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: USER_PROMPT },
              {
                type: "file",
                file: {
                  filename: filename || "scorecard.pdf",
                  file_data: `data:application/pdf;base64,${rawBase64}`,
                },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_match_scorecard",
              description: "Extract structured Stellar Slayers cricket scorecard data from the PDF.",
              parameters: MATCH_DATA_SCHEMA,
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_match_scorecard" } },
        temperature: 0,
        max_tokens: 16000,
      }),
    });

    if (resp.status !== 429) return resp;

    lastRateLimitBody = await resp.text();
    if (attempt < MAX_AI_GATEWAY_ATTEMPTS - 1) {
      await sleep(retryDelayMs(resp, attempt));
    }
  }

  throw new Error(`AI parsing is temporarily rate limited after ${MAX_AI_GATEWAY_ATTEMPTS} attempts: ${lastRateLimitBody.slice(0, 200)}`);
}

function extractAiJsonText(aiJson: any): string {
  const toolCalls = aiJson?.choices?.[0]?.message?.tool_calls;
  const toolArgs = toolCalls?.find?.((call: any) => call?.function?.name === "extract_match_scorecard")?.function?.arguments
    ?? toolCalls?.[0]?.function?.arguments;

  if (typeof toolArgs === "string" && toolArgs.trim()) return toolArgs;
  if (toolArgs && typeof toolArgs === "object") return JSON.stringify(toolArgs);

  const content = aiJson?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((part: any) => typeof part === "string" ? part : part?.text ?? part?.content ?? "").join("");
  }
  return "";
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

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const rawBase64 = pdf_base64.startsWith("data:")
      ? pdf_base64.replace(/^data:application\/pdf;base64,/, "")
      : pdf_base64;

    const aiResp = await callGemini(GEMINI_API_KEY, rawBase64);
    if (!aiResp.ok) {
      const txt = await aiResp.text();
      console.error("Gemini API error:", aiResp.status, txt);
      throw new Error(`Gemini API error ${aiResp.status}: ${txt.slice(0, 200)}`);
    }

    const aiJson = await aiResp.json();
    const content: string =
      aiJson?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? "").join("") ?? "";
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