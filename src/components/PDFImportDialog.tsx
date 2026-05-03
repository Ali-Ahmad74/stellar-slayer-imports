import { useState, useCallback } from "react";
import { FileText, AlertTriangle, Check, X, Upload, Loader2, ArrowLeft } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { insertWithSafeNumericId } from "@/lib/safe-numeric-insert";
import { logAdminActivity } from "@/lib/admin-activity-log";
import { toast } from "sonner";
import { AdminPlayer, AdminSeries, AdminSeason } from "@/components/admin/types";
import {
  ParsedMatch,
  buildPlayerMap,
  computePartnerships,
  extractCatchesFromDismissals,
  fileToBase64,
  findPlayer,
  normalizeResult,
  oversToBalls,
} from "@/lib/pdf-import-helpers";

interface Props {
  players: AdminPlayer[];
  series: AdminSeries[];
  seasons: AdminSeason[];
  teamId: string | null;
  onImportComplete: () => void;
}

type FileEntry = {
  file: File;
  status: "pending" | "parsing" | "parsed" | "error" | "saving" | "saved" | "save-error";
  parsed?: ParsedMatch;
  error?: string;
  matchedNames?: string[];
  skippedNames?: string[];
  warnings?: string[];
};

type Step = "select" | "preview" | "result";

const PARALLEL = 2;

export function PDFImportDialog({ players, series, seasons, teamId, onImportComplete }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("select");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [seriesId, setSeriesId] = useState<string>("none");
  const [seasonId, setSeasonId] = useState<string>("auto");
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setStep("select");
    setFiles([]);
    setSeriesId("none");
    setSeasonId("auto");
    setParsing(false);
    setSaving(false);
  };

  const handleFiles = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    if (list.length === 0) return;
    setFiles((prev) => [...prev, ...list.map((f) => ({ file: f, status: "pending" as const }))]);
    e.target.value = "";
  }, []);

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const parseAll = async () => {
    if (files.length === 0) return;
    setParsing(true);
    setStep("preview");
    const playerMap = buildPlayerMap(players);

    // Mark all as parsing
    setFiles((prev) => prev.map((f) => ({ ...f, status: "parsing" as const })));

    const queue = [...files.keys()];
    const work = async (idx: number) => {
      const entry = files[idx];
      try {
        const b64 = await fileToBase64(entry.file);
        const { data, error } = await supabase.functions.invoke("parse-match-pdf", {
          body: { pdf_base64: b64, filename: entry.file.name },
        });
        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || "Parse failed");
        const parsed = data.data as ParsedMatch;

        const matched: string[] = [];
        const skipped: string[] = [];
        const allNames = new Set<string>();
        [...(parsed.our_batting || []), ...(parsed.our_bowling || []), ...(parsed.our_fielding || [])]
          .forEach((p) => p?.name && allNames.add(p.name));
        for (const n of allNames) {
          if (findPlayer(n, playerMap)) matched.push(n);
          else skipped.push(n);
        }

        const warnings: string[] = [];
        if (!parsed.match_date) warnings.push("Match date missing");
        if (!parsed.opponent_name) warnings.push("Opponent name missing");
        if ((parsed.our_batting || []).length === 0) warnings.push("No batting entries parsed");
        if (skipped.length > 0) warnings.push(`${skipped.length} name(s) not in roster — stats will be skipped`);

        setFiles((prev) => {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], status: "parsed", parsed, matchedNames: matched, skippedNames: skipped, warnings };
          return copy;
        });
      } catch (err) {
        setFiles((prev) => {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], status: "error", error: err instanceof Error ? err.message : String(err) };
          return copy;
        });
      }
    };

    // Run with limited concurrency
    const runners: Promise<void>[] = [];
    for (let i = 0; i < PARALLEL; i++) {
      runners.push((async () => {
        while (queue.length > 0) {
          const next = queue.shift();
          if (next === undefined) return;
          await work(next);
        }
      })());
    }
    await Promise.all(runners);
    setParsing(false);
  };

  const saveOne = async (entry: FileEntry, idx: number): Promise<void> => {
    if (!entry.parsed || !teamId) return;
    const parsed = entry.parsed;
    const playerMap = buildPlayerMap(players);

    // Determine season
    let resolvedSeasonId: number | null = null;
    if (seasonId !== "auto") {
      resolvedSeasonId = parseInt(seasonId, 10);
    } else {
      const active = seasons.find((s) => s.is_active);
      resolvedSeasonId = active?.id ?? null;
    }
    const resolvedSeriesId = seriesId !== "none" ? parseInt(seriesId, 10) : null;

    // 1. Insert match
    const matchPayload = {
      team_id: teamId,
      season_id: resolvedSeasonId,
      series_id: resolvedSeriesId,
      match_date: parsed.match_date,
      venue: parsed.venue,
      opponent_name: parsed.opponent_name,
      our_score: parsed.our_score ?? 0,
      opponent_score: parsed.opponent_score ?? 0,
      overs: parsed.overs ?? 20,
      result: normalizeResult(parsed.result),
    };
    const matchInsert = await insertWithSafeNumericId("matches", matchPayload);
    if (matchInsert.error) throw matchInsert.error;
    // Fetch the new match id
    const { data: matchRow, error: matchFetchErr } = await supabase
      .from("matches")
      .select("id")
      .eq("team_id", teamId)
      .eq("match_date", parsed.match_date)
      .eq("opponent_name", parsed.opponent_name || "")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (matchFetchErr || !matchRow) throw new Error("Could not retrieve inserted match id");
    const matchId = matchRow.id;

    // 2. Batting
    const battingRows: any[] = [];
    const attendanceIds = new Set<number>();
    for (const b of parsed.our_batting || []) {
      const p = findPlayer(b.name, playerMap);
      if (!p) continue;
      attendanceIds.add(p.id);
      battingRows.push({
        match_id: matchId,
        player_id: p.id,
        season_id: resolvedSeasonId,
        runs: b.runs ?? 0,
        balls: b.balls ?? 0,
        fours: b.fours ?? 0,
        sixes: b.sixes ?? 0,
        out: !!b.out,
        dismissal_type: b.dismissal_type ?? null,
        batting_position: b.batting_position ?? null,
      });
    }

    // 3. Bowling
    const bowlingRows: any[] = [];
    for (const bw of parsed.our_bowling || []) {
      const p = findPlayer(bw.name, playerMap);
      if (!p) continue;
      attendanceIds.add(p.id);
      bowlingRows.push({
        match_id: matchId,
        player_id: p.id,
        season_id: resolvedSeasonId,
        balls: oversToBalls(bw.overs),
        runs_conceded: bw.runs_conceded ?? 0,
        wickets: bw.wickets ?? 0,
        maidens: bw.maidens ?? 0,
        wides: bw.wides ?? 0,
        no_balls: bw.no_balls ?? 0,
      });
    }

    // 4. Fielding (model + dismissal-derived merged)
    const fielderCounts = new Map<string, number>();
    for (const f of parsed.our_fielding || []) {
      const p = findPlayer(f.name, playerMap);
      if (!p) continue;
      fielderCounts.set(String(p.id), Math.max(fielderCounts.get(String(p.id)) || 0, f.catches || 0));
    }
    // NOTE: opponent dismissals not in payload (we excluded them); rely on model output for catches.
    // But we can also extract from our_batting dismissal text (catches WE dropped against, not relevant here).
    const fieldingRows: any[] = [];
    for (const [pid, catches] of fielderCounts) {
      if (catches <= 0) continue;
      const playerId = parseInt(pid, 10);
      attendanceIds.add(playerId);
      fieldingRows.push({
        match_id: matchId,
        player_id: playerId,
        season_id: resolvedSeasonId,
        catches,
        runouts: 0,
        stumpings: 0,
        dropped_catches: 0,
      });
    }

    // 5. Partnerships from FOW
    const computed = computePartnerships(parsed.fall_of_wickets || [], parsed.our_batting || []);
    const partnershipRows: any[] = [];
    for (const pr of computed) {
      const p1 = findPlayer(pr.player1_name, playerMap);
      const p2 = findPlayer(pr.player2_name, playerMap);
      if (!p1 || !p2) continue;
      partnershipRows.push({
        match_id: matchId,
        wicket_number: pr.wicket_number,
        player1_id: p1.id,
        player2_id: p2.id,
        runs: pr.runs,
        balls: 0,
      });
    }

    // 6. Attendance
    const attendanceRows = Array.from(attendanceIds).map((player_id) => ({
      match_id: matchId,
      player_id,
      attended: true,
    }));

    // Insert in parallel (errors throw)
    const inserts: Promise<any>[] = [];
    if (battingRows.length) inserts.push(Promise.resolve(supabase.from("batting_inputs").insert(battingRows)));
    if (bowlingRows.length) inserts.push(Promise.resolve(supabase.from("bowling_inputs").insert(bowlingRows)));
    if (fieldingRows.length) inserts.push(Promise.resolve(supabase.from("fielding_inputs").insert(fieldingRows)));
    if (partnershipRows.length) inserts.push(Promise.resolve(supabase.from("match_partnerships").insert(partnershipRows)));
    if (attendanceRows.length) inserts.push(Promise.resolve(supabase.from("match_attendance").insert(attendanceRows)));
    const results = await Promise.all(inserts);
    for (const r of results) {
      if (r?.error) throw r.error;
    }

    await logAdminActivity({
      action: "create",
      entityType: "match",
      entityId: matchId,
      summary: `Imported from PDF: ${entry.file.name}`,
      metadata: { opponent: parsed.opponent_name, date: parsed.match_date, series_id: resolvedSeriesId },
    });
  };

  const saveAll = async () => {
    if (!teamId) {
      toast.error("Team not loaded");
      return;
    }
    setSaving(true);
    const indexes = files.map((f, i) => (f.status === "parsed" ? i : -1)).filter((i) => i >= 0);
    for (const i of indexes) {
      setFiles((prev) => {
        const copy = [...prev];
        copy[i] = { ...copy[i], status: "saving" };
        return copy;
      });
      try {
        await saveOne(files[i], i);
        setFiles((prev) => {
          const copy = [...prev];
          copy[i] = { ...copy[i], status: "saved" };
          return copy;
        });
      } catch (err) {
        setFiles((prev) => {
          const copy = [...prev];
          copy[i] = { ...copy[i], status: "save-error", error: err instanceof Error ? err.message : String(err) };
          return copy;
        });
      }
    }
    setSaving(false);
    setStep("result");
    onImportComplete();
  };

  const parsedCount = files.filter((f) => f.status === "parsed").length;
  const savedCount = files.filter((f) => f.status === "saved").length;
  const errorCount = files.filter((f) => f.status === "error" || f.status === "save-error").length;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileText className="w-4 h-4" />
          Import PDFs
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display">Import Match PDFs</DialogTitle>
          <DialogDescription>
            Upload one or more Cricket Scorer PDFs. Stats are auto-parsed and saved against matched players.
          </DialogDescription>
        </DialogHeader>

        {step === "select" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Series (optional)</Label>
                <Select value={seriesId} onValueChange={setSeriesId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {series.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Season</Label>
                <Select value={seasonId} onValueChange={setSeasonId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto (active season)</SelectItem>
                    {seasons.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
              <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground mb-3">
                Select one or more PDF scorecards
              </p>
              <label>
                <input type="file" accept="application/pdf" multiple onChange={handleFiles} className="hidden" />
                <Button variant="outline" asChild><span>Choose PDFs</span></Button>
              </label>
            </div>

            {files.length > 0 && (
              <ScrollArea className="h-[200px] rounded-lg border p-2">
                <ul className="space-y-1">
                  {files.map((f, i) => (
                    <li key={i} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted/40 text-sm">
                      <span className="truncate flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        {f.file.name}
                      </span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(i)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}

            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">{files.length} file{files.length !== 1 ? "s" : ""}</span>
              <Button onClick={parseAll} disabled={files.length === 0}>
                Parse {files.length || ""} PDF{files.length !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="default" className="gap-1"><Check className="w-3 h-3" />{parsedCount} parsed</Badge>
              {errorCount > 0 && <Badge variant="destructive" className="gap-1"><X className="w-3 h-3" />{errorCount} failed</Badge>}
              {parsing && <span className="text-muted-foreground flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Parsing…</span>}
            </div>
            <ScrollArea className="flex-1 rounded-lg border">
              <div className="p-3 space-y-3">
                {files.map((f, i) => (
                  <div key={i} className="rounded-lg border p-3 bg-card/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-sm flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        {f.file.name}
                      </div>
                      {f.status === "parsing" && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                      {f.status === "parsed" && <Badge variant="default" className="gap-1"><Check className="w-3 h-3" />Ready</Badge>}
                      {f.status === "error" && <Badge variant="destructive" className="gap-1"><X className="w-3 h-3" />Failed</Badge>}
                    </div>
                    {f.status === "error" && (
                      <p className="text-xs text-destructive flex items-start gap-1">
                        <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />{f.error}
                      </p>
                    )}
                    {f.status === "parsed" && f.parsed && (
                      <div className="space-y-2 text-xs">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-muted-foreground">
                          <div><span className="font-semibold text-foreground">Date:</span> {f.parsed.match_date || "—"}</div>
                          <div><span className="font-semibold text-foreground">Vs:</span> {f.parsed.opponent_name || "—"}</div>
                          <div><span className="font-semibold text-foreground">Score:</span> {f.parsed.our_score}/{f.parsed.our_wickets} vs {f.parsed.opponent_score}/{f.parsed.opponent_wickets}</div>
                          <div><span className="font-semibold text-foreground">Result:</span> {normalizeResult(f.parsed.result)}</div>
                        </div>
                        {f.matchedNames && f.matchedNames.length > 0 && (
                          <div>
                            <span className="font-semibold">Matched ({f.matchedNames.length}):</span>{" "}
                            <span className="text-emerald-500">{f.matchedNames.join(", ")}</span>
                          </div>
                        )}
                        {f.skippedNames && f.skippedNames.length > 0 && (
                          <div>
                            <span className="font-semibold">Skipped ({f.skippedNames.length}):</span>{" "}
                            <span className="text-amber-500">{f.skippedNames.join(", ")}</span>
                          </div>
                        )}
                        {f.warnings && f.warnings.length > 0 && (
                          <ul className="text-amber-500 list-disc pl-4">
                            {f.warnings.map((w, j) => <li key={j}>{w}</li>)}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep("select")} disabled={parsing || saving}>
                <ArrowLeft className="w-4 h-4 mr-1" />Back
              </Button>
              <Button onClick={saveAll} disabled={parsing || saving || parsedCount === 0}>
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : `Import ${parsedCount} Match${parsedCount !== 1 ? "es" : ""}`}
              </Button>
            </div>
          </>
        )}

        {step === "result" && (
          <>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="default" className="gap-1"><Check className="w-3 h-3" />{savedCount} saved</Badge>
              {errorCount > 0 && <Badge variant="destructive" className="gap-1"><X className="w-3 h-3" />{errorCount} failed</Badge>}
            </div>
            <ScrollArea className="flex-1 rounded-lg border">
              <ul className="p-3 space-y-2 text-sm">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center justify-between gap-2">
                    <span className="truncate flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      {f.file.name}
                    </span>
                    {f.status === "saved" && <Badge variant="default" className="gap-1"><Check className="w-3 h-3" />Saved</Badge>}
                    {(f.status === "save-error" || f.status === "error") && (
                      <Badge variant="destructive" className="gap-1" title={f.error}><X className="w-3 h-3" />{f.status === "save-error" ? "Save failed" : "Parse failed"}</Badge>
                    )}
                  </li>
                ))}
              </ul>
            </ScrollArea>
            <div className="flex justify-end">
              <Button onClick={() => { setOpen(false); reset(); }}>Done</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}