'use server';

import { createClient } from '@/lib/supabase/server';
import type { Activity, ActivityWithAuthor, WeeklyActivity, SeasonPR } from '@/types';

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
    type: row.type as Activity['type'],
    name: row.name,
    description: row.description || undefined,
    privacy: row.privacy as Activity['privacy'],
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
    source: row.source as Activity['source'],
    externalId: row.external_id || undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function getActivityById(activityId: string): Promise<ActivityWithAuthor | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('activities')
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
    .eq('id', activityId)
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
    .from('activities')
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
    .order('started_at', { ascending: false })
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
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
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

  const { data, error } = await (supabase.rpc as CallableFunction)('get_season_prs', {
    target_user_id: userId,
    year_start: yearStart,
  });

  if (error || !data) {
    return [];
  }

  return (data as Array<{
    distance: string;
    time_seconds: number;
    activity_id: string;
    activity_name: string;
    achieved_at: string;
  }>).map((row) => ({
    distance: row.distance as SeasonPR['distance'],
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
    .from('activities')
    .select('started_at, distance_meters')
    .eq('user_id', userId)
    .gte('started_at', startDate.toISOString())
    .order('started_at', { ascending: true });

  if (error || !data) {
    return [];
  }

  const weeklyMap = new Map<string, WeeklyActivity>();

  const currentDate = new Date(startDate);
  while (currentDate <= new Date()) {
    const weekStart = new Date(currentDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const dateKey = weekStart.toISOString().split('T')[0];

    if (!weeklyMap.has(dateKey)) {
      weeklyMap.set(dateKey, {
        date: dateKey,
        count: 0,
        totalDistanceMeters: 0,
      });
    }
    currentDate.setDate(currentDate.getDate() + 7);
  }

  const activities = data as unknown as Array<{ started_at: string; distance_meters: number }>;
  for (const activity of activities) {
    const activityDate = new Date(activity.started_at);
    activityDate.setDate(activityDate.getDate() - activityDate.getDay());
    const dateKey = activityDate.toISOString().split('T')[0];

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

export async function getActivityStats(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('activities')
    .select('distance_meters, elapsed_time_seconds, elevation_gain_meters')
    .eq('user_id', userId);

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
    totalDistanceMeters: activities.reduce((sum, a) => sum + Number(a.distance_meters), 0),
    totalDurationSeconds: activities.reduce((sum, a) => sum + a.elapsed_time_seconds, 0),
    totalElevationGainMeters: activities.reduce(
      (sum, a) => sum + (Number(a.elevation_gain_meters) || 0),
      0
    ),
  };
}

export async function deleteActivity(activityId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.from('activities').delete().eq('id', activityId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
