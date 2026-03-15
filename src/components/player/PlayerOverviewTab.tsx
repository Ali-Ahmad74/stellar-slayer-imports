import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ClipboardCheck, Trophy } from 'lucide-react';
import type { PlayerRole } from '@/types/cricket';

interface PlayerOverviewTabProps {
  player: {
    name: string;
    role: PlayerRole;
    date_of_birth: string | null;
    nationality: string | null;
    batting_style: string | null;
    bowling_style: string | null;
    debut_date: string | null;
    jersey_number: number | null;
    bio: string | null;
  };
  stats: { matches: number } | null;
  selectedSeasonName: string;
  attendance: { attended: number; totalMatches: number; percentage: number } | null | undefined;
  ranks: { bat?: number; bowl?: number; field?: number; overall?: number };
}

function calculateAge(dob: string): string {
  const birth = new Date(dob);
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) years--;
  const diffMs = today.getTime() - new Date(birth.getFullYear() + years, birth.getMonth(), birth.getDate()).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return `${years}y ${days}d`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export const PlayerOverviewTab = ({ player, stats, selectedSeasonName, attendance, ranks }: PlayerOverviewTabProps) => {
  const infoItems = [
    { label: 'Full Name', value: player.name },
    player.date_of_birth ? { label: 'Born', value: formatDate(player.date_of_birth) } : null,
    player.date_of_birth ? { label: 'Age', value: calculateAge(player.date_of_birth) } : null,
    player.nationality ? { label: 'Nationality', value: player.nationality } : null,
    player.batting_style ? { label: 'Batting Style', value: player.batting_style } : null,
    player.bowling_style ? { label: 'Bowling Style', value: player.bowling_style } : null,
    { label: 'Playing Role', value: player.role },
    player.jersey_number != null ? { label: 'Jersey Number', value: `#${player.jersey_number}` } : null,
    player.debut_date ? { label: 'Debut', value: formatDate(player.debut_date) } : null,
    { label: 'Matches', value: `${stats?.matches || 0} (${selectedSeasonName})` },
  ].filter(Boolean) as { label: string; value: string | number }[];

  const rankItems = [
    { label: 'Batting', value: ranks.bat, color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
    { label: 'Bowling', value: ranks.bowl, color: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20' },
    { label: 'Fielding', value: ranks.field, color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20' },
    { label: 'Overall', value: ranks.overall, color: 'bg-accent/15 text-accent-foreground border-accent/20' },
  ];

  return (
    <div className="space-y-4">
      {/* Personal Info - Cricinfo style list */}
      <Card variant="elevated">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {infoItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 sm:px-5">
                <span className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wide">
                  {item.label}
                </span>
                <span className="text-sm sm:text-base font-semibold text-foreground text-right">
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          {player.bio && (
            <div className="px-4 py-4 sm:px-5 border-t border-border">
              <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-1">Bio</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{player.bio}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rankings - Compact grid */}
      <Card variant="elevated">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Rankings</h3>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {rankItems.map(r => (
              <div key={r.label} className={`text-center p-2.5 rounded-lg border ${r.color}`}>
                <p className="text-lg sm:text-xl font-bold font-display">{r.value ? `#${r.value}` : '—'}</p>
                <p className="text-[10px] uppercase tracking-wider mt-0.5 opacity-70">{r.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Attendance */}
      <Card variant="elevated">
        <CardContent className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Attendance</h3>
            <Badge variant="outline" className="ml-auto text-[10px]">Auto</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Played</span>
            <span className="font-bold font-display">{attendance?.attended || 0} / {attendance?.totalMatches || 0}</span>
          </div>
          <Progress value={attendance?.percentage || 0} className="h-2.5" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Rate</span>
            <Badge variant={
              (attendance?.percentage || 0) >= 80 ? 'default' :
              (attendance?.percentage || 0) >= 50 ? 'secondary' : 'destructive'
            } className="text-xs font-bold">
              {attendance?.percentage || 0}%
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
