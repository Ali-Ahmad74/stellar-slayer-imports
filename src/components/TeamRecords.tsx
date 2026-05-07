import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, Loader2 } from "lucide-react";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { Link } from "react-router-dom";

interface PlayerLite {
  id: number;
  name: string;
  photo_url: string | null;
}

interface MilestoneRecord {
  player_id: number;
  matches_taken: number; // number of matches to reach milestone
  milestone_label: string;
}

interface RecordEntry {
  category: string;
  icon: string;
  records: {
    label: string;
    player: PlayerLite;
    value: string;
    detail: string;
    matchId?: number;
    secondaryPlayer?: PlayerLite;
  }[];
}

interface TeamRecordsProps {
  players: PlayerLite[];
}

export function TeamRecords({ players }: TeamRecordsProps) {
  const [loading, setLoading] = useState(true);
  const [battingData, setBattingData] = useState<any[]>([]);
  const [bowlingData, setBowlingData] = useState<any[]>([]);
  const [partnerships, setPartnerships] = useState<any[]>([]);

  const playerMap = useMemo(() => {
    const map = new Map<number, PlayerLite>();
    players.forEach(p => map.set(p.id, p));
    return map;
  }, [players]);

  useEffect(() => {
    const fetch = async () => {
      const [{ data: bat }, { data: bowl }, { data: parts }] = await Promise.all([
        supabase.from("batting_inputs").select("player_id, match_id, runs, balls, fours, sixes, out, balls_to_fifty, balls_to_hundred").order("match_id", { ascending: true }),
        supabase.from("bowling_inputs").select("player_id, match_id, wickets, balls, runs_conceded, maidens, dot_balls").order("match_id", { ascending: true }),
        supabase.from("match_partnerships").select("match_id, player1_id, player2_id, runs, balls, wicket_number"),
      ]);
      setBattingData(bat || []);
      setBowlingData(bowl || []);
      setPartnerships(parts || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const records = useMemo<RecordEntry[]>(() => {
    if (battingData.length === 0 && bowlingData.length === 0) return [];

    const result: RecordEntry[] = [];

    // ====== BATTING RECORDS ======
    const battingRecords: RecordEntry["records"] = [];

    // Highest individual score
    const highestScore = battingData.reduce((best: any, r: any) => (!best || r.runs > best.runs) ? r : best, null);
    if (highestScore) {
      const p = playerMap.get(highestScore.player_id);
      if (p) battingRecords.push({
        label: "Highest Individual Score",
        player: p,
        value: `${highestScore.runs}${highestScore.out ? '' : '*'}`,
        detail: `off ${highestScore.balls} balls (SR: ${highestScore.balls > 0 ? ((highestScore.runs / highestScore.balls) * 100).toFixed(1) : '0'})`,
        matchId: highestScore.match_id,
      });
    }

    const fastestFifty = battingData
      .filter((r: any) => r.runs >= 50 && r.balls_to_fifty)
      .reduce((best: any, r: any) => (!best || r.balls_to_fifty < best.balls_to_fifty) ? r : best, null);
    if (fastestFifty) {
      const p = playerMap.get(fastestFifty.player_id);
      if (p) battingRecords.push({
        label: "Fastest Fifty",
        player: p,
        value: `${fastestFifty.balls_to_fifty} balls`,
        detail: `scored ${fastestFifty.runs} runs`,
        matchId: fastestFifty.match_id,
      });
    }

    const fastestCentury = battingData
      .filter((r: any) => r.runs >= 100 && r.balls_to_hundred)
      .reduce((best: any, r: any) => (!best || r.balls_to_hundred < best.balls_to_hundred) ? r : best, null);
    if (fastestCentury) {
      const p = playerMap.get(fastestCentury.player_id);
      if (p) battingRecords.push({
        label: "Fastest Century",
        player: p,
        value: `${fastestCentury.balls_to_hundred} balls`,
        detail: `scored ${fastestCentury.runs} runs`,
        matchId: fastestCentury.match_id,
      });
    }

    // Most sixes in an innings
    const mostSixes = battingData.reduce((best: any, r: any) => (!best || r.sixes > best.sixes) ? r : best, null);
    if (mostSixes && mostSixes.sixes > 0) {
      const p = playerMap.get(mostSixes.player_id);
      if (p) battingRecords.push({
        label: "Most Sixes in an Innings",
        player: p,
        value: `${mostSixes.sixes} sixes`,
        detail: `scored ${mostSixes.runs} runs`,
        matchId: mostSixes.match_id,
      });
    }

    // Most fours in an innings
    const mostFours = battingData.reduce((best: any, r: any) => (!best || r.fours > best.fours) ? r : best, null);
    if (mostFours && mostFours.fours > 0) {
      const p = playerMap.get(mostFours.player_id);
      if (p) battingRecords.push({
        label: "Most Fours in an Innings",
        player: p,
        value: `${mostFours.fours} fours`,
        detail: `scored ${mostFours.runs} runs`,
        matchId: mostFours.match_id,
      });
    }

    // Fastest to milestones (500/1000/2000/3000 runs)
    const runMilestones = [500, 1000, 2000, 3000, 4000, 5000];
    const playerRunsByMatch = new Map<number, { match_id: number; cumRuns: number }[]>();
    for (const r of battingData) {
      if (!playerRunsByMatch.has(r.player_id)) playerRunsByMatch.set(r.player_id, []);
      const arr = playerRunsByMatch.get(r.player_id)!;
      const prevRuns = arr.length > 0 ? arr[arr.length - 1].cumRuns : 0;
      // Only add if new match
      const lastMatchId = arr.length > 0 ? arr[arr.length - 1].match_id : -1;
      if (r.match_id !== lastMatchId) {
        arr.push({ match_id: r.match_id, cumRuns: prevRuns + r.runs });
      } else {
        arr[arr.length - 1].cumRuns += r.runs;
      }
    }

    for (const milestone of runMilestones) {
      let fastest: { playerId: number; innings: number } | null = null;
      for (const [playerId, matches] of playerRunsByMatch) {
        const idx = matches.findIndex(m => m.cumRuns >= milestone);
        if (idx >= 0 && (!fastest || (idx + 1) < fastest.innings)) {
          fastest = { playerId, innings: idx + 1 };
        }
      }
      if (fastest) {
        const p = playerMap.get(fastest.playerId);
        if (p) battingRecords.push({
          label: `Fastest to ${milestone} Runs`,
          player: p,
          value: `${fastest.innings} innings`,
          detail: `first to reach ${milestone} runs`,
        });
      }
    }

    // Highest strike rate (min 5 balls)
    const eligibleSR = battingData.filter((r: any) => r.balls >= 5);
    if (eligibleSR.length > 0) {
      const bestSR = eligibleSR.reduce((best: any, r: any) => {
        const sr = (r.runs / r.balls) * 100;
        const bestVal = (best.runs / best.balls) * 100;
        return sr > bestVal ? r : best;
      });
      const p = playerMap.get(bestSR.player_id);
      if (p) battingRecords.push({
        label: "Highest Strike Rate (min 5 balls)",
        player: p,
        value: `${((bestSR.runs / bestSR.balls) * 100).toFixed(1)}`,
        detail: `${bestSR.runs} off ${bestSR.balls} balls`,
      });
    }

    if (battingRecords.length > 0) {
      result.push({ category: "Batting Records", icon: "🏏", records: battingRecords });
    }

    // ====== BOWLING RECORDS ======
    const bowlingRecords: RecordEntry["records"] = [];

    // Best bowling figures
    const bestFigures = bowlingData.reduce((best: any, r: any) => {
      if (!best) return r;
      if (r.wickets > best.wickets) return r;
      if (r.wickets === best.wickets && r.runs_conceded < best.runs_conceded) return r;
      return best;
    }, null);
    if (bestFigures && bestFigures.wickets > 0) {
      const p = playerMap.get(bestFigures.player_id);
      const overs = Math.floor(bestFigures.balls / 6);
      const rem = bestFigures.balls % 6;
      if (p) bowlingRecords.push({
        label: "Best Bowling Figures",
        player: p,
        value: `${bestFigures.wickets}/${bestFigures.runs_conceded}`,
        detail: `in ${rem > 0 ? `${overs}.${rem}` : overs} overs`,
        matchId: bestFigures.match_id,
      });
    }

    // Best economy (min 2 overs)
    const eligibleEco = bowlingData.filter((r: any) => r.balls >= 12);
    if (eligibleEco.length > 0) {
      const bestEco = eligibleEco.reduce((best: any, r: any) => {
        const eco = r.runs_conceded / (r.balls / 6);
        const bestVal = best.runs_conceded / (best.balls / 6);
        return eco < bestVal ? r : best;
      });
      const eco = (bestEco.runs_conceded / (bestEco.balls / 6)).toFixed(2);
      const p = playerMap.get(bestEco.player_id);
      if (p) bowlingRecords.push({
        label: "Best Economy (min 2 overs)",
        player: p,
        value: eco,
        detail: `${bestEco.wickets}/${bestEco.runs_conceded}`,
        matchId: bestEco.match_id,
      });
    }

    // Most dot balls in an innings
    const mostDots = bowlingData.reduce((best: any, r: any) => (!best || (r.dot_balls || 0) > (best.dot_balls || 0)) ? r : best, null);
    if (mostDots && (mostDots.dot_balls || 0) > 0) {
      const p = playerMap.get(mostDots.player_id);
      if (p) bowlingRecords.push({
        label: "Most Dot Balls in an Innings",
        player: p,
        value: `${mostDots.dot_balls} dots`,
        detail: `${mostDots.wickets}/${mostDots.runs_conceded}`,
      });
    }

    // Fastest to wicket milestones
    const wicketMilestones = [25, 50, 100];
    const playerWicketsByMatch = new Map<number, { match_id: number; cumWickets: number }[]>();
    for (const r of bowlingData) {
      if (!playerWicketsByMatch.has(r.player_id)) playerWicketsByMatch.set(r.player_id, []);
      const arr = playerWicketsByMatch.get(r.player_id)!;
      const prev = arr.length > 0 ? arr[arr.length - 1].cumWickets : 0;
      const lastMatchId = arr.length > 0 ? arr[arr.length - 1].match_id : -1;
      if (r.match_id !== lastMatchId) {
        arr.push({ match_id: r.match_id, cumWickets: prev + r.wickets });
      } else {
        arr[arr.length - 1].cumWickets += r.wickets;
      }
    }

    for (const milestone of wicketMilestones) {
      let fastest: { playerId: number; matches: number } | null = null;
      for (const [playerId, matches] of playerWicketsByMatch) {
        const idx = matches.findIndex(m => m.cumWickets >= milestone);
        if (idx >= 0 && (!fastest || (idx + 1) < fastest.matches)) {
          fastest = { playerId, matches: idx + 1 };
        }
      }
      if (fastest) {
        const p = playerMap.get(fastest.playerId);
        if (p) bowlingRecords.push({
          label: `Fastest to ${milestone} Wickets`,
          player: p,
          value: `${fastest.matches} matches`,
          detail: `first to reach ${milestone} wickets`,
        });
      }
    }

    if (bowlingRecords.length > 0) {
      result.push({ category: "Bowling Records", icon: "🎯", records: bowlingRecords });
    }

    // ====== PARTNERSHIPS ======
    const partnershipRecords: RecordEntry["records"] = [];
    if (partnerships.length > 0) {
      const highest = partnerships.reduce((best: any, r: any) => (!best || r.runs > best.runs) ? r : best, null);
      if (highest) {
        const p1 = playerMap.get(highest.player1_id);
        const p2 = playerMap.get(highest.player2_id);
        if (p1 && p2) partnershipRecords.push({
          label: "Highest Partnership",
          player: p1,
          secondaryPlayer: p2,
          value: `${highest.runs} runs`,
          detail: `${p1.name} & ${p2.name} (${highest.wicket_number}${ord(highest.wicket_number)} wkt)`,
          matchId: highest.match_id,
        });
      }
      for (let w = 1; w <= 10; w++) {
        const best = partnerships
          .filter((r: any) => r.wicket_number === w)
          .reduce((a: any, r: any) => (!a || r.runs > a.runs) ? r : a, null);
        if (best) {
          const p1 = playerMap.get(best.player1_id);
          const p2 = playerMap.get(best.player2_id);
          if (p1 && p2) partnershipRecords.push({
            label: `Best ${w}${ord(w)} Wicket Partnership`,
            player: p1,
            secondaryPlayer: p2,
            value: `${best.runs} runs`,
            detail: `${p1.name} & ${p2.name}`,
            matchId: best.match_id,
          });
        }
      }
      if (partnershipRecords.length > 0) {
        result.push({ category: "Partnership Records", icon: "🤝", records: partnershipRecords });
      }
    }

    return result;
  }, [battingData, bowlingData, partnerships, playerMap]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (records.length === 0) {
    return null;
  }

  return (
    <Card variant="elevated">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-xl">
        <CardTitle className="flex items-center gap-2 text-lg font-display">
          <Medal className="w-6 h-6" />
          Team Records
          <Badge className="ml-auto bg-white/20 text-white border-white/30 text-xs font-bold">
            {records.reduce((sum, r) => sum + r.records.length, 0)} Records
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-6">
        {records.map((category) => (
          <div key={category.category}>
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-lg">{category.icon}</span>
              {category.category}
            </h3>
            <div className="space-y-2">
              {category.records.map((record, idx) => (
                <motion.div
                  key={`${record.label}-${idx}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  {(() => {
                    const inner = (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border hover:bg-muted/50 transition-colors">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                          {idx + 1}
                        </div>
                        <PlayerAvatar name={record.player.name} photoUrl={record.player.photo_url} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">{record.label}</p>
                          <p className="text-sm font-bold truncate">{record.player.name}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold font-display text-primary">{record.value}</p>
                          <p className="text-[10px] text-muted-foreground line-clamp-1 max-w-[180px]">{record.detail}</p>
                        </div>
                      </div>
                    );
                    return record.matchId
                      ? <Link to={`/matches?expand=${record.matchId}`} className="block">{inner}</Link>
                      : inner;
                  })()}
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ord(n: number): string {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
