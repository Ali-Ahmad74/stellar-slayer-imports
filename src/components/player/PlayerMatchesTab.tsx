import { motion } from 'framer-motion';
import { PlayerMatchLog } from '@/components/PlayerMatchLog';

interface PlayerMatchesTabProps {
  battingRecords: any[];
  bowlingRecords: any[];
}

export const PlayerMatchesTab = ({ battingRecords, bowlingRecords }: PlayerMatchesTabProps) => {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <PlayerMatchLog battingRecords={battingRecords} bowlingRecords={bowlingRecords} />
    </motion.div>
  );
};
