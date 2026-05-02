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
  }));

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
            </div>
          ))}
        </div>

        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="phase" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number, _name: string, props: any) => [
                  `SR ${value} · ${props.payload.runs} off ${props.payload.balls} (${props.payload.innings} inn)`,
                  props.payload.range,
                ]}
              />
              <Bar dataKey="SR" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="SR" position="top" style={{ fontSize: 11, fill: 'hsl(var(--foreground))' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <p className="text-[10px] text-muted-foreground text-center italic">
          Based on innings duration buckets · ball-by-ball data not tracked
        </p>
      </CardContent>
    </Card>
  );
}