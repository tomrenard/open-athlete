"use server";

import { createClient } from "@/lib/supabase/server";
import { computeCtlAtlTsb, type DailyLoadPoint } from "@/lib/utils/ctl-atl-tsb";

export type { DailyLoadPoint } from "@/lib/utils/ctl-atl-tsb";

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function getTrainingLoadData(
  days: number = 90
): Promise<{
  data: DailyLoadPoint[];
  latest: DailyLoadPoint | null;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: [], latest: null, error: "Not authenticated" };
  }

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startKey = toDateKey(startDate);
  const endKey = toDateKey(endDate);

  const { data: rows, error } = await supabase
    .from("activities")
    .select("started_at, relative_effort")
    .eq("user_id", user.id)
    .not("relative_effort", "is", null)
    .gte("started_at", startKey)
    .lte("started_at", endKey + "T23:59:59.999Z");

  if (error) {
    return { data: [], latest: null, error: error.message };
  }

  const dailyLoads: { date: string; load: number }[] = [];
  const loadByDate = new Map<string, number>();
  for (const row of rows ?? []) {
    const dateKey = (row.started_at as string).slice(0, 10);
    const re = Number(row.relative_effort);
    loadByDate.set(dateKey, (loadByDate.get(dateKey) ?? 0) + re);
  }
  loadByDate.forEach((load, date) => dailyLoads.push({ date, load }));

  const data = computeCtlAtlTsb(dailyLoads, startDate, endDate);
  const latest = data.length > 0 ? data[data.length - 1]! : null;
  return { data, latest };
}
