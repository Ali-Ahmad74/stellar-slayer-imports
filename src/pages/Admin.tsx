import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Calendar, Settings, LogOut, Activity, CalendarDays, Trophy, Info, AlertCircle, ClipboardCheck } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlayerDialog, PlayerFormData } from '@/components/dialogs/PlayerDialog';
import { MatchDialog, MatchFormData } from '@/components/dialogs/MatchDialog';
import { PerformanceDialog, PerformanceFormData } from '@/components/dialogs/PerformanceDialog';
import { SeasonDialog, SeasonFormData } from '@/components/dialogs/SeasonDialog';
import { TournamentDialog, TournamentFormData } from '@/components/dialogs/TournamentDialog';
import { SeriesDialog, SeriesFormData } from '@/components/dialogs/SeriesDialog';
import { DeleteConfirmDialog } from '@/components/dialogs/DeleteConfirmDialog';
import { MatchNotesEditor } from '@/components/MatchNotesEditor';
import { AttendanceManager } from '@/components/AttendanceManager';
import { DataHealthDashboard } from '@/components/DataHealthDashboard';
import { ScoringSettingsPanel } from '@/components/ScoringSettingsPanel';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PlayerRole } from '@/types/cricket';
import { insertWithSafeNumericId } from '@/lib/safe-numeric-insert';
import { logAdminActivity } from '@/lib/admin-activity-log';
import { ActivityLog } from '@/components/admin/ActivityLog';

