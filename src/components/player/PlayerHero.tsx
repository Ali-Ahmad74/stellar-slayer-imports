import { motion } from 'framer-motion';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { PlayerFormBadge } from '@/components/PlayerFormBadge';
import type { PlayerRole } from '@/types/cricket';

interface PlayerHeroProps {
  player: {
    name: string;
    role: PlayerRole;
    photo_url: string | null;
    nationality: string | null;
    debut_date: string | null;
    jersey_number: number | null;
  };
  formStats: { totalMatches: number; formTrend: number; consistency: number };
}

export const PlayerHero = ({ player, formStats }: PlayerHeroProps) => {
  const careerStart = player.debut_date
    ? new Date(player.debut_date).getFullYear()
    : null;
  const currentYear = new Date().getFullYear();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative gradient-header rounded-2xl overflow-hidden shadow-lg"
    >
      <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-5 p-6 sm:p-8 pb-4">
        {/* Photo */}
        <PlayerAvatar name={player.name} photoUrl={player.photo_url} size="xl" />

        {/* Info overlay */}
        <div className="text-center sm:text-left flex-1 pb-2">
          <div className="flex items-center gap-3 justify-center sm:justify-start mb-1">
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
              {player.name}
            </h1>
            {player.jersey_number != null && (
              <span className="bg-white/20 backdrop-blur-sm text-white font-display text-lg font-bold px-2.5 py-0.5 rounded-lg">
                #{player.jersey_number}
              </span>
            )}
          </div>

          <p className="text-white/80 text-sm sm:text-base">
            {player.nationality || 'Unknown'} <span className="mx-1.5 text-white/40">|</span> {player.role}
          </p>

          {careerStart && (
            <p className="text-white/60 text-xs sm:text-sm mt-1 uppercase tracking-wider">
              Career: {careerStart} – {String(currentYear)}
            </p>
          )}

          {formStats.totalMatches >= 3 && (
            <div className="mt-2">
              <PlayerFormBadge formTrend={formStats.formTrend} consistency={formStats.consistency} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
