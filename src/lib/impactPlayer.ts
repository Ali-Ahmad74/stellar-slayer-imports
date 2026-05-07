/**
 * Impact Player calculation
 * Batting impact: 30+ runs OR strike rate >= 180 (min 5 balls)
 * Bowling impact: 2+ wickets OR economy <= 6 (min 12 balls = 2 overs)
 * All-round: both batting AND bowling impact in same match
 */
export type ImpactKind = "batting" | "bowling" | "allround" | null;

export interface ImpactInputs {
  runs?: number;
  balls?: number;
  wickets?: number;
  bowlBalls?: number;
  runsConceded?: number;
}

export function getImpactKind(p: ImpactInputs): ImpactKind {
  const runs = p.runs ?? 0;
  const balls = p.balls ?? 0;
  const sr = balls >= 5 ? (runs / balls) * 100 : 0;
  const battingImpact = runs >= 30 || sr >= 180;

  const wkts = p.wickets ?? 0;
  const bb = p.bowlBalls ?? 0;
  const econ = bb >= 12 ? (p.runsConceded ?? 0) / (bb / 6) : Infinity;
  const bowlingImpact = wkts >= 2 || econ <= 6;

  if (battingImpact && bowlingImpact) return "allround";
  if (battingImpact) return "batting";
  if (bowlingImpact) return "bowling";
  return null;
}

export const IMPACT_BADGE: Record<NonNullable<ImpactKind>, { emoji: string; label: string; classes: string }> = {
  batting: { emoji: "🏏", label: "Batting Impact", classes: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40" },
  bowling: { emoji: "🎯", label: "Bowling Impact", classes: "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/40" },
  allround: { emoji: "⚡", label: "All-round Impact", classes: "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/40" },
};