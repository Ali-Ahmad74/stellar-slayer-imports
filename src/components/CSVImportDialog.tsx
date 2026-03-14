import { useState, useCallback } from "react";
import { Upload, FileText, AlertTriangle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CSVImportDialogProps {
  teamId: string;
  onImportComplete: () => void;
}

interface ParsedPlayer {
  name: string;
  role: string;
  batting_style: string | null;
  bowling_style: string | null;
  valid: boolean;
  error?: string;
}

const VALID_ROLES = ["Batsman", "Bowler", "All-Rounder", "Wicket-Keeper"];

function parseCSV(text: string): ParsedPlayer[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
  const nameIdx = headers.findIndex((h) => h === "name");
  const roleIdx = headers.findIndex((h) => h === "role");
  const batIdx = headers.findIndex((h) => h.includes("batting") && h.includes("style"));
  const bowlIdx = headers.findIndex((h) => h.includes("bowling") && h.includes("style"));

  if (nameIdx === -1) return [];

  return lines.slice(1).filter((l) => l.trim()).map((line) => {
    const cols = line.split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
    const name = cols[nameIdx]?.trim() || "";
    const rawRole = cols[roleIdx]?.trim() || "Batsman";
    const role = VALID_ROLES.find((r) => r.toLowerCase() === rawRole.toLowerCase()) || "";
    const batting_style = batIdx >= 0 ? cols[batIdx]?.trim() || null : null;
    const bowling_style = bowlIdx >= 0 ? cols[bowlIdx]?.trim() || null : null;

    const errors: string[] = [];
    if (!name) errors.push("Name required");
    if (name.length > 100) errors.push("Name too long");
    if (!role) errors.push(`Invalid role "${rawRole}"`);

    return {
      name,
      role: role || "Batsman",
      batting_style,
      bowling_style,
      valid: errors.length === 0,
      error: errors.join(", "),
    };
  });
}

export function CSVImportDialog({ teamId, onImportComplete }: CSVImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [parsed, setParsed] = useState<ParsedPlayer[]>([]);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setParsed(parseCSV(text));
    };
    reader.readAsText(file);
    e.target.value = "";
  }, []);

  const validCount = parsed.filter((p) => p.valid).length;
  const invalidCount = parsed.filter((p) => !p.valid).length;

  const handleImport = async () => {
    const validPlayers = parsed.filter((p) => p.valid);
    if (validPlayers.length === 0) return;

    setImporting(true);
    try {
      const { error } = await supabase.from("players").insert(
        validPlayers.map((p) => ({
          name: p.name,
          role: p.role,
          batting_style: p.batting_style,
          bowling_style: p.bowling_style,
          team_id: teamId,
        }))
      );
      if (error) throw error;
      toast.success(`${validPlayers.length} players imported successfully!`);
      setParsed([]);
      setFileName("");
      setOpen(false);
      onImportComplete();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setParsed([]); setFileName(""); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="w-4 h-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">Import Players from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with columns: <code className="text-xs bg-muted px-1 rounded">name, role, batting_style, bowling_style</code>
          </DialogDescription>
        </DialogHeader>

        {parsed.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-40" />
            <p className="text-sm text-muted-foreground mb-4">
              Drop a CSV file or click to browse
            </p>
            <label>
              <input type="file" accept=".csv" onChange={handleFile} className="hidden" />
              <Button variant="outline" asChild><span>Choose File</span></Button>
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{fileName}</span>
              </div>
              <div className="flex gap-2">
                <Badge variant="default" className="gap-1"><Check className="w-3 h-3" />{validCount} valid</Badge>
                {invalidCount > 0 && <Badge variant="destructive" className="gap-1"><X className="w-3 h-3" />{invalidCount} invalid</Badge>}
              </div>
            </div>

            <ScrollArea className="h-[300px] rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Bat Style</TableHead>
                    <TableHead>Bowl Style</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsed.map((p, i) => (
                    <TableRow key={i} className={!p.valid ? "bg-destructive/5" : ""}>
                      <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{p.name || "—"}</TableCell>
                      <TableCell>{p.role}</TableCell>
                      <TableCell className="text-muted-foreground">{p.batting_style || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{p.bowling_style || "—"}</TableCell>
                      <TableCell>
                        {p.valid ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-destructive">
                            <AlertTriangle className="w-3 h-3" />{p.error}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => { setParsed([]); setFileName(""); }}>
                Clear
              </Button>
              <Button onClick={handleImport} disabled={importing || validCount === 0}>
                {importing ? "Importing…" : `Import ${validCount} Player${validCount !== 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
