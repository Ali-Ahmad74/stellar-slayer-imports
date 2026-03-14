import { Download, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExportButtonProps {
  onExportPlayersPDF?: () => void;
  onExportMatchesPDF?: () => void;
  onExportPNG?: () => void;
  // Legacy compat
  onExportPlayers?: () => void;
  onExportMatches?: () => void;
  disabled?: boolean;
}

export function ExportButton({ 
  onExportPlayersPDF, 
  onExportMatchesPDF, 
  onExportPNG,
  onExportPlayers,
  onExportMatches,
  disabled 
}: ExportButtonProps) {
  const playersPDF = onExportPlayersPDF || onExportPlayers;
  const matchesPDF = onExportMatchesPDF || onExportMatches;
  
  const actions = [
    playersPDF && { label: "Player Stats (PDF)", icon: "📊", handler: playersPDF },
    matchesPDF && { label: "Match Data (PDF)", icon: "📋", handler: matchesPDF },
    onExportPNG && { label: "Screenshot (PNG)", icon: "📸", handler: onExportPNG },
  ].filter(Boolean) as { label: string; icon: string; handler: () => void }[];

  if (actions.length === 0) return null;

  if (actions.length === 1) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={actions[0].handler} 
        disabled={disabled}
        className="gap-2"
      >
        <Download className="w-4 h-4" />
        Export
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {actions.map((action, i) => (
          <DropdownMenuItem key={i} onClick={action.handler} className="gap-2">
            <span>{action.icon}</span>
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
