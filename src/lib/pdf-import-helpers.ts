import { AdminPlayer } from "@/components/admin/types";

export type ParsedBatting = {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  out: boolean;
  dismissal_type: string | null;
  batting_position: number;
};

export type ParsedBowling = {
  name: string;
  overs: number;
  runs_conceded: number;
  wickets: number;
  maidens: number;
  wides: number;
  no_balls: number;
};

export type ParsedFielding = { name: string; catches: number };

export type ParsedFOW = {
  wicket_number: number;
  runs_at_fall: number;
  over: string;
  batsman_out: string;
};

export type ParsedPartnership = {
  wicket_number: number;
  player1_name: string;
  player2_name: string;
  runs: number;
};

export type ParsedMatch = {
  match_date: string;
  venue: string | null;
  opponent_name: string | null;
  our_score: number;
  opponent_score: number;
  our_wickets: number;
  opponent_wickets: number;
  overs: number;
  result: string;
  our_batting: ParsedBatting[];
  our_bowling: ParsedBowling[];
  our_fielding: ParsedFielding[];
  fall_of_wickets: ParsedFOW[];
  partnerships: ParsedPartnership[];
};

export function normalizeName(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s'.-]/g, "")
    .trim();
}

export function buildPlayerMap(players: AdminPlayer[]): Map<string, AdminPlayer> {
  const m = new Map<string, AdminPlayer>();
  for (const p of players) m.set(normalizeName(p.name), p);
  return m;
}

export function findPlayer(
  name: string | null | undefined,
  map: Map<string, AdminPlayer>
): AdminPlayer | null {
  if (!name) return null;
  const norm = normalizeName(name);
  if (map.has(norm)) return map.get(norm)!;
  // Fallback: last-name-only match (handles "M. Ali" vs "Muhammad Ali")
  const tokens = norm.split(" ").filter(Boolean);
  if (tokens.length === 0) return null;
  const last = tokens[tokens.length - 1];
  for (const [key, p] of map) {
    const k = key.split(" ");
    if (k[k.length - 1] === last) return p;
  }
  return null;
}

/**
 * Extract catches from dismissal text like "c Muzammil b Bowler" or "c (sub) Ali b Khan".
 * Returns map of normalized fielder name → catch count.
 */
export function extractCatchesFromDismissals(
  dismissals: Array<string | null | undefined>
): Map<string, number> {
  const out = new Map<string, number>();
  const re = /^\s*c\s+(?:\(sub\)\s+)?([A-Za-z][A-Za-z .'-]*?)\s+b\s+/i;
  for (const raw of dismissals) {
    if (!raw) continue;
    const m = raw.match(re);
    if (!m) continue;
    const fielder = normalizeName(m[1]);
    if (!fielder) continue;
    out.set(fielder, (out.get(fielder) || 0) + 1);
  }
  return out;
}

/**
 * Compute partnerships from FOW + batting order.
 * Partnership N runs = FOW[N].runs - FOW[N-1].runs.
 * Tracks who is at the crease using batting_position.
 */
export function computePartnerships(
  fow: ParsedFOW[],
  batting: ParsedBatting[]
): Array<{ wicket_number: number; player1_name: string; player2_name: string; runs: number }> {
  const sortedFow = [...fow].sort((a, b) => a.wicket_number - b.wicket_number);
  const sortedBat = [...batting].sort((a, b) => (a.batting_position || 99) - (b.batting_position || 99));
  if (sortedBat.length < 2 || sortedFow.length === 0) return [];

  const result: Array<{ wicket_number: number; player1_name: string; player2_name: string; runs: number }> = [];
  let atCrease: [string, string] = [sortedBat[0].name, sortedBat[1].name];
  let nextInIdx = 2;
  let prevRuns = 0;

  for (const f of sortedFow) {
    const runs = Math.max(0, f.runs_at_fall - prevRuns);
    result.push({
      wicket_number: f.wicket_number,
      player1_name: atCrease[0],
      player2_name: atCrease[1],
      runs,
    });
    prevRuns = f.runs_at_fall;

    // Determine who got out and replace with next in order
    const outNorm = normalizeName(f.batsman_out);
    const newBatter = sortedBat[nextInIdx]?.name;
    if (!newBatter) break;
    if (normalizeName(atCrease[0]) === outNorm) {
      atCrease = [newBatter, atCrease[1]];
    } else if (normalizeName(atCrease[1]) === outNorm) {
      atCrease = [atCrease[0], newBatter];
    } else {
      // Couldn't match — assume the earlier-position batter got out
      atCrease = [newBatter, atCrease[1]];
    }
    nextInIdx += 1;
  }
  return result;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const result = r.result as string;
      // strip "data:application/pdf;base64,"
      const idx = result.indexOf(",");
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export function oversToBalls(overs: number): number {
  if (!Number.isFinite(overs) || overs <= 0) return 0;
  const whole = Math.floor(overs);
  const frac = Math.round((overs - whole) * 10);
  return whole * 6 + Math.min(frac, 5);
}

export function normalizeResult(r: string | null | undefined): string {
  const v = (r || "").toLowerCase().trim();
  if (v.startsWith("won") || v === "win") return "won";
  if (v.startsWith("lost") || v === "loss" || v === "lose") return "lost";
  if (v.startsWith("draw") || v === "tie" || v === "tied" || v === "no result") return "draw";
  return v || "draw";
}