"use server";

import { createClient } from "@/lib/supabase/server";
import { computeRelativeEffort } from "@/lib/utils/relative-effort";
import type {
  Activity,
  ActivityType,
  ActivityWithAuthor,
  WeeklyActivity,
  SeasonPR,
} from "@/types";

interface ActivityRow {
  id: string;
  user_id: string;
  type: string;
  name: string;
  description: string | null;
  privacy: string;
  started_at: string;
  elapsed_time_seconds: number;
  moving_time_seconds: number | null;
  distance_meters: number;
  elevation_gain_meters: number | null;
  elevation_loss_meters: number | null;
  avg_heart_rate: number | null;
  max_heart_rate: number | null;
  avg_pace_seconds_per_km: number | null;
  avg_speed_kmh: number | null;
  calories: number | null;
  polyline: string | null;
  best_1km_seconds: number | null;
  best_5km_seconds: number | null;
  best_10km_seconds: number | null;
  relative_effort: number | null;
  source: string;
  external_id: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

function parseActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as Activity["type"],
    name: row.name,
    description: row.description || undefined,
    privacy: row.privacy as Activity["privacy"],
    startedAt: new Date(row.started_at),
    elapsedTimeSeconds: row.elapsed_time_seconds,
    movingTimeSeconds: row.moving_time_seconds || undefined,
    distanceMeters: Number(row.distance_meters),
    elevationGainMeters: row.elevation_gain_meters
      ? Number(row.elevation_gain_meters)
      : undefined,
    elevationLossMeters: row.elevation_loss_meters
      ? Number(row.elevation_loss_meters)
      : undefined,
    avgHeartRate: row.avg_heart_rate || undefined,
    maxHeartRate: row.max_heart_rate || undefined,
    avgPaceSecondsPerKm: row.avg_pace_seconds_per_km
      ? Number(row.avg_pace_seconds_per_km)
      : undefined,
    avgSpeedKmh: row.avg_speed_kmh ? Number(row.avg_speed_kmh) : undefined,
    calories: row.calories || undefined,
    polyline: row.polyline || undefined,
    best1kmSeconds: row.best_1km_seconds || undefined,
    best5kmSeconds: row.best_5km_seconds || undefined,
    best10kmSeconds: row.best_10km_seconds || undefined,
    relativeEffort:
      row.relative_effort != null ? Number(row.relative_effort) : undefined,
    source: row.source as Activity["source"],
    externalId: row.external_id || undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function getActivityById(
  activityId: string
): Promise<ActivityWithAuthor | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("activities")
    .select(
      `
      *,
      profiles:user_id (
        id,
        username,
        display_name,
        avatar_url
      )
    `
    )
    .eq("id", activityId)
    .single();

  if (error || !data) {
    return null;
  }

  const row = data as unknown as ActivityRow;
  const profile = row.profiles;
  const activity = parseActivity(row);

  if (!profile) {
    return null;
  }

  return {
    ...activity,
    author: {
      id: profile.id,
      username: profile.username,
      displayName: profile.display_name || undefined,
      avatarUrl: profile.avatar_url || undefined,
    },
  };
}

export async function getFeedActivities(
  page: number = 1,
  limit: number = 10
): Promise<{ activities: ActivityWithAuthor[]; hasMore: boolean }> {
  const supabase = await createClient();
  const offset = (page - 1) * limit;

  const { data, error } = await supabase
    .from("activities")
    .select(
      `
      *,
      profiles:user_id (
        id,
        username,
        display_name,
        avatar_url
      )
    `
    )
    .order("started_at", { ascending: false })
    .range(offset, offset + limit);

  if (error || !data) {
    return { activities: [], hasMore: false };
  }

  const rows = data as unknown as ActivityRow[];
  const activities: ActivityWithAuthor[] = rows
    .filter((row) => row.profiles)
    .map((row) => {
      const profile = row.profiles!;
      const activity = parseActivity(row);

      return {
        ...activity,
        author: {
          id: profile.id,
          username: profile.username,
          displayName: profile.display_name || undefined,
          avatarUrl: profile.avatar_url || undefined,
        },
      };
    });

  return {
    activities,
    hasMore: data.length > limit,
  };
}

