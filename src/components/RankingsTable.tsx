import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { RankBadge } from './RankBadge';
import { PlayerAvatar } from './PlayerAvatar';
import { RoleBadge } from './RoleBadge';
import { RankingPlayer, RankingCategory } from '@/types/cricket';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

function RecentFormDots({ playerId }: { playerId: number }) {
  const { data: dots } = useQuery({
    queryKey: ['recent-form', playerId],
    queryFn: async () => {
      const { data } = await supabase
        .from('batting_inputs')
        .select('runs, match_id')
        .eq('player_id', playerId)
        .order('match_id', { ascending: false })
        .limit(5);
      return (data ?? []).map(d => Number(d.runs ?? 0));
    },
    staleTime: 60000,
  });

  if (!dots || dots.length === 0) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex gap-0.5 mt-0.5">
          {dots.map((runs, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full ${
                runs >= 50 ? 'bg-emerald-500' :
                runs >= 30 ? 'bg-green-400' :
                runs >= 15 ? 'bg-amber-400' :
                runs > 0 ? 'bg-orange-400' :
                'bg-red-400'
              }`}
            />
          ))}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        Last {dots.length}: {dots.join(', ')} runs
      </TooltipContent>
    </Tooltip>
  );
}
interface RankingsTableProps {
  title: string;
  icon: string;
  category: RankingCategory;
  players: RankingPlayer[];
}

export function RankingsTable({ title, icon, category, players }: RankingsTableProps) {
  const getColumns = () => {
    switch (category) {
      case 'batting':
        return [
          { key: 'matches', label: 'M' },
          { key: 'runs', label: 'Runs' },
          { key: 'strikeRate', label: 'SR' },
          { key: 'rating', label: 'Points' },
        ];
      case 'bowling':
        return [
          { key: 'matches', label: 'M' },
          { key: 'wickets', label: 'Wkts' },
          { key: 'economy', label: 'Econ' },
          { key: 'rating', label: 'Points' },
        ];
      case 'fielding':
        return [
          { key: 'matches', label: 'M' },
          { key: 'catches', label: 'Catches' },
          { key: 'runouts', label: 'Run Outs' },
          { key: 'stumpings', label: 'Stumpings' },
          { key: 'rating', label: 'Points' },
        ];
      default:
        return [
          { key: 'matches', label: 'M' },
          { key: 'runs', label: 'Runs' },
          { key: 'wickets', label: 'Wkts' },
          { key: 'catches', label: 'C' },
          { key: 'rating', label: 'Total Pts' },
        ];
    }
  };

  const columns = getColumns();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card variant="elevated" className="overflow-hidden">
        <CardHeader className="gradient-header text-white py-6">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <span className="text-3xl">{icon}</span>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-16 text-center font-semibold">Rank</TableHead>
                  <TableHead className="font-semibold">Player</TableHead>
                  {columns.map((col) => (
                    <TableHead key={col.key} className="text-center font-semibold">
                      {col.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={2 + columns.length}
                      className="text-center py-12 text-muted-foreground"
                    >
                      No rankings data yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  players.map((player, index) => (
                    <motion.tr
                      key={player.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => (window.location.href = `/player/${player.id}`)}
                    >
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <RankBadge rank={player.rank} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link
                          to={`/player/${player.id}`}
                          state={{ from: '/', fromLabel: 'Back to Rankings' }}
                          className="flex items-center gap-3 hover:text-primary transition-colors"
                        >
                          <PlayerAvatar name={player.name} photoUrl={player.photo_url} size="sm" />
                          <div>
                            <p className="font-semibold">{player.name}</p>
                            <div className="flex items-center gap-2">
                              <RoleBadge role={player.role} size="sm" />
                              <RecentFormDots playerId={player.id} />
                            </div>
                          </div>
                        </Link>
                      </TableCell>
                      {columns.map((col) => (
                        <TableCell
                          key={col.key}
                          className={`text-center ${col.key === 'rating' ? 'font-bold text-primary text-lg' : ''}`}
                        >
                          {player[col.key as keyof RankingPlayer] ?? '-'}
                        </TableCell>
                      ))}
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
