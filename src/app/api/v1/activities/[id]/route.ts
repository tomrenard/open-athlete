import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Activity not found" },
        { status: 404 }
      );
    }

    const profile = data.profiles as Record<string, unknown>;

    const activity = {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      name: data.name,
      description: data.description,
      privacy: data.privacy,
      startedAt: data.started_at,
      elapsedTimeSeconds: data.elapsed_time_seconds,
      movingTimeSeconds: data.moving_time_seconds,
      distanceMeters: Number(data.distance_meters),
      elevationGainMeters: data.elevation_gain_meters
        ? Number(data.elevation_gain_meters)
        : null,
      elevationLossMeters: data.elevation_loss_meters
        ? Number(data.elevation_loss_meters)
        : null,
      avgHeartRate: data.avg_heart_rate,
      maxHeartRate: data.max_heart_rate,
      avgPaceSecondsPerKm: data.avg_pace_seconds_per_km
        ? Number(data.avg_pace_seconds_per_km)
        : null,
      avgSpeedKmh: data.avg_speed_kmh ? Number(data.avg_speed_kmh) : null,
      calories: data.calories,
      polyline: data.polyline,
      best1kmSeconds: data.best_1km_seconds,
      best5kmSeconds: data.best_5km_seconds,
      best10kmSeconds: data.best_10km_seconds,
      relativeEffort:
        data.relative_effort != null ? Number(data.relative_effort) : null,
      source: data.source,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      author: {
        id: profile.id,
        username: profile.username,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
      },
    };

    return NextResponse.json(activity);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { error } = await supabase.from("activities").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
