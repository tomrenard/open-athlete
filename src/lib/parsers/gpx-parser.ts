import { XMLParser } from 'fast-xml-parser';
import type { ParsedActivityData, ActivityType, GpsPointInsert, Coordinates } from '@/types';
import { encodePolyline, calculateBounds } from '@/lib/utils/polyline';

interface GpxTrackPoint {
  lat: number;
  lng: number;
  elevation?: number;
  time?: Date;
  heartRate?: number;
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function detectActivityType(avgSpeedKmh: number): ActivityType {
  if (avgSpeedKmh > 25) return 'ride';
  if (avgSpeedKmh < 2) return 'swim';
  return 'run';
}

interface ParsedTrkpt {
  '@_lat': string;
  '@_lon': string;
  ele?: string;
  time?: string;
  extensions?: {
    'gpxtpx:TrackPointExtension'?: {
      'gpxtpx:hr'?: string;
    };
  };
}

interface ParsedGpx {
  gpx?: {
    trk?: {
      trkseg?: {
        trkpt?: ParsedTrkpt | ParsedTrkpt[];
      } | Array<{ trkpt?: ParsedTrkpt | ParsedTrkpt[] }>;
    };
  };
}

export async function parseGpxFile(content: string): Promise<ParsedActivityData> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });

  const parsed: ParsedGpx = parser.parse(content);

  if (!parsed.gpx?.trk?.trkseg) {
    throw new Error('Invalid GPX file format: no track segments found');
  }

  const trackPoints: GpxTrackPoint[] = [];
  
  // Handle both single segment and array of segments
  const segments = Array.isArray(parsed.gpx.trk.trkseg) 
    ? parsed.gpx.trk.trkseg 
    : [parsed.gpx.trk.trkseg];

  for (const segment of segments) {
    if (!segment.trkpt) continue;
    
    // Handle both single point and array of points
    const points = Array.isArray(segment.trkpt) ? segment.trkpt : [segment.trkpt];
    
    for (const trkpt of points) {
      const lat = parseFloat(trkpt['@_lat'] || '0');
      const lng = parseFloat(trkpt['@_lon'] || '0');
      
      // Skip invalid coordinates
      if (lat === 0 && lng === 0) continue;
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;

      const elevation = trkpt.ele ? parseFloat(trkpt.ele) : undefined;
      const time = trkpt.time ? new Date(trkpt.time) : undefined;
      const heartRate = trkpt.extensions?.['gpxtpx:TrackPointExtension']?.['gpxtpx:hr']
        ? parseInt(trkpt.extensions['gpxtpx:TrackPointExtension']['gpxtpx:hr'], 10)
        : undefined;

      trackPoints.push({
        lat,
        lng,
        elevation,
        time,
        heartRate,
      });
    }
  }

  if (trackPoints.length === 0) {
    throw new Error('No valid track points found in GPX file');
  }

  let totalDistance = 0;
  let elevationGain = 0;
  let elevationLoss = 0;
  let heartRateSum = 0;
  let heartRateCount = 0;
  let maxHeartRate = 0;

  const gpsPoints: GpsPointInsert[] = [];
  const coordinates: Coordinates[] = [];

  for (let i = 0; i < trackPoints.length; i++) {
    const point = trackPoints[i];
    coordinates.push({ lat: point.lat, lng: point.lng });

    if (i > 0) {
      const prev = trackPoints[i - 1];
      totalDistance += haversineDistance(prev.lat, prev.lng, point.lat, point.lng);

      if (point.elevation !== undefined && prev.elevation !== undefined) {
        const diff = point.elevation - prev.elevation;
        if (diff > 0) {
          elevationGain += diff;
        } else {
          elevationLoss += Math.abs(diff);
        }
      }
    }

    if (point.heartRate) {
      heartRateSum += point.heartRate;
      heartRateCount++;
      if (point.heartRate > maxHeartRate) {
        maxHeartRate = point.heartRate;
      }
    }

    gpsPoints.push({
      activityId: '',
      sequence: i,
      timestamp: point.time || new Date(),
      lat: point.lat,
      lng: point.lng,
      altitudeMeters: point.elevation,
      heartRate: point.heartRate,
    });
  }

  const startTime = trackPoints[0].time;
  const endTime = trackPoints[trackPoints.length - 1].time;
  const elapsedTimeSeconds =
    startTime && endTime
      ? Math.round((endTime.getTime() - startTime.getTime()) / 1000)
      : 0;

  const startPoint = coordinates[0];
  const endPoint = coordinates[coordinates.length - 1];
  const { sw: boundsSw, ne: boundsNe } = calculateBounds(coordinates);
  const polyline = encodePolyline(coordinates);

  const avgSpeedKmh =
    totalDistance > 0 && elapsedTimeSeconds > 0
      ? (totalDistance / 1000) / (elapsedTimeSeconds / 3600)
      : 0;

  const result: ParsedActivityData = {
    type: detectActivityType(avgSpeedKmh),
    startedAt: startTime || new Date(),
    elapsedTimeSeconds,
    movingTimeSeconds: elapsedTimeSeconds,
    distanceMeters: totalDistance,
    elevationGainMeters: elevationGain,
    elevationLossMeters: elevationLoss,
    avgHeartRate: heartRateCount > 0 ? Math.round(heartRateSum / heartRateCount) : undefined,
    maxHeartRate: maxHeartRate > 0 ? maxHeartRate : undefined,
    gpsPoints,
    polyline,
    startPoint,
    endPoint,
    boundsSw,
    boundsNe,
  };

  return result;
}
