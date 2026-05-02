import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PositionStat {
  position: number | 'Unknown';
  positionLabel: string;
  totalRuns: number;
  winningRuns: number;
  innings: number;
  winningRunsPct: number;
}

export interface PhaseStat {
  bucket: string;
  range: string;
  innings: number;
  totalRuns: number;
  totalBalls: number;
  strikeRate: number;
  winningRuns: number;
  winningInnings: number;
  winningRunsPct: number;
}

export function usePlayerPositionAnalysis(playerId: number | null, selectedSeasonId: string) {
  const [positions, setPositions] = useState<PositionStat[]>([]);
  const [phases, setPhases] = useState<PhaseStat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!playerId) { setLoading(false); return; }
    setLoading(true);
    try {
      let q = supabase
        .from('batting_inputs')
        .select('runs, balls, batting_position, match_id, matches!inner(result)')
        .eq('player_id', playerId);
      if (selectedSeasonId !== 'all') {
        q = q.eq('season_id', parseInt(selectedSeasonId));
      }
      const { data } = await q;
      const rows = (data as any[]) || [];

      // Position aggregation
      const posMap = new Map<number | 'Unknown', PositionStat>();
      for (const r of rows) {
        const pos: number | 'Unknown' = r.batting_position ?? 'Unknown';
        const key = pos;
        const cur = posMap.get(key) || {
          position: pos,
          positionLabel: pos === 'Unknown' ? 'N/A' : `#${pos}`,
          totalRuns: 0, winningRuns: 0, innings: 0,
        };
        cur.totalRuns += r.runs || 0;
        cur.innings += 1;
        if (r.matches?.result === 'won') cur.winningRuns += r.runs || 0;
        posMap.set(key, cur);
      }
      const posArr = Array.from(posMap.values()).sort((a, b) => {
        if (a.position === 'Unknown') return 1;
        if (b.position === 'Unknown') return -1;
        return (a.position as number) - (b.position as number);
      }).map(p => ({
        ...p,
        winningRunsPct: p.totalRuns > 0 ? (p.winningRuns / p.totalRuns) * 100 : 0,
      }));
      setPositions(posArr);

      // Phase aggregation — only legal balls, exclude null/invalid (<=0)
      const legalRows = rows.filter(r => typeof r.balls === 'number' && Number.isFinite(r.balls) && r.balls > 0);
      const buckets = [
        { bucket: 'First 10', range: '1–10 balls', min: 1, max: 10 },
        { bucket: 'Next 20', range: '11–30 balls', min: 11, max: 30 },
        { bucket: 'Established', range: '31+ balls', min: 31, max: Infinity },
      ];
      const phaseArr: PhaseStat[] = buckets.map(b => {
        const matched = legalRows.filter(r => r.balls >= b.min && r.balls <= b.max);
        const totalRuns = matched.reduce((s, r) => s + (r.runs || 0), 0);
        const totalBalls = matched.reduce((s, r) => s + (r.balls || 0), 0);
        const winRows = matched.filter(r => r.matches?.result === 'won');
        const winningRuns = winRows.reduce((s, r) => s + (r.runs || 0), 0);
        return {
          bucket: b.bucket,
          range: b.range,
          innings: matched.length,
          totalRuns,
          totalBalls,
          strikeRate: totalBalls > 0 ? (totalRuns / totalBalls) * 100 : 0,
          winningRuns,
          winningInnings: winRows.length,
          winningRunsPct: totalRuns > 0 ? (winningRuns / totalRuns) * 100 : 0,
        };
      });
      setPhases(phaseArr);
    } finally {
      setLoading(false);
    }
  }, [playerId, selectedSeasonId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { positions, phases, loading };
}