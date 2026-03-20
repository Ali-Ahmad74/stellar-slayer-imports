import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, Shield, Zap } from 'lucide-react';

interface MilestoneTrackerProps {
  stats: {
    total_runs: number;
    wickets: number;
    catches: number;
    matches: number;
    fifties: number;
    hundreds: number;
    five_fers: number;
  } | null;
}

interface Milestone {
  label: string;
  current: number;
  target: number;
  icon: React.ReactNode;
  color: string;
}

function getNextMilestones(stats: MilestoneTrackerProps['stats']): Milestone[] {
  if (!stats) return [];
  const milestones: Milestone[] = [];

  // Runs milestones
  const runTargets = [100, 250, 500, 1000, 2000, 3000, 5000];
  const nextRunTarget = runTargets.find(t => stats.total_runs < t);
  if (nextRunTarget) {
    milestones.push({
      label: `${nextRunTarget} Runs`,
      current: stats.total_runs,
      target: nextRunTarget,
      icon: <Zap className="w-4 h-4" />,
      color: 'text-emerald-500',
    });
  }

  // Wickets milestones
  const wktTargets = [10, 25, 50, 100, 150, 200];
  const nextWktTarget = wktTargets.find(t => stats.wickets < t);
  if (nextWktTarget) {
    milestones.push({
      label: `${nextWktTarget} Wickets`,
      current: stats.wickets,
      target: nextWktTarget,
      icon: <Target className="w-4 h-4" />,
      color: 'text-red-500',
    });
  }

  // Catches milestones
  const catchTargets = [10, 25, 50, 75, 100];
  const nextCatchTarget = catchTargets.find(t => stats.catches < t);
  if (nextCatchTarget) {
    milestones.push({
      label: `${nextCatchTarget} Catches`,
      current: stats.catches,
      target: nextCatchTarget,
      icon: <Shield className="w-4 h-4" />,
      color: 'text-blue-500',
    });
  }

  // Matches milestones
  const matchTargets = [10, 25, 50, 100, 150, 200];
  const nextMatchTarget = matchTargets.find(t => stats.matches < t);
  if (nextMatchTarget) {
    milestones.push({
      label: `${nextMatchTarget} Matches`,
      current: stats.matches,
      target: nextMatchTarget,
      icon: <Trophy className="w-4 h-4" />,
      color: 'text-amber-500',
    });
  }

  return milestones.filter(m => m.current < m.target).slice(0, 4);
}

export function PlayerMilestoneTracker({ stats }: MilestoneTrackerProps) {
  const milestones = getNextMilestones(stats);

  if (milestones.length === 0) return null;

  return (
    <Card variant="elevated">
      <CardContent className="p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Next Milestones
        </h3>
        <div className="space-y-4">
          {milestones.map((m) => {
            const pct = Math.min((m.current / m.target) * 100, 100);
            const remaining = m.target - m.current;
            return (
              <div key={m.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className={`flex items-center gap-1.5 font-medium ${m.color}`}>
                    {m.icon}
                    {m.label}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {remaining} more
                  </span>
                </div>
                <Progress value={pct} className="h-2" />
                <p className="text-xs text-muted-foreground text-right">
                  {m.current} / {m.target}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
