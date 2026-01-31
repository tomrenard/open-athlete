import { createAdminClient } from "@/lib/supabase/admin";
import { computeRelativeEffort } from "@/lib/utils/relative-effort";
import {
  getActivity,
  getActivityStreams,
  refreshAccessToken,
  type StravaActivity,
} from "./client";
import type { ActivityType } from "@/types";

function mapStravaActivityType(stravaType: string): ActivityType | null {
  const typeMap: Record<string, ActivityType> = {
    Run: "run",
    VirtualRun: "run",
    TrailRun: "run",
    Ride: "ride",
    VirtualRide: "ride",
    EBikeRide: "ride",
    GravelRide: "ride",
    MountainBikeRide: "ride",
    Swim: "swim",
  };

  return typeMap[stravaType] || null;
}

function coordsToPostgisPoint(lat: number, lng: number): string {
  return `POINT(${lng} ${lat})`;
}

async function getValidAccessTokenForAthlete(
  supabase: ReturnType<typeof createAdminClient>,
  athleteId: number
): Promise<{ accessToken: string; userId: string } | null> {
  const { data: tokenData, error } = await supabase
    .from("strava_tokens")
    .select("*")
    .eq("athlete_id", athleteId)
    .single();

  if (error || !tokenData) {
    console.error("No tokens found for athlete:", athleteId);
    return null;
  }

  const expiresAt = new Date(tokenData.expires_at);
  const now = new Date();
  const bufferMs = 5 * 60 * 1000;

  if (expiresAt.getTime() - bufferMs > now.getTime()) {
    return {
      accessToken: tokenData.access_token,
      userId: tokenData.user_id,
    };
  }

  try {
    const newTokens = await refreshAccessToken(tokenData.refresh_token);

    await supabase
      .from("strava_tokens")
      .update({
        access_token: newTokens.accessToken,
        refresh_token: newTokens.refreshToken,
        expires_at: newTokens.expiresAt.toISOString(),
      })
      .eq("user_id", tokenData.user_id);

    return {
      accessToken: newTokens.accessToken,
      userId: tokenData.user_id,
    };
  } catch (err) {
    console.error("Failed to refresh token:", err);
    return null;
  }
}

