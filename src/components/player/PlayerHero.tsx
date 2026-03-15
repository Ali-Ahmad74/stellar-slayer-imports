import { motion } from 'framer-motion';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { PlayerFormBadge } from '@/components/PlayerFormBadge';
import { RoleBadge } from '@/components/RoleBadge';
import type { PlayerRole } from '@/types/cricket';

interface PlayerHeroProps {
  player: {
    name: string;
    role: PlayerRole;
    photo_url: string | null;
    nationality: string | null;
    debut_date: string | null;
    jersey_number: number | null;
    batting_style: string | null;
    bowling_style: string | null;
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
      className="relative overflow-hidden border border-border rounded-xl bg-card"
    >
      {/* Top gradient bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-primary via-accent to-primary" />

      <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-6">
        {/* Photo */}
        <div className="flex-shrink-0 flex justify-center sm:justify-start">
          <PlayerAvatar name={player.name} photoUrl={player.photo_url} size="xl" />
        </div>

        {/* Info */}
        <div className="flex-1 text-center sm:text-left min-w-0">
          <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight truncate">
              {player.name}
            </h1>
            {player.jersey_number != null && (
              <span className="bg-primary/10 text-primary font-display text-sm font-bold px-2 py-0.5 rounded-md">
                #{player.jersey_number}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 justify-center sm:justify-start mt-1.5 flex-wrap">
            {player.nationality && (
              <span className="text-sm text-muted-foreground">{player.nationality}</span>
            )}
            {player.nationality && <span className="text-muted-foreground/40">•</span>}
            <RoleBadge role={player.role} />
          </div>

          {/* Quick info row */}
          <div className="flex items-center gap-3 justify-center sm:justify-start mt-3 text-xs text-muted-foreground flex-wrap">
            {player.batting_style && (
              <span className="bg-muted px-2 py-1 rounded-md">{player.batting_style}</span>
            )}
            {player.bowling_style && (
              <span className="bg-muted px-2 py-1 rounded-md">{player.bowling_style}</span>
            )}
            {careerStart && (
              <span className="bg-muted px-2 py-1 rounded-md">
                {careerStart} – {currentYear}
              </span>
            )}
          </div>

          {formStats.totalMatches >= 3 && (
            <div className="mt-3">
              <PlayerFormBadge formTrend={formStats.formTrend} consistency={formStats.consistency} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
