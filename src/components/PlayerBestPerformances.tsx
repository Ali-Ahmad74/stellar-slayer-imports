import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Flame, Star } from 'lucide-react';

interface BattingRecord {
  match_id: number;
  match_date: string;
  runs: number;
  balls: number;
}

interface BowlingRecord {
  match_id: number;
  match_date: string;
  wickets: number;
  runs_conceded: number;
  bowling_balls: number;
}

interface PlayerBestPerformancesProps {
  battingRecords: BattingRecord[];
  bowlingRecords: BowlingRecord[];
}

export function PlayerBestPerformances({ battingRecords, bowlingRecords }: PlayerBestPerformancesProps) {
  // Best batting innings
  const bestBatting = [...battingRecords]
    .sort((a, b) => (b.runs || 0) - (a.runs || 0))
    .slice(0, 3);

  // Best bowling figures
  const bestBowling = [...bowlingRecords]
    .filter(r => (r.wickets || 0) > 0)
    .sort((a, b) => {
      if ((b.wickets || 0) !== (a.wickets || 0)) return (b.wickets || 0) - (a.wickets || 0);
      return (a.runs_conceded || 0) - (b.runs_conceded || 0);
    })
    .slice(0, 3);

  // Highest strike rate (min 10 balls)
  const bestSR = [...battingRecords]
    .filter(r => (r.balls || 0) >= 10)
    .map(r => ({ ...r, sr: ((r.runs || 0) / (r.balls || 1)) * 100 }))
    .sort((a, b) => b.sr - a.sr)
    .slice(0, 1);

  // Best economy (min 12 balls / 2 overs)
  const bestEco = [...bowlingRecords]
    .filter(r => (r.bowling_balls || 0) >= 12)
    .map(r => ({ ...r, eco: ((r.runs_conceded || 0) / ((r.bowling_balls || 1) / 6)) }))
    .sort((a, b) => a.eco - b.eco)
    .slice(0, 1);

  if (bestBatting.length === 0 && bestBowling.length === 0) return null;

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }); }
    catch { return d; }
  };

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="w-5 h-5 text-amber-500" />
          Best Performances
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Best Batting */}
        {bestBatting.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-500" /> Top Batting
            </h4>
            <div className="space-y-2">
              {bestBatting.map((r, i) => (
                <div key={r.match_id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${i === 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                      #{i + 1}
                    </span>
                    <div>
                      <span className="font-bold text-foreground">{r.runs}</span>
                      <span className="text-muted-foreground text-sm"> ({r.balls}b)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.runs >= 50 && <Badge variant="secondary" className="text-xs">{r.runs >= 100 ? '💯' : '⭐'}</Badge>}
                    <span className="text-xs text-muted-foreground">{formatDate(r.match_date)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Best Bowling */}
        {bestBowling.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-red-500" /> Top Bowling
            </h4>
            <div className="space-y-2">
              {bestBowling.map((r, i) => {
                const overs = Math.floor((r.bowling_balls || 0) / 6);
                const ballsRem = (r.bowling_balls || 0) % 6;
                const oversStr = ballsRem > 0 ? `${overs}.${ballsRem}` : `${overs}`;
                return (
                  <div key={r.match_id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${i === 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                        #{i + 1}
                      </span>
                      <div>
                        <span className="font-bold text-foreground">{r.wickets}/{r.runs_conceded}</span>
                        <span className="text-muted-foreground text-sm"> ({oversStr} ov)</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.wickets >= 3 && <Badge variant="secondary" className="text-xs">{r.wickets >= 5 ? '🔥' : '🎯'}</Badge>}
                      <span className="text-xs text-muted-foreground">{formatDate(r.match_date)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Records */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
          {bestSR.length > 0 && (
            <div className="text-center p-2 rounded-lg bg-emerald-500/10">
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{bestSR[0].sr.toFixed(1)}</p>
              <p className="text-[10px] text-muted-foreground">Best SR</p>
            </div>
          )}
          {bestEco.length > 0 && (
            <div className="text-center p-2 rounded-lg bg-blue-500/10">
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{bestEco[0].eco.toFixed(2)}</p>
              <p className="text-[10px] text-muted-foreground">Best Economy</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
