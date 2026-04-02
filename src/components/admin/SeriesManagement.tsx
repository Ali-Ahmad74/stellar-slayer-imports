import { useState, useEffect } from 'react';
import { Trophy, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AdminSeries, AdminMatch } from './types';

interface Props {
  series: AdminSeries[];
  matches: AdminMatch[];
  isAdmin: boolean;
  loadingData: boolean;
  onAddSeries: () => void;
  onEditSeries: (s: AdminSeries) => void;
  onDeleteSeries: (id: number, name: string) => void;
  onRefetch: () => void;
}

export function SeriesManagement({ series, matches, isAdmin, loadingData, onAddSeries, onEditSeries, onDeleteSeries, onRefetch }: Props) {
  const [bulkAssignSeriesId, setBulkAssignSeriesId] = useState<string>('');
  const [bulkAssignMode, setBulkAssignMode] = useState<'unassigned' | 'all'>('unassigned');
  const [bulkAssignMatchIds, setBulkAssignMatchIds] = useState<Record<number, boolean>>({});
  const [bulkAssignSaving, setBulkAssignSaving] = useState(false);

  useEffect(() => {
    if (!bulkAssignSeriesId && series.length > 0) {
      setBulkAssignSeriesId(String(series[0].id));
    }
  }, [series, bulkAssignSeriesId]);

  const handleBulkAssign = async () => {
    const sid = Number(bulkAssignSeriesId);
    const targetSeriesId = Number.isFinite(sid) ? sid : null;
    const selectedIds = Object.entries(bulkAssignMatchIds)
      .filter(([, v]) => v).map(([k]) => Number(k)).filter((n) => Number.isFinite(n));

    if (!targetSeriesId) { toast.error('Select a series first'); return; }
    if (selectedIds.length === 0) { toast.error('Select at least 1 match'); return; }

    setBulkAssignSaving(true);
    try {
      const { error } = await supabase.from('matches').update({ series_id: targetSeriesId }).in('id', selectedIds);
      if (error) throw error;
      toast.success(`Assigned ${selectedIds.length} match(es) to series`);
      setBulkAssignMatchIds({});
      onRefetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to assign matches');
    } finally {
      setBulkAssignSaving(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle>Series Management</CardTitle><CardDescription>Create series to group matches and generate highlights</CardDescription></div>
          {isAdmin && <Button onClick={onAddSeries}><Plus className="w-4 h-4 mr-2" />Add Series</Button>}
        </CardHeader>
        <CardContent className="p-0">
          {loadingData ? <div className="p-8 text-center text-muted-foreground">Loading...</div>
          : series.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>No series yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Name</TableHead><TableHead>Venue</TableHead><TableHead>Dates</TableHead>
                    <TableHead>Matches</TableHead><TableHead>Status</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {series.map((s) => {
                    const matchCount = matches.filter((m) => Number(m.series_id) === Number(s.id)).length;
                    const dateLabel = s.start_date && s.end_date
                      ? `${new Date(s.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(s.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                      : '-';
                    return (
                      <TableRow key={s.id} className="hover:bg-muted/30">
                        <TableCell className="font-semibold">{s.name}</TableCell>
                        <TableCell className="text-muted-foreground">{s.venue || '-'}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{dateLabel}</TableCell>
                        <TableCell><span className="text-xs text-muted-foreground tabular-nums">{matchCount} {matchCount === 1 ? 'match' : 'matches'}</span></TableCell>
                        <TableCell>{s.is_active ? <Badge>Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => onEditSeries(s)}><Edit className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => onDeleteSeries(s.id, s.name)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Bulk assign matches to series</CardTitle>
          <CardDescription>Select a series, tick matches, and assign in one action</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Target series</Label>
              <Select value={bulkAssignSeriesId} onValueChange={setBulkAssignSeriesId}>
                <SelectTrigger><SelectValue placeholder="Select series" /></SelectTrigger>
                <SelectContent>{series.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Matches list</Label>
              <Select value={bulkAssignMode} onValueChange={(v) => setBulkAssignMode(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned only</SelectItem>
                  <SelectItem value="all">All matches</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end md:justify-end">
              <Button onClick={handleBulkAssign} disabled={bulkAssignSaving}>{bulkAssignSaving ? 'Assigning…' : 'Assign selected'}</Button>
            </div>
          </div>
          <ScrollArea className="h-[320px] rounded-lg border border-border">
            <div className="p-3 space-y-2">
              {matches.filter((m) => (bulkAssignMode === 'unassigned' ? !m.series_id : true)).map((m) => {
                const checked = Boolean(bulkAssignMatchIds[m.id]);
                const label = `${new Date(m.match_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} • ${m.opponent_name || 'Match'}${m.venue ? ` • ${m.venue}` : ''}`;
                return (
                  <label key={m.id} className="flex items-start gap-3 rounded-md border bg-card p-3 cursor-pointer">
                    <Checkbox checked={checked} onCheckedChange={(v) => setBulkAssignMatchIds((prev) => ({ ...prev, [m.id]: Boolean(v) }))} />
                    <div className="min-w-0">
                      <div className="font-medium truncate">{label}</div>
                      <div className="text-xs text-muted-foreground">Match ID: {m.id}</div>
                    </div>
                  </label>
                );
              })}
              {matches.filter((m) => (bulkAssignMode === 'unassigned' ? !m.series_id : true)).length === 0 && (
                <div className="text-sm text-muted-foreground">No matches found.</div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
}
