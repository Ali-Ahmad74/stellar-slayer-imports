import { supabase } from "@/integrations/supabase/client";

type NumericIdTable = "players" | "matches" | "series" | "seasons" | "tournaments";

function isDuplicatePrimaryKeyError(table: NumericIdTable, message?: string) {
  return Boolean(message && message.includes(`${table}_pkey`));
}

async function getNextNumericId(table: NumericIdTable) {
  const { data, error } = await supabase
    .from(table)
    .select("id")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return ((data as { id?: number } | null)?.id ?? 0) + 1;
}

export async function insertWithSafeNumericId<T extends Record<string, unknown>>(
  table: NumericIdTable,
  payload: T,
) {
  const firstAttempt = await supabase.from(table).insert(payload as any);
  if (!firstAttempt.error || !isDuplicatePrimaryKeyError(table, firstAttempt.error.message)) {
    return firstAttempt;
  }

  const nextId = await getNextNumericId(table);
  return supabase.from(table).insert({ ...(payload as object), id: nextId } as any);
}

export async function insertManyWithSafeNumericIds<T extends Record<string, unknown>>(
  table: NumericIdTable,
  rows: T[],
) {
  const firstAttempt = await supabase.from(table).insert(rows as any);
  if (!firstAttempt.error || !isDuplicatePrimaryKeyError(table, firstAttempt.error.message)) {
    return firstAttempt;
  }

  const startId = await getNextNumericId(table);
  const rowsWithIds = rows.map((row, index) => ({
    ...(row as object),
    id: startId + index,
  }));

  return supabase.from(table).insert(rowsWithIds as any);
}