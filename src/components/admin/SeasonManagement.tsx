import { CalendarDays, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminSeason } from './types';

interface Props {
  seasons: AdminSeason[];
  isAdmin: boolean;
  loadingData: boolean;
  onAddSeason: () => void;
  onEditSeason: (season: AdminSeason) => void;
  onDeleteSeason: (id: number, name: string) => void;
}

export function SeasonManagement({ seasons, isAdmin, loadingData, onAddSeason, onEditSeason, onDeleteSeason }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div><CardTitle>Season Management</CardTitle><CardDescription>Organize matches by season</CardDescription></div>
        {isAdmin && <Button onClick={onAddSeason}><Plus className="w-4 h-4 mr-2" />Add Season</Button>}
      </CardHeader>
      <CardContent className="p-0">
        {loadingData ? <div className="p-8 text-center text-muted-foreground">Loading seasons...</div>
        : seasons.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>No seasons yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Name</TableHead><TableHead>Year</TableHead><TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead><TableHead>Status</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {seasons.map((season) => (
                  <TableRow key={season.id} className="hover:bg-muted/30">
                    <TableCell className="font-semibold">{season.name}</TableCell>
                    <TableCell>{season.year}</TableCell>
                    <TableCell>{season.start_date ? new Date(season.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}</TableCell>
                    <TableCell>{season.end_date ? new Date(season.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}</TableCell>
                    <TableCell>
                      {season.is_active
                        ? <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Active</span>
                        : <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground">Inactive</span>}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => onEditSeason(season)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => onDeleteSeason(season.id, season.name)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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
