import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AchievementBadge } from "./AchievementBadge";
import { 
  getUnlockedAchievements, 
  getNextAchievements, 
  PlayerStats,
  Achievement,
  TIER_LABEL
} from "@/lib/achievements";
import { Trophy, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RankHistoryData {
  highestOverallRank: number | null;
  daysAtNumber1: number;
  bestSeason: string | null;
  highestBattingRank: number | null;
  highestBowlingRank: number | null;
  currentStreak: number;
}

interface PlayerAchievementsProps {
  stats: PlayerStats;
  compact?: boolean;
  rankHistory?: RankHistoryData;
}

export function PlayerAchievements({ stats, compact = false }: PlayerAchievementsProps) {
  const unlocked = getUnlockedAchievements(stats);
  const upcoming = getNextAchievements(stats, 4);

  if (compact) {
    return (
      <div className="flex flex-wrap gap-3">
        {unlocked.slice(0, 6).map((ach) => (
          <AchievementBadge key={ach.id} achievement={ach} size="sm" />
        ))}
        {unlocked.length > 6 && (
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-muted text-sm font-bold">
            +{unlocked.length - 6}
          </div>
        )}
      </div>
    );
  }

  // Group by category
  const grouped = unlocked.reduce<Record<string, Achievement[]>>((acc, ach) => {
    if (!acc[ach.category]) acc[ach.category] = [];
    acc[ach.category].push(ach);
    return acc;
  }, {});

  const categoryIcons: Record<string, string> = {
    batting: "🏏",
    bowling: "🎯",
    fielding: "🧤",
    milestone: "🏅",
  };

  const categoryLabels: Record<string, string> = {
    batting: "Batting Achievements",
    bowling: "Bowling Achievements",
    fielding: "Fielding Achievements",
    milestone: "Career Milestones",
  };

  // Count by tier
  const tierCounts = unlocked.reduce<Record<string, number>>((acc, ach) => {
    acc[ach.tier] = (acc[ach.tier] || 0) + 1;
    return acc;
  }, {});

  return (
    <Card variant="elevated">
      <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-xl">
        <CardTitle className="flex items-center gap-2 text-lg font-display">
          <Trophy className="w-6 h-6" />
          Achievements
          <span className="ml-auto flex items-center gap-2">
            {tierCounts.platinum && (
              <Badge className="bg-cyan-500/30 text-white border-cyan-400/50 text-xs">{tierCounts.platinum} 💎</Badge>
            )}
            {tierCounts.gold && (
              <Badge className="bg-yellow-500/30 text-white border-yellow-400/50 text-xs">{tierCounts.gold} 🥇</Badge>
            )}
            <Badge className="bg-white/20 text-white border-white/30 text-xs font-bold">
              {unlocked.length} Unlocked
            </Badge>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-8">
        {/* Unlocked badges grouped by category */}
        {Object.entries(grouped).map(([category, achievements]) => (
          <div key={category}>
            <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="text-lg">{categoryIcons[category] || "🏆"}</span>
              {categoryLabels[category] || category}
              <span className="text-xs text-muted-foreground font-normal ml-1">({achievements.length})</span>
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {achievements.map((ach, idx) => (
                <motion.div
                  key={ach.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: idx * 0.04, type: "spring", stiffness: 200 }}
                >
                  <AchievementBadge achievement={ach} size="md" />
                </motion.div>
              ))}
            </div>
          </div>
        ))}

        {unlocked.length === 0 && (
          <div className="text-center py-8">
            <Award className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg font-semibold text-muted-foreground mb-1">No Achievements Yet</p>
            <p className="text-sm text-muted-foreground">Keep playing to unlock your first achievement!</p>
          </div>
        )}

        {/* Upcoming - progress bars */}
        {upcoming.length > 0 && (
          <div className="pt-6 border-t-2 border-border">
            <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="text-lg">🎯</span>
              Next Achievements
            </h4>
            <div className="grid gap-4">
              {upcoming.map(({ achievement, progress }) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 border border-border"
                >
                  <AchievementBadge achievement={achievement} unlocked={false} size="sm" showTooltip={false} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold truncate">{achievement.name}</p>
                      <span className="text-xs font-bold text-primary ml-2">{Math.round(progress)}%</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-2 leading-relaxed">{achievement.description}</p>
                    <Progress value={progress} className="h-2" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
