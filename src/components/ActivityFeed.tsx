import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Trophy, Target, Zap } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'high_score' | 'wickets' | 'match' | 'milestone';
  message: string;
  detail: string;
  timestamp: string;
  icon: typeof Activity;
  color: string;
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      // Fetch recent performances with match & player info
      const { data: performances } = await supabase
        .from('performances')
        .select('id, runs_scored, wickets, catches, match_id, player_id, players(name), matches(match_date, opponent_name, result)')
        .order('match_id', { ascending: false })
        .limit(100);

      if (!performances) { setLoading(false); return; }

      const items: ActivityItem[] = [];

      for (const p of performances) {
        const player = (p as any).players?.name || 'Unknown';
        const match = (p as any).matches;
        const opponent = match?.opponent_name || 'Unknown';
        const date = match?.match_date || '';

        if ((p.runs_scored || 0) >= 50) {
          items.push({
            id: `score-${p.id}`,
            type: 'high_score',
            message: `${player} scored ${p.runs_scored} vs ${opponent}`,
            detail: (p.runs_scored || 0) >= 100 ? '💯 Century!' : '⭐ Half Century!',
            timestamp: date,
            icon: Zap,
            color: (p.runs_scored || 0) >= 100 ? 'text-amber-500' : 'text-emerald-500',
          });
        }

        if ((p.wickets || 0) >= 3) {
          items.push({
            id: `wicket-${p.id}`,
            type: 'wickets',
            message: `${player} took ${p.wickets} wickets vs ${opponent}`,
            detail: (p.wickets || 0) >= 5 ? '🔥 5-fer!' : '🎯 3+ wickets!',
            timestamp: date,
            icon: Target,
            color: 'text-red-500',
          });
        }
      }

      // Fetch recent matches
      const { data: recentMatches } = await supabase
        .from('matches')
        .select('id, match_date, opponent_name, result, our_score, opponent_score')
        .order('match_date', { ascending: false })
        .limit(5);

      if (recentMatches) {
        for (const m of recentMatches) {
          items.push({
            id: `match-${m.id}`,
            type: 'match',
            message: `${m.result || 'Played'} vs ${m.opponent_name || 'Unknown'}`,
            detail: `${m.our_score || 0} - ${m.opponent_score || 0}`,
            timestamp: m.match_date || '',
            icon: Trophy,
            color: m.result === 'Won' ? 'text-emerald-500' : m.result === 'Lost' ? 'text-red-500' : 'text-muted-foreground',
          });
        }
      }

      // Sort by date, most recent first
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(items.slice(0, 15));
      setLoading(false);
    };

    fetchActivity();
  }, []);

  if (loading) return null;
  if (activities.length === 0) return null;

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="w-5 h-5 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {activities.map((item) => (
            <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors">
              <item.icon className={`w-5 h-5 mt-0.5 shrink-0 ${item.color}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-tight">{item.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">{item.detail}</Badge>
                  {item.timestamp && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
