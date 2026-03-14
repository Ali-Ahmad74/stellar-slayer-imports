import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePlayerAttendance(playerId: number | null | undefined) {
  return useQuery({
    queryKey: ["player-attendance", playerId],
    queryFn: async () => {
      if (!playerId) return { attended: 0, totalMatches: 0, percentage: 0 };

      const [{ count: attendedCount }, { count: totalCount }] = await Promise.all([
        supabase
          .from("match_attendance")
          .select("*", { count: "exact", head: true })
          .eq("player_id", playerId)
          .eq("attended", true),
        supabase
          .from("matches")
          .select("*", { count: "exact", head: true }),
      ]);

      const attended = attendedCount || 0;
      const totalMatches = totalCount || 0;
      const percentage = totalMatches > 0 ? Math.round((attended / totalMatches) * 100) : 0;

      return { attended, totalMatches, percentage };
    },
    enabled: !!playerId,
  });
}
