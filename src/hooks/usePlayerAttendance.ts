import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePlayerAttendance(playerId: number | null | undefined) {
  return useQuery({
    queryKey: ["player-attendance", playerId],
    queryFn: async () => {
      if (!playerId) return { attended: 0, totalMatches: 0, percentage: 0 };

      // Auto-calculate: player attended if they have ANY performance entry (batting/bowling/fielding)
      const [{ data: batMatches }, { data: bowlMatches }, { data: fieldMatches }, { count: totalCount }] = await Promise.all([
        supabase
          .from("batting_inputs")
          .select("match_id")
          .eq("player_id", playerId),
        supabase
          .from("bowling_inputs")
          .select("match_id")
          .eq("player_id", playerId),
        supabase
          .from("fielding_inputs")
          .select("match_id")
          .eq("player_id", playerId),
        supabase
          .from("matches")
          .select("*", { count: "exact", head: true }),
      ]);

      // Unique match IDs where player had any input = attended
      const matchIds = new Set<number>();
      for (const r of batMatches || []) matchIds.add(r.match_id);
      for (const r of bowlMatches || []) matchIds.add(r.match_id);
      for (const r of fieldMatches || []) matchIds.add(r.match_id);

      const attended = matchIds.size;
      const totalMatches = totalCount || 0;
      const percentage = totalMatches > 0 ? Math.round((attended / totalMatches) * 100) : 0;

      return { attended, totalMatches, percentage };
    },
    enabled: !!playerId,
  });
}
