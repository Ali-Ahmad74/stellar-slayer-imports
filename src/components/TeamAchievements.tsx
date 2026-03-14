import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Users, Flame, Target, Loader2 } from "lucide-react";

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
  [id: number]: string;
}

interface TeamAchievementsProps {
  players: { id: number; name: string }[];
}

interface TeamAchievement {
  id: string;
  icon: string;
  name: string;
  description: string;
  value: string | number;
  unlocked: boolean;
  tier: "bronze" | "silver" | "gold" | "platinum";
}

const TIER_STYLES = {
  bronze: "bg-amber-900/20 border-amber-700/50 text-amber-600",
  silver: "bg-slate-600/20 border-slate-400/50 text-slate-400",
  gold: "bg-yellow-900/20 border-yellow-600/50 text-yellow-500",
  platinum: "bg-cyan-900/20 border-cyan-500/50 text-cyan-400",
};

export function TeamAchievements({ players }: TeamAchievementsProps) {
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [matchCount, setMatchCount] = useState(0);
  const [teamStats, setTeamStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const playerMap = useMemo(() => {
    const map: PlayerMap = {};
    players.forEach((p) => { map[p.id] = p.name; });
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

      // Aggregate team stats
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

  // Build team achievements
  const achievements = useMemo<TeamAchievement[]>(() => {
    if (!teamStats) return [];
    return [
      { id: "team_1000_runs", icon: "🏏", name: "1000 Club", description: "Team scored 1000+ runs", value: teamStats.total_runs, unlocked: teamStats.total_runs >= 1000, tier: "silver" as const },
      { id: "team_5000_runs", icon: "👑", name: "5000 Run Machine", description: "Team scored 5000+ runs", value: teamStats.total_runs, unlocked: teamStats.total_runs >= 5000, tier: "platinum" as const },
      { id: "team_100_wickets", icon: "🎯", name: "Century of Wickets", description: "Team took 100+ wickets", value: teamStats.wickets, unlocked: teamStats.wickets >= 100, tier: "gold" as const },
      { id: "team_50_catches", icon: "🧤", name: "Safe Squad", description: "Team took 50+ catches", value: teamStats.catches, unlocked: teamStats.catches >= 50, tier: "silver" as const },
      { id: "team_100_sixes", icon: "6️⃣", name: "Six Storm", description: "Team hit 100+ sixes", value: teamStats.sixes, unlocked: teamStats.sixes >= 100, tier: "gold" as const },
      { id: "team_50_matches", icon: "📅", name: "Battle Tested", description: "Team played 50+ matches", value: matchCount, unlocked: matchCount >= 50, tier: "gold" as const },
      { id: "team_10_fifties", icon: "⭐", name: "Fifty Factory", description: "10+ individual fifties", value: teamStats.fifties, unlocked: teamStats.fifties >= 10, tier: "silver" as const },
      { id: "team_500_dots", icon: "⏹️", name: "Dot Ball Army", description: "500+ dot balls bowled", value: teamStats.dot_balls, unlocked: teamStats.dot_balls >= 500, tier: "gold" as const },
    ];
  }, [teamStats, matchCount]);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

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
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {achievements.map((ach, idx) => (
              <motion.div
                key={ach.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.05, type: "spring", stiffness: 200 }}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                  ach.unlocked ? TIER_STYLES[ach.tier] : "bg-muted/20 border-muted opacity-40 grayscale"
                }`}
              >
                <span className="text-3xl">{ach.icon}</span>
                <span className="text-sm font-bold text-center leading-tight">{ach.name}</span>
                <span className="text-[11px] text-muted-foreground text-center leading-relaxed">{ach.description}</span>
                {ach.unlocked && (
                  <Badge variant="outline" className="text-[10px] mt-1">
                    {ach.value}
                  </Badge>
                )}
              </motion.div>
            ))}
          </div>
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
                const p1Name = playerMap[p.player1_id] || `Player ${p.player1_id}`;
                const p2Name = playerMap[p.player2_id] || `Player ${p.player2_id}`;
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
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {p1Name} & {p2Name}
                      </p>
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
