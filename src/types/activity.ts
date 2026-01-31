export type ActivityType = "run" | "ride" | "swim";
export type PrivacyLevel = "public" | "followers" | "private";
export type ActivitySource = "upload" | "strava" | "manual";

export interface GpsPoint {
  id: string;
  activityId: string;
  sequence: number;
  timestamp: Date;
  lat: number;
  lng: number;
  altitudeMeters?: number;
  heartRate?: number;
  cadence?: number;
  speedMs?: number;
  powerWatts?: number;
  temperatureCelsius?: number;
}

export interface GpsPointInsert {
  activityId: string;
  sequence: number;
  timestamp: Date;
  lat: number;
  lng: number;
  altitudeMeters?: number;
  heartRate?: number;
  cadence?: number;
  speedMs?: number;
  powerWatts?: number;
  temperatureCelsius?: number;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Activity {
  id: string;
  userId: string;
  type: ActivityType;
  name: string;
  description?: string;
  privacy: PrivacyLevel;
  startedAt: Date;
  elapsedTimeSeconds: number;
  movingTimeSeconds?: number;
  distanceMeters: number;
  elevationGainMeters?: number;
  elevationLossMeters?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  avgPaceSecondsPerKm?: number;
  avgSpeedKmh?: number;
  calories?: number;
  startPoint?: Coordinates;
  endPoint?: Coordinates;
  boundsSw?: Coordinates;
  boundsNe?: Coordinates;
  polyline?: string;
  best1kmSeconds?: number;
  best5kmSeconds?: number;
  best10kmSeconds?: number;
  relativeEffort?: number;
  source: ActivitySource;
  externalId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityInsert {
  userId: string;
  type: ActivityType;
  name: string;
  description?: string;
  privacy?: PrivacyLevel;
  startedAt: Date;
  elapsedTimeSeconds: number;
  movingTimeSeconds?: number;
  distanceMeters: number;
  elevationGainMeters?: number;
  elevationLossMeters?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  avgPaceSecondsPerKm?: number;
  avgSpeedKmh?: number;
  calories?: number;
  startPoint?: Coordinates;
  endPoint?: Coordinates;
  boundsSw?: Coordinates;
  boundsNe?: Coordinates;
  polyline?: string;
  best1kmSeconds?: number;
  best5kmSeconds?: number;
  best10kmSeconds?: number;
  relativeEffort?: number;
  source?: ActivitySource;
  externalId?: string;
}

export interface ActivityWithAuthor extends Activity {
  author: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

export interface ActivityStats {
  totalActivities: number;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  totalElevationGainMeters: number;
}

export interface SeasonPR {
  distance: "1km" | "5km" | "10km";
  timeSeconds: number;
  activityId: string;
  activityName: string;
  achievedAt: Date;
}

export interface WeeklyActivity {
  date: string;
  count: number;
  totalDistanceMeters: number;
}

export interface ParsedActivityData {
  type: ActivityType;
  startedAt: Date;
  elapsedTimeSeconds: number;
  movingTimeSeconds?: number;
  distanceMeters: number;
  elevationGainMeters?: number;
  elevationLossMeters?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  calories?: number;
  gpsPoints: GpsPointInsert[];
  polyline?: string;
  startPoint?: Coordinates;
  endPoint?: Coordinates;
  boundsSw?: Coordinates;
  boundsNe?: Coordinates;
}
