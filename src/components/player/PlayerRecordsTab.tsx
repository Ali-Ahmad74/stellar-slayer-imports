import { motion } from 'framer-motion';
import { PlayerAchievements } from '@/components/PlayerAchievements';
import { PlayerBestPerformances } from '@/components/PlayerBestPerformances';
import { FormAnalysisChart } from '@/components/FormAnalysisChart';
import { OpponentBreakdown } from '@/components/OpponentBreakdown';
import { PlayerPerformanceChart } from '@/components/PlayerPerformanceChart';
import { PlayerPositionChart } from '@/components/player/PlayerPositionChart';
import { PlayerPhaseStrikeRate } from '@/components/player/PlayerPhaseStrikeRate';
import { usePlayerPositionAnalysis } from '@/hooks/usePlayerPositionAnalysis';

interface PlayerRecordsTabProps {
  stats: any;
  rankHistory: any;
  formData: any;
  formStats: any;
  battingRecords: any[];
  bowlingRecords: any[];
  playerId: number;
  playerName: string;
  selectedSeasonId: string;
}

export const PlayerRecordsTab = ({
  stats, rankHistory, formData, formStats,
  battingRecords, bowlingRecords, playerId, playerName, selectedSeasonId,
}: PlayerRecordsTabProps) => {
  const { positions, phases } = usePlayerPositionAnalysis(playerId, selectedSeasonId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Achievements */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <PlayerAchievements stats={{
          ...(stats || {}),
          _rank_top5: rankHistory?.highestOverallRank !== null && rankHistory!.highestOverallRank <= 5 ? 1 : 0,
          _rank_top3: rankHistory?.highestOverallRank !== null && rankHistory!.highestOverallRank <= 3 ? 1 : 0,
          _rank_no1: rankHistory?.highestOverallRank !== null && rankHistory!.highestOverallRank <= 1 ? 1 : 0,
          _rank_days_at_1: rankHistory?.daysAtNumber1 || 0,
        }} rankHistory={rankHistory || undefined} />
      </motion.div>

      {/* Best Performances */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <PlayerBestPerformances battingRecords={battingRecords} bowlingRecords={bowlingRecords} />
      </motion.div>

      {/* Batting Position Impact - full width */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="lg:col-span-2">
        <PlayerPositionChart data={positions} />
      </motion.div>

      {/* Phase Strike Rate */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <PlayerPhaseStrikeRate data={phases} />
      </motion.div>

      {/* Form Analysis */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <FormAnalysisChart data={formData} stats={formStats} type="batting" />
      </motion.div>

      {/* Opponent Breakdown - full width */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
        <OpponentBreakdown playerId={playerId} />
      </motion.div>

      {/* Performance Trends - full width */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2">
        <PlayerPerformanceChart playerId={playerId} playerName={playerName} />
      </motion.div>
    </div>
  );
};
