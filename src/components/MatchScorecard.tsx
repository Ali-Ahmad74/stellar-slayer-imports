import { useEffect, useMemo, useRef, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Loader2, Share2 } from "lucide-react";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { exportSingleMatchPDF, type SingleMatchExportData, type MatchExportOptions } from "@/lib/match-export";
import { ShareMatchScorecardDialog } from "@/components/ShareMatchScorecardDialog";
import { useTeamSettings } from "@/hooks/useTeamSettings";

export interface BattingScorecardRow {
  player_id: number;
  player_name: string;
  player_photo_url: string | null;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  out: boolean;
  dismissal_type: string | null;
  balls_to_fifty: number | null;
  balls_to_hundred: number | null;
}

export interface BowlingScorecardRow {
  player_id: number;
  player_name: string;
  player_photo_url: string | null;
  balls: number;
  runs_conceded: number;
  wickets: number;
  maidens: number;
  wides: number;
  no_balls: number;
}

export interface FieldingScorecardRow {
  player_id: number;
  player_name: string;
  player_photo_url: string | null;
  catches: number;
  runouts: number;
  stumpings: number;
  dropped_catches: number;
}

function formatOvers(balls: number) {
  const overs = Math.floor(balls / 6);
  const remainingBalls = balls % 6;
  return remainingBalls > 0 ? `${overs}.${remainingBalls}` : `${overs}`;
}

interface MatchScorecardProps {
  matchId: number;
  showExport?: boolean;
  matchMeta?: {
    date: string;
    opponent: string;
    venue: string;
    ourScore: number | null;
    opponentScore: number | null;
    result: string;
    overs: number;
    seriesName?: string;
  };
  exportOptions?: MatchExportOptions;
}

