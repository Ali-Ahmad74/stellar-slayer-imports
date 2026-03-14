import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Calendar, Download, Image, ClipboardCheck, Crown, Trophy, Cake, Hash, Globe, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { RoleBadge } from '@/components/RoleBadge';
import { PlayerAchievements } from '@/components/PlayerAchievements';
import { FormAnalysisChart } from '@/components/FormAnalysisChart';
import { PlayerSeasonFilter } from '@/components/PlayerSeasonFilter';
import { OpponentBreakdown } from '@/components/OpponentBreakdown';
import { PlayerPerformanceChart } from '@/components/PlayerPerformanceChart';
import { PlayerBestPerformances } from '@/components/PlayerBestPerformances';
import { PlayerFormBadge } from '@/components/PlayerFormBadge';
import { PlayerMatchLog } from '@/components/PlayerMatchLog';
import { SocialShareButtons } from '@/components/SocialShareButtons';
import { supabase } from '@/integrations/supabase/client';
import { calculateICCPoints, PlayerStats as PlayerStatsType, usePlayerRankings } from '@/hooks/usePlayerRankings';
import { usePlayerSeasons } from '@/hooks/usePlayerSeasons';
import { usePlayerStatsBySeason } from '@/hooks/usePlayerStatsBySeason';
import { useFormAnalysis } from '@/hooks/useFormAnalysis';
import { usePlayerAttendance } from '@/hooks/usePlayerAttendance';
import { usePlayerRankHistory } from '@/hooks/usePlayerRankHistory';
import type { PlayerRole } from '@/types/cricket';
import { useScoringSettings } from '@/hooks/useScoringSettings';
import { useTeamSettings } from '@/hooks/useTeamSettings';
import { SharePlayerCardDialog } from '@/components/SharePlayerCardDialog';
import { useAuth } from '@/hooks/useAuth';
import { exportPlayerFullStats } from '@/lib/pdf-export';
import { getUnlockedAchievements } from '@/lib/achievements';

interface Player {
  id: number;
  name: string;
  role: PlayerRole;
  photo_url: string | null;
  batting_style: string | null;
  bowling_style: string | null;
  date_of_birth: string | null;
  debut_date: string | null;
  jersey_number: number | null;
  nationality: string | null;
  bio: string | null;
}

const PlayerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine back navigation based on where the user came from
  const fromState = (location.state as { from?: string; fromLabel?: string }) || {};
  const backTo = fromState.from || '/';
  const backLabel = fromState.fromLabel || 'Back to Rankings';
  const [player, setPlayer] = useState<Player | null>(null);
  const [playerLoading, setPlayerLoading] = useState(true);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('all');
  const [seasonInitialized, setSeasonInitialized] = useState(false);
  const { settings: scoringSettings } = useScoringSettings();
  const { teamSettings } = useTeamSettings();
  const { isAdmin } = useAuth();
  const [shareOpen, setShareOpen] = useState(false);

  // Get rankings for rank display
  const { getBattingRankings, getBowlingRankings, getFieldingRankings, getOverallRankings } = usePlayerRankings();

  const playerId = id ? Number(id) : null;

  // Attendance & rank history hooks
  const { data: attendance } = usePlayerAttendance(playerId);
  const { data: rankHistory } = usePlayerRankHistory(playerId);
  
  // Fetch available seasons for this player
  const { 
    seasons, 
    loading: seasonsLoading, 
    latestSeasonId 
  } = usePlayerSeasons(playerId);

  // Set default season to latest when loaded
  useEffect(() => {
    if (!seasonsLoading && !seasonInitialized && latestSeasonId) {
      setSelectedSeasonId(latestSeasonId);
      setSeasonInitialized(true);
    }
  }, [seasonsLoading, latestSeasonId, seasonInitialized]);

  // Fetch stats filtered by season
  const { 
    stats, 
    battingRecords, 
    bowlingRecords, 
    loading: statsLoading 
  } = usePlayerStatsBySeason(playerId, selectedSeasonId);
  
  const { formData, stats: formStats } = useFormAnalysis(battingRecords, bowlingRecords);

  // Fetch player basic info (only once)
  useEffect(() => {
    const fetchPlayer = async () => {
      if (!id) return;
      
      const { data: playerData } = await supabase
        .from('players')
        .select('*')
        .eq('id', Number(id))
        .maybeSingle();

      if (playerData) {
        setPlayer({
          ...playerData,
          role: playerData.role as PlayerRole,
          date_of_birth: (playerData as any).date_of_birth || null,
          debut_date: (playerData as any).debut_date || null,
          jersey_number: (playerData as any).jersey_number || null,
          nationality: (playerData as any).nationality || null,
          bio: (playerData as any).bio || null,
        });
      }
      setPlayerLoading(false);
    };

    fetchPlayer();
  }, [id]);

  const loading = playerLoading || seasonsLoading;

  // Get selected season name for display
  const selectedSeasonName = selectedSeasonId === 'all' 
    ? 'All Seasons' 
    : seasons.find(s => String(s.id) === selectedSeasonId)?.name || '';

  if (loading && playerLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Player Not Found</h1>
          <Link to="/">
            <Button>Return to Rankings</Button>
          </Link>
        </div>
      </div>
    );
  }

  const iccPoints = calculateICCPoints(stats, scoringSettings);

  // Calculate derived stats
  const strikeRate = stats && stats.total_balls > 0 
    ? ((stats.total_runs / stats.total_balls) * 100).toFixed(2) 
    : '0.00';
  
  const battingAverage = stats && stats.times_out > 0 
    ? (stats.total_runs / stats.times_out).toFixed(2) 
    : stats?.total_runs?.toFixed(2) || '0.00';

  const economy = stats && stats.bowling_balls > 0 
    ? (stats.runs_conceded / (stats.bowling_balls / 6)).toFixed(2) 
    : '0.00';

  const bowlingAverage = stats && stats.wickets > 0
    ? (stats.runs_conceded / stats.wickets).toFixed(2)
    : '0.00';

  const hasStats = stats && (
    stats.matches > 0 || 
    stats.total_runs > 0 || 
    stats.wickets > 0 || 
    stats.catches > 0
  );

  // Handle PDF export
  const handleExportPDF = async () => {
    if (!player) {
      console.error('Cannot export: player data not loaded');
      return;
    }
    
    // Use empty stats object if stats is null
    const statsData = stats || {
      matches: 0, total_runs: 0, total_balls: 0, fours: 0, sixes: 0,
      times_out: 0, thirties: 0, fifties: 0, hundreds: 0,
      wickets: 0, runs_conceded: 0, bowling_balls: 0, maidens: 0,
      wides: 0, no_balls: 0, dot_balls: 0, fours_conceded: 0,
      sixes_conceded: 0, three_fers: 0, five_fers: 0,
      catches: 0, runouts: 0, stumpings: 0, dropped_catches: 0
    };

    // Get unlocked achievements
    const unlockedAchievements = getUnlockedAchievements(statsData);
    const achievementsData = unlockedAchievements.map(a => ({
      name: a.name,
      icon: a.icon,
      tier: a.tier,
      category: a.category,
    }));

    try {
      await exportPlayerFullStats(
        {
          name: player.name,
          role: player.role,
          photoUrl: player.photo_url,
          batting_style: player.batting_style,
          bowling_style: player.bowling_style,
          matches: statsData.matches || 0,
          // Batting
          total_runs: statsData.total_runs || 0,
          total_balls: statsData.total_balls || 0,
          fours: statsData.fours || 0,
          sixes: statsData.sixes || 0,
          times_out: statsData.times_out || 0,
          thirties: statsData.thirties || 0,
          fifties: statsData.fifties || 0,
          hundreds: statsData.hundreds || 0,
          battingAverage,
          strikeRate,
          // Bowling
          wickets: statsData.wickets || 0,
          runs_conceded: statsData.runs_conceded || 0,
          bowling_balls: statsData.bowling_balls || 0,
          maidens: statsData.maidens || 0,
          wides: statsData.wides || 0,
          no_balls: statsData.no_balls || 0,
          dot_balls: statsData.dot_balls || 0,
          fours_conceded: statsData.fours_conceded || 0,
          sixes_conceded: statsData.sixes_conceded || 0,
          three_fers: statsData.three_fers || 0,
          five_fers: statsData.five_fers || 0,
          economy,
          bowlingAverage,
          // Fielding
          catches: statsData.catches || 0,
          runouts: statsData.runouts || 0,
          stumpings: statsData.stumpings || 0,
          dropped_catches: statsData.dropped_catches || 0,
          // Points
          battingPoints: iccPoints.battingPoints,
          bowlingPoints: iccPoints.bowlingPoints,
          fieldingPoints: iccPoints.fieldingPoints,
          totalPoints: iccPoints.totalPoints,
          // Season
          seasonName: selectedSeasonName,
          // Achievements
          achievements: achievementsData,
        },
        {
          teamName: teamSettings?.team_name,
          logoUrl: teamSettings?.team_logo_url,
          watermarkHandle: teamSettings?.watermark_handle,
        }
      );
      console.log('PDF export completed successfully');
    } catch (error) {
      console.error('PDF export failed:', error);
    }
  };

  // Handle PNG export - capture the profile section as image
  const handleExportPNG = async () => {
    try {
      const { default: html2canvas } = await import('html2canvas');
      const profileEl = document.querySelector('.gradient-header')?.parentElement;
      if (!profileEl) return;
      const canvas = await html2canvas(profileEl as HTMLElement, { 
        backgroundColor: null, 
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `${player?.name || 'player'}-stats.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('PNG export failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        {/* Back Button + Season Filter */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Button variant="outline" className="gap-2" onClick={() => navigate(backTo)}>
              <ArrowLeft className="w-4 h-4" />
              {backLabel}
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground whitespace-nowrap">Season:</span>
              <PlayerSeasonFilter 
                seasons={seasons}
                selectedSeasonId={selectedSeasonId}
                onSeasonChange={setSelectedSeasonId}
                loading={seasonsLoading}
              />
            </div>
            <Button onClick={() => setShareOpen(true)} className="whitespace-nowrap">
              Share Player Card
            </Button>
            {isAdmin && (
              <div className="flex gap-2">
                <Button 
                  onClick={handleExportPDF} 
                  variant="outline" 
                  className="whitespace-nowrap gap-2"
                  disabled={!hasStats}
                >
                  <Download className="w-4 h-4" />
                  PDF
                </Button>
                <Button
                  onClick={handleExportPNG}
                  variant="outline"
                  className="whitespace-nowrap gap-2"
                  disabled={!hasStats}
                >
                  <Image className="w-4 h-4" />
                  PNG
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Social Share */}
        <div className="mb-6">
          <SocialShareButtons 
            playerName={player.name} 
            stats={stats} 
            teamName={teamSettings?.team_name} 
          />
        </div>

        {/* Player Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="gradient-header rounded-2xl p-8 mb-8 text-white shadow-lg"
        >
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
            <PlayerAvatar name={player.name} photoUrl={player.photo_url} size="xl" />
            <div className="text-center md:text-left flex-1">
              <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                <h1 className="font-display text-4xl md:text-5xl font-bold">
                  {player.name}
                </h1>
                {player.jersey_number && (
                  <span className="bg-white/20 backdrop-blur-sm text-white font-display text-2xl font-bold px-3 py-1 rounded-xl">
                    #{player.jersey_number}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3">
                <RoleBadge role={player.role} />
                {player.batting_style && (
                  <span className="text-white/80 text-sm">{player.batting_style}</span>
                )}
                {player.bowling_style && (
                  <span className="text-white/80 text-sm">• {player.bowling_style}</span>
                )}
                {player.nationality && (
                  <span className="text-white/80 text-sm flex items-center gap-1"><Globe className="w-3 h-3" />{player.nationality}</span>
                )}
              </div>
              
              {/* Bio info line */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-white/70 text-sm mb-2">
                <span>{stats?.matches || 0} Matches {selectedSeasonId !== 'all' ? `in ${selectedSeasonName}` : 'Played'}</span>
                {player.date_of_birth && (() => {
                  const today = new Date();
                  const birth = new Date(player.date_of_birth!);
                  let age = today.getFullYear() - birth.getFullYear();
                  const m = today.getMonth() - birth.getMonth();
                  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
                  return (
                    <span className="flex items-center gap-1">
                      <Cake className="w-3 h-3" />
                      {age} years ({new Date(player.date_of_birth!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
                    </span>
                  );
                })()}
                {player.debut_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Debut: {new Date(player.debut_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
              </div>
              
              {player.bio && (
                <p className="text-white/60 text-sm italic max-w-lg">{player.bio}</p>
              )}
              
              {formStats.totalMatches >= 3 && (
                <PlayerFormBadge 
                  formTrend={formStats.formTrend} 
                  consistency={formStats.consistency} 
                />
              )}
            </div>
          </div>

          {/* Rank Cards in Header */}
          {statsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-white/70" />
              <span className="ml-2 text-white/70">Loading stats...</span>
            </div>
          ) : (() => {
            const batRank = getBattingRankings().find(p => p.id === playerId)?.rank;
            const bowlRank = getBowlingRankings().find(p => p.id === playerId)?.rank;
            const fieldRank = getFieldingRankings().find(p => p.id === playerId)?.rank;
            const overallRank = getOverallRankings().find(p => p.id === playerId)?.rank;
            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: '🏏', label: 'Batting Rank', value: batRank ? `#${batRank}` : '—', color: 'bg-emerald-500/20' },
                  { icon: '🎯', label: 'Bowling Rank', value: bowlRank ? `#${bowlRank}` : '—', color: 'bg-red-500/20' },
                  { icon: '🧤', label: 'Fielding Rank', value: fieldRank ? `#${fieldRank}` : '—', color: 'bg-blue-500/20' },
                  { icon: '👑', label: 'Overall Rank', value: overallRank ? `#${overallRank}` : '—', color: 'bg-yellow-500/20' },
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index }}
                    className={`${item.color} backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center`}
                  >
                    <span className="text-xl sm:text-2xl mb-1 block">{item.icon}</span>
                    <p className="text-2xl sm:text-3xl font-bold font-display">{item.value}</p>
                    <p className="text-xs sm:text-sm text-white/70">{item.label}</p>
                  </motion.div>
                ))}
              </div>
            );
          })()}
        </motion.div>

        {/* Stats Sections - moved achievements up, attendance after */}

        {!hasStats && !statsLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 mb-8"
          >
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">No Stats Available</h3>
            <p className="text-muted-foreground">
              {selectedSeasonId !== 'all' 
                ? `No performance records found for ${selectedSeasonName}. Try selecting a different season.`
                : 'No performance records found for this player yet.'}
            </p>
          </motion.div>
        )}

        {/* Stats Sections */}
        {hasStats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Batting Stats */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card variant="elevated">
                <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-xl">
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">🏏</span>
                    Batting Statistics
                    {selectedSeasonId !== 'all' && (
                      <span className="ml-auto text-sm font-normal bg-white/20 px-2 py-1 rounded">
                        {selectedSeasonName}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: stats?.total_runs || 0, label: 'Runs' },
                      { value: stats?.total_balls || 0, label: 'Balls' },
                      { value: strikeRate, label: 'SR' },
                      { value: battingAverage, label: 'Average' },
                      { value: stats?.fours || 0, label: 'Fours' },
                      { value: stats?.sixes || 0, label: 'Sixes' },
                      { value: stats?.times_out || 0, label: 'Dismissals' },
                      { value: stats ? (stats.matches - stats.times_out) : 0, label: 'Not Outs' },
                      { value: stats?.run_outs_as_batter || 0, label: 'Run Outs' },
                    ].map((item) => (
                      <div key={item.label} className="text-center p-3 bg-muted/50 rounded-xl">
                        <p className="text-xl sm:text-2xl font-bold font-display text-primary leading-tight">{item.value}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-tight">{item.label}</p>
                      </div>
                    ))}
                  </div>
                  {/* Milestones */}
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3">Milestones</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: stats?.thirties || 0, label: '30s', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
                        { value: stats?.fifties || 0, label: '50s', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
                        { value: stats?.hundreds || 0, label: '100s', bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400' },
                      ].map((item) => (
                        <div key={item.label} className={`text-center p-3 ${item.bg} rounded-lg`}>
                          <p className={`text-lg font-bold ${item.text}`}>{item.value}</p>
                          <p className="text-xs text-muted-foreground">{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Bowling Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card variant="elevated">
                <CardHeader className="bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-t-xl">
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    Bowling Statistics
                    {selectedSeasonId !== 'all' && (
                      <span className="ml-auto text-sm font-normal bg-white/20 px-2 py-1 rounded">
                        {selectedSeasonName}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: stats?.wickets || 0, label: 'Wickets' },
                      { value: bowlingAverage, label: 'Average' },
                      { value: economy, label: 'Economy' },
                      { value: stats?.runs_conceded || 0, label: 'Runs Given' },
                      { value: stats?.maidens || 0, label: 'Maidens' },
                      { value: `${stats?.wides || 0}/${stats?.no_balls || 0}`, label: 'Wd/Nb' },
                    ].map((item) => (
                      <div key={item.label} className="text-center p-3 bg-muted/50 rounded-xl">
                        <p className="text-xl sm:text-2xl font-bold font-display text-primary leading-tight">{item.value}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-tight">{item.label}</p>
                      </div>
                    ))}
                  </div>
                  {/* Bowling extras */}
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3">Additional Stats</h4>
                     <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {[
                        { value: stats?.dot_balls || 0, label: 'Dots', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
                        { value: stats?.three_fers || 0, label: '3-fers', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' },
                        { value: stats?.five_fers || 0, label: '5-fers', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
                        { value: (stats as any)?.hat_tricks || 0, label: 'Hat-Tricks', bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400' },
                        { value: stats?.fours_conceded || 0, label: '4s Given', bg: 'bg-muted', text: '' },
                        { value: stats?.sixes_conceded || 0, label: '6s Given', bg: 'bg-muted', text: '' },
                      ].map((item) => (
                        <div key={item.label} className={`text-center p-2 ${item.bg} rounded-lg`}>
                          <p className={`text-base sm:text-lg font-bold leading-tight ${item.text}`}>{item.value}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 leading-tight">{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Fielding Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-2"
            >
              <Card variant="elevated">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-xl">
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">🧤</span>
                    Fielding Statistics
                    {selectedSeasonId !== 'all' && (
                      <span className="ml-auto text-sm font-normal bg-white/20 px-2 py-1 rounded">
                        {selectedSeasonName}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { value: stats?.catches || 0, label: 'Catches', color: '' },
                      { value: stats?.runouts || 0, label: 'Run Outs', color: '' },
                      { value: stats?.stumpings || 0, label: 'Stumpings', color: '' },
                      { value: stats?.dropped_catches || 0, label: 'Dropped', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
                    ].map((item) => (
                      <div key={item.label} className={`text-center p-3 sm:p-4 ${item.bg || 'bg-muted/50'} rounded-xl`}>
                        <p className={`text-xl sm:text-2xl font-bold font-display leading-tight ${item.color || 'text-primary'}`}>{item.value}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-tight">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Achievements (with ranking milestones merged in) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <PlayerAchievements stats={{
                ...(stats || {}),
                _rank_top5: rankHistory?.highestOverallRank !== null && rankHistory!.highestOverallRank <= 5 ? 1 : 0,
                _rank_top3: rankHistory?.highestOverallRank !== null && rankHistory!.highestOverallRank <= 3 ? 1 : 0,
                _rank_no1: rankHistory?.highestOverallRank !== null && rankHistory!.highestOverallRank <= 1 ? 1 : 0,
                _rank_days_at_1: rankHistory?.daysAtNumber1 || 0,
              }} rankHistory={rankHistory || undefined} />
            </motion.div>

            {/* Attendance Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
              <Card variant="elevated">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ClipboardCheck className="w-5 h-5 text-primary" />
                    Attendance Record
                    <Badge variant="outline" className="ml-auto text-xs">Auto-calculated</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Matches Played</span>
                    <span className="text-lg font-bold font-display">{attendance?.attended || 0} / {attendance?.totalMatches || 0}</span>
                  </div>
                  <Progress value={attendance?.percentage || 0} className="h-3" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Attendance Rate</span>
                    <Badge variant={
                      (attendance?.percentage || 0) >= 80 ? 'default' : 
                      (attendance?.percentage || 0) >= 50 ? 'secondary' : 'destructive'
                    } className="text-sm font-bold">
                      {attendance?.percentage || 0}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Form Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <FormAnalysisChart data={formData} stats={formStats} type="batting" />
            </motion.div>

            {/* Best Performances */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
            >
              <PlayerBestPerformances battingRecords={battingRecords} bowlingRecords={bowlingRecords} />
            </motion.div>

            {/* Match Log */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <PlayerMatchLog battingRecords={battingRecords} bowlingRecords={bowlingRecords} />
            </motion.div>

            {/* Opponent Breakdown - full width */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 }}
              className="lg:col-span-2"
            >
              <OpponentBreakdown playerId={playerId!} />
            </motion.div>

            {/* Performance Trends - full width */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="lg:col-span-2"
            >
              <PlayerPerformanceChart playerId={playerId!} playerName={player.name} />
            </motion.div>
          </div>
        )}
      </main>

      {player && (
        <SharePlayerCardDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          player={{ ...player, stats }}
          teamName={teamSettings?.team_name}
          teamSettings={teamSettings}
          scoringSettings={scoringSettings}
        />
      )}
    </div>
  );
};

export default PlayerProfile;
