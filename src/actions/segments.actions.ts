"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActivityType } from "@/types";

export interface Segment {
  id: string;
  name: string;
  activityType: ActivityType;
  polyline: string | null;
  distanceMeters: number | null;
  elevationGainMeters: number | null;
  createdFromActivityId: string | null;
  creatorId: string;
  createdAt: Date;
  effortsCount?: number;
}

export interface SegmentWithLeaderboard extends Segment {
  leaderboard: Array<{
    userId: string;
    username: string;
    displayName: string | null;
    elapsedTimeSeconds: number;
    startDate: Date;
    activityId: string;
  }>;
}

export async function createSegmentFromActivity(
  activityId: string,
  name: string
): Promise<{ success: boolean; segmentId?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: activity, error: activityError } = await supabase
    .from("activities")
    .select("polyline, distance_meters, elevation_gain_meters, type")
    .eq("id", activityId)
    .eq("user_id", user.id)
    .single();

  if (activityError || !activity) {
    return { success: false, error: "Activity not found or not yours" };
  }

  const row = activity as {
    polyline: string | null;
    distance_meters: number;
    elevation_gain_meters: number | null;
    type: ActivityType;
  };

  const { data: inserted, error } = await supabase
    .from("segments")
    .insert({
      name: name.trim(),
      activity_type: row.type,
      polyline: row.polyline,
      distance_meters: row.distance_meters,
      elevation_gain_meters: row.elevation_gain_meters,
      created_from_activity_id: activityId,
      creator_id: user.id,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/segments");
  return { success: true, segmentId: (inserted as { id: string }).id };
}

export async function getSegments(
  activityType?: ActivityType,
  limit = 50
): Promise<Segment[]> {
  const supabase = await createClient();

  let query = supabase
    .from("segments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (activityType) {
    query = query.eq("activity_type", activityType);
  }

  const { data, error } = await query;

  if (error || !data) return [];

  const result: Segment[] = [];
  for (const row of data as Array<Record<string, unknown>>) {
    const { count } = await supabase
      .from("segment_efforts")
      .select("*", { count: "exact", head: true })
      .eq("segment_id", row.id);
    result.push({
      id: row.id as string,
      name: row.name as string,
      activityType: row.activity_type as ActivityType,
      polyline: row.polyline as string | null,
      distanceMeters:
        row.distance_meters != null ? Number(row.distance_meters) : null,
      elevationGainMeters:
        row.elevation_gain_meters != null
          ? Number(row.elevation_gain_meters)
          : null,
      createdFromActivityId: row.created_from_activity_id as string | null,
      creatorId: row.creator_id as string,
      createdAt: new Date(row.created_at as string),
      effortsCount: count ?? 0,
    });
  }
  return result;
}

export async function getSegmentById(
  segmentId: string
): Promise<SegmentWithLeaderboard | null> {
  const supabase = await createClient();

  const { data: row, error } = await supabase
    .from("segments")
    .select("*")
    .eq("id", segmentId)
    .single();

  if (error || !row) return null;

  const segmentRow = row as Record<string, unknown>;

  const { data: efforts } = await supabase
    .from("segment_efforts")
    .select("user_id, activity_id, elapsed_time_seconds, start_date")
    .eq("segment_id", segmentId)
    .order("elapsed_time_seconds", { ascending: true });

  const leaderboard: SegmentWithLeaderboard["leaderboard"] = [];
  if (efforts && efforts.length > 0) {
    const userIds = [
      ...new Set((efforts as Array<{ user_id: string }>).map((e) => e.user_id)),
    ];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, display_name")
      .in("id", userIds);
    const profileMap = new Map(
      (
        (profiles as Array<{
          id: string;
          username: string;
          display_name: string | null;
        }>) ?? []
      ).map((p) => [
        p.id,
        { username: p.username, displayName: p.display_name },
      ])
    );
    for (const e of efforts as Array<{
      user_id: string;
      activity_id: string;
      elapsed_time_seconds: number;
      start_date: string;
    }>) {
      leaderboard.push({
        userId: e.user_id,
        username: profileMap.get(e.user_id)?.username ?? "unknown",
        displayName: profileMap.get(e.user_id)?.displayName ?? null,
        elapsedTimeSeconds: e.elapsed_time_seconds,
        startDate: new Date(e.start_date),
        activityId: e.activity_id,
      });
    }
  }

  return {
    id: segmentRow.id as string,
    name: segmentRow.name as string,
    activityType: segmentRow.activity_type as ActivityType,
    polyline: segmentRow.polyline as string | null,
    distanceMeters:
      segmentRow.distance_meters != null
        ? Number(segmentRow.distance_meters)
        : null,
    elevationGainMeters:
      segmentRow.elevation_gain_meters != null
        ? Number(segmentRow.elevation_gain_meters)
        : null,
    createdFromActivityId: segmentRow.created_from_activity_id as string | null,
    creatorId: segmentRow.creator_id as string,
    createdAt: new Date(segmentRow.created_at as string),
    effortsCount: leaderboard.length,
    leaderboard,
  };
}
