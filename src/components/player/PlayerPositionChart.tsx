import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Trophy, Target } from 'lucide-react';
import { PositionStat } from '@/hooks/usePlayerPositionAnalysis';

interface Props {
  data: PositionStat[];
}

export function PlayerPositionChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <Target className="w-5 h-5 text-primary" /> Batting Position Impact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No position data available</p>
        </CardContent>
      </Card>
    );
  }

  const bestPos = [...data].sort((a, b) => b.totalRuns - a.totalRuns)[0];
  const bestWinPos = [...data].sort((a, b) => b.winningRuns - a.winningRuns)[0];
  const totalInnings = data.reduce((s, d) => s + d.innings, 0);
  const weightedPos = data
    .filter(d => typeof d.position === 'number')
    .reduce((s, d) => s + (d.position as number) * d.innings, 0);
  const knownInnings = data.filter(d => typeof d.position === 'number').reduce((s, d) => s + d.innings, 0);
  const avgPos = knownInnings > 0 ? (weightedPos / knownInnings).toFixed(1) : '–';

  const chartData = data.map(d => ({
    position: d.positionLabel,
    Total: d.totalRuns,
    Winning: d.winningRuns,
    innings: d.innings,
  }));

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-display">
          <Target className="w-5 h-5 text-primary" /> Batting Position Impact
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xl font-bold text-primary">{bestPos.positionLabel}</p>
            <p className="text-[11px] text-muted-foreground">Best Position</p>
            <p className="text-[10px] text-muted-foreground">{bestPos.totalRuns} runs</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-success" />
              <p className="text-xl font-bold text-success">{bestWinPos.positionLabel}</p>
            </div>
            <p className="text-[11px] text-muted-foreground">Top Winning Pos.</p>
            <p className="text-[10px] text-muted-foreground">{bestWinPos.winningRuns} runs</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xl font-bold text-accent">{avgPos}</p>
            <p className="text-[11px] text-muted-foreground">Avg Position</p>
            <p className="text-[10px] text-muted-foreground">{totalInnings} innings</p>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="position" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number, name: string, props: any) => {
                  if (name === 'Total') return [`${value} runs (${props.payload.innings} inn)`, 'Total Runs'];
                  return [`${value} runs`, 'Winning Cause'];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Winning" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}