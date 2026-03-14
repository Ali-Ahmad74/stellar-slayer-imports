import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Users, Target, Loader2, Flame } from "lucide-react";
import { PlayerAvatar } from "@/components/PlayerAvatar";

interface Partnership {
  id: number;
  match_id: number;
  wicket_number: number;
  player1_id: number;
  player2_id: number;
  runs: number;
  balls: number;
}

interface PlayerMap {
  [id: number]: { name: string; photo_url: string | null };
}

interface TeamAchievementsProps {
  players: { id: number; name: string; photo_url?: string | null }[];
}

interface TeamAchievement {
  id: string;
  icon: string;
  name: string;
  description: string;
  value: number;
  target: number;
  unlocked: boolean;
  tier: "bronze" | "silver" | "gold" | "platinum";
  category: "batting" | "bowling" | "fielding" | "team";
}

const TIER_STYLES = {
  bronze: "bg-amber-900/20 border-amber-700/50 text-amber-600",
  silver: "bg-slate-600/20 border-slate-400/50 text-slate-400",
  gold: "bg-yellow-900/20 border-yellow-600/50 text-yellow-500",
  platinum: "bg-cyan-900/20 border-cyan-500/50 text-cyan-400",
};

const CATEGORY_LABELS: Record<string, string> = {
  batting: "🏏 Batting",
  bowling: "🎯 Bowling",
  fielding: "🧤 Fielding",
  team: "👥 Team",
};