import { PlayerManagement } from '@/components/admin/PlayerManagement';
import { MatchManagement } from '@/components/admin/MatchManagement';
import { SeasonManagement } from '@/components/admin/SeasonManagement';
import { TournamentManagement } from '@/components/admin/TournamentManagement';
import { SeriesManagement } from '@/components/admin/SeriesManagement';
import { PerformanceManagement } from '@/components/admin/PerformanceManagement';
import { TeamSettingsTab } from '@/components/admin/TeamSettingsTab';
import { AdminPlayer, AdminMatch, AdminSeason, AdminTournament, AdminSeries } from '@/components/admin/types';

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading, signOut, team } = useAuth();
  const teamId = team?.id ?? null;

  const [players, setPlayers] = useState<AdminPlayer[]>([]);
  const [matches, setMatches] = useState<AdminMatch[]>([]);
  const [seasons, setSeasons] = useState<AdminSeason[]>([]);
  const [tournaments, setTournaments] = useState<AdminTournament[]>([]);
  const [series, setSeries] = useState<AdminSeries[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('players');

  // Dialog states
  const [playerDialogOpen, setPlayerDialogOpen] = useState(false);
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [performanceDialogOpen, setPerformanceDialogOpen] = useState(false);
  const [seasonDialogOpen, setSeasonDialogOpen] = useState(false);
  const [tournamentDialogOpen, setTournamentDialogOpen] = useState(false);
  const [seriesDialogOpen, setSeriesDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSampleDialogOpen, setDeleteSampleDialogOpen] = useState(false);
  const [notesMatch, setNotesMatch] = useState<AdminMatch | null>(null);

  // Edit states
  const [editingPlayer, setEditingPlayer] = useState<AdminPlayer | undefined>();
  const [editingMatch, setEditingMatch] = useState<AdminMatch | undefined>();
  const [editingSeason, setEditingSeason] = useState<AdminSeason | undefined>();
  const [editingTournament, setEditingTournament] = useState<AdminTournament | undefined>();
  const [editingSeries, setEditingSeries] = useState<AdminSeries | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'player' | 'match' | 'season' | 'tournament' | 'series'; id: number; name: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && user && !isAdmin) navigate('/');
  }, [loading, user, isAdmin, navigate]);

  useEffect(() => {
    if (user && teamId) fetchData();
  }, [user, teamId]);

  const fetchData = async () => {
    if (!teamId) return;
    setLoadingData(true);

    const [playersRes, matchesRes, seasonsRes, tournamentsRes, seriesRes] = await Promise.all([
      supabase.from('players').select('*').eq('team_id', teamId).order('name'),
      supabase.from('matches').select('*').eq('team_id', teamId).order('match_date', { ascending: false }),
      supabase.from('seasons').select('*').eq('team_id', teamId).order('year', { ascending: false }),
      supabase.from('tournaments').select('*').eq('team_id', teamId).order('start_date', { ascending: false }),
      supabase.from('series').select('*').eq('team_id', teamId).order('is_active', { ascending: false }).order('created_at', { ascending: false }),
    ]);

    if (playersRes.data) setPlayers(playersRes.data);
    if (matchesRes.data) setMatches(matchesRes.data as AdminMatch[]);
    if (seasonsRes.data) setSeasons(seasonsRes.data);
    if (tournamentsRes.data) setTournaments(tournamentsRes.data);
    if (seriesRes.data) setSeries(seriesRes.data as any);

    setLoadingData(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // ── Player CRUD
  const handleSavePlayer = async (data: PlayerFormData) => {
    if (!teamId) return;
    setSaving(true);
    if (data.id) {
      const { error } = await supabase.from('players').update({
        name: data.name, role: data.role,
        batting_style: data.batting_style, bowling_style: data.bowling_style, photo_url: data.photo_url,
        date_of_birth: data.date_of_birth, debut_date: data.debut_date,
        jersey_number: data.jersey_number, nationality: data.nationality, bio: data.bio,
      } as any).eq('id', data.id);
      if (error) toast.error('Failed to update player: ' + error.message);
      else {
        toast.success('Player updated!');
        setPlayerDialogOpen(false);
        fetchData();
        logAdminActivity({ action: 'update', entityType: 'player', entityId: data.id, summary: data.name });
      }
    } else {
      const { error } = await insertWithSafeNumericId('players', {
        name: data.name, role: data.role,
        batting_style: data.batting_style, bowling_style: data.bowling_style,
        photo_url: data.photo_url, team_id: teamId,
        date_of_birth: data.date_of_birth, debut_date: data.debut_date,
        jersey_number: data.jersey_number, nationality: data.nationality, bio: data.bio,
      } as any);
      if (error) toast.error('Failed to add player: ' + error.message);
      else {
        toast.success('Player added!');
        setPlayerDialogOpen(false);
        fetchData();
        logAdminActivity({ action: 'create', entityType: 'player', entityId: 'new', summary: data.name });
      }
    }
    setSaving(false);
    setEditingPlayer(undefined);
  };

  // ── Match CRUD
  const handleSaveMatch = async (data: MatchFormData) => {
    if (!teamId) return;
    setSaving(true);
    if (data.id) {
      const { error } = await supabase.from('matches').update({
        match_date: data.match_date, overs: data.overs, venue: data.venue,
        tournament_id: data.tournament_id, series_id: data.series_id,
        opponent_name: data.opponent_name, our_score: data.our_score,
        opponent_score: data.opponent_score, result: data.result,
        player_of_the_match_id: data.player_of_the_match_id,
      }).eq('id', data.id);
      if (error) toast.error('Failed to update match: ' + error.message);
      else {
        toast.success('Match updated!');
        setMatchDialogOpen(false);
        fetchData();
        logAdminActivity({ action: 'update', entityType: 'match', entityId: data.id, summary: `vs ${data.opponent_name ?? 'unknown'}` });
      }
    } else {
      const { error } = await insertWithSafeNumericId('matches', {
        match_date: data.match_date, overs: data.overs, venue: data.venue,
        tournament_id: data.tournament_id, series_id: data.series_id,
        opponent_name: data.opponent_name, our_score: data.our_score,
        opponent_score: data.opponent_score, result: data.result,
        player_of_the_match_id: data.player_of_the_match_id,
        team_id: teamId,
      });
      if (error) {
        toast.error('Failed to add match: ' + error.message);
      } else {
        toast.success('Match added!');
        setMatchDialogOpen(false);
        fetchData();
        logAdminActivity({ action: 'create', entityType: 'match', entityId: 'new', summary: `vs ${data.opponent_name ?? 'unknown'} on ${data.match_date}` });
        // Send push notification for new match
        const opponentText = data.opponent_name ? ` vs ${data.opponent_name}` : '';
        const resultText = data.result ? ` - ${data.result}` : '';
        try {
          await supabase.functions.invoke('send-push-notification', {
            body: {
              title: '🏏 New Match Added!',
              body: `Match${opponentText}${resultText}. Check the latest rankings!`,
              url: '/matches',
            },
          });
        } catch (e) {
          console.error('Push notification failed:', e);
        }
      }
    }
    setSaving(false);
    setEditingMatch(undefined);
  };

  // ── Season CRUD
  const handleSaveSeason = async (data: SeasonFormData) => {
    if (!teamId) return;
    setSaving(true);
    if (data.is_active) {
      await supabase.from('seasons').update({ is_active: false }).eq('team_id', teamId).neq('id', data.id || 0);
    }
    if (data.id) {
      const { error } = await supabase.from('seasons').update({
        name: data.name, year: data.year, start_date: data.start_date, end_date: data.end_date, is_active: data.is_active,
      }).eq('id', data.id);
      if (error) toast.error('Failed to update season: ' + error.message);
      else {
        toast.success('Season updated!');
        setSeasonDialogOpen(false);
        fetchData();
        logAdminActivity({ action: 'update', entityType: 'season', entityId: data.id, summary: data.name });
      }
    } else {
      const { error } = await insertWithSafeNumericId('seasons', {
        name: data.name, year: data.year, start_date: data.start_date, end_date: data.end_date, is_active: data.is_active, team_id: teamId,
      });
      if (error) toast.error('Failed to add season: ' + error.message);
      else {
        toast.success('Season added!');
        setSeasonDialogOpen(false);
        fetchData();
        logAdminActivity({ action: 'create', entityType: 'season', entityId: 'new', summary: data.name });
      }
    }
    setSaving(false);
    setEditingSeason(undefined);
  };

  // ── Tournament CRUD
  const handleSaveTournament = async (data: TournamentFormData) => {
    if (!teamId) return;
    setSaving(true);
    if (data.is_active) {
      await supabase.from('tournaments').update({ is_active: false }).eq('team_id', teamId).neq('id', data.id || 0);
    }
    if (data.id) {
      const { error } = await supabase.from('tournaments').update({
        name: data.name, description: data.description, start_date: data.start_date, end_date: data.end_date,
        venue: data.venue, tournament_type: data.tournament_type, is_active: data.is_active,
      }).eq('id', data.id);
      if (error) toast.error('Failed to update tournament: ' + error.message);
      else {
        toast.success('Tournament updated!');
        setTournamentDialogOpen(false);
        fetchData();
        logAdminActivity({ action: 'update', entityType: 'tournament', entityId: data.id, summary: data.name });
      }
    } else {
      const { error } = await insertWithSafeNumericId('tournaments', {
        name: data.name, description: data.description, start_date: data.start_date, end_date: data.end_date,
        venue: data.venue, tournament_type: data.tournament_type, is_active: data.is_active, team_id: teamId,
      });
      if (error) toast.error('Failed to add tournament: ' + error.message);
      else {
        toast.success('Tournament added!');
        setTournamentDialogOpen(false);
        fetchData();
        logAdminActivity({ action: 'create', entityType: 'tournament', entityId: 'new', summary: data.name });
      }
    }
    setSaving(false);
    setEditingTournament(undefined);
  };

  // ── Series CRUD
  const handleSaveSeries = async (data: SeriesFormData) => {
    if (!teamId) return;
    setSaving(true);
    if (data.is_active) {
      await supabase.from('series').update({ is_active: false }).eq('team_id', teamId).neq('id', data.id || 0);
    }
    if (data.id) {
      const { error } = await supabase.from('series').update({
        name: data.name, description: data.description, start_date: data.start_date, end_date: data.end_date,
        venue: data.venue, is_active: data.is_active,
      }).eq('id', data.id);
      if (error) toast.error('Failed to update series: ' + error.message);
      else {
        toast.success('Series updated!');
        setSeriesDialogOpen(false);
        fetchData();
        logAdminActivity({ action: 'update', entityType: 'series', entityId: data.id, summary: data.name });
      }
    } else {
      const { error } = await insertWithSafeNumericId('series', {
        name: data.name, description: data.description, start_date: data.start_date, end_date: data.end_date,
        venue: data.venue, is_active: data.is_active, team_id: teamId,
      });
      if (error) toast.error('Failed to add series: ' + error.message);
      else {
        toast.success('Series added!');
        setSeriesDialogOpen(false);
        fetchData();
        logAdminActivity({ action: 'create', entityType: 'series', entityId: 'new', summary: data.name });
      }
    }
    setSaving(false);
    setEditingSeries(undefined);
  };

  // ── Performance
  const handleSavePerformance = async (data: PerformanceFormData) => {
    setSaving(true);
    try {
      const errors: string[] = [];

      if (data.batting.balls > 0 || data.batting.runs > 0) {
        const { data: existing } = await supabase.from('batting_inputs').select('id')
          .eq('match_id', data.match_id).eq('player_id', data.player_id).maybeSingle();
        if (existing) {
          const { error } = await supabase.from('batting_inputs').update({
            runs: data.batting.runs, balls: data.batting.balls,
            fours: data.batting.fours, sixes: data.batting.sixes,
            out: data.batting.out, dismissal_type: data.batting.dismissal_type ?? null,
          }).eq('id', existing.id);
          if (error) errors.push('batting: ' + error.message);
        } else {
          const { error } = await supabase.from('batting_inputs').insert({
            match_id: data.match_id, player_id: data.player_id,
            runs: data.batting.runs, balls: data.batting.balls,
            fours: data.batting.fours, sixes: data.batting.sixes,
            out: data.batting.out, dismissal_type: data.batting.dismissal_type ?? null,
          });
          if (error) errors.push('batting: ' + error.message);
        }
      }

      if (data.bowling.balls > 0) {
        const { data: existing } = await supabase.from('bowling_inputs').select('id')
          .eq('match_id', data.match_id).eq('player_id', data.player_id).maybeSingle();
        if (existing) {
          const { error } = await supabase.from('bowling_inputs').update({
            balls: data.bowling.balls, runs_conceded: data.bowling.runs_conceded,
            wickets: data.bowling.wickets, maidens: data.bowling.maidens,
            wides: data.bowling.wides, no_balls: data.bowling.no_balls,
            fours_conceded: data.bowling.fours_conceded, sixes_conceded: data.bowling.sixes_conceded,
          }).eq('id', existing.id);
          if (error) errors.push('bowling: ' + error.message);
        } else {
          const { error } = await supabase.from('bowling_inputs').insert({
            match_id: data.match_id, player_id: data.player_id,
            balls: data.bowling.balls, runs_conceded: data.bowling.runs_conceded,
            wickets: data.bowling.wickets, maidens: data.bowling.maidens,
            wides: data.bowling.wides, no_balls: data.bowling.no_balls,
            fours_conceded: data.bowling.fours_conceded, sixes_conceded: data.bowling.sixes_conceded,
          });
          if (error) errors.push('bowling: ' + error.message);
        }
      }

      if (data.fielding.catches > 0 || data.fielding.runouts > 0 || data.fielding.stumpings > 0 || data.fielding.dropped_catches > 0) {
        const { data: existing } = await supabase.from('fielding_inputs').select('id')
          .eq('match_id', data.match_id).eq('player_id', data.player_id).maybeSingle();
        if (existing) {
          const { error } = await supabase.from('fielding_inputs').update({
            catches: data.fielding.catches, runouts: data.fielding.runouts,
            stumpings: data.fielding.stumpings, dropped_catches: data.fielding.dropped_catches,
          }).eq('id', existing.id);
          if (error) errors.push('fielding: ' + error.message);
        } else {
          const { error } = await supabase.from('fielding_inputs').insert({
            match_id: data.match_id, player_id: data.player_id,
            catches: data.fielding.catches, runouts: data.fielding.runouts,
            stumpings: data.fielding.stumpings, dropped_catches: data.fielding.dropped_catches,
          });
          if (error) errors.push('fielding: ' + error.message);
        }
      }

      if (errors.length > 0) toast.error('Failed to save: ' + errors.join(', '));
      else { toast.success('Performance saved!'); setPerformanceDialogOpen(false); }
    } catch {
      toast.error('Failed to save performance data');
    }
    setSaving(false);
  };

  // ── Delete
  const handleDeleteClick = (type: 'player' | 'match' | 'season' | 'tournament' | 'series', id: number, name: string) => {
    setDeleteTarget({ type, id, name });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    const table = deleteTarget.type === 'player' ? 'players'
      : deleteTarget.type === 'match' ? 'matches'
      : deleteTarget.type === 'season' ? 'seasons'
      : deleteTarget.type === 'tournament' ? 'tournaments'
      : 'series';
    const { error } = await supabase.from(table).delete().eq('id', deleteTarget.id);
    if (error) toast.error(`Failed to delete ${deleteTarget.type}: ` + error.message);
    else {
      toast.success(`${deleteTarget.type.charAt(0).toUpperCase() + deleteTarget.type.slice(1)} deleted!`);
      fetchData();
      logAdminActivity({
        action: 'delete',
        entityType: deleteTarget.type as any,
        entityId: deleteTarget.id,
        summary: deleteTarget.name,
      });
    }
    setSaving(false);
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const handleConfirmDeleteSampleData = async () => {
    if (!teamId) return;
    setSaving(true);
    try {
      const [samplePlayersRes, sampleSeriesRes] = await Promise.all([
        supabase.from('players').select('id').eq('team_id', teamId).like('name', '(Sample)%'),
        supabase.from('series').select('id').eq('team_id', teamId).like('name', '(Sample)%'),
      ]);
      if (samplePlayersRes.error) throw samplePlayersRes.error;
      if (sampleSeriesRes.error) throw sampleSeriesRes.error;

      const samplePlayerIds = (samplePlayersRes.data || []).map((r) => r.id);
      const sampleSeriesIds = (sampleSeriesRes.data || []).map((r) => r.id);

      const sampleMatchesByOpponentRes = await supabase.from('matches').select('id')
        .eq('team_id', teamId).like('opponent_name', '(Sample)%');
      if (sampleMatchesByOpponentRes.error) throw sampleMatchesByOpponentRes.error;

      const sampleMatchIds = new Set<number>((sampleMatchesByOpponentRes.data || []).map((r) => r.id));

      if (sampleSeriesIds.length > 0) {
        const sampleMatchesBySeriesRes = await supabase.from('matches').select('id')
          .eq('team_id', teamId).in('series_id', sampleSeriesIds as any);
        if (sampleMatchesBySeriesRes.error) throw sampleMatchesBySeriesRes.error;
        (sampleMatchesBySeriesRes.data || []).forEach((r) => sampleMatchIds.add(r.id));
      }

      const matchIds = Array.from(sampleMatchIds);

      if (samplePlayerIds.length === 0 && sampleSeriesIds.length === 0 && matchIds.length === 0) {
        toast.info('No sample data found to delete');
        setDeleteSampleDialogOpen(false);
        return;
      }

      const inputOrParts: string[] = [];
      if (samplePlayerIds.length > 0) inputOrParts.push(`player_id.in.(${samplePlayerIds.join(',')})`);
      if (matchIds.length > 0) inputOrParts.push(`match_id.in.(${matchIds.join(',')})`);
      const inputsOrFilter = inputOrParts.join(',');

      if (inputsOrFilter) {
        const [batDel, bowlDel, fieldDel] = await Promise.all([
          supabase.from('batting_inputs').delete().or(inputsOrFilter),
          supabase.from('bowling_inputs').delete().or(inputsOrFilter),
          supabase.from('fielding_inputs').delete().or(inputsOrFilter),
        ]);
        if (batDel.error) throw batDel.error;
        if (bowlDel.error) throw bowlDel.error;
        if (fieldDel.error) throw fieldDel.error;
      }

      if (matchIds.length > 0) {
        const { error } = await supabase.from('matches').delete().in('id', matchIds);
        if (error) throw error;
      }
      if (samplePlayerIds.length > 0) {
        const { error } = await supabase.from('players').delete().in('id', samplePlayerIds);
        if (error) throw error;
      }
      if (sampleSeriesIds.length > 0) {
        const { error } = await supabase.from('series').delete().in('id', sampleSeriesIds as any);
        if (error) throw error;
      }

      toast.success('Sample data deleted');
      fetchData();
      setDeleteSampleDialogOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete sample data');
    } finally {
      setSaving(false);
    }
  };

  // ── Guards
  if (!loading && user && !team) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="font-display">No team found</CardTitle>
              <CardDescription>You don't have a team set up yet.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button onClick={() => navigate('/auth')}>Set up your team</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Admin access required</CardTitle>
              <CardDescription>You don't have permission to view this page.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button onClick={() => navigate('/')}>Go Home</Button>
              <Button variant="outline" onClick={() => navigate('/auth')}>Switch Account</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8 md:py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Admin Panel</h1>
              <p className="text-muted-foreground mt-1">
                {team?.name ? `Managing: ${team.name}` : 'Manage players, matches, and performance data'}
              </p>
            </div>
            <Button variant="outline" onClick={handleSignOut} className="gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { icon: Users, label: 'Players', value: players.length, color: 'bg-blue-500' },
              { icon: Calendar, label: 'Matches', value: matches.length, color: 'bg-emerald-500' },
              { icon: Trophy, label: 'Tournaments', value: tournaments.length, color: 'bg-purple-500' },
              { icon: CalendarDays, label: 'Seasons', value: seasons.length, color: 'bg-amber-500' },
              { icon: Settings, label: 'Status', value: isAdmin ? 'Admin' : 'Viewer', color: 'bg-cyan-500' },
            ].map((stat, index) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className={`${stat.color} p-3 rounded-xl text-white`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold font-display">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start mb-6 bg-card border border-border shadow-md rounded-xl p-1.5 h-auto flex-wrap gap-1">
              {[
                { value: 'players', icon: Users, label: 'Players' },
                { value: 'matches', icon: Calendar, label: 'Matches' },
                { value: 'tournaments', icon: Trophy, label: 'Tournaments' },
                { value: 'series', icon: Trophy, label: 'Series' },
                { value: 'performance', icon: Activity, label: 'Performance' },
                { value: 'seasons', icon: CalendarDays, label: 'Seasons' },
                { value: 'attendance', icon: ClipboardCheck, label: 'Attendance' },
                { value: 'team', icon: Settings, label: 'Team Settings' },
                { value: 'scoring', icon: Info, label: 'Scoring' },
                { value: 'health', icon: AlertCircle, label: 'Data Health' },
                { value: 'activity', icon: Activity, label: 'Activity Log' },
              ].map(tab => (
                <TabsTrigger key={tab.value} value={tab.value}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 md:px-6 py-2.5 rounded-lg font-semibold">
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="players">
              <PlayerManagement
                players={players} isAdmin={isAdmin} loadingData={loadingData} teamId={teamId}
                onAddPlayer={() => { setEditingPlayer(undefined); setPlayerDialogOpen(true); }}
                onEditPlayer={(p) => { setEditingPlayer(p); setPlayerDialogOpen(true); }}
                onDeletePlayer={(id, name) => handleDeleteClick('player', id, name)}
                onImportComplete={fetchData}
              />
            </TabsContent>

            <TabsContent value="matches">
              <MatchManagement
                matches={matches} tournaments={tournaments} isAdmin={isAdmin} loadingData={loadingData}
                onAddMatch={() => { setEditingMatch(undefined); setMatchDialogOpen(true); }}
                onEditMatch={(m) => { setEditingMatch(m); setMatchDialogOpen(true); }}
                onDeleteMatch={(id, name) => handleDeleteClick('match', id, name)}
                onNotesMatch={(m) => setNotesMatch(m)}
              />
            </TabsContent>

            <TabsContent value="tournaments">
              <TournamentManagement
                tournaments={tournaments} matches={matches} isAdmin={isAdmin} loadingData={loadingData}
                onAddTournament={() => { setEditingTournament(undefined); setTournamentDialogOpen(true); }}
                onEditTournament={(t) => { setEditingTournament(t); setTournamentDialogOpen(true); }}
                onDeleteTournament={(id, name) => handleDeleteClick('tournament', id, name)}
              />
            </TabsContent>

            <TabsContent value="series">
              <SeriesManagement
                series={series} matches={matches} isAdmin={isAdmin} loadingData={loadingData}
                onAddSeries={() => { setEditingSeries(undefined); setSeriesDialogOpen(true); }}
                onEditSeries={(s) => { setEditingSeries(s); setSeriesDialogOpen(true); }}
                onDeleteSeries={(id, name) => handleDeleteClick('series', id, name)}
                onRefetch={fetchData}
              />
            </TabsContent>

            <TabsContent value="performance">
              <PerformanceManagement
                players={players} matches={matches} tournaments={tournaments} series={series}
                onAddPerformance={() => setPerformanceDialogOpen(true)}
              />
            </TabsContent>

            <TabsContent value="seasons">
              <SeasonManagement
                seasons={seasons} isAdmin={isAdmin} loadingData={loadingData}
                onAddSeason={() => { setEditingSeason(undefined); setSeasonDialogOpen(true); }}
                onEditSeason={(s) => { setEditingSeason(s); setSeasonDialogOpen(true); }}
                onDeleteSeason={(id, name) => handleDeleteClick('season', id, name)}
              />
            </TabsContent>

            <TabsContent value="attendance">
              <AttendanceManager
                players={players.map(p => ({ id: p.id, name: p.name, photo_url: p.photo_url }))}
                matches={matches.map(m => ({ id: m.id, match_date: m.match_date, opponent_name: m.opponent_name, venue: m.venue }))}
              />
            </TabsContent>

            <TabsContent value="team">
              <TeamSettingsTab
                isAdmin={isAdmin}
                saving={saving}
                onDeleteSampleData={() => setDeleteSampleDialogOpen(true)}
              />
            </TabsContent>

            <TabsContent value="scoring"><ScoringSettingsPanel /></TabsContent>

            <TabsContent value="health">
              <DataHealthDashboard
                players={players.map(p => ({ id: p.id, name: p.name }))}
                matches={matches.map(m => ({ id: m.id, match_date: m.match_date, venue: m.venue, series_id: m.series_id, our_score: m.our_score, opponent_score: m.opponent_score, result: m.result }))}
                series={series.map(s => ({ id: s.id, name: s.name }))}
              />
            </TabsContent>

            <TabsContent value="activity">
              <ActivityLog />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      {/* Dialogs */}
      <PlayerDialog open={playerDialogOpen} onOpenChange={(open) => { setPlayerDialogOpen(open); if (!open) setEditingPlayer(undefined); }} onSave={handleSavePlayer} player={editingPlayer ? { ...editingPlayer, role: editingPlayer.role as PlayerRole } : undefined} isLoading={saving} />
      <MatchDialog open={matchDialogOpen} onOpenChange={(open) => { setMatchDialogOpen(open); if (!open) setEditingMatch(undefined); }} onSave={handleSaveMatch} match={editingMatch} tournaments={tournaments.map(t => ({ id: t.id, name: t.name }))} seriesOptions={series.map(s => ({ id: s.id, name: s.name }))} players={players.map(p => ({ id: p.id, name: p.name }))} isLoading={saving} />
      <SeriesDialog open={seriesDialogOpen} onOpenChange={(open) => { setSeriesDialogOpen(open); if (!open) setEditingSeries(undefined); }} onSave={handleSaveSeries} series={editingSeries} isLoading={saving} />
      <PerformanceDialog open={performanceDialogOpen} onOpenChange={setPerformanceDialogOpen} onSave={handleSavePerformance} players={players} matches={matches} isLoading={saving} />
      <SeasonDialog open={seasonDialogOpen} onOpenChange={(open) => { setSeasonDialogOpen(open); if (!open) setEditingSeason(undefined); }} onSave={handleSaveSeason} season={editingSeason} isLoading={saving} />
      <TournamentDialog open={tournamentDialogOpen} onOpenChange={(open) => { setTournamentDialogOpen(open); if (!open) setEditingTournament(undefined); }} onSave={handleSaveTournament} tournament={editingTournament} saving={saving} />
      <DeleteConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={handleConfirmDelete} title={`Delete ${deleteTarget?.type ? deleteTarget.type.charAt(0).toUpperCase() + deleteTarget.type.slice(1) : ''}?`} description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`} isLoading={saving} />
      <DeleteConfirmDialog open={deleteSampleDialogOpen} onOpenChange={setDeleteSampleDialogOpen} onConfirm={handleConfirmDeleteSampleData} title="Delete sample data?" description='This will remove all records prefixed with "(Sample)" and all related performance inputs. This action cannot be undone.' isLoading={saving} />
      {notesMatch && (
        <MatchNotesEditor
          matchId={notesMatch.id}
          matchLabel={`${new Date(notesMatch.match_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} vs ${notesMatch.opponent_name || 'Unknown'}`}
          initialNotes={notesMatch.notes || null}
          open={!!notesMatch}
          onOpenChange={(open) => { if (!open) setNotesMatch(null); }}
          onSaved={fetchData}
        />
      )}
    </div>
  );
};

export default Admin;
