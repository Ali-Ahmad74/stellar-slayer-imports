import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PlayerFormBadgeProps {
  formTrend: number;
  consistency: number;
  recentMatches?: number;
}

export function PlayerFormBadge({ formTrend, consistency, recentMatches = 5 }: PlayerFormBadgeProps) {
  const getFormStatus = () => {
    if (formTrend > 20) return { label: '🔥 Hot Form', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: TrendingUp };
    if (formTrend > 5) return { label: '📈 Good Form', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: TrendingUp };
    if (formTrend > -5) return { label: '➡️ Steady', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Minus };
    if (formTrend > -20) return { label: '📉 Dip', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: TrendingDown };
    return { label: '⚠️ Poor Form', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: TrendingDown };
  };

  const form = getFormStatus();
  const Icon = form.icon;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge className={`${form.color} border px-2.5 py-1`}>
        <Icon className="w-3 h-3 mr-1" />
        {form.label}
      </Badge>
      <Badge variant="outline" className="text-white/70 border-white/20 px-2 py-1">
        {consistency}% Consistency
      </Badge>
    </div>
  );
}
