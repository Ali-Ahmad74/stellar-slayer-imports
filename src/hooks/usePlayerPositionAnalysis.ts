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
  // Split by match result for ball-by-ball derived phase data
  wonRuns?: number;
  wonBalls?: number;
  wonSR?: number;
  lostRuns?: number;
  lostBalls?: number;
  lostSR?: number;
  isBallByBall?: boolean;
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
        .select('runs, balls, batting_position, match_id, matches!inner(result, ball_by_ball)')
        .eq('player_id', playerId);
      if (selectedSeasonId !== 'all') {
        q = q.eq('season_id', parseInt(selectedSeasonId));
      }
      const { data } = await q;
      const rows = (data as any[]) || [];

      // Player name needed to filter ball-by-ball
      const { data: playerRow } = await supabase
        .from('players').select('name').eq('id', playerId).maybeSingle();
      const playerName: string = (playerRow as any)?.name || '';
      const normName = playerName.toLowerCase().replace(/\s+/g, ' ').replace(/[^\w\s'.-]/g, '').trim();

      // Position aggregation
      const posMap = new Map<number | 'Unknown', PositionStat>();
      for (const r of rows) {
        const pos: number | 'Unknown' = r.batting_position ?? 'Unknown';
        const key = pos;
        const cur = posMap.get(key) || {
          position: pos,
          positionLabel: pos === 'Unknown' ? 'N/A' : `#${pos}`,
          totalRuns: 0, winningRuns: 0, innings: 0, winningRunsPct: 0,
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

      // Phase aggregation — prefer true ball-by-ball when stored on matches.ball_by_ball.
      const buckets = [
        { bucket: 'Powerplay', range: 'Balls 1–36', min: 1, max: 36 },
        { bucket: 'Middle', range: 'Balls 37–90', min: 37, max: 90 },
        { bucket: 'Death', range: 'Balls 91+', min: 91, max: Infinity },
      ];
      // Initialise accumulators
      const accs = buckets.map(() => ({
        innings: 0, totalRuns: 0, totalBalls: 0,
        wonRuns: 0, wonBalls: 0, lostRuns: 0, lostBalls: 0,
        winningRuns: 0, winningInnings: 0,
      }));
      let usedBallByBall = false;
      // Track innings-level "did this batter face a ball in this bucket" once per match
      for (const r of rows) {
        const result: string | undefined = r.matches?.result;
        const bbb: any[] | undefined = r.matches?.ball_by_ball as any;
        let perBucketRuns = [0, 0, 0];
        let perBucketBalls = [0, 0, 0];
        if (Array.isArray(bbb) && bbb.length > 0 && normName) {
          usedBallByBall = true;
          let ballIdx = 0;
          for (const ball of bbb) {
            if (!ball) continue;
            if (ball.is_legal === false) continue;
            const batterKey = (ball.batter || '').toLowerCase().replace(/\s+/g, ' ').replace(/[^\w\s'.-]/g, '').trim();
            if (batterKey !== normName) continue;
            ballIdx += 1;
            const runs = Number(ball.runs) || 0;
            for (let i = 0; i < buckets.length; i++) {
              if (ballIdx >= buckets[i].min && ballIdx <= buckets[i].max) {
                perBucketRuns[i] += runs;
                perBucketBalls[i] += 1;
                break;
              }
            }
          }
        } else {
          // Fallback: bucket the whole innings by total balls faced (legacy behaviour)
          if (typeof r.balls === 'number' && r.balls > 0) {
            for (let i = 0; i < buckets.length; i++) {
              if (r.balls >= buckets[i].min && r.balls <= buckets[i].max) {
                perBucketRuns[i] = r.runs || 0;
                perBucketBalls[i] = r.balls;
                break;
              }
            }
          }
        }
        for (let i = 0; i < buckets.length; i++) {
          if (perBucketBalls[i] === 0) continue;
          accs[i].innings += 1;
          accs[i].totalRuns += perBucketRuns[i];
          accs[i].totalBalls += perBucketBalls[i];
          if (result === 'won') {
            accs[i].wonRuns += perBucketRuns[i];
            accs[i].wonBalls += perBucketBalls[i];
            accs[i].winningRuns += perBucketRuns[i];
            accs[i].winningInnings += 1;
          } else if (result === 'lost') {
            accs[i].lostRuns += perBucketRuns[i];
            accs[i].lostBalls += perBucketBalls[i];
          }
        }
      }
      const phaseArr: PhaseStat[] = buckets.map((b, i) => {
        const a = accs[i];
        return {
          bucket: b.bucket, range: b.range,
          innings: a.innings,
          totalRuns: a.totalRuns, totalBalls: a.totalBalls,
          strikeRate: a.totalBalls > 0 ? (a.totalRuns / a.totalBalls) * 100 : 0,
          winningRuns: a.winningRuns, winningInnings: a.winningInnings,
          winningRunsPct: a.totalRuns > 0 ? (a.winningRuns / a.totalRuns) * 100 : 0,
          wonRuns: a.wonRuns, wonBalls: a.wonBalls,
          wonSR: a.wonBalls > 0 ? (a.wonRuns / a.wonBalls) * 100 : 0,
          lostRuns: a.lostRuns, lostBalls: a.lostBalls,
          lostSR: a.lostBalls > 0 ? (a.lostRuns / a.lostBalls) * 100 : 0,
          isBallByBall: usedBallByBall,
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