import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface RankHistory {
  highestOverallRank: number | null;
  daysAtNumber1: number;
  bestSeason: string | null;
  highestBattingRank: number | null;
  highestBowlingRank: number | null;
  highestFieldingRank: number | null;
  currentStreak: number;
}

export function usePlayerRankHistory(playerId: number | null | undefined) {
  return useQuery({
    queryKey: ["player-rank-history", playerId],
    queryFn: async (): Promise<RankHistory> => {
      if (!playerId) return { highestOverallRank: null, daysAtNumber1: 0, bestSeason: null, highestBattingRank: null, highestBowlingRank: null, highestFieldingRank: null, currentStreak: 0 };

      const { data: snapshots } = await supabase
        .from("rank_snapshots")
        .select("*, seasons(name)")
        .eq("player_id", playerId)
        .order("snapshot_date", { ascending: true });

      if (!snapshots || snapshots.length === 0) {
        return { highestOverallRank: null, daysAtNumber1: 0, bestSeason: null, highestBattingRank: null, highestBowlingRank: null, currentStreak: 0 };
      }

      let highestOverallRank = Infinity;
      let highestBattingRank = Infinity;
      let highestBowlingRank = Infinity;
      let daysAtNumber1 = 0;
      let bestSeasonName: string | null = null;
      let bestSeasonRank = Infinity;

      // Current streak at #1 from the end
      let currentStreak = 0;
      for (let i = snapshots.length - 1; i >= 0; i--) {
        if (snapshots[i].overall_rank === 1) currentStreak++;
        else break;
      }

      for (const snap of snapshots) {
        if (snap.overall_rank < highestOverallRank) {
          highestOverallRank = snap.overall_rank;
        }
        if (snap.batting_rank && snap.batting_rank < highestBattingRank) {
          highestBattingRank = snap.batting_rank;
        }
        if (snap.bowling_rank && snap.bowling_rank < highestBowlingRank) {
          highestBowlingRank = snap.bowling_rank;
        }
        if (snap.overall_rank === 1) daysAtNumber1++;
        
        // Find best season (lowest rank)
        const seasonName = (snap as any).seasons?.name;
        if (seasonName && snap.overall_rank < bestSeasonRank) {
          bestSeasonRank = snap.overall_rank;
          bestSeasonName = seasonName;
        }
      }

      return {
        highestOverallRank: highestOverallRank === Infinity ? null : highestOverallRank,
        daysAtNumber1,
        bestSeason: bestSeasonName,
        highestBattingRank: highestBattingRank === Infinity ? null : highestBattingRank,
        highestBowlingRank: highestBowlingRank === Infinity ? null : highestBowlingRank,
        currentStreak,
      };
    },
    enabled: !!playerId,
  });
}