export function MatchScorecard({ matchId, showExport, matchMeta, exportOptions }: MatchScorecardProps) {
  const [loading, setLoading] = useState(false);
  const [batting, setBatting] = useState<BattingScorecardRow[]>([]);
  const [bowling, setBowling] = useState<BowlingScorecardRow[]>([]);
  const [fielding, setFielding] = useState<FieldingScorecardRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const { teamSettings } = useTeamSettings();

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const [batRes, bowlRes, fieldRes] = await Promise.all([
          supabase
            .from("batting_inputs")
            .select("player_id, runs, balls, fours, sixes, out, dismissal_type, balls_to_fifty, balls_to_hundred, players(name, photo_url)")
            .eq("match_id", matchId)
            .order("runs", { ascending: false }),
          supabase
            .from("bowling_inputs")
            .select("player_id, balls, runs_conceded, wickets, maidens, wides, no_balls, players(name, photo_url)")
            .eq("match_id", matchId)
            .order("wickets", { ascending: false }),
          supabase
            .from("fielding_inputs")
            .select("player_id, catches, runouts, stumpings, dropped_catches, players(name, photo_url)")
            .eq("match_id", matchId),
        ]);

        if (batRes.error) throw batRes.error;
        if (bowlRes.error) throw bowlRes.error;
        if (fieldRes.error) throw fieldRes.error;

        const battingRows: BattingScorecardRow[] = (batRes.data ?? []).map((b: any) => ({
          player_id: b.player_id,
          player_name: b.players?.name || "Unknown",
          player_photo_url: b.players?.photo_url || null,
          runs: Number(b.runs ?? 0),
          balls: Number(b.balls ?? 0),
          fours: Number(b.fours ?? 0),
          sixes: Number(b.sixes ?? 0),
          out: Boolean(b.out),
          dismissal_type: b.dismissal_type || null,
          balls_to_fifty: b.balls_to_fifty ?? null,
          balls_to_hundred: b.balls_to_hundred ?? null,
        }));

        const bowlingRows: BowlingScorecardRow[] = (bowlRes.data ?? []).map((b: any) => ({
          player_id: b.player_id,
          player_name: b.players?.name || "Unknown",
          player_photo_url: b.players?.photo_url || null,
          balls: Number(b.balls ?? 0),
          runs_conceded: Number(b.runs_conceded ?? 0),
          wickets: Number(b.wickets ?? 0),
          maidens: Number(b.maidens ?? 0),
          wides: Number(b.wides ?? 0),
          no_balls: Number(b.no_balls ?? 0),
        }));

        const fieldingRows: FieldingScorecardRow[] = (fieldRes.data ?? [])
          .filter(
            (f: any) =>
              Number(f.catches ?? 0) > 0 || Number(f.runouts ?? 0) > 0 || Number(f.stumpings ?? 0) > 0 || Number(f.dropped_catches ?? 0) > 0
          )
          .map((f: any) => ({
            player_id: f.player_id,
            player_name: f.players?.name || "Unknown",
            player_photo_url: f.players?.photo_url || null,
            catches: Number(f.catches ?? 0),
            runouts: Number(f.runouts ?? 0),
            stumpings: Number(f.stumpings ?? 0),
            dropped_catches: Number(f.dropped_catches ?? 0),
          }));

        if (cancelled) return;
        setBatting(battingRows);
        setBowling(bowlingRows);
        setFielding(fieldingRows);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load scorecard");
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [matchId]);

  const isEmpty = useMemo(() => batting.length === 0 && bowling.length === 0 && fielding.length === 0, [batting, bowling, fielding]);

  const handleExportPDF = async () => {
    if (!matchMeta) return;
    setExporting(true);
    try {
      const exportData: SingleMatchExportData = {
        matchId,
        date: matchMeta.date,
        opponent: matchMeta.opponent,
        venue: matchMeta.venue,
        ourScore: matchMeta.ourScore,
        opponentScore: matchMeta.opponentScore,
        result: matchMeta.result,
        overs: matchMeta.overs,
        seriesName: matchMeta.seriesName,
        batting: batting.filter(b => b.balls > 0 || b.runs > 0 || b.out).map(b => ({
          player_name: b.player_name,
          photo_url: b.player_photo_url,
          runs: b.runs,
          balls: b.balls,
          fours: b.fours,
          sixes: b.sixes,
          out: b.out,
          dismissal_type: b.dismissal_type,
          strike_rate: b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : "0.0",
        })),
        bowling: bowling.map(b => ({
          player_name: b.player_name,
          photo_url: b.player_photo_url,
          overs: formatOvers(b.balls),
          maidens: b.maidens,
          runs_conceded: b.runs_conceded,
          wickets: b.wickets,
          economy: b.balls > 0 ? (b.runs_conceded / (b.balls / 6)).toFixed(2) : "0.00",
          extras: b.wides + b.no_balls > 0 ? `${b.wides}wd, ${b.no_balls}nb` : "-",
        })),
        fielding: fielding.map(f => ({
          player_name: f.player_name,
          photo_url: f.player_photo_url,
          catches: f.catches,
          runouts: f.runouts,
          stumpings: f.stumpings,
          dropped_catches: f.dropped_catches,
        })),
      };
      await exportSingleMatchPDF(exportData, exportOptions);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive text-center py-4">{error}</p>;
  }

  if (isEmpty) {
    return <p className="text-center text-muted-foreground py-4">No detailed scorecard available for this match</p>;
  }

  const actualBatters = batting.filter(b => b.balls > 0 || b.runs > 0 || b.out);
  const dnbPlayers = batting.filter(b => b.balls === 0 && b.runs === 0 && !b.out);

  // Data for share dialog
  const shareBatting = actualBatters.map(b => ({
    player_name: b.player_name, runs: b.runs, balls: b.balls, fours: b.fours, sixes: b.sixes, out: b.out,
  }));
  const shareBowling = bowling.map(b => ({
    player_name: b.player_name, overs: formatOvers(b.balls), wickets: b.wickets, runs_conceded: b.runs_conceded,
    economy: b.balls > 0 ? (b.runs_conceded / (b.balls / 6)).toFixed(2) : "0.00",
  }));
  const shareFielding = fielding.map(f => ({
    player_name: f.player_name, catches: f.catches, runouts: f.runouts, stumpings: f.stumpings,
  }));

  return (
    <div className="p-4 space-y-6">
      {/* Export buttons */}
      {showExport && matchMeta && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={exporting}
            className="gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.preventDefault(); setShareOpen(true); }}
            disabled={exporting}
            className="gap-1.5"
            type="button"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share
          </Button>
        </div>
      )}

      {actualBatters.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">🏏 Batting Scorecard</h4>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-center">R</TableHead>
                  <TableHead className="text-center">B</TableHead>
                  <TableHead className="text-center">4s</TableHead>
                  <TableHead className="text-center">6s</TableHead>
                  <TableHead className="text-center">SR</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actualBatters.map((b) => (
                  <TableRow key={b.player_id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <PlayerAvatar name={b.player_name} photoUrl={b.player_photo_url} size="sm" />
                        {b.player_name}
                        {b.runs >= 100 && <Badge className="text-[9px] px-1">💯</Badge>}
                        {b.runs >= 50 && b.runs < 100 && <Badge variant="secondary" className="text-[9px] px-1">⭐50</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-bold">{b.runs}</TableCell>
                    <TableCell className="text-center">{b.balls}</TableCell>
                    <TableCell className="text-center">{b.fours}</TableCell>
                    <TableCell className="text-center">{b.sixes}</TableCell>
                    <TableCell className="text-center">{b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : "0.0"}</TableCell>
                    <TableCell className="text-center">
                      {b.out ? (
                        <Badge variant="destructive">
                          {b.dismissal_type ? b.dismissal_type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Out'}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Not Out</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Milestone annotations using balls_to_fifty / balls_to_hundred */}
          {actualBatters.some(b => b.runs >= 50) && (
            <div className="mt-2 flex flex-wrap gap-2">
              {actualBatters.filter(b => b.runs >= 100 && b.balls_to_hundred).map(b => (
                <Badge key={`${b.player_id}-100`} variant="outline" className="text-xs">
                  {b.player_name}: 💯 Century off {b.balls_to_hundred} balls
                </Badge>
              ))}
              {actualBatters.filter(b => b.runs >= 50 && b.balls_to_fifty).map(b => (
                <Badge key={`${b.player_id}-50`} variant="outline" className="text-xs">
                  {b.player_name}: ⭐ Fifty off {b.balls_to_fifty} balls
                </Badge>
              ))}
              {/* Fallback for entries without specific balls_to_fifty/hundred */}
              {actualBatters.filter(b => b.runs >= 50 && !b.balls_to_fifty && !b.balls_to_hundred).map(b => (
                <Badge key={`${b.player_id}-fallback`} variant="outline" className="text-xs text-muted-foreground">
                  {b.player_name}: {b.runs >= 100 ? "💯 Century" : "⭐ Fifty"}
                </Badge>
              ))}
            </div>
          )}
          {dnbPlayers.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Did Not Bat: </span>
                {dnbPlayers.map(p => p.player_name).join(", ")}
              </p>
            </div>
          )}
        </div>
      )}

      {bowling.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">🎯 Bowling Scorecard</h4>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-center">O</TableHead>
                  <TableHead className="text-center">M</TableHead>
                  <TableHead className="text-center">R</TableHead>
                  <TableHead className="text-center">W</TableHead>
                  <TableHead className="text-center">Econ</TableHead>
                  <TableHead className="text-center">Extras</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bowling.map((b) => (
                  <TableRow key={b.player_id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <PlayerAvatar name={b.player_name} photoUrl={b.player_photo_url} size="sm" />
                        {b.player_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{formatOvers(b.balls)}</TableCell>
                    <TableCell className="text-center">{b.maidens}</TableCell>
                    <TableCell className="text-center">{b.runs_conceded}</TableCell>
                    <TableCell className="text-center font-bold">{b.wickets}</TableCell>
                    <TableCell className="text-center">{b.balls > 0 ? (b.runs_conceded / (b.balls / 6)).toFixed(2) : "0.00"}</TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {b.wides + b.no_balls > 0 ? `${b.wides}wd, ${b.no_balls}nb` : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {fielding.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">🧤 Fielding Highlights</h4>
          <div className="flex flex-wrap gap-2">
            {fielding.map((f) => (
              <Badge key={f.player_id} variant="outline" className="py-2 px-3 flex items-center gap-1.5">
                <PlayerAvatar name={f.player_name} photoUrl={f.player_photo_url} size="sm" />
                {f.player_name}:{f.catches > 0 && ` ${f.catches}c`}
                {f.runouts > 0 && ` ${f.runouts}ro`}
                {f.stumpings > 0 && ` ${f.stumpings}st`}
                {f.dropped_catches > 0 && <span className="text-destructive"> {f.dropped_catches}d</span>}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Share Dialog */}
      {matchMeta && (
        <ShareMatchScorecardDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          teamName={teamSettings?.team_name}
          teamSettings={teamSettings}
          match={matchMeta}
          batting={shareBatting}
          bowling={shareBowling}
          fielding={shareFielding}
        />
      )}
    </div>
  );
}
