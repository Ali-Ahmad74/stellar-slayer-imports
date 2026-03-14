import { useState } from "react";
import { MessageSquare, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MatchNotesEditorProps {
  matchId: number;
  matchLabel: string;
  initialNotes: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function MatchNotesEditor({ matchId, matchLabel, initialNotes, open, onOpenChange, onSaved }: MatchNotesEditorProps) {
  const [notes, setNotes] = useState(initialNotes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("matches").update({ notes: notes.trim() || null }).eq("id", matchId);
    if (error) {
      toast.error("Failed to save notes");
    } else {
      toast.success("Notes saved");
      onSaved();
      onOpenChange(false);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Match Notes
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{matchLabel}</p>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add match notes, observations, highlights..."
          className="min-h-[150px]"
          maxLength={2000}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{notes.length}/2000</span>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save Notes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
