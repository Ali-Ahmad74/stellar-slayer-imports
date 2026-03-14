import { useState, useEffect, useMemo } from "react";
import { ClipboardCheck, Save, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Player {
  id: number;
  name: string;
  photo_url: string | null;
}

interface Match {
  id: number;
  match_date: string;
  opponent_name: string | null;
  venue: string | null;
}

interface AttendanceManagerProps {
  players: Player[];
  matches: Match[];
}

export function AttendanceManager({ players, matches }: AttendanceManagerProps) {
  const [selectedMatchId, setSelectedMatchId] = useState<string>("");
  const [attendance, setAttendance] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load attendance when match changes
  useEffect(() => {
    if (!selectedMatchId) return;
    const matchId = Number(selectedMatchId);
    
    const load = async () => {
      setLoaded(false);
      const { data } = await supabase
        .from("match_attendance")
        .select("player_id, attended")
        .eq("match_id", matchId);
      
      const map: Record<number, boolean> = {};
      (data || []).forEach((r) => { map[r.player_id] = r.attended; });
      setAttendance(map);
      setLoaded(true);
    };
    load();
  }, [selectedMatchId]);

  const attendedCount = useMemo(() => 
    Object.values(attendance).filter(Boolean).length, [attendance]
  );

  const handleToggle = (playerId: number, checked: boolean) => {
    setAttendance((prev) => ({ ...prev, [playerId]: checked }));
  };

  const handleSelectAll = () => {
    const all: Record<number, boolean> = {};
    players.forEach((p) => { all[p.id] = true; });
    setAttendance(all);
  };

  const handleDeselectAll = () => {
    setAttendance({});
  };

  const handleSave = async () => {
    const matchId = Number(selectedMatchId);
    if (!matchId) return;

    setSaving(true);
    try {
      // Delete existing then insert fresh
      await supabase.from("match_attendance").delete().eq("match_id", matchId);
      
      const rows = players
        .filter((p) => attendance[p.id])
        .map((p) => ({ match_id: matchId, player_id: p.id, attended: true }));

      if (rows.length > 0) {
        const { error } = await supabase.from("match_attendance").insert(rows);
        if (error) throw error;
      }
      
      toast.success(`Attendance saved: ${rows.length}/${players.length} players`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const selectedMatch = matches.find((m) => String(m.id) === selectedMatchId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5" />
          Attendance Tracker
        </CardTitle>
        <CardDescription>Track which players attended each match</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selectedMatchId} onValueChange={setSelectedMatchId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a match..." />
          </SelectTrigger>
          <SelectContent>
            {matches.map((m) => (
              <SelectItem key={m.id} value={String(m.id)}>
                {new Date(m.match_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                {m.opponent_name ? ` vs ${m.opponent_name}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedMatchId && loaded && (
          <>
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="gap-1">
                <Users className="w-3 h-3" />
                {attendedCount}/{players.length} attended
              </Badge>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleSelectAll}>Select All</Button>
                <Button variant="ghost" size="sm" onClick={handleDeselectAll}>Clear All</Button>
              </div>
            </div>

            <ScrollArea className="h-[300px] rounded-lg border">
              <div className="p-3 space-y-1">
                {players.map((player) => (
                  <label
                    key={player.id}
                    className="flex items-center gap-3 rounded-md p-2 cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={Boolean(attendance[player.id])}
                      onCheckedChange={(v) => handleToggle(player.id, Boolean(v))}
                    />
                    <PlayerAvatar name={player.name} photoUrl={player.photo_url} size="sm" />
                    <span className="text-sm font-medium">{player.name}</span>
                  </label>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                <Save className="w-4 h-4" />
                {saving ? "Saving…" : "Save Attendance"}
              </Button>
            </div>
          </>
        )}

        {selectedMatchId && !loaded && (
          <div className="py-8 text-center text-muted-foreground">Loading attendance...</div>
        )}
      </CardContent>
    </Card>
  );
}
