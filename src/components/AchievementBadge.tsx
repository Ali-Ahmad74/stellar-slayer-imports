import { motion } from "framer-motion";
import { Achievement, TIER_BG, TIER_COLORS, TIER_LABEL } from "@/lib/achievements";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked?: boolean;
  showTooltip?: boolean;
  size?: "sm" | "md" | "lg";
}

export function AchievementBadge({ 
  achievement, 
  unlocked = true, 
  showTooltip = true,
  size = "md" 
}: AchievementBadgeProps) {
  const sizeClasses = {
    sm: "w-12 h-12 text-xl",
    md: "w-16 h-16 text-3xl",
    lg: "w-24 h-24 text-5xl",
  };

  const nameSizeClasses = {
    sm: "text-[10px] max-w-[70px]",
    md: "text-xs max-w-[90px]",
    lg: "text-sm max-w-[110px]",
  };

  const tierLabelSize = {
    sm: "text-[8px] px-1.5 py-0.5",
    md: "text-[9px] px-2 py-0.5",
    lg: "text-[10px] px-2.5 py-1",
  };

  const badge = (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.08, y: -2 }}
      className="flex flex-col items-center gap-1.5"
    >
      <div
        className={`
          relative flex items-center justify-center rounded-2xl border-2 shadow-md
          ${sizeClasses[size]}
          ${unlocked ? TIER_BG[achievement.tier] : "bg-muted/30 border-muted grayscale opacity-40"}
          transition-all duration-300
        `}
      >
        {unlocked && (
          <>
            <div 
              className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${TIER_COLORS[achievement.tier]} opacity-20`} 
            />
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-white/10 to-transparent opacity-50" />
          </>
        )}
        <span className={`relative z-10 ${unlocked ? "drop-shadow-md" : "opacity-40"}`}>{achievement.icon}</span>
      </div>
      
      {/* Name */}
      <span className={`${nameSizeClasses[size]} text-center font-semibold leading-tight ${unlocked ? "text-foreground" : "text-muted-foreground opacity-40"}`}>
        {achievement.name}
      </span>
      
      {/* Tier label */}
      {unlocked && (
        <span className={`${tierLabelSize[size]} rounded-full font-bold uppercase tracking-wider ${
          achievement.tier === "platinum" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" :
          achievement.tier === "gold" ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30" :
          achievement.tier === "silver" ? "bg-slate-400/20 text-slate-400 border border-slate-400/30" :
          "bg-amber-600/20 text-amber-600 border border-amber-600/30"
        }`}>
          {TIER_LABEL[achievement.tier]}
        </span>
      )}
    </motion.div>
  );

  if (!showTooltip) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent className="max-w-xs p-3">
        <div className="space-y-1.5">
          <p className="font-bold text-base">{achievement.icon} {achievement.name}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{achievement.description}</p>
          <div className="flex gap-2 pt-1">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
              achievement.tier === "platinum" ? "bg-cyan-500/20 text-cyan-400" :
              achievement.tier === "gold" ? "bg-yellow-500/20 text-yellow-500" :
              achievement.tier === "silver" ? "bg-slate-400/20 text-slate-400" :
              "bg-amber-600/20 text-amber-600"
            }`}>{TIER_LABEL[achievement.tier]}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{achievement.category}</span>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
