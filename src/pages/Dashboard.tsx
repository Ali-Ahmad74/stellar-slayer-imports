import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { usePlayerRankings } from '@/hooks/usePlayerRankings';
import { Loader2, Trophy, Target, TrendingUp, Users, Calendar, Zap, Award, Activity, MapPin, Flame, ArrowUp, ArrowDown } from 'lucide-react';
import { TeamAchievements } from '@/components/TeamAchievements';
import { TeamRecords } from '@/components/TeamRecords';
import { ActivityFeed } from '@/components/ActivityFeed';
import { BackupExportButton } from '@/components/BackupExportButton';
import { useAuth } from '@/hooks/useAuth';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend, LineChart, Line
} from 'recharts';
import { SeasonFilter } from '@/components/SeasonFilter';
import { SiteFooter } from '@/components/SiteFooter';

interface Match {
  id: number;
  match_date: string;
  result: string | null;
  our_score: number | null;
  opponent_score: number | null;
  venue: string | null;
  opponent_name: string | null;
}

const Dashboard = () => {
  const { isAdmin } = useAuth();
  const { players, loading: playersLoading } = usePlayerRankings();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('all');

  useEffect(() => {
    const fetchMatches = async () => {
      const { data } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: true });
      setMatches(data || []);
      setLoading(false);
    };
    fetchMatches();
  }, []);

  const years = useMemo(() => {
    const uniqueYears = [...new Set(matches.map(m => new Date(m.match_date).getFullYear()))];
    return uniqueYears.sort((a, b) => b - a);
  }, [matches]);

  const filteredMatches = useMemo(() => {
    if (selectedYear === 'all') return matches;
    return matches.filter(m => new Date(m.match_date).getFullYear().toString() === selectedYear);
  }, [matches, selectedYear]);

  const isLoading = loading || playersLoading;

  // Basic stats
  const totalMatches = filteredMatches.length;
  const wins = filteredMatches.filter(m => m.result === 'Won').length;
  const losses = filteredMatches.filter(m => m.result === 'Lost').length;
  const draws = filteredMatches.filter(m => m.result === 'Tied' || m.result === 'Draw').length;
  const winRate = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : '0';

  const totalRuns = players.reduce((sum, p) => sum + (p.stats?.total_runs || 0), 0);
  const totalWickets = players.reduce((sum, p) => sum + (p.stats?.wickets || 0), 0);
  const totalCatches = players.reduce((sum, p) => sum + (p.stats?.catches || 0), 0);
  const totalSixes = players.reduce((sum, p) => sum + (p.stats?.sixes || 0), 0);
  const totalFours = players.reduce((sum, p) => sum + (p.stats?.fours || 0), 0);
  const totalFifties = players.reduce((sum, p) => sum + (p.stats?.fifties || 0), 0);
  const totalHundreds = players.reduce((sum, p) => sum + (p.stats?.hundreds || 0), 0);
  const totalThreeFers = players.reduce((sum, p) => sum + (p.stats?.three_fers || 0), 0);
  const totalFiveFers = players.reduce((sum, p) => sum + (p.stats?.five_fers || 0), 0);

  // Top performers
  const topScorer = players.reduce((top, p) => 
    (p.stats?.total_runs || 0) > (top?.stats?.total_runs || 0) ? p : top, players[0]);
  const topWicketTaker = players.reduce((top, p) => 
    (p.stats?.wickets || 0) > (top?.stats?.wickets || 0) ? p : top, players[0]);
  const topFielder = players.reduce((top, p) => 
    (p.stats?.catches || 0) > (top?.stats?.catches || 0) ? p : top, players[0]);

  // ── Win/Loss Streaks ──
  const streaks = useMemo(() => {
    let currentStreak = { type: '', count: 0 };
    let longestWinStreak = 0;
    let longestLossStreak = 0;
    let tempWin = 0;
    let tempLoss = 0;

    const sorted = [...filteredMatches].sort((a, b) => 
      new Date(a.match_date).getTime() - new Date(b.match_date).getTime()
    );

    for (const m of sorted) {
      if (m.result === 'Won') {
        tempWin++;
        tempLoss = 0;
        longestWinStreak = Math.max(longestWinStreak, tempWin);
      } else if (m.result === 'Lost') {
        tempLoss++;
        tempWin = 0;
        longestLossStreak = Math.max(longestLossStreak, tempLoss);
      } else {
        tempWin = 0;
        tempLoss = 0;
      }
    }

    // Current streak from the end
    for (let i = sorted.length - 1; i >= 0; i--) {
      const r = sorted[i].result;
      if (currentStreak.count === 0) {
        currentStreak = { type: r || '', count: 1 };
      } else if (r === currentStreak.type) {
        currentStreak.count++;
      } else {
        break;
      }
    }

    return { currentStreak, longestWinStreak, longestLossStreak };
  }, [filteredMatches]);

  // ── Venue Performance ──
  const venueStats = useMemo(() => {
    const map = new Map<string, { venue: string; matches: number; wins: number; losses: number; avgScore: number; totalScore: number }>();
    for (const m of filteredMatches) {
      const venue = m.venue || 'Unknown';
      const existing = map.get(venue) || { venue, matches: 0, wins: 0, losses: 0, avgScore: 0, totalScore: 0 };
      existing.matches++;
      if (m.result === 'Won') existing.wins++;
      if (m.result === 'Lost') existing.losses++;
      existing.totalScore += m.our_score || 0;
      map.set(venue, existing);
    }
    return Array.from(map.values())
      .map(v => ({ ...v, avgScore: v.matches > 0 ? Math.round(v.totalScore / v.matches) : 0, winRate: v.matches > 0 ? Math.round((v.wins / v.matches) * 100) : 0 }))
      .sort((a, b) => b.matches - a.matches)
      .slice(0, 6);
  }, [filteredMatches]);

  // ── Monthly Trends (enhanced) ──
  const monthlyData = useMemo(() => {
    return filteredMatches.reduce((acc: any[], match) => {
      const month = new Date(match.match_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const existing = acc.find(m => m.month === month);
      if (existing) {
        existing.matches += 1;
        existing.wins += match.result === 'Won' ? 1 : 0;
        existing.losses += match.result === 'Lost' ? 1 : 0;
        existing.runs += match.our_score || 0;
        existing.conceded += match.opponent_score || 0;
      } else {
        acc.push({
          month,
          matches: 1,
          wins: match.result === 'Won' ? 1 : 0,
          losses: match.result === 'Lost' ? 1 : 0,
          runs: match.our_score || 0,
          conceded: match.opponent_score || 0,
        });
      }
      return acc;
    }, []);
  }, [filteredMatches]);

  // ── Opponent Record ──
  const opponentStats = useMemo(() => {
    const map = new Map<string, { opponent: string; matches: number; wins: number; losses: number }>();
    for (const m of filteredMatches) {
      const opp = m.opponent_name || 'Unknown';
      const existing = map.get(opp) || { opponent: opp, matches: 0, wins: 0, losses: 0 };
      existing.matches++;
      if (m.result === 'Won') existing.wins++;
      if (m.result === 'Lost') existing.losses++;
      map.set(opp, existing);
    }
    return Array.from(map.values())
      .sort((a, b) => b.matches - a.matches)
      .slice(0, 8);
  }, [filteredMatches]);

  // ── Score Trend ──
  const scoreTrend = useMemo(() => {
    return [...filteredMatches]
      .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
      .map((m, i) => ({
        match: i + 1,
        date: new Date(m.match_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        ourScore: m.our_score || 0,
        oppScore: m.opponent_score || 0,
        result: m.result,
      }));
  }, [filteredMatches]);

  // Win/Loss pie data
  const resultData = [
    { name: 'Wins', value: wins, color: 'hsl(142, 71%, 45%)' },
    { name: 'Losses', value: losses, color: 'hsl(0, 84%, 60%)' },
    { name: 'Draws/Ties', value: draws, color: 'hsl(var(--accent))' },
  ].filter(d => d.value > 0);

  // Role distribution
  const roleData = players.reduce((acc: any[], p) => {
    const existing = acc.find(r => r.name === p.role);
    if (existing) existing.value += 1;
    else acc.push({ name: p.role, value: 1 });
    return acc;
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground font-display text-center md:text-left">
              📊 Team Dashboard
            </h1>
            <p className="text-muted-foreground text-center md:text-left">
              Comprehensive overview of team performance
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && <BackupExportButton />}
            <SeasonFilter 
              years={years} 
              selectedYear={selectedYear} 
              onYearChange={setSelectedYear} 
            />
          </div>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          {[
            { label: 'Matches', value: totalMatches, icon: Calendar, color: 'text-primary' },
            { label: 'Win Rate', value: `${winRate}%`, icon: Trophy, color: 'text-emerald-500' },
            { label: 'Total Runs', value: totalRuns.toLocaleString(), icon: Zap, color: 'text-amber-500' },
            { label: 'Wickets', value: totalWickets, icon: Target, color: 'text-red-500' },
            { label: 'Catches', value: totalCatches, icon: Activity, color: 'text-blue-500' },
            { label: 'Sixes', value: totalSixes, icon: TrendingUp, color: 'text-purple-500' },
            { label: 'Players', value: players.length, icon: Users, color: 'text-cyan-500' },
            { label: '50s/100s', value: `${totalFifties}/${totalHundreds}`, icon: Award, color: 'text-orange-500' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card variant="stat" className="h-full">
                <CardContent className="p-4 text-center">
                  <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Streaks Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <Card variant="elevated">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                streaks.currentStreak.type === 'Won' ? 'bg-emerald-500/20' : streaks.currentStreak.type === 'Lost' ? 'bg-red-500/20' : 'bg-muted'
              }`}>
                {streaks.currentStreak.type === 'Won' ? (
                  <ArrowUp className="w-6 h-6 text-emerald-500" />
                ) : (
                  <ArrowDown className="w-6 h-6 text-red-500" />
                )}
              </div>
              <div>
                <p className="text-2xl font-bold">{streaks.currentStreak.count}</p>
                <p className="text-xs text-muted-foreground">Current {streaks.currentStreak.type || 'N/A'} Streak</p>
              </div>
            </CardContent>
          </Card>
          <Card variant="elevated">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Flame className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{streaks.longestWinStreak}</p>
                <p className="text-xs text-muted-foreground">Best Win Streak</p>
              </div>
            </CardContent>
          </Card>
          <Card variant="elevated">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <ArrowDown className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{streaks.longestLossStreak}</p>
                <p className="text-xs text-muted-foreground">Worst Loss Streak</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Win/Loss Pie */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
            <Card variant="elevated" className="h-full">
              <CardHeader><CardTitle className="text-lg">Match Results</CardTitle></CardHeader>
              <CardContent>
                {resultData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={resultData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {resultData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">No match data</div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Score Trend */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
            <Card variant="elevated" className="h-full">
              <CardHeader><CardTitle className="text-lg">Score Trend (Our vs Opponent)</CardTitle></CardHeader>
              <CardContent>
                {scoreTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={scoreTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend />
                      <Line type="monotone" dataKey="ourScore" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Our Score" />
                      <Line type="monotone" dataKey="oppScore" stroke="hsl(0, 84%, 60%)" strokeWidth={2} dot={{ r: 3 }} name="Opp Score" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">No data</div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Monthly Trends */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mb-8">
          <Card variant="elevated">
            <CardHeader><CardTitle className="text-lg">📅 Monthly Performance</CardTitle></CardHeader>
            <CardContent>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                    <Bar dataKey="wins" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} name="Wins" />
                    <Bar dataKey="losses" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} name="Losses" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">No data</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Venue Performance + Opponent Record */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Venue Performance */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <Card variant="elevated" className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="w-5 h-5 text-primary" />
                  Venue Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {venueStats.length > 0 ? (
                  <div className="space-y-3">
                    {venueStats.map((v) => (
                      <div key={v.venue} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{v.venue}</p>
                          <p className="text-xs text-muted-foreground">{v.matches} matches • Avg {v.avgScore} runs</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant={v.winRate >= 50 ? 'default' : 'secondary'} className="text-xs">
                            {v.winRate}% WR
                          </Badge>
                          <span className="text-xs text-muted-foreground">{v.wins}W-{v.losses}L</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No venue data</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Opponent Record */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <Card variant="elevated" className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  ⚔️ Opponent Record
                </CardTitle>
              </CardHeader>
              <CardContent>
                {opponentStats.length > 0 ? (
                  <div className="space-y-3">
                    {opponentStats.map((o) => {
                      const wr = o.matches > 0 ? Math.round((o.wins / o.matches) * 100) : 0;
                      return (
                        <div key={o.opponent} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div>
                            <p className="font-medium text-sm">{o.opponent}</p>
                            <p className="text-xs text-muted-foreground">{o.matches} matches</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={wr >= 50 ? 'default' : 'secondary'} className="text-xs">
                              {wr}% WR
                            </Badge>
                            <span className="text-xs text-emerald-500 font-medium">{o.wins}W</span>
                            <span className="text-xs text-red-500 font-medium">{o.losses}L</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No opponent data</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Top Performers */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="mb-8">
          <h2 className="text-2xl font-bold mb-4">🏆 Top Performers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Top Run Scorer', player: topScorer, stat: topScorer?.stats?.total_runs || 0, label: 'Runs', icon: '🏏', color: 'from-emerald-500 to-teal-600' },
              { title: 'Top Wicket Taker', player: topWicketTaker, stat: topWicketTaker?.stats?.wickets || 0, label: 'Wickets', icon: '🎯', color: 'from-red-500 to-rose-600' },
              { title: 'Top Fielder', player: topFielder, stat: topFielder?.stats?.catches || 0, label: 'Catches', icon: '🧤', color: 'from-blue-500 to-indigo-600' },
            ].map((item) => (
              <Card key={item.title} variant="performer">
                <CardHeader className={`bg-gradient-to-r ${item.color} text-white rounded-t-xl`}>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{item.icon}</span>
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold font-display text-primary mb-2">{item.stat}</div>
                  <p className="text-lg font-semibold">{item.player?.name || 'N/A'}</p>
                  <p className="text-muted-foreground text-sm">{item.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Team Achievements & Partnerships */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mb-8">
          <TeamAchievements players={players.map(p => ({ id: p.id, name: p.name, photo_url: p.photo_url }))} />
        </motion.div>

        {/* Team Records */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="mb-8">
          <TeamRecords players={players.map(p => ({ id: p.id, name: p.name, photo_url: p.photo_url }))} />
        </motion.div>

        {/* Team Composition & Milestones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.55 }}>
            <Card variant="elevated">
              <CardHeader><CardTitle className="text-lg">Team Composition</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={roleData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Players" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.55 }}>
            <Card variant="elevated">
              <CardHeader><CardTitle className="text-lg">Team Milestones</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: '30+ Scores', value: players.reduce((s, p) => s + (p.stats?.thirties || 0), 0), icon: '🎯' },
                    { label: '50+ Scores', value: totalFifties, icon: '⭐' },
                    { label: '100+ Scores', value: totalHundreds, icon: '💯' },
                    { label: '3+ Wickets', value: totalThreeFers, icon: '🔥' },
                    { label: '5+ Wickets', value: totalFiveFers, icon: '🏆' },
                    { label: 'Total Fours', value: totalFours, icon: '4️⃣' },
                  ].map((m) => (
                    <div key={m.label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <span className="text-2xl">{m.icon}</span>
                      <div>
                        <p className="text-xl font-bold">{m.value}</p>
                        <p className="text-xs text-muted-foreground">{m.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Dashboard;