import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PlayerStatsTabProps {
  stats: any;
  selectedSeasonId: string;
  selectedSeasonName: string;
  iccPoints: { battingPoints: number; bowlingPoints: number; fieldingPoints: number; totalPoints: number };
}

export const PlayerStatsTab = ({ stats, selectedSeasonId, selectedSeasonName, iccPoints }: PlayerStatsTabProps) => {
  const strikeRate = stats && stats.total_balls > 0 ? ((stats.total_runs / stats.total_balls) * 100).toFixed(2) : '0.00';
  const battingAverage = stats && stats.times_out > 0 ? (stats.total_runs / stats.times_out).toFixed(2) : stats?.total_runs?.toFixed(2) || '0.00';
  const economy = stats && stats.bowling_balls > 0 ? (stats.runs_conceded / (stats.bowling_balls / 6)).toFixed(2) : '0.00';
  const bowlingAverage = stats && stats.wickets > 0 ? (stats.runs_conceded / stats.wickets).toFixed(2) : '0.00';

  const seasonBadge = selectedSeasonId !== 'all' ? (
    <span className="ml-auto text-sm font-normal bg-white/20 px-2 py-1 rounded">{selectedSeasonName}</span>
  ) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Batting */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card variant="elevated">
          <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-xl">
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🏏</span> Batting {seasonBadge}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: stats?.total_runs || 0, label: 'Runs' },
                { value: stats?.total_balls || 0, label: 'Balls' },
                { value: strikeRate, label: 'SR' },
                { value: battingAverage, label: 'Average' },
                { value: stats?.fours || 0, label: 'Fours' },
                { value: stats?.sixes || 0, label: 'Sixes' },
                { value: stats?.times_out || 0, label: 'Dismissals' },
                { value: stats ? (stats.matches - stats.times_out) : 0, label: 'Not Outs' },
                { value: stats?.run_outs_as_batter || 0, label: 'Run Outs' },
                { value: stats?.ducks || 0, label: 'Ducks 🦆' },
              ].map(i => (
                <div key={i.label} className="text-center p-3 bg-muted/50 rounded-xl">
                  <p className="text-xl sm:text-2xl font-bold font-display text-primary leading-tight">{i.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{i.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">Milestones</h4>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: stats?.thirties || 0, label: '30s', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
                  { value: stats?.fifties || 0, label: '50s', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
                  { value: stats?.hundreds || 0, label: '100s', bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400' },
                ].map(i => (
                  <div key={i.label} className={`text-center p-3 ${i.bg} rounded-lg`}>
                    <p className={`text-lg font-bold ${i.text}`}>{i.value}</p>
                    <p className="text-xs text-muted-foreground">{i.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bowling */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card variant="elevated">
          <CardHeader className="bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-t-xl">
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🎯</span> Bowling {seasonBadge}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: stats?.wickets || 0, label: 'Wickets' },
                { value: bowlingAverage, label: 'Average' },
                { value: economy, label: 'Economy' },
                { value: stats?.runs_conceded || 0, label: 'Runs Given' },
                { value: stats?.maidens || 0, label: 'Maidens' },
                { value: `${stats?.wides || 0}/${stats?.no_balls || 0}`, label: 'Wd/Nb' },
              ].map(i => (
                <div key={i.label} className="text-center p-3 bg-muted/50 rounded-xl">
                  <p className="text-xl sm:text-2xl font-bold font-display text-primary leading-tight">{i.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{i.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">Additional Stats</h4>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { value: stats?.dot_balls || 0, label: 'Dots', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
                  { value: stats?.three_fers || 0, label: '3-fers', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' },
                  { value: stats?.five_fers || 0, label: '5-fers', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
                  { value: (stats as any)?.hat_tricks || 0, label: 'Hat-Tricks', bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400' },
                  { value: stats?.fours_conceded || 0, label: '4s Given', bg: 'bg-muted', text: '' },
                  { value: stats?.sixes_conceded || 0, label: '6s Given', bg: 'bg-muted', text: '' },
                ].map(i => (
                  <div key={i.label} className={`text-center p-2 ${i.bg} rounded-lg`}>
                    <p className={`text-base sm:text-lg font-bold leading-tight ${i.text}`}>{i.value}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{i.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Fielding */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card variant="elevated">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-xl">
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🧤</span> Fielding {seasonBadge}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: stats?.catches || 0, label: 'Catches', color: '' },
                { value: stats?.runouts || 0, label: 'Run Outs', color: '' },
                { value: stats?.stumpings || 0, label: 'Stumpings', color: '' },
                { value: stats?.dropped_catches || 0, label: 'Dropped', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
              ].map(i => (
                <div key={i.label} className={`text-center p-3 sm:p-4 ${(i as any).bg || 'bg-muted/50'} rounded-xl`}>
                  <p className={`text-xl sm:text-2xl font-bold font-display leading-tight ${i.color || 'text-primary'}`}>{i.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{i.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Points Summary */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card variant="elevated">
          <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-xl">
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">⭐</span> Performance Points
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: iccPoints.battingPoints.toFixed(0), label: 'Batting Pts' },
                { value: iccPoints.bowlingPoints.toFixed(0), label: 'Bowling Pts' },
                { value: iccPoints.fieldingPoints.toFixed(0), label: 'Fielding Pts' },
                { value: iccPoints.totalPoints.toFixed(0), label: 'Total Pts' },
              ].map(i => (
                <div key={i.label} className="text-center p-3 bg-muted/50 rounded-xl">
                  <p className="text-xl sm:text-2xl font-bold font-display text-primary leading-tight">{i.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{i.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
