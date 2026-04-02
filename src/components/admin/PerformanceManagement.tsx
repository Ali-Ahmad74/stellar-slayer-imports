import { useState } from 'react';
import { Activity, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MatchEntryGrid } from '@/components/MatchEntryGrid';
import { AdminPlayer, AdminMatch, AdminTournament, AdminSeries } from './types';

interface Props {
  players: AdminPlayer[];
  matches: AdminMatch[];
  tournaments: AdminTournament[];
  series: AdminSeries[];
  onAddPerformance: () => void;
}

export function PerformanceManagement({ players, matches, tournaments, series, onAddPerformance }: Props) {
  const [performanceSeriesId, setPerformanceSeriesId] = useState<string>('all');
  const [performanceTournamentId, setPerformanceTournamentId] = useState<string>('all');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Single Player Entry</CardTitle>
            <CardDescription>Record batting, bowling, and fielding stats for one player in a match</CardDescription>
          </div>
          <Button onClick={onAddPerformance} disabled={players.length === 0 || matches.length === 0}>
            <Plus className="w-4 h-4 mr-2" />Add Performance
          </Button>
        </CardHeader>
        <CardContent>
          {players.length === 0 || matches.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>You need at least one player and one match to add performance data.</p>
              <p className="text-sm mt-2">{players.length === 0 ? 'Start by adding players.' : 'Start by adding a match.'}</p>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">Ready to record performance!</p>
              <p className="text-sm mt-2">Click "Add Performance" to record stats for a player in a match.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {players.length > 0 && matches.length > 0 && (
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div><CardTitle>Bulk Entry (Grid)</CardTitle><CardDescription>Filter and enter performance data for multiple players</CardDescription></div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Tournament</span>
                <Select value={performanceTournamentId} onValueChange={setPerformanceTournamentId}>
                  <SelectTrigger className="w-[200px]"><SelectValue placeholder="All tournaments" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All tournaments</SelectItem>
                    <SelectItem value="none">No tournament</SelectItem>
                    {tournaments.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Series</span>
                <Select value={performanceSeriesId} onValueChange={setPerformanceSeriesId}>
                  <SelectTrigger className="w-[200px]"><SelectValue placeholder="All series" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All series</SelectItem>
                    <SelectItem value="none">No series</SelectItem>
                    {series.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <MatchEntryGrid
              players={players.map((p) => ({ id: p.id, name: p.name }))}
              matches={matches
                .filter((m) => performanceTournamentId === 'all' ? true : performanceTournamentId === 'none' ? !m.tournament_id : Number(m.tournament_id) === Number(performanceTournamentId))
                .filter((m) => performanceSeriesId === 'all' ? true : performanceSeriesId === 'none' ? !m.series_id : Number(m.series_id) === Number(performanceSeriesId))
                .map((m) => ({ id: m.id, match_date: m.match_date, venue: m.venue }))}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