export function TeamAchievements({ players }: TeamAchievementsProps) {
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [matchCount, setMatchCount] = useState(0);
  const [teamStats, setTeamStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const playerMap = useMemo(() => {
    const map: PlayerMap = {};
    players.forEach((p) => { map[p.id] = { name: p.name, photo_url: p.photo_url || null }; });
    return map;
  }, [players]);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: partData }, { count }, { data: statsData }] = await Promise.all([
        supabase.from("match_partnerships").select("*").order("runs", { ascending: false }),
        supabase.from("matches").select("*", { count: "exact", head: true }),
        supabase.from("player_stats").select("*"),
      ]);

      setPartnerships(partData || []);
      setMatchCount(count || 0);

      if (statsData && statsData.length > 0) {
        const agg = statsData.reduce((acc: any, s: any) => ({
          total_runs: (acc.total_runs || 0) + (s.total_runs || 0),
          wickets: (acc.wickets || 0) + (s.wickets || 0),
          catches: (acc.catches || 0) + (s.catches || 0),
          sixes: (acc.sixes || 0) + (s.sixes || 0),
          fours: (acc.fours || 0) + (s.fours || 0),
          fifties: (acc.fifties || 0) + (s.fifties || 0),
          hundreds: (acc.hundreds || 0) + (s.hundreds || 0),
          dot_balls: (acc.dot_balls || 0) + (s.dot_balls || 0),
          maidens: (acc.maidens || 0) + (s.maidens || 0),
          three_fers: (acc.three_fers || 0) + (s.three_fers || 0),
          five_fers: (acc.five_fers || 0) + (s.five_fers || 0),
          runouts: (acc.runouts || 0) + (s.runouts || 0),
          stumpings: (acc.stumpings || 0) + (s.stumpings || 0),
          total_balls: (acc.total_balls || 0) + (s.total_balls || 0),
          bowling_balls: (acc.bowling_balls || 0) + (s.bowling_balls || 0),
          runs_conceded: (acc.runs_conceded || 0) + (s.runs_conceded || 0),
          thirties: (acc.thirties || 0) + (s.thirties || 0),
          wides: (acc.wides || 0) + (s.wides || 0),
          no_balls: (acc.no_balls || 0) + (s.no_balls || 0),
          dropped_catches: (acc.dropped_catches || 0) + (s.dropped_catches || 0),
        }), {});
        setTeamStats(agg);
      }

      setLoading(false);
    };
    fetchData();
  }, []);

  // Highest partnerships by wicket
  const highestByWicket = useMemo(() => {
    const map = new Map<number, Partnership>();
    partnerships.forEach((p) => {
      const existing = map.get(p.wicket_number);
      if (!existing || p.runs > existing.runs) {
        map.set(p.wicket_number, p);
      }
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [partnerships]);

  const highestPartnership = partnerships.length > 0 
    ? partnerships.reduce((max, p) => p.runs > max.runs ? p : max, partnerships[0])
    : null;

  // Build comprehensive team achievements
  const achievements = useMemo<TeamAchievement[]>(() => {
    if (!teamStats) return [];
    const s = teamStats;
    return [
      // Batting achievements
      { id: "bat_500_runs", icon: "🏏", name: "500 Run Club", description: "Team scored 500+ runs collectively", value: s.total_runs, target: 500, unlocked: s.total_runs >= 500, tier: "bronze" as const, category: "batting" as const },
      { id: "bat_1000_runs", icon: "🏏", name: "1000 Run Machine", description: "Team scored 1000+ runs", value: s.total_runs, target: 1000, unlocked: s.total_runs >= 1000, tier: "silver" as const, category: "batting" as const },
      { id: "bat_2500_runs", icon: "💎", name: "Run Dynasty", description: "Team scored 2500+ runs", value: s.total_runs, target: 2500, unlocked: s.total_runs >= 2500, tier: "gold" as const, category: "batting" as const },
      { id: "bat_5000_runs", icon: "👑", name: "5000 Run Empire", description: "Team scored 5000+ runs", value: s.total_runs, target: 5000, unlocked: s.total_runs >= 5000, tier: "platinum" as const, category: "batting" as const },
      { id: "bat_50_fours", icon: "4️⃣", name: "Boundary Blasters", description: "50+ fours hit", value: s.fours, target: 50, unlocked: s.fours >= 50, tier: "bronze" as const, category: "batting" as const },
      { id: "bat_200_fours", icon: "4️⃣", name: "Four Machine", description: "200+ fours hit", value: s.fours, target: 200, unlocked: s.fours >= 200, tier: "gold" as const, category: "batting" as const },
      { id: "bat_50_sixes", icon: "6️⃣", name: "Six Hitters", description: "50+ sixes hit", value: s.sixes, target: 50, unlocked: s.sixes >= 50, tier: "silver" as const, category: "batting" as const },
      { id: "bat_100_sixes", icon: "6️⃣", name: "Six Storm", description: "100+ sixes hit", value: s.sixes, target: 100, unlocked: s.sixes >= 100, tier: "gold" as const, category: "batting" as const },
      { id: "bat_250_sixes", icon: "💥", name: "Maximum Kings", description: "250+ sixes hit", value: s.sixes, target: 250, unlocked: s.sixes >= 250, tier: "platinum" as const, category: "batting" as const },
      { id: "bat_10_fifties", icon: "⭐", name: "Fifty Factory", description: "10+ individual fifties", value: s.fifties, target: 10, unlocked: s.fifties >= 10, tier: "silver" as const, category: "batting" as const },
      { id: "bat_25_fifties", icon: "🌟", name: "Half-Century Haven", description: "25+ individual fifties", value: s.fifties, target: 25, unlocked: s.fifties >= 25, tier: "gold" as const, category: "batting" as const },
      { id: "bat_5_hundreds", icon: "💯", name: "Century Makers", description: "5+ individual centuries", value: s.hundreds, target: 5, unlocked: s.hundreds >= 5, tier: "gold" as const, category: "batting" as const },
      { id: "bat_10_hundreds", icon: "🔥", name: "Century Legion", description: "10+ individual centuries", value: s.hundreds, target: 10, unlocked: s.hundreds >= 10, tier: "platinum" as const, category: "batting" as const },
      { id: "bat_5_thirties", icon: "3️⃣", name: "Thirty Tally", description: "5+ individual thirties", value: s.thirties, target: 5, unlocked: s.thirties >= 5, tier: "bronze" as const, category: "batting" as const },

      // Bowling achievements
      { id: "bowl_50_wickets", icon: "🎯", name: "Wicket Hunters", description: "50+ wickets taken", value: s.wickets, target: 50, unlocked: s.wickets >= 50, tier: "bronze" as const, category: "bowling" as const },
      { id: "bowl_100_wickets", icon: "🎯", name: "Century of Wickets", description: "100+ wickets taken", value: s.wickets, target: 100, unlocked: s.wickets >= 100, tier: "silver" as const, category: "bowling" as const },
      { id: "bowl_250_wickets", icon: "🔥", name: "Wicket Machine", description: "250+ wickets taken", value: s.wickets, target: 250, unlocked: s.wickets >= 250, tier: "gold" as const, category: "bowling" as const },
      { id: "bowl_500_wickets", icon: "👑", name: "500 Wicket Club", description: "500+ wickets taken", value: s.wickets, target: 500, unlocked: s.wickets >= 500, tier: "platinum" as const, category: "bowling" as const },
      { id: "bowl_10_maidens", icon: "🔒", name: "Maiden Makers", description: "10+ maiden overs", value: s.maidens, target: 10, unlocked: s.maidens >= 10, tier: "silver" as const, category: "bowling" as const },
      { id: "bowl_25_maidens", icon: "🔒", name: "Maiden Masters", description: "25+ maiden overs", value: s.maidens, target: 25, unlocked: s.maidens >= 25, tier: "gold" as const, category: "bowling" as const },
      { id: "bowl_500_dots", icon: "⏹️", name: "Dot Ball Army", description: "500+ dot balls bowled", value: s.dot_balls, target: 500, unlocked: s.dot_balls >= 500, tier: "gold" as const, category: "bowling" as const },
      { id: "bowl_1000_dots", icon: "⏹️", name: "Dot Ball Empire", description: "1000+ dot balls", value: s.dot_balls, target: 1000, unlocked: s.dot_balls >= 1000, tier: "platinum" as const, category: "bowling" as const },
      { id: "bowl_5_threefers", icon: "🎳", name: "3-For Brigade", description: "5+ three-wicket hauls", value: s.three_fers, target: 5, unlocked: s.three_fers >= 5, tier: "silver" as const, category: "bowling" as const },
      { id: "bowl_3_fifers", icon: "🎳", name: "5-For Club", description: "3+ five-wicket hauls", value: s.five_fers, target: 3, unlocked: s.five_fers >= 3, tier: "gold" as const, category: "bowling" as const },

      // Fielding achievements
      { id: "field_25_catches", icon: "🧤", name: "Safe Hands", description: "25+ catches taken", value: s.catches, target: 25, unlocked: s.catches >= 25, tier: "bronze" as const, category: "fielding" as const },
      { id: "field_50_catches", icon: "🧤", name: "Catching Squad", description: "50+ catches taken", value: s.catches, target: 50, unlocked: s.catches >= 50, tier: "silver" as const, category: "fielding" as const },
      { id: "field_100_catches", icon: "🧤", name: "100 Catch Club", description: "100+ catches taken", value: s.catches, target: 100, unlocked: s.catches >= 100, tier: "gold" as const, category: "fielding" as const },
      { id: "field_10_runouts", icon: "🏃", name: "Run Out Specialists", description: "10+ run outs", value: s.runouts, target: 10, unlocked: s.runouts >= 10, tier: "silver" as const, category: "fielding" as const },
      { id: "field_25_runouts", icon: "🏃", name: "Run Out Kings", description: "25+ run outs", value: s.runouts, target: 25, unlocked: s.runouts >= 25, tier: "gold" as const, category: "fielding" as const },
      { id: "field_5_stumpings", icon: "🪵", name: "Stumping Stars", description: "5+ stumpings", value: s.stumpings, target: 5, unlocked: s.stumpings >= 5, tier: "silver" as const, category: "fielding" as const },

      // Team milestones
      { id: "team_10_matches", icon: "📅", name: "Getting Started", description: "Played 10+ matches", value: matchCount, target: 10, unlocked: matchCount >= 10, tier: "bronze" as const, category: "team" as const },
      { id: "team_25_matches", icon: "📅", name: "Season Veterans", description: "Played 25+ matches", value: matchCount, target: 25, unlocked: matchCount >= 25, tier: "silver" as const, category: "team" as const },
      { id: "team_50_matches", icon: "📅", name: "Battle Tested", description: "Played 50+ matches", value: matchCount, target: 50, unlocked: matchCount >= 50, tier: "gold" as const, category: "team" as const },
      { id: "team_100_matches", icon: "🏟️", name: "Centurion Team", description: "Played 100+ matches", value: matchCount, target: 100, unlocked: matchCount >= 100, tier: "platinum" as const, category: "team" as const },
      { id: "team_100_partnership", icon: "🤝", name: "Century Partnership", description: "100+ run partnership", value: highestPartnership?.runs || 0, target: 100, unlocked: (highestPartnership?.runs || 0) >= 100, tier: "gold" as const, category: "team" as const },
      { id: "team_150_partnership", icon: "🤝", name: "Monster Partnership", description: "150+ run partnership", value: highestPartnership?.runs || 0, target: 150, unlocked: (highestPartnership?.runs || 0) >= 150, tier: "platinum" as const, category: "team" as const },
    ];
  }, [teamStats, matchCount, highestPartnership]);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  // Group by category
  const groupedAchievements = useMemo(() => {
    const groups: Record<string, TeamAchievement[]> = {};
    for (const a of achievements) {
      if (!groups[a.category]) groups[a.category] = [];
      groups[a.category].push(a);
    }
    return groups;
  }, [achievements]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Achievements */}
      <Card variant="elevated">
        <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-t-xl">
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <Trophy className="w-6 h-6" />
            Team Achievements
            <Badge className="ml-auto bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 text-xs font-bold">
              {unlockedCount}/{achievements.length} Unlocked
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-6">
          {Object.entries(groupedAchievements).map(([category, achs]) => {
            const catUnlocked = achs.filter(a => a.unlocked).length;
            return (
              <div key={category}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-foreground">{CATEGORY_LABELS[category] || category}</h3>
                  <span className="text-xs text-muted-foreground">{catUnlocked}/{achs.length}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {achs.map((ach, idx) => {
                    const progress = Math.min((ach.value / ach.target) * 100, 100);
                    return (
                      <motion.div
                        key={ach.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: idx * 0.03, type: "spring", stiffness: 200 }}
                        className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                          ach.unlocked ? TIER_STYLES[ach.tier] : "bg-muted/20 border-muted opacity-50 grayscale"
                        }`}
                      >
                        <span className="text-2xl">{ach.icon}</span>
                        <span className="text-xs font-bold text-center leading-tight">{ach.name}</span>
                        <span className="text-[10px] text-muted-foreground text-center leading-snug">{ach.description}</span>
                        {/* Progress bar */}
                        <div className="w-full h-1.5 bg-muted/40 rounded-full overflow-hidden mt-1">
                          <div 
                            className={`h-full rounded-full transition-all ${ach.unlocked ? 'bg-current' : 'bg-muted-foreground/30'}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-muted-foreground">
                          {ach.value}/{ach.target}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Highest Partnerships */}
      <Card variant="elevated">
        <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-xl">
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <Users className="w-6 h-6" />
            Highest Partnerships
            {highestPartnership && (
              <Badge className="ml-auto bg-white/20 text-white border-white/30 text-xs">
                Best: {highestPartnership.runs} runs
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {highestByWicket.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No partnership data yet. Add batting positions in performance entry to auto-calculate partnerships.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {highestByWicket.map(([wicket, p], idx) => {
                const p1 = playerMap[p.player1_id];
                const p2 = playerMap[p.player2_id];
                const p1Name = p1?.name || `Player ${p.player1_id}`;
                const p2Name = p2?.name || `Player ${p.player2_id}`;
                const isHighest = highestPartnership && p.id === highestPartnership.id;
                
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      isHighest ? "bg-amber-500/10 border-amber-500/40" : "bg-muted/30 border-border"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      wicket === 1 ? "bg-emerald-500/20 text-emerald-500" :
                      wicket <= 3 ? "bg-blue-500/20 text-blue-500" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {wicket === 1 ? "🏏" : `#${wicket}`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold truncate">
                          {wicket === 1 ? "Opening" : `${wicket}${wicket === 2 ? "nd" : wicket === 3 ? "rd" : "th"} Wicket`}
                        </p>
                        {isHighest && (
                          <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-[10px]">
                            <Flame className="w-3 h-3 mr-0.5" /> Highest
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <PlayerAvatar name={p1Name} photoUrl={p1?.photo_url || null} size="sm" />
                        <span className="text-xs text-muted-foreground">{p1Name}</span>
                        <span className="text-xs text-muted-foreground">&</span>
                        <PlayerAvatar name={p2Name} photoUrl={p2?.photo_url || null} size="sm" />
                        <span className="text-xs text-muted-foreground">{p2Name}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold font-display text-primary">{p.runs}</p>
                      <p className="text-[10px] text-muted-foreground">{p.balls} balls</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
