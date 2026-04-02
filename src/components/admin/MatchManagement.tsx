import { Calendar, Plus, Edit, Trash2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminMatch, AdminTournament } from './types';

interface Props {
  matches: AdminMatch[];
  tournaments: AdminTournament[];
  isAdmin: boolean;
  loadingData: boolean;
  onAddMatch: () => void;
  onEditMatch: (match: AdminMatch) => void;
  onDeleteMatch: (id: number, name: string) => void;
  onNotesMatch: (match: AdminMatch) => void;
}

export function MatchManagement({ matches, tournaments, isAdmin, loadingData, onAddMatch, onEditMatch, onDeleteMatch, onNotesMatch }: Props) {
  const getTournamentName = (tournamentId: number | null) => {
    if (!tournamentId) return null;
    return tournaments.find(t => t.id === tournamentId)?.name || null;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Match Management</CardTitle>
          <CardDescription>Record and manage your matches</CardDescription>
        </div>
        {isAdmin && (
          <Button onClick={onAddMatch}>
            <Plus className="w-4 h-4 mr-2" />Add Match
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {loadingData ? (
          <div className="p-8 text-center text-muted-foreground">Loading matches...</div>
        ) : matches.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No matches yet.</p>
            {isAdmin && <p className="text-sm mt-2">Click "Add Match" to record your first game!</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead><TableHead>Opponent</TableHead><TableHead>Tournament</TableHead>
                  <TableHead>Score</TableHead><TableHead>Result</TableHead><TableHead>Overs</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((match) => (
                  <TableRow key={match.id} className="hover:bg-muted/30">
                    <TableCell className="whitespace-nowrap">
                      {new Date(match.match_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </TableCell>
                    <TableCell className="font-semibold">{match.opponent_name || '-'}</TableCell>
                    <TableCell>
                      {getTournamentName(match.tournament_id)
                        ? <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">{getTournamentName(match.tournament_id)}</span>
                        : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>{match.our_score !== null && match.opponent_score !== null ? `${match.our_score} - ${match.opponent_score}` : '-'}</TableCell>
                    <TableCell>
                      {match.result ? (
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${match.result === 'Won' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : match.result === 'Lost' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-muted text-muted-foreground'}`}>
                          {match.result}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{match.overs}</TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => onNotesMatch(match)} title="Notes"><MessageSquare className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => onEditMatch(match)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => onDeleteMatch(match.id, match.opponent_name || 'this match')}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
