import { forwardRef } from "react";
import { Trophy } from "lucide-react";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { cn } from "@/lib/utils";

type CardFormat = "story" | "square" | "wide";

export interface ShareableMatchCardProps {
  format?: CardFormat;
  teamName?: string;
  teamLogoUrl?: string | null;
  watermarkEnabled?: boolean;
  watermarkHandle?: string | null;
  watermarkPosition?: string;
  match: {
    opponent: string;
    date: string;
    venue: string;
    ourScore: number | null;
    opponentScore: number | null;
    result: string;
    overs: number;
    seriesName?: string;
  };
  batting: { player_name: string; photo_url?: string | null; runs: number; balls: number; fours: number; sixes: number; out: boolean }[];
  bowling: { player_name: string; photo_url?: string | null; overs: string; wickets: number; runs_conceded: number; economy: string }[];
  fielding: { player_name: string; photo_url?: string | null; catches: number; runouts: number; stumpings: number }[];
}

function formatClass(format: CardFormat) {
  switch (format) {
    case "story": return "w-[420px]";
    case "wide": return "w-[960px]";
    default: return "w-[720px]";
  }
}

function resultColor(result: string) {
  if (result === "Won") return "text-emerald-500";
  if (result === "Lost") return "text-red-500";
  return "text-amber-500";
}

export const ShareableMatchCard = forwardRef<HTMLDivElement, ShareableMatchCardProps>(
  ({ format = "square", teamName, teamLogoUrl, watermarkEnabled, watermarkHandle, watermarkPosition, match, batting, bowling, fielding }, ref) => {
    const watermark = watermarkEnabled ? (watermarkHandle || teamName || "") : "";
    const watermarkPos = watermarkPosition || "bottom-right";

    const topBatters = [...batting].sort((a, b) => b.runs - a.runs).slice(0, 4);
    const topBowlers = [...bowling].sort((a, b) => b.wickets - a.wickets || parseFloat(a.economy) - parseFloat(b.economy)).slice(0, 4);

    return (
      <div ref={ref} className={cn("relative rounded-2xl overflow-visible border bg-background text-foreground p-6 pb-10", formatClass(format))}>
        <div className="absolute inset-0 opacity-[0.06]" aria-hidden>
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-primary" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-primary" />
        </div>

        <header className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-xs uppercase tracking-wide">Match Scorecard</span>
            </div>
            <h1 className="mt-2 font-display text-2xl leading-tight">vs {match.opponent || "Unknown"}</h1>
            <div className="mt-2 text-sm text-muted-foreground space-y-0.5">
              <div>{match.date}</div>
              {match.venue && <div>{match.venue}</div>}
              {match.seriesName && <div>{match.seriesName}</div>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {teamLogoUrl ? (
              <img src={teamLogoUrl} alt={`${teamName || "Team"} logo`} className="h-12 w-12 rounded-xl object-cover border border-border" />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-muted border border-border" aria-hidden />
            )}
          </div>
        </header>

        {/* Score */}
        <section className="relative mt-5 rounded-xl border bg-card/60 p-4 flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold tabular-nums">
              {match.ourScore !== null ? `${match.ourScore} - ${match.opponentScore}` : "N/A"}
            </div>
            <div className="text-xs text-muted-foreground">{match.overs} overs</div>
          </div>
          <div className={cn("text-xl font-bold", resultColor(match.result))}>
            {match.result || "N/A"}
          </div>
        </section>

        {/* Top Performers */}
        <section className={cn("relative mt-5 grid gap-4", format === "wide" ? "grid-cols-3" : "grid-cols-1")}>
          {topBatters.length > 0 && (
            <div className="rounded-xl border bg-card/60 p-4">
              <div className="font-semibold text-sm mb-2">🏏 Top Batters</div>
              <div className="space-y-1.5">
                {topBatters.map((b, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <PlayerAvatar name={b.player_name} photoUrl={b.photo_url} size="sm" />
                      <span className="truncate">{b.player_name}</span>
                    </div>
                    <span className="font-semibold tabular-nums">{b.runs}({b.balls})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {topBowlers.length > 0 && (
            <div className="rounded-xl border bg-card/60 p-4">
              <div className="font-semibold text-sm mb-2">🎯 Top Bowlers</div>
              <div className="space-y-1.5">
                {topBowlers.map((b, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <PlayerAvatar name={b.player_name} photoUrl={b.photo_url} size="sm" />
                      <span className="truncate">{b.player_name}</span>
                    </div>
                    <span className="font-semibold tabular-nums">{b.wickets}/{b.runs_conceded} ({b.overs})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {fielding.length > 0 && (
            <div className="rounded-xl border bg-card/60 p-4">
              <div className="font-semibold text-sm mb-2">🧤 Fielding</div>
              <div className="space-y-1.5">
                {fielding.slice(0, 4).map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <PlayerAvatar name={f.player_name} photoUrl={f.photo_url} size="sm" />
                      <span className="truncate">{f.player_name}</span>
                    </div>
                    <span className="font-semibold tabular-nums">
                      {f.catches > 0 && `${f.catches}c `}
                      {f.runouts > 0 && `${f.runouts}ro `}
                      {f.stumpings > 0 && `${f.stumpings}st`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {watermark && (
          <div
            className={cn(
              "absolute text-xs text-muted-foreground/80",
              watermarkPos === "bottom-right" && "bottom-4 right-4",
              watermarkPos === "bottom-left" && "bottom-4 left-4",
              watermarkPos === "top-right" && "top-4 right-4",
              watermarkPos === "top-left" && "top-4 left-4"
            )}
          >
            {watermark}
          </div>
        )}
      </div>
    );
  }
);

ShareableMatchCard.displayName = "ShareableMatchCard";
