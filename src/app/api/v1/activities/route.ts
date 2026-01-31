import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const userId = searchParams.get("user_id");
    const offset = (page - 1) * limit;

    let query = supabase
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

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const activities = data.map((row) => ({
      id: row.id,
      userId: row.user_id,
      type: row.type,
      name: row.name,
      description: row.description,
      privacy: row.privacy,
      startedAt: row.started_at,
      elapsedTimeSeconds: row.elapsed_time_seconds,
      movingTimeSeconds: row.moving_time_seconds,
      distanceMeters: Number(row.distance_meters),
      elevationGainMeters: row.elevation_gain_meters
        ? Number(row.elevation_gain_meters)
        : null,
      elevationLossMeters: row.elevation_loss_meters
        ? Number(row.elevation_loss_meters)
        : null,
      avgHeartRate: row.avg_heart_rate,
      maxHeartRate: row.max_heart_rate,
      avgPaceSecondsPerKm: row.avg_pace_seconds_per_km
        ? Number(row.avg_pace_seconds_per_km)
        : null,
      avgSpeedKmh: row.avg_speed_kmh ? Number(row.avg_speed_kmh) : null,
      calories: row.calories,
      polyline: row.polyline,
      best1kmSeconds: row.best_1km_seconds,
      best5kmSeconds: row.best_5km_seconds,
      best10kmSeconds: row.best_10km_seconds,
      relativeEffort:
        row.relative_effort != null ? Number(row.relative_effort) : null,
      source: row.source,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      author: row.profiles
        ? {
            id: (row.profiles as Record<string, unknown>).id,
            username: (row.profiles as Record<string, unknown>).username,
            displayName: (row.profiles as Record<string, unknown>).display_name,
            avatarUrl: (row.profiles as Record<string, unknown>).avatar_url,
          }
        : null,
    }));

    return NextResponse.json({
      activities,
      page,
      limit,
      hasMore: data.length > limit,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
