import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { DEFAULT_TEAM_LOGO_URL } from '@/lib/constants';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Calendar, Download, GitCompare } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlayerSeasonFilter } from '@/components/PlayerSeasonFilter';
import { SocialShareButtons } from '@/components/SocialShareButtons';
import { supabase } from '@/integrations/supabase/client';
import { calculateICCPoints, usePlayerRankings } from '@/hooks/usePlayerRankings';
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
import { PlayerHero } from '@/components/player/PlayerHero';
import { PlayerOverviewTab } from '@/components/player/PlayerOverviewTab';
import { PlayerStatsTab } from '@/components/player/PlayerStatsTab';
import { PlayerRecordsTab } from '@/components/player/PlayerRecordsTab';
import { PlayerMatchesTab } from '@/components/player/PlayerMatchesTab';

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
  const [activeTab, setActiveTab] = useState('overview');

  const { getBattingRankings, getBowlingRankings, getFieldingRankings, getOverallRankings } = usePlayerRankings();
  const playerId = id ? Number(id) : null;

  const { data: attendance } = usePlayerAttendance(playerId);
  const { data: rankHistory } = usePlayerRankHistory(playerId);
  
  const { seasons, loading: seasonsLoading, latestSeasonId } = usePlayerSeasons(playerId);

  useEffect(() => {
    if (!seasonsLoading && !seasonInitialized && latestSeasonId) {
      setSelectedSeasonId(latestSeasonId);
      setSeasonInitialized(true);
    }
  }, [seasonsLoading, latestSeasonId, seasonInitialized]);

  const { stats, battingRecords, bowlingRecords, loading: statsLoading } = usePlayerStatsBySeason(playerId, selectedSeasonId);
  const { formData, stats: formStats } = useFormAnalysis(battingRecords, bowlingRecords);

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
          <Link to="/"><Button>Return to Rankings</Button></Link>
        </div>
      </div>
    );
  }

  const iccPoints = calculateICCPoints(stats, scoringSettings);
  const hasStats = stats && (stats.matches > 0 || stats.total_runs > 0 || stats.wickets > 0 || stats.catches > 0);

  // Ranks
  const batRank = getBattingRankings().find(p => p.id === playerId)?.rank;
  const bowlRank = getBowlingRankings().find(p => p.id === playerId)?.rank;
  const fieldRank = getFieldingRankings().find(p => p.id === playerId)?.rank;
  const overallRank = getOverallRankings().find(p => p.id === playerId)?.rank;

  // PDF export handler
  const handleExportPDF = async () => {
    if (!player) return;
    const statsData = stats || {
      matches: 0, total_runs: 0, total_balls: 0, fours: 0, sixes: 0,
      times_out: 0, thirties: 0, fifties: 0, hundreds: 0,
      wickets: 0, runs_conceded: 0, bowling_balls: 0, maidens: 0,
      wides: 0, no_balls: 0, dot_balls: 0, fours_conceded: 0,
      sixes_conceded: 0, three_fers: 0, five_fers: 0,
      catches: 0, runouts: 0, stumpings: 0, dropped_catches: 0
    };
    const unlockedAchievements = getUnlockedAchievements(statsData);
    const strikeRate = statsData.total_balls > 0 ? ((statsData.total_runs / statsData.total_balls) * 100).toFixed(2) : '0.00';
    const battingAverage = statsData.times_out > 0 ? (statsData.total_runs / statsData.times_out).toFixed(2) : statsData.total_runs?.toFixed(2) || '0.00';
    const economy = statsData.bowling_balls > 0 ? (statsData.runs_conceded / (statsData.bowling_balls / 6)).toFixed(2) : '0.00';
    const bowlingAverage = statsData.wickets > 0 ? (statsData.runs_conceded / statsData.wickets).toFixed(2) : '0.00';

    try {
      await exportPlayerFullStats(
        {
          name: player.name, role: player.role, photoUrl: player.photo_url,
          batting_style: player.batting_style, bowling_style: player.bowling_style,
          matches: statsData.matches || 0,
          total_runs: statsData.total_runs || 0, total_balls: statsData.total_balls || 0,
          fours: statsData.fours || 0, sixes: statsData.sixes || 0,
          times_out: statsData.times_out || 0, thirties: statsData.thirties || 0,
          fifties: statsData.fifties || 0, hundreds: statsData.hundreds || 0,
          battingAverage, strikeRate,
          wickets: statsData.wickets || 0, runs_conceded: statsData.runs_conceded || 0,
          bowling_balls: statsData.bowling_balls || 0, maidens: statsData.maidens || 0,
          wides: statsData.wides || 0, no_balls: statsData.no_balls || 0,
          dot_balls: statsData.dot_balls || 0, fours_conceded: statsData.fours_conceded || 0,
          sixes_conceded: statsData.sixes_conceded || 0, three_fers: statsData.three_fers || 0,
          five_fers: statsData.five_fers || 0, economy, bowlingAverage,
          catches: statsData.catches || 0, runouts: statsData.runouts || 0,
          stumpings: statsData.stumpings || 0, dropped_catches: statsData.dropped_catches || 0,
          battingPoints: iccPoints.battingPoints, bowlingPoints: iccPoints.bowlingPoints,
          fieldingPoints: iccPoints.fieldingPoints, totalPoints: iccPoints.totalPoints,
          seasonName: selectedSeasonName,
          achievements: unlockedAchievements.map(a => ({ name: a.name, icon: a.icon, tier: a.tier, category: a.category })),
        },
        { teamName: teamSettings?.team_name, logoUrl: teamSettings?.team_logo_url || DEFAULT_TEAM_LOGO_URL, watermarkHandle: teamSettings?.watermark_handle }
      );
    } catch (error) {
      console.error('PDF export failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-6 md:py-8">
        {/* Top Bar */}
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Button variant="outline" size="sm" className="gap-2 w-fit" onClick={() => navigate(backTo)}>
            <ArrowLeft className="w-4 h-4" />
            {backLabel}
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <PlayerSeasonFilter 
                seasons={seasons}
                selectedSeasonId={selectedSeasonId}
                onSeasonChange={setSelectedSeasonId}
                loading={seasonsLoading}
              />
            </div>
            <Button size="sm" onClick={() => setShareOpen(true)}>Share</Button>
            <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate('/compare', { state: { preselect: playerId } })}>
              <GitCompare className="w-3.5 h-3.5" /> Compare
            </Button>
            {isAdmin && (
              <>
                <Button onClick={handleExportPDF} variant="outline" size="sm" className="gap-1" disabled={!hasStats}>
                  <Download className="w-3.5 h-3.5" /> PDF
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Social Share */}
        <div className="mb-5">
          <SocialShareButtons playerName={player.name} stats={stats} teamName={teamSettings?.team_name} />
        </div>

        {/* Hero Section - ESPN Cricinfo Style */}
        <PlayerHero player={player} formStats={formStats} />

        {/* Tabs - ESPN Cricinfo Style */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-0">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto gap-0 overflow-x-auto">
            {['Overview', 'Stats', 'Records', 'Matches'].map(tab => (
              <TabsTrigger
                key={tab}
                value={tab.toLowerCase()}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 sm:px-6 py-3 text-sm font-medium"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-6">
            {!hasStats && !statsLoading && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold mb-2">No Stats Available</h3>
                <p className="text-muted-foreground">
                  {selectedSeasonId !== 'all'
                    ? `No performance records found for ${selectedSeasonName}. Try selecting a different season.`
                    : 'No performance records found for this player yet.'}
                </p>
              </div>
            )}

            <TabsContent value="overview" className="mt-0">
              <PlayerOverviewTab
                player={player}
                stats={stats}
                selectedSeasonName={selectedSeasonName}
                attendance={attendance}
                ranks={{ bat: batRank, bowl: bowlRank, field: fieldRank, overall: overallRank }}
              />
            </TabsContent>

            <TabsContent value="stats" className="mt-0">
              {hasStats && (
                <PlayerStatsTab
                  stats={stats}
                  selectedSeasonId={selectedSeasonId}
                  selectedSeasonName={selectedSeasonName}
                  iccPoints={iccPoints}
                />
              )}
            </TabsContent>

            <TabsContent value="records" className="mt-0">
              {hasStats && (
                <PlayerRecordsTab
                  stats={stats}
                  rankHistory={rankHistory}
                  formData={formData}
                  formStats={formStats}
                  battingRecords={battingRecords}
                  bowlingRecords={bowlingRecords}
                  playerId={playerId!}
                  playerName={player.name}
                  selectedSeasonId={selectedSeasonId}
                />
              )}
            </TabsContent>

            <TabsContent value="matches" className="mt-0">
              <PlayerMatchesTab battingRecords={battingRecords} bowlingRecords={bowlingRecords} />
            </TabsContent>
          </div>
        </Tabs>
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