export async function syncStravaActivity(
  athleteId: number,
  activityId: number
): Promise<void> {
  const supabase = createAdminClient();

  const tokenInfo = await getValidAccessTokenForAthlete(supabase, athleteId);
  if (!tokenInfo) {
    console.error("Could not get valid access token for athlete:", athleteId);
    return;
  }

  const { accessToken, userId } = tokenInfo;

  const { data: existingActivity } = await supabase
    .from("activities")
    .select("id")
    .eq("external_id", `strava:${activityId}`)
    .eq("user_id", userId)
    .single();

  let stravaActivity: StravaActivity;
  try {
    stravaActivity = await getActivity(accessToken, activityId);
  } catch (err) {
    console.error("Failed to fetch Strava activity:", err);
    return;
  }

  const activityType = mapStravaActivityType(stravaActivity.type);
  if (!activityType) {
    console.log(`Skipping unsupported activity type: ${stravaActivity.type}`);
    return;
  }

  const avgPaceSecondsPerKm =
    stravaActivity.distance > 0 && stravaActivity.moving_time > 0
      ? Math.round(
          (stravaActivity.moving_time / stravaActivity.distance) * 1000
        )
      : null;

  const avgSpeedKmh =
    stravaActivity.distance > 0 && stravaActivity.moving_time > 0
      ? stravaActivity.distance / 1000 / (stravaActivity.moving_time / 3600)
      : null;

  let relativeEffort: number | null = null;
  if (
    stravaActivity.average_heartrate != null &&
    stravaActivity.average_heartrate > 0
  ) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("max_heart_rate, rest_heart_rate")
      .eq("id", userId)
      .single();
    relativeEffort = computeRelativeEffort({
      durationSeconds: stravaActivity.elapsed_time,
      avgHeartRate: stravaActivity.average_heartrate,
      maxHeartRate:
        stravaActivity.max_heartrate ?? profile?.max_heart_rate ?? undefined,
      restHeartRate: profile?.rest_heart_rate ?? undefined,
    });
  }

  const activityData = {
    user_id: userId,
    type: activityType,
    name: stravaActivity.name,
    privacy: "followers" as const,
    started_at: stravaActivity.start_date,
    elapsed_time_seconds: stravaActivity.elapsed_time,
    moving_time_seconds: stravaActivity.moving_time,
    distance_meters: stravaActivity.distance,
    elevation_gain_meters: stravaActivity.total_elevation_gain,
    avg_heart_rate: stravaActivity.average_heartrate
      ? Math.round(stravaActivity.average_heartrate)
      : null,
    max_heart_rate: stravaActivity.max_heartrate
      ? Math.round(stravaActivity.max_heartrate)
      : null,
    avg_pace_seconds_per_km: avgPaceSecondsPerKm,
    avg_speed_kmh: avgSpeedKmh,
    calories: stravaActivity.calories,
    start_point: stravaActivity.start_latlng
      ? coordsToPostgisPoint(
          stravaActivity.start_latlng[0],
          stravaActivity.start_latlng[1]
        )
      : null,
    end_point: stravaActivity.end_latlng
      ? coordsToPostgisPoint(
          stravaActivity.end_latlng[0],
          stravaActivity.end_latlng[1]
        )
      : null,
    polyline: stravaActivity.map?.summary_polyline || null,
    relative_effort: relativeEffort,
    source: "strava",
    external_id: `strava:${activityId}`,
  };

  if (existingActivity) {
    const { error } = await supabase
      .from("activities")
      .update(activityData)
      .eq("id", existingActivity.id);

    if (error) {
      console.error("Failed to update activity:", error);
    } else {
      console.log(`Updated Strava activity ${activityId}`);
    }
  } else {
    const { data: newActivity, error } = await supabase
      .from("activities")
      .insert(activityData)
      .select("id")
      .single();

    if (error) {
      console.error("Failed to insert activity:", error);
      return;
    }

    console.log(
      `Synced new Strava activity ${activityId} -> ${newActivity.id}`
    );

    try {
      const streams = await getActivityStreams(accessToken, activityId);

      if (streams.latlng && streams.time) {
        const latlngData = streams.latlng.data as unknown as [number, number][];
        const gpsPoints = latlngData.map((coords, idx) => {
          const timestamp = new Date(stravaActivity.start_date);
          timestamp.setSeconds(
            timestamp.getSeconds() + (streams.time?.data[idx] || 0)
          );

          return {
            activity_id: newActivity.id,
            sequence: idx,
            timestamp: timestamp.toISOString(),
            position: coordsToPostgisPoint(coords[0], coords[1]),
            altitude_meters: streams.altitude?.data[idx] || null,
            heart_rate: streams.heartrate?.data[idx] || null,
            cadence: streams.cadence?.data[idx] || null,
          };
        });

        const BATCH_SIZE = 1000;
        for (let i = 0; i < gpsPoints.length; i += BATCH_SIZE) {
          const batch = gpsPoints.slice(i, i + BATCH_SIZE);
          const { error: gpsError } = await supabase
            .from("gps_points")
            .insert(batch);
          if (gpsError) {
            console.error("Error inserting GPS points batch:", gpsError);
          }
        }
      }
    } catch (err) {
      console.error("Failed to sync GPS streams:", err);
    }
  }
}

export async function syncRecentActivities(
  userId: string,
  count: number = 10
): Promise<{ synced: number; errors: number }> {
  const supabase = createAdminClient();

  const { data: tokenData, error: tokenError } = await supabase
    .from("strava_tokens")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (tokenError || !tokenData) {
    throw new Error("Strava not connected");
  }

  const tokenInfo = await getValidAccessTokenForAthlete(
    supabase,
    tokenData.athlete_id
  );
  if (!tokenInfo) {
    throw new Error("Could not get valid access token");
  }

  const { getAthleteActivities } = await import("./client");
  const activities = await getAthleteActivities(tokenInfo.accessToken, {
    perPage: count,
  });

  let synced = 0;
  let errors = 0;

  for (const activity of activities) {
    try {
      await syncStravaActivity(tokenData.athlete_id, activity.id);
      synced++;
    } catch (err) {
      console.error(`Failed to sync activity ${activity.id}:`, err);
      errors++;
    }
  }

  return { synced, errors };
}
