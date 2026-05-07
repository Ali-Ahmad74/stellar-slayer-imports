import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { Zap } from 'lucide-react';
import { PhaseStat } from '@/hooks/usePlayerPositionAnalysis';

interface Props {
  data: PhaseStat[];
}

export function PlayerPhaseStrikeRate({ data }: Props) {
  const hasAny = data.some(d => d.innings > 0);

  if (!hasAny) {
    return (
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <Zap className="w-5 h-5 text-primary" /> Innings Phase Strike Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">Not enough innings data</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(d => ({
    phase: d.bucket,
    range: d.range,
    SR: Number(d.strikeRate.toFixed(1)),
    innings: d.innings,
    runs: d.totalRuns,
    balls: d.totalBalls,
    winningRuns: d.winningRuns,
    winningInnings: d.winningInnings,
    winPct: Number(d.winningRunsPct.toFixed(1)),
    wonSR: Number((d.wonSR ?? 0).toFixed(1)),
    wonRuns: d.wonRuns ?? 0,
    wonBalls: d.wonBalls ?? 0,
    lostSR: Number((d.lostSR ?? 0).toFixed(1)),
    lostRuns: d.lostRuns ?? 0,
    lostBalls: d.lostBalls ?? 0,
    isBbB: !!d.isBallByBall,
  }));

  const PhaseTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="rounded-lg border border-border bg-card p-3 shadow-lg text-xs space-y-1">
        <p className="font-semibold text-foreground">{d.phase} <span className="text-muted-foreground font-normal">({d.range})</span></p>
        <p className="text-muted-foreground">Innings: <span className="text-foreground font-medium">{d.innings}</span> ({d.winningInnings} won)</p>
        <p className="text-muted-foreground">Runs / Balls: <span className="text-foreground font-medium">{d.runs} / {d.balls}</span></p>
        <p className="text-muted-foreground">Strike rate: <span className="text-primary font-medium">{d.SR}</span></p>
        <p className="text-muted-foreground">In wins: <span className="text-success font-medium">{d.wonRuns} / {d.wonBalls}</span> · SR <span className="text-success font-medium">{d.wonSR}</span></p>
        <p className="text-muted-foreground">In losses: <span className="text-destructive font-medium">{d.lostRuns} / {d.lostBalls}</span> · SR <span className="text-destructive font-medium">{d.lostSR}</span></p>
      </div>
    );
  };

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-display">
          <Zap className="w-5 h-5 text-primary" /> Innings Phase Strike Rate
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {chartData.map(d => (
            <div key={d.phase} className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xl font-bold text-primary">{d.SR}</p>
              <p className="text-[11px] text-muted-foreground">{d.phase}</p>
              <p className="text-[10px] text-muted-foreground">{d.range}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{d.innings} inn · {d.runs}r</p>
              <p className="text-[10px] text-success mt-0.5">{d.winPct}% in wins</p>
            </div>
          ))}
        </div>

        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="phase" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<PhaseTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
              <Bar dataKey="SR" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="SR" position="top" style={{ fontSize: 11, fill: 'hsl(var(--foreground))' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <p className="text-[10px] text-muted-foreground text-center italic">
          {chartData.some(d => d.isBbB)
            ? 'Computed from ball-by-ball data · split by win/loss in tooltip'
            : 'Computed from innings totals (older matches without ball-by-ball)'}
        </p>
      </CardContent>
    </Card>
  );
}