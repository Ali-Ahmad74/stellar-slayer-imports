import { useEffect, useState } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

interface ActivityRow {
  id: string;
  action: "create" | "update" | "delete";
  entity_type: string;
  entity_id: string;
  summary: string | null;
  created_at: string;
}

const actionVariant: Record<string, "default" | "secondary" | "destructive"> = {
  create: "default",
  update: "secondary",
  delete: "destructive",
};

export function ActivityLog() {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("admin_activity_log" as never)
      .select("id, action, entity_type, entity_id, summary, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    setRows((data as unknown as ActivityRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Admin Activity Log</CardTitle>
          <CardDescription>Recent create, edit, and delete actions on players, matches, and series</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading activity…</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No activity recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>When</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Summary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/30">
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(row.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={actionVariant[row.action] ?? "secondary"} className="capitalize">
                        {row.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize font-medium">{row.entity_type}</TableCell>
                    <TableCell className="font-mono text-xs">{row.entity_id}</TableCell>
                    <TableCell className="text-sm">{row.summary || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}