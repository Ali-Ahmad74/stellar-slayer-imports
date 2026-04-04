import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { downloadCSV } from '@/lib/csv-export';
import { toast } from '@/hooks/use-toast';

export function BackupExportButton() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      // Fetch all data in parallel
      const [playersRes, matchesRes, performancesRes, seasonsRes, seriesRes] = await Promise.all([
        supabase.from('players').select('*'),
        supabase.from('matches').select('*').order('match_date', { ascending: false }),
        supabase.from('performances').select('*'),
        supabase.from('seasons').select('*'),
        supabase.from('series').select('*'),
      ]);

      // Export each table as CSV
      if (playersRes.data?.length) {
        downloadCSV(playersRes.data, `backup-players-${new Date().toISOString().split('T')[0]}`);
      }
      
      await new Promise(r => setTimeout(r, 300));
      
      if (matchesRes.data?.length) {
        downloadCSV(matchesRes.data, `backup-matches-${new Date().toISOString().split('T')[0]}`);
      }
      
      await new Promise(r => setTimeout(r, 300));
      
      if (performancesRes.data?.length) {
        downloadCSV(performancesRes.data, `backup-performances-${new Date().toISOString().split('T')[0]}`);
      }
      
      await new Promise(r => setTimeout(r, 300));
      
      if (seasonsRes.data?.length) {
        downloadCSV(seasonsRes.data, `backup-seasons-${new Date().toISOString().split('T')[0]}`);
      }
      
      await new Promise(r => setTimeout(r, 300));
      
      if (seriesRes.data?.length) {
        downloadCSV(seriesRes.data, `backup-series-${new Date().toISOString().split('T')[0]}`);
      }

      toast({ title: '✅ Backup Complete', description: '5 CSV files downloaded (Players, Matches, Performances, Seasons, Series)' });
    } catch (err) {
      console.error('Backup failed:', err);
      toast({ title: 'Backup Failed', description: 'An error occurred during export', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting} className="gap-2">
      {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      {exporting ? 'Exporting...' : 'Full Backup (CSV)'}
    </Button>
  );
}
