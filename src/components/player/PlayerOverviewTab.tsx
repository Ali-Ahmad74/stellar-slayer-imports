import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ClipboardCheck } from 'lucide-react';
import type { PlayerRole } from '@/types/cricket';
import { PlayerMilestoneTracker } from './PlayerMilestoneTracker';

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
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

export const PlayerOverviewTab = ({ player, stats, selectedSeasonName, attendance, ranks }: PlayerOverviewTabProps) => {
  return (
    <div className="space-y-6">
      {/* Personal Info Card */}
      <Card variant="elevated">
        <CardContent className="p-5 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8">
            <InfoItem label="FULL NAME" value={player.name} />
            {player.date_of_birth && (
              <InfoItem label="BORN" value={formatDate(player.date_of_birth)} />
            )}
            {player.date_of_birth && (
              <InfoItem label="AGE" value={calculateAge(player.date_of_birth)} />
            )}
            {player.nationality && (
              <InfoItem label="NATIONALITY" value={player.nationality} />
            )}
            {player.batting_style && (
              <InfoItem label="BATTING STYLE" value={player.batting_style} />
            )}
            {player.bowling_style && (
              <InfoItem label="BOWLING STYLE" value={player.bowling_style} />
            )}
            <InfoItem label="PLAYING ROLE" value={player.role} />
            {player.jersey_number != null && (
              <InfoItem label="JERSEY NUMBER" value={`#${player.jersey_number}`} />
            )}
            {player.debut_date && (
              <InfoItem label="DEBUT" value={formatDate(player.debut_date)} />
            )}
            <InfoItem label="MATCHES" value={`${stats?.matches || 0} (${selectedSeasonName})`} />
          </div>

          {player.bio && (
            <div className="mt-6 pt-5 border-t border-border">
              <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-1">BIO</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{player.bio}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rankings Card */}
      <Card variant="elevated">
        <CardContent className="p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Current Rankings</h3>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Batting', value: ranks.bat, color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
              { label: 'Bowling', value: ranks.bowl, color: 'bg-red-500/15 text-red-600 dark:text-red-400' },
              { label: 'Fielding', value: ranks.field, color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
              { label: 'Overall', value: ranks.overall, color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
            ].map(r => (
              <div key={r.label} className={`text-center p-3 rounded-xl ${r.color}`}>
                <p className="text-2xl font-bold font-display">{r.value ? `#${r.value}` : '—'}</p>
                <p className="text-[10px] uppercase tracking-wider mt-1 opacity-70">{r.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Attendance Card */}
      <Card variant="elevated">
        <CardContent className="p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Attendance Record</h3>
            <Badge variant="outline" className="ml-auto text-xs">Auto-calculated</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Matches Played</span>
            <span className="text-lg font-bold font-display">{attendance?.attended || 0} / {attendance?.totalMatches || 0}</span>
          </div>
          <Progress value={attendance?.percentage || 0} className="h-3" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Attendance Rate</span>
            <Badge variant={
              (attendance?.percentage || 0) >= 80 ? 'default' :
              (attendance?.percentage || 0) >= 50 ? 'secondary' : 'destructive'
            } className="text-sm font-bold">
              {attendance?.percentage || 0}%
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

function InfoItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-0.5">{label}</p>
      <p className="text-base sm:text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
