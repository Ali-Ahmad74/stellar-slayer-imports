/**
 * Achievements & Badges system for cricket players
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "batting" | "bowling" | "fielding" | "milestone" | "ranking";
  tier: "bronze" | "silver" | "gold" | "platinum";
  requirement: number;
  stat: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  // ========== BATTING ==========
  { id: "first_30", name: "Solid Start", description: "Score 30+ in an innings", icon: "🎯", category: "batting", tier: "bronze", requirement: 1, stat: "thirties" },
  { id: "first_50", name: "Half Century", description: "Score your first 50", icon: "⭐", category: "batting", tier: "silver", requirement: 1, stat: "fifties" },
  { id: "five_50s", name: "Consistent Performer", description: "Score 5 half-centuries", icon: "🌟", category: "batting", tier: "gold", requirement: 5, stat: "fifties" },
  { id: "ten_50s", name: "Fifty Machine", description: "Score 10 half-centuries", icon: "💫", category: "batting", tier: "platinum", requirement: 10, stat: "fifties" },
  { id: "first_100", name: "Century Maker", description: "Score your first 100", icon: "💯", category: "batting", tier: "gold", requirement: 1, stat: "hundreds" },
  { id: "three_100s", name: "Century Machine", description: "Score 3 centuries", icon: "👑", category: "batting", tier: "platinum", requirement: 3, stat: "hundreds" },
  { id: "run_250", name: "Rising Star", description: "Score 250 career runs", icon: "🌱", category: "batting", tier: "bronze", requirement: 250, stat: "total_runs" },
  { id: "run_500", name: "Run Machine", description: "Score 500 career runs", icon: "🔥", category: "batting", tier: "silver", requirement: 500, stat: "total_runs" },
  { id: "run_1000", name: "Run Legend", description: "Score 1000 career runs", icon: "👑", category: "batting", tier: "gold", requirement: 1000, stat: "total_runs" },
  { id: "run_2000", name: "Run Emperor", description: "Score 2000 career runs", icon: "🏛️", category: "batting", tier: "platinum", requirement: 2000, stat: "total_runs" },
  { id: "boundary_25", name: "Boundary Finder", description: "Hit 25 fours", icon: "4️⃣", category: "batting", tier: "bronze", requirement: 25, stat: "fours" },
  { id: "boundary_50", name: "Boundary Hunter", description: "Hit 50 fours", icon: "4️⃣", category: "batting", tier: "silver", requirement: 50, stat: "fours" },
  { id: "boundary_100", name: "Boundary King", description: "Hit 100 fours", icon: "4️⃣", category: "batting", tier: "gold", requirement: 100, stat: "fours" },
  { id: "six_10", name: "Six Hitter", description: "Hit 10 sixes", icon: "6️⃣", category: "batting", tier: "bronze", requirement: 10, stat: "sixes" },
  { id: "six_25", name: "Six Machine", description: "Hit 25 sixes", icon: "6️⃣", category: "batting", tier: "silver", requirement: 25, stat: "sixes" },
  { id: "six_50", name: "Maximum King", description: "Hit 50 sixes", icon: "💥", category: "batting", tier: "gold", requirement: 50, stat: "sixes" },

  // ========== BOWLING ==========
  { id: "first_3fer", name: "Wicket Taker", description: "Take 3 wickets in an innings", icon: "🎳", category: "bowling", tier: "bronze", requirement: 1, stat: "three_fers" },
  { id: "five_3fers", name: "3-For Specialist", description: "Take 5 three-wicket hauls", icon: "🎳", category: "bowling", tier: "silver", requirement: 5, stat: "three_fers" },
  { id: "first_5fer", name: "Five-for Fame", description: "Take 5 wickets in an innings", icon: "🔥", category: "bowling", tier: "gold", requirement: 1, stat: "five_fers" },
  { id: "first_hatrick", name: "Hat-Trick Hero", description: "Take a hat-trick", icon: "🎩", category: "bowling", tier: "platinum", requirement: 1, stat: "hat_tricks" },
  { id: "wicket_10", name: "Wicket Seeker", description: "Take 10 career wickets", icon: "⚡", category: "bowling", tier: "bronze", requirement: 10, stat: "wickets" },
  { id: "wicket_25", name: "Wicket Hunter", description: "Take 25 career wickets", icon: "⚡", category: "bowling", tier: "silver", requirement: 25, stat: "wickets" },
  { id: "wicket_50", name: "Wicket Master", description: "Take 50 career wickets", icon: "🏆", category: "bowling", tier: "gold", requirement: 50, stat: "wickets" },
  { id: "wicket_100", name: "Century Wickets", description: "Take 100 career wickets", icon: "👑", category: "bowling", tier: "platinum", requirement: 100, stat: "wickets" },
  { id: "maiden_5", name: "Maiden Master", description: "Bowl 5 maiden overs", icon: "🔒", category: "bowling", tier: "silver", requirement: 5, stat: "maidens" },
  { id: "maiden_15", name: "Maiden King", description: "Bowl 15 maiden overs", icon: "🔒", category: "bowling", tier: "gold", requirement: 15, stat: "maidens" },
  { id: "dot_50", name: "Dot Ball Artist", description: "Bowl 50 dot balls", icon: "⏹️", category: "bowling", tier: "bronze", requirement: 50, stat: "dot_balls" },
  { id: "dot_100", name: "Dot Ball King", description: "Bowl 100 dot balls", icon: "⏹️", category: "bowling", tier: "silver", requirement: 100, stat: "dot_balls" },
  { id: "dot_250", name: "Dot Ball Legend", description: "Bowl 250 dot balls", icon: "🛑", category: "bowling", tier: "gold", requirement: 250, stat: "dot_balls" },

  // ========== FIELDING ==========
  { id: "catch_5", name: "Good Hands", description: "Take 5 catches", icon: "🧤", category: "fielding", tier: "bronze", requirement: 5, stat: "catches" },
  { id: "catch_10", name: "Safe Hands", description: "Take 10 catches", icon: "🧤", category: "fielding", tier: "bronze", requirement: 10, stat: "catches" },
  { id: "catch_25", name: "Catching Machine", description: "Take 25 catches", icon: "✋", category: "fielding", tier: "silver", requirement: 25, stat: "catches" },
  { id: "catch_50", name: "Catching Legend", description: "Take 50 catches", icon: "🏆", category: "fielding", tier: "gold", requirement: 50, stat: "catches" },
  { id: "runout_3", name: "Direct Hit", description: "Effect 3 run outs", icon: "🎯", category: "fielding", tier: "bronze", requirement: 3, stat: "runouts" },
  { id: "runout_10", name: "Runout Specialist", description: "Effect 10 run outs", icon: "🎯", category: "fielding", tier: "silver", requirement: 10, stat: "runouts" },
  { id: "stumping_3", name: "Keeper Star", description: "Effect 3 stumpings", icon: "⚡", category: "fielding", tier: "bronze", requirement: 3, stat: "stumpings" },
  { id: "stumping_10", name: "Stumping King", description: "Effect 10 stumpings", icon: "⚡", category: "fielding", tier: "silver", requirement: 10, stat: "stumpings" },

  // ========== CAREER MILESTONES ==========
  { id: "debut", name: "Debut", description: "Play your first match", icon: "🏏", category: "milestone", tier: "bronze", requirement: 1, stat: "matches" },
  { id: "matches_10", name: "Getting Started", description: "Play 10 matches", icon: "📅", category: "milestone", tier: "bronze", requirement: 10, stat: "matches" },
  { id: "matches_25", name: "Team Regular", description: "Play 25 matches", icon: "📅", category: "milestone", tier: "silver", requirement: 25, stat: "matches" },
  { id: "matches_50", name: "Veteran", description: "Play 50 matches", icon: "🎖️", category: "milestone", tier: "gold", requirement: 50, stat: "matches" },
  { id: "matches_100", name: "Centurion", description: "Play 100 matches", icon: "🏟️", category: "milestone", tier: "platinum", requirement: 100, stat: "matches" },

  // ========== RANKING MILESTONES ==========
  { id: "rank_top5", name: "Top 5", description: "Reach top 5 in overall ranking", icon: "📊", category: "ranking", tier: "bronze", requirement: 1, stat: "_rank_top5" },
  { id: "rank_top3", name: "Podium Finisher", description: "Reach top 3 in overall ranking", icon: "🥉", category: "ranking", tier: "silver", requirement: 1, stat: "_rank_top3" },
  { id: "rank_no1", name: "Number One", description: "Reach #1 in overall ranking", icon: "🥇", category: "ranking", tier: "gold", requirement: 1, stat: "_rank_no1" },
  { id: "rank_7days", name: "Dominant Force", description: "Hold #1 for 7+ days", icon: "👑", category: "ranking", tier: "platinum", requirement: 7, stat: "_rank_days_at_1" },
];

export interface PlayerStats {
  matches?: number;
  total_runs?: number;
  total_balls?: number;
  fours?: number;
  sixes?: number;
  thirties?: number;
  fifties?: number;
  hundreds?: number;
  wickets?: number;
  maidens?: number;
  three_fers?: number;
  five_fers?: number;
  hat_tricks?: number;
  dot_balls?: number;
  catches?: number;
  runouts?: number;
  stumpings?: number;
  // Ranking stats (injected externally)
  _rank_top5?: number;
  _rank_top3?: number;
  _rank_no1?: number;
  _rank_days_at_1?: number;
}

export function getUnlockedAchievements(stats: PlayerStats): Achievement[] {
  return ACHIEVEMENTS.filter((achievement) => {
    const statValue = stats[achievement.stat as keyof PlayerStats] ?? 0;
    return statValue >= achievement.requirement;
  });
}

export function getNextAchievements(stats: PlayerStats, limit = 3): { achievement: Achievement; progress: number }[] {
  const locked = ACHIEVEMENTS.filter((achievement) => {
    const statValue = stats[achievement.stat as keyof PlayerStats] ?? 0;
    return statValue < achievement.requirement;
  });

  return locked
    .map((achievement) => {
      const statValue = stats[achievement.stat as keyof PlayerStats] ?? 0;
      const progress = Math.min((statValue / achievement.requirement) * 100, 99);
      return { achievement, progress };
    })
    .sort((a, b) => b.progress - a.progress)
    .slice(0, limit);
}

export const TIER_COLORS = {
  bronze: "from-amber-600 to-amber-800",
  silver: "from-slate-300 to-slate-500",
  gold: "from-yellow-400 to-amber-500",
  platinum: "from-cyan-300 to-blue-500",
} as const;

export const TIER_BG = {
  bronze: "bg-amber-900/20 border-amber-700/50",
  silver: "bg-slate-600/20 border-slate-400/50",
  gold: "bg-yellow-900/20 border-yellow-600/50",
  platinum: "bg-cyan-900/20 border-cyan-500/50",
} as const;

export const TIER_LABEL = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
} as const;
