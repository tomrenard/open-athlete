import FitParser from 'fit-file-parser';
import type { ParsedActivityData, ActivityType, GpsPointInsert, Coordinates } from '@/types';
import { encodePolyline, calculateBounds } from '@/lib/utils/polyline';

interface FitRecord {
  timestamp?: Date;
  position_lat?: number;
  position_long?: number;
  altitude?: number;
  heart_rate?: number;
  cadence?: number;
  speed?: number;
  power?: number;
  temperature?: number;
  distance?: number;
}

interface FitSession {
  sport?: string;
  start_time?: Date;
  total_elapsed_time?: number;
  total_timer_time?: number;
  total_distance?: number;
  total_ascent?: number;
  total_descent?: number;
  avg_heart_rate?: number;
  max_heart_rate?: number;
  total_calories?: number;
  avg_cadence?: number;
  avg_speed?: number;
  avg_power?: number;
}

interface FitData {
  records?: FitRecord[];
  sessions?: FitSession[];
}

function semicirclesToDegrees(value: number): number {
  // fit-file-parser may already convert to degrees
  // Semicircle values are typically very large (e.g., 500000000)
  // Degree values are between -180 and 180
  if (Math.abs(value) <= 180) {
    return value; // Already in degrees
  }
  return value * (180 / Math.pow(2, 31));
}

function mapSportToActivityType(sport?: string): ActivityType {
  if (!sport) return 'run';
  const sportLower = sport.toLowerCase();
  if (sportLower.includes('cycling') || sportLower.includes('biking') || sportLower === 'ride') {
    return 'ride';
  }
  if (sportLower.includes('swim')) {
    return 'swim';
  }
  return 'run';
}

export async function parseFitFile(buffer: ArrayBuffer): Promise<ParsedActivityData> {
  return new Promise((resolve, reject) => {
    const fitParser = new FitParser({
      force: true,
      speedUnit: 'm/s',
      lengthUnit: 'm',
      temperatureUnit: 'celsius',
      elapsedRecordField: true,
      mode: 'list',
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fitParser.parse(buffer, (error: any, data: any) => {
      if (error) {
        reject(new Error(`Failed to parse FIT file: ${error}`));
        return;
      }

      try {
        const fitData = data as FitData;
        const session = fitData.sessions?.[0];
        const records = fitData.records || [];

        if (!session) {
          reject(new Error('No session data found in FIT file'));
          return;
        }

        const gpsPoints: GpsPointInsert[] = [];
        const coordinates: Coordinates[] = [];
        let elevationGain = 0;
        let elevationLoss = 0;
        let prevAltitude: number | null = null;
        let maxHeartRate = 0;
        let heartRateSum = 0;
        let heartRateCount = 0;

        records.forEach((record, index) => {
          if (record.position_lat && record.position_long) {
            const lat = semicirclesToDegrees(record.position_lat);
            const lng = semicirclesToDegrees(record.position_long);

            // Validate coordinates are within valid range
            if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
              return; // Skip invalid coordinates
            }

            coordinates.push({ lat, lng });

            gpsPoints.push({
              activityId: '',
              sequence: index,
              timestamp: record.timestamp || new Date(),
              lat,
              lng,
              altitudeMeters: record.altitude,
              heartRate: record.heart_rate,
              cadence: record.cadence,
              speedMs: record.speed,
              powerWatts: record.power,
              temperatureCelsius: record.temperature,
            });

            if (record.altitude !== undefined) {
              if (prevAltitude !== null) {
                const diff = record.altitude - prevAltitude;
                if (diff > 0) {
                  elevationGain += diff;
                } else {
                  elevationLoss += Math.abs(diff);
                }
              }
              prevAltitude = record.altitude;
            }

            if (record.heart_rate) {
              heartRateSum += record.heart_rate;
              heartRateCount++;
              if (record.heart_rate > maxHeartRate) {
                maxHeartRate = record.heart_rate;
              }
            }
          }
        });

        const startPoint = coordinates[0];
        const endPoint = coordinates[coordinates.length - 1];
        const { sw: boundsSw, ne: boundsNe } = calculateBounds(coordinates);
        const polyline = encodePolyline(coordinates);

        const distanceMeters = session.total_distance || 0;
        const elapsedTimeSeconds = Math.round(session.total_elapsed_time || 0);
        const movingTimeSeconds = session.total_timer_time
          ? Math.round(session.total_timer_time)
          : undefined;

        const result: ParsedActivityData = {
          type: mapSportToActivityType(session.sport),
          startedAt: session.start_time || new Date(),
          elapsedTimeSeconds,
          movingTimeSeconds,
          distanceMeters,
          elevationGainMeters: session.total_ascent || elevationGain,
          elevationLossMeters: session.total_descent || elevationLoss,
          avgHeartRate: session.avg_heart_rate || (heartRateCount > 0 ? Math.round(heartRateSum / heartRateCount) : undefined),
          maxHeartRate: maxHeartRate || session.max_heart_rate,
          calories: session.total_calories,
          gpsPoints,
          polyline,
          startPoint,
          endPoint,
          boundsSw,
          boundsNe,
        };

        resolve(result);
      } catch (err) {
        reject(new Error(`Failed to process FIT data: ${err instanceof Error ? err.message : 'Unknown error'}`));
      }
    });
  });
}
