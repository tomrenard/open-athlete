"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type GoalType = "distance" | "time" | "elevation" | "activities";
export type GoalPeriod = "week" | "month" | "year";

export interface Goal {
  id: string;
  userId: string;
  type: GoalType;
  period: GoalPeriod;
  targetValue: number;
  periodStart: Date;
  createdAt: Date;
}

export interface GoalWithProgress extends Goal {
  currentValue: number;
  unit: string;
}

function getPeriodEnd(periodStart: Date, period: GoalPeriod): Date {
  const end = new Date(periodStart);
  if (period === "week") {
    end.setDate(end.getDate() + 6);
  } else if (period === "month") {
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
  } else {
    end.setFullYear(end.getFullYear() + 1);
    end.setMonth(0);
    end.setDate(0);
  }
  return end;
}

export async function getGoals(userId: string): Promise<Goal[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .order("period_start", { ascending: false });

  if (error || !data) {
    return [];
  }

  return (
    data as Array<{
      id: string;
      user_id: string;
      type: string;
      period: string;
      target_value: number;
      period_start: string;
      created_at: string;
    }>
  ).map((row) => ({
    id: row.id,
    userId: row.user_id,
    type: row.type as GoalType,
    period: row.period as GoalPeriod,
    targetValue: Number(row.target_value),
    periodStart: new Date(row.period_start),
    createdAt: new Date(row.created_at),
  }));
}

export async function getGoalsWithProgress(
  userId: string
): Promise<GoalWithProgress[]> {
  const goals = await getGoals(userId);
  if (goals.length === 0) return [];

  const supabase = await createClient();
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const { data: activities, error } = await supabase
    .from("activities")
    .select(
      "started_at, distance_meters, elapsed_time_seconds, elevation_gain_meters"
    )
    .eq("user_id", userId)
    .gte("started_at", yearStart.toISOString());

  if (error || !activities) {
    return goals.map((g) => ({
      ...g,
      currentValue: 0,
      unit:
        g.type === "distance"
          ? "km"
          : g.type === "time"
          ? "hours"
          : g.type === "elevation"
          ? "m"
          : "",
    }));
  }

  const rows = activities as Array<{
    started_at: string;
    distance_meters: number;
    elapsed_time_seconds: number;
    elevation_gain_meters: number | null;
  }>;

  return goals.map((goal) => {
    const periodEnd = getPeriodEnd(goal.periodStart, goal.period);
    const start = goal.periodStart.getTime();
    const end = periodEnd.getTime();

    let currentValue = 0;
    for (const a of rows) {
      const t = new Date(a.started_at).getTime();
      if (t >= start && t <= end) {
        if (goal.type === "distance") {
          currentValue += Number(a.distance_meters) / 1000;
        } else if (goal.type === "time") {
          currentValue += a.elapsed_time_seconds / 3600;
        } else if (goal.type === "elevation") {
          currentValue += Number(a.elevation_gain_meters) || 0;
        } else {
          currentValue += 1;
        }
      }
    }

    const unit =
      goal.type === "distance"
        ? "km"
        : goal.type === "time"
        ? "hrs"
        : goal.type === "elevation"
        ? "m"
        : "";

    return {
      ...goal,
      currentValue: Math.round(currentValue * 100) / 100,
      unit,
    };
  });
}

export async function createGoal(
  type: GoalType,
  period: GoalPeriod,
  targetValue: number,
  periodStart: Date
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const start = new Date(periodStart);
  if (period === "week") {
    start.setDate(start.getDate() - start.getDay());
  } else if (period === "month") {
    start.setDate(1);
  } else {
    start.setMonth(0);
    start.setDate(1);
  }

  const { error } = await supabase.from("goals").insert({
    user_id: user.id,
    type,
    period,
    target_value: targetValue,
    period_start: start.toISOString().split("T")[0],
  });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Goal already exists for this period" };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteGoal(
  goalId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", goalId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}