export async function getUserActivities(
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<{ activities: Activity[]; hasMore: boolean }> {
  const supabase = await createClient();
  const offset = (page - 1) * limit;

  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .range(offset, offset + limit);

  if (error || !data) {
    return { activities: [], hasMore: false };
  }

  const rows = data as unknown as ActivityRow[];
  const activities = rows.map(parseActivity);

  return {
    activities,
    hasMore: data.length > limit,
  };
}

export async function getSeasonPRs(userId: string): Promise<SeasonPR[]> {
  const supabase = await createClient();
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();

  const { data, error } = await (supabase.rpc as CallableFunction)(
    "get_season_prs",
    {
      target_user_id: userId,
      year_start: yearStart,
    }
  );

  if (error || !data) {
    return [];
  }

  return (
    data as Array<{
      distance: string;
      time_seconds: number;
      activity_id: string;
      activity_name: string;
      achieved_at: string;
    }>
  ).map((row) => ({
    distance: row.distance as SeasonPR["distance"],
    timeSeconds: row.time_seconds,
    activityId: row.activity_id,
    activityName: row.activity_name,
    achievedAt: new Date(row.achieved_at),
  }));
}

export async function getWeeklyActivityData(
  userId: string,
  weeks: number = 52
): Promise<WeeklyActivity[]> {
  const supabase = await createClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeks * 7);

  const { data, error } = await supabase
    .from("activities")
    .select("started_at, distance_meters")
    .eq("user_id", userId)
    .gte("started_at", startDate.toISOString())
    .order("started_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  const weeklyMap = new Map<string, WeeklyActivity>();

  const currentDate = new Date(startDate);
  while (currentDate <= new Date()) {
    const weekStart = new Date(currentDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const dateKey = weekStart.toISOString().split("T")[0];

    if (!weeklyMap.has(dateKey)) {
      weeklyMap.set(dateKey, {
        date: dateKey,
        count: 0,
        totalDistanceMeters: 0,
      });
    }
    currentDate.setDate(currentDate.getDate() + 7);
  }

  const activities = data as unknown as Array<{
    started_at: string;
    distance_meters: number;
  }>;
  for (const activity of activities) {
    const activityDate = new Date(activity.started_at);
    activityDate.setDate(activityDate.getDate() - activityDate.getDay());
    const dateKey = activityDate.toISOString().split("T")[0];

    const existing = weeklyMap.get(dateKey);
    if (existing) {
      existing.count += 1;
      existing.totalDistanceMeters += Number(activity.distance_meters);
    }
  }

  return Array.from(weeklyMap.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export async function getActivitiesForLog(
  userId: string,
  options: {
    from?: Date;
    to?: Date;
    type?: ActivityType;
    limit?: number;
  } = {}
): Promise<Activity[]> {
  const { from, to, type: activityType, limit = 200 } = options;
  const supabase = await createClient();

  let query = supabase
    .from("activities")
    .select("*")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (from) {
    query = query.gte("started_at", from.toISOString());
  }
  if (to) {
    query = query.lte("started_at", to.toISOString());
  }
  if (activityType) {
    query = query.eq("type", activityType);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  const rows = data as unknown as ActivityRow[];
  return rows.map(parseActivity);
}

export async function getActivityStats(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("activities")
    .select("distance_meters, elapsed_time_seconds, elevation_gain_meters")
    .eq("user_id", userId);

  if (error || !data) {
    return {
      totalActivities: 0,
      totalDistanceMeters: 0,
      totalDurationSeconds: 0,
      totalElevationGainMeters: 0,
    };
  }

  const activities = data as unknown as Array<{
    distance_meters: number;
    elapsed_time_seconds: number;
    elevation_gain_meters: number | null;
  }>;

  return {
    totalActivities: activities.length,
    totalDistanceMeters: activities.reduce(
      (sum, a) => sum + Number(a.distance_meters),
      0
    ),
    totalDurationSeconds: activities.reduce(
      (sum, a) => sum + a.elapsed_time_seconds,
      0
    ),
    totalElevationGainMeters: activities.reduce(
      (sum, a) => sum + (Number(a.elevation_gain_meters) || 0),
      0
    ),
  };
}

export interface UpdateActivityInput {
  name?: string;
  description?: string | null;
  type?: ActivityType;
  privacy?: import("@/types").PrivacyLevel;
  startedAt?: Date;
}

export async function updateActivity(
  activityId: string,
  input: UpdateActivityInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const updates: Record<string, unknown> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description;
  if (input.type !== undefined) updates.type = input.type;
  if (input.privacy !== undefined) updates.privacy = input.privacy;
  if (input.startedAt !== undefined) {
    updates.started_at = input.startedAt.toISOString();
  }
  if (Object.keys(updates).length === 0) {
    return { success: true };
  }

  const { error } = await supabase
    .from("activities")
    .update(updates)
    .eq("id", activityId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export interface CreateManualActivityInput {
  name: string;
  type: ActivityType;
  description?: string | null;
  privacy?: import("@/types").PrivacyLevel;
  startedAt: Date;
  elapsedTimeSeconds: number;
  distanceMeters: number;
  elevationGainMeters?: number | null;
}

export async function createManualActivity(
  input: CreateManualActivityInput
): Promise<{ success: boolean; activityId?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const distanceMeters = Number(input.distanceMeters);
  const elapsedTimeSeconds = input.elapsedTimeSeconds;
  const avgPaceSecondsPerKm =
    distanceMeters > 0 ? (elapsedTimeSeconds / distanceMeters) * 1000 : null;
  const avgSpeedKmh =
    elapsedTimeSeconds > 0
      ? distanceMeters / 1000 / (elapsedTimeSeconds / 3600)
      : null;

  const { data, error } = await supabase
    .from("activities")
    .insert({
      user_id: user.id,
      type: input.type,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      privacy: input.privacy ?? "followers",
      started_at: input.startedAt.toISOString(),
      elapsed_time_seconds: elapsedTimeSeconds,
      moving_time_seconds: elapsedTimeSeconds,
      distance_meters: distanceMeters,
      elevation_gain_meters: input.elevationGainMeters ?? null,
      avg_pace_seconds_per_km: avgPaceSecondsPerKm,
      avg_speed_kmh: avgSpeedKmh,
      source: "manual",
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, activityId: (data as { id: string }).id };
}

export async function deleteActivity(
  activityId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("activities")
    .delete()
    .eq("id", activityId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function backfillRelativeEffort(): Promise<{
  success: boolean;
  updated: number;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, updated: 0, error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("max_heart_rate, rest_heart_rate")
    .eq("id", user.id)
    .single();

  const { data: activities, error: fetchError } = await supabase
    .from("activities")
    .select("id, elapsed_time_seconds, avg_heart_rate, max_heart_rate")
    .eq("user_id", user.id)
    .not("avg_heart_rate", "is", null)
    .is("relative_effort", null);

  if (fetchError || !activities?.length) {
    return { success: true, updated: 0 };
  }

  let updated = 0;
  for (const a of activities) {
    const re = computeRelativeEffort({
      durationSeconds: a.elapsed_time_seconds,
      avgHeartRate: a.avg_heart_rate!,
      maxHeartRate: a.max_heart_rate ?? profile?.max_heart_rate ?? undefined,
      restHeartRate: profile?.rest_heart_rate ?? undefined,
    });
    const { error } = await supabase
      .from("activities")
      .update({ relative_effort: re })
      .eq("id", a.id);
    if (!error) updated++;
  }

  return { success: true, updated };
}
