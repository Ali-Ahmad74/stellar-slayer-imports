import { Trophy, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminTournament, AdminMatch } from './types';

interface Props {
  tournaments: AdminTournament[];
  matches: AdminMatch[];
  isAdmin: boolean;
  loadingData: boolean;
  onAddTournament: () => void;
  onEditTournament: (tournament: AdminTournament) => void;
  onDeleteTournament: (id: number, name: string) => void;
}

export function TournamentManagement({ tournaments, matches, isAdmin, loadingData, onAddTournament, onEditTournament, onDeleteTournament }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div><CardTitle>Tournament Management</CardTitle><CardDescription>Create tournaments to group your matches</CardDescription></div>
        {isAdmin && <Button onClick={onAddTournament}><Plus className="w-4 h-4 mr-2" />Add Tournament</Button>}
      </CardHeader>
      <CardContent className="p-0">
        {loadingData ? <div className="p-8 text-center text-muted-foreground">Loading...</div>
        : tournaments.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>No tournaments yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Venue</TableHead>
                  <TableHead>Dates</TableHead><TableHead>Matches</TableHead><TableHead>Status</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tournaments.map((tournament) => {
                  const matchCount = matches.filter(m => m.tournament_id === tournament.id).length;
                  return (
                    <TableRow key={tournament.id} className="hover:bg-muted/30">
                      <TableCell className="font-semibold">{tournament.name}</TableCell>
                      <TableCell className="capitalize">{tournament.tournament_type || 'League'}</TableCell>
                      <TableCell className="text-muted-foreground">{tournament.venue || '-'}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {tournament.start_date && tournament.end_date
                          ? `${new Date(tournament.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(tournament.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                          : '-'}
                      </TableCell>
                      <TableCell><span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-muted">{matchCount} {matchCount === 1 ? 'match' : 'matches'}</span></TableCell>
                      <TableCell>
                        {tournament.is_active
                          ? <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Active</span>
                          : <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground">Inactive</span>}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => onEditTournament(tournament)}><Edit className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => onDeleteTournament(tournament.id, tournament.name)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
