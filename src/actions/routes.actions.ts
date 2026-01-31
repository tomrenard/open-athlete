"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActivityType } from "@/types";

export interface Route {
  id: string;
  userId: string;
  name: string;
  polyline: string;
  distanceMeters: number | null;
  elevationGainMeters: number | null;
  activityType: ActivityType;
  createdFromActivityId: string | null;
  createdAt: Date;
}

export async function createRouteFromActivity(
  activityId: string,
  name: string
): Promise<{ success: boolean; routeId?: string; error?: string }> {
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

  if (!row.polyline) {
    return { success: false, error: "Activity has no route" };
  }

  const { data: inserted, error } = await supabase
    .from("routes")
    .insert({
      user_id: user.id,
      name: name.trim(),
      polyline: row.polyline,
      distance_meters: row.distance_meters,
      elevation_gain_meters: row.elevation_gain_meters,
      activity_type: row.type,
      created_from_activity_id: activityId,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/routes");
  return { success: true, routeId: (inserted as { id: string }).id };
}

export async function getMyRoutes(limit = 50): Promise<Route[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("routes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    polyline: row.polyline as string,
    distanceMeters:
      row.distance_meters != null ? Number(row.distance_meters) : null,
    elevationGainMeters:
      row.elevation_gain_meters != null
        ? Number(row.elevation_gain_meters)
        : null,
    activityType: row.activity_type as ActivityType,
    createdFromActivityId: row.created_from_activity_id as string | null,
    createdAt: new Date(row.created_at as string),
  }));
}

export async function deleteRoute(
  routeId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("routes")
    .delete()
    .eq("id", routeId)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/routes");
  return { success: true };
}
