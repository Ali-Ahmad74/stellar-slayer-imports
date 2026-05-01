import { supabase } from "@/integrations/supabase/client";

export type ActivityAction = "create" | "update" | "delete";
export type ActivityEntity =
  | "player"
  | "match"
  | "series"
  | "season"
  | "tournament";

/**
 * Records an admin action to the activity log. Failures are logged but never
 * thrown so logging never blocks a CRUD operation.
 */
export async function logAdminActivity(params: {
  action: ActivityAction;
  entityType: ActivityEntity;
  entityId: string | number;
  summary?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("admin_activity_log").insert({
      user_id: user?.id ?? null,
      action: params.action,
      entity_type: params.entityType,
      entity_id: String(params.entityId),
      summary: params.summary ?? null,
      metadata: (params.metadata as never) ?? null,
    });
  } catch (e) {
    console.warn("[admin-activity-log] failed to record", e);
  }
}