import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
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
      avgHeartRate: row.avg_heart_rate,
      maxHeartRate: row.max_heart_rate,
      relativeEffort:
        row.relative_effort != null ? Number(row.relative_effort) : null,
      avgPaceSecondsPerKm: row.avg_pace_seconds_per_km
        ? Number(row.avg_pace_seconds_per_km)
        : null,
      polyline: row.polyline,
      source: row.source,
      createdAt: row.created_at,
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
