import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, ChevronRight } from 'lucide-react';

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

interface PlayerMatchLogProps {
  battingRecords: BattingRecord[];
  bowlingRecords: BowlingRecord[];
}

interface MatchEntry {
  match_id: number;
  date: string;
  runs: number;
  balls: number;
  wickets: number;
  runsConceded: number;
  bowlingBalls: number;
  sr: number;
  eco: number;
}

export function PlayerMatchLog({ battingRecords, bowlingRecords }: PlayerMatchLogProps) {
  // Merge batting and bowling by match_id
  const matchMap = new Map<number, MatchEntry>();

  for (const b of battingRecords) {
    const existing = matchMap.get(b.match_id) || {
      match_id: b.match_id, date: b.match_date,
      runs: 0, balls: 0, wickets: 0, runsConceded: 0, bowlingBalls: 0, sr: 0, eco: 0
    };
    existing.runs = b.runs || 0;
    existing.balls = b.balls || 0;
    existing.date = b.match_date;
    matchMap.set(b.match_id, existing);
  }

  for (const b of bowlingRecords) {
    const existing = matchMap.get(b.match_id) || {
      match_id: b.match_id, date: b.match_date,
      runs: 0, balls: 0, wickets: 0, runsConceded: 0, bowlingBalls: 0, sr: 0, eco: 0
    };
    existing.wickets = b.wickets || 0;
    existing.runsConceded = b.runs_conceded || 0;
    existing.bowlingBalls = b.bowling_balls || 0;
    existing.date = b.match_date;
    matchMap.set(b.match_id, existing);
  }

  const entries = Array.from(matchMap.values())
    .map(e => ({
      ...e,
      sr: e.balls > 0 ? (e.runs / e.balls) * 100 : 0,
      eco: e.bowlingBalls > 0 ? (e.runsConceded / (e.bowlingBalls / 6)) : 0,
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (entries.length === 0) return null;

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
    catch { return d; }
  };

  const getRunsBadge = (runs: number) => {
    if (runs >= 100) return '💯';
    if (runs >= 50) return '⭐';
    if (runs >= 30) return '🔵';
    return null;
  };

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="w-5 h-5 text-primary" />
          Match Log
          <Badge variant="secondary" className="ml-auto">{entries.length} matches</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[360px]">
          <div className="divide-y divide-border">
            {entries.map((entry) => {
              const badge = getRunsBadge(entry.runs);
              return (
                <div key={entry.match_id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                  <div className="text-xs text-muted-foreground w-16 shrink-0">
                    {formatDate(entry.date)}
                  </div>
                  <div className="flex-1 flex items-center gap-3 min-w-0">
                    {/* Batting */}
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-foreground">{entry.runs}</span>
                      <span className="text-xs text-muted-foreground">({entry.balls}b)</span>
                      {badge && <span className="text-sm">{badge}</span>}
                    </div>
                    
                    {entry.bowlingBalls > 0 && (
                      <>
                        <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-foreground">{entry.wickets}/{entry.runsConceded}</span>
                          <span className="text-xs text-muted-foreground">
                            ({Math.floor(entry.bowlingBalls / 6)}.{entry.bowlingBalls % 6} ov)
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs text-muted-foreground">
                      SR {entry.sr.toFixed(0)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
