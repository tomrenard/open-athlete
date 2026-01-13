'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { parseFitFile } from '@/lib/parsers/fit-parser';
import { parseGpxFile } from '@/lib/parsers/gpx-parser';
import { calculateActivityPRs } from '@/lib/utils/pr-calculator';
import type { ActivityType, PrivacyLevel, ParsedActivityData, GpsPoint } from '@/types';

export interface UploadResult {
  success: boolean;
  activityId?: string;
  error?: string;
}

function coordsToPostgisPoint(lat: number, lng: number): string {
  return `POINT(${lng} ${lat})`;
}

export async function uploadActivityFile(formData: FormData): Promise<UploadResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const file = formData.get('file') as File | null;
    const name = (formData.get('name') as string) || 'Untitled Activity';
    const description = formData.get('description') as string | null;
    const activityType = (formData.get('type') as ActivityType) || undefined;
    const privacy = (formData.get('privacy') as PrivacyLevel) || 'followers';

    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    const fileName = file.name.toLowerCase();
    let parsedData: ParsedActivityData;

    if (fileName.endsWith('.fit')) {
      const buffer = await file.arrayBuffer();
      parsedData = await parseFitFile(buffer);
    } else if (fileName.endsWith('.gpx')) {
      const content = await file.text();
      parsedData = await parseGpxFile(content);
    } else {
      return { success: false, error: 'Unsupported file format. Please use .FIT or .GPX files.' };
    }

    const gpsPointsForPR: GpsPoint[] = parsedData.gpsPoints.map((p, idx) => ({
      id: `temp-${idx}`,
      activityId: '',
      sequence: p.sequence,
      timestamp: p.timestamp,
      lat: p.lat,
      lng: p.lng,
      altitudeMeters: p.altitudeMeters,
      heartRate: p.heartRate,
      cadence: p.cadence,
      speedMs: p.speedMs,
      powerWatts: p.powerWatts,
    }));

    const prs = calculateActivityPRs(gpsPointsForPR);
    const best1km = prs.find((p) => p.distance === 1000)?.timeSeconds;
    const best5km = prs.find((p) => p.distance === 5000)?.timeSeconds;
    const best10km = prs.find((p) => p.distance === 10000)?.timeSeconds;

    const avgPaceSecondsPerKm =
      parsedData.distanceMeters > 0
        ? Math.round(
            ((parsedData.movingTimeSeconds || parsedData.elapsedTimeSeconds) /
              parsedData.distanceMeters) *
              1000
          )
        : null;

    const avgSpeedKmh =
      parsedData.distanceMeters > 0 &&
      (parsedData.movingTimeSeconds || parsedData.elapsedTimeSeconds) > 0
        ? (parsedData.distanceMeters / 1000) /
          ((parsedData.movingTimeSeconds || parsedData.elapsedTimeSeconds) / 3600)
        : null;

    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .insert({
        user_id: user.id,
        type: activityType || parsedData.type,
        name,
        description,
        privacy,
        started_at: parsedData.startedAt.toISOString(),
        elapsed_time_seconds: parsedData.elapsedTimeSeconds,
        moving_time_seconds: parsedData.movingTimeSeconds,
        distance_meters: parsedData.distanceMeters,
        elevation_gain_meters: parsedData.elevationGainMeters,
        elevation_loss_meters: parsedData.elevationLossMeters,
        avg_heart_rate: parsedData.avgHeartRate,
        max_heart_rate: parsedData.maxHeartRate,
        avg_pace_seconds_per_km: avgPaceSecondsPerKm,
        avg_speed_kmh: avgSpeedKmh,
        calories: parsedData.calories,
        start_point: parsedData.startPoint
          ? coordsToPostgisPoint(parsedData.startPoint.lat, parsedData.startPoint.lng)
          : null,
        end_point: parsedData.endPoint
          ? coordsToPostgisPoint(parsedData.endPoint.lat, parsedData.endPoint.lng)
          : null,
        bounds_sw: parsedData.boundsSw
          ? coordsToPostgisPoint(parsedData.boundsSw.lat, parsedData.boundsSw.lng)
          : null,
        bounds_ne: parsedData.boundsNe
          ? coordsToPostgisPoint(parsedData.boundsNe.lat, parsedData.boundsNe.lng)
          : null,
        polyline: parsedData.polyline,
        best_1km_seconds: best1km,
        best_5km_seconds: best5km,
        best_10km_seconds: best10km,
        source: 'upload',
      })
      .select('id')
      .single();

    if (activityError || !activity) {
      return { success: false, error: activityError?.message || 'Failed to create activity' };
    }

    if (parsedData.gpsPoints.length > 0) {
      const gpsPointsToInsert = parsedData.gpsPoints.map((point) => ({
        activity_id: activity.id,
        sequence: point.sequence,
        timestamp: point.timestamp.toISOString(),
        position: coordsToPostgisPoint(point.lat, point.lng),
        altitude_meters: point.altitudeMeters,
        heart_rate: point.heartRate,
        cadence: point.cadence,
        speed_ms: point.speedMs,
        power_watts: point.powerWatts,
        temperature_celsius: point.temperatureCelsius,
      }));

      const BATCH_SIZE = 1000;
      for (let i = 0; i < gpsPointsToInsert.length; i += BATCH_SIZE) {
        const batch = gpsPointsToInsert.slice(i, i + BATCH_SIZE);
        const { error: gpsError } = await supabase.from('gps_points').insert(batch);
        if (gpsError) {
          console.error('Error inserting GPS points batch:', gpsError);
        }
      }
    }

    revalidatePath('/feed');
    revalidatePath('/dashboard');

    return { success: true, activityId: activity.id };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload activity',
    };
  }
}
