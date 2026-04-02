import { Users, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RoleBadge } from '@/components/RoleBadge';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { CSVImportDialog } from '@/components/CSVImportDialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PlayerRole } from '@/types/cricket';
import { AdminPlayer } from './types';

interface Props {
  players: AdminPlayer[];
  isAdmin: boolean;
  loadingData: boolean;
  teamId: string | null;
  onAddPlayer: () => void;
  onEditPlayer: (player: AdminPlayer) => void;
  onDeletePlayer: (id: number, name: string) => void;
  onImportComplete: () => void;
}

export function PlayerManagement({ players, isAdmin, loadingData, teamId, onAddPlayer, onEditPlayer, onDeletePlayer, onImportComplete }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Player Management</CardTitle>
          <CardDescription>Add and manage your team's players</CardDescription>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button onClick={onAddPlayer}>
              <Plus className="w-4 h-4 mr-2" />Add Player
            </Button>
            {teamId && <CSVImportDialog teamId={teamId} onImportComplete={onImportComplete} />}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {loadingData ? (
          <div className="p-8 text-center text-muted-foreground">Loading players...</div>
        ) : players.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No players yet.</p>
            {isAdmin && <p className="text-sm mt-2">Click "Add Player" to get started!</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Role</TableHead>
                  <TableHead>Batting Style</TableHead><TableHead>Bowling Style</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => (
                  <TableRow key={player.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs">{player.id}</TableCell>
                    <TableCell className="font-semibold">
                      <div className="flex items-center gap-2">
                        <PlayerAvatar name={player.name} photoUrl={player.photo_url} size="sm" />
                        {player.name}
                      </div>
                    </TableCell>
                    <TableCell><RoleBadge role={player.role as PlayerRole} size="sm" /></TableCell>
                    <TableCell className="text-muted-foreground">{player.batting_style || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{player.bowling_style || '-'}</TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Tooltip><TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => onEditPlayer(player)}><Edit className="w-4 h-4" /></Button>
                          </TooltipTrigger><TooltipContent>Edit player</TooltipContent></Tooltip>
                          <Tooltip><TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => onDeletePlayer(player.id, player.name)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                          </TooltipTrigger><TooltipContent>Delete player</TooltipContent></Tooltip>
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
