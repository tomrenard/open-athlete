import type { ActivityType, PrivacyLevel, ActivitySource } from "./activity";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          location: string | null;
          strava_athlete_id: number | null;
          max_heart_rate: number | null;
          rest_heart_rate: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          location?: string | null;
          strava_athlete_id?: number | null;
          max_heart_rate?: number | null;
          rest_heart_rate?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          location?: string | null;
          strava_athlete_id?: number | null;
          max_heart_rate?: number | null;
          rest_heart_rate?: number | null;
          updated_at?: string;
        };
      };
      activities: {
        Row: {
          id: string;
          user_id: string;
          type: ActivityType;
          name: string;
          description: string | null;
          privacy: PrivacyLevel;
          started_at: string;
          elapsed_time_seconds: number;
          moving_time_seconds: number | null;
          distance_meters: number;
          elevation_gain_meters: number | null;
          elevation_loss_meters: number | null;
          avg_heart_rate: number | null;
          max_heart_rate: number | null;
          avg_pace_seconds_per_km: number | null;
          avg_speed_kmh: number | null;
          calories: number | null;
          start_point: string | null;
          end_point: string | null;
          bounds_sw: string | null;
          bounds_ne: string | null;
          polyline: string | null;
          best_1km_seconds: number | null;
          best_5km_seconds: number | null;
          best_10km_seconds: number | null;
          relative_effort: number | null;
          source: ActivitySource;
          external_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: ActivityType;
          name: string;
          description?: string | null;
          privacy?: PrivacyLevel;
          started_at: string;
          elapsed_time_seconds: number;
          moving_time_seconds?: number | null;
          distance_meters: number;
          elevation_gain_meters?: number | null;
          elevation_loss_meters?: number | null;
          avg_heart_rate?: number | null;
          max_heart_rate?: number | null;
          avg_pace_seconds_per_km?: number | null;
          avg_speed_kmh?: number | null;
          calories?: number | null;
          start_point?: string | null;
          end_point?: string | null;
          bounds_sw?: string | null;
          bounds_ne?: string | null;
          polyline?: string | null;
          best_1km_seconds?: number | null;
          best_5km_seconds?: number | null;
          best_10km_seconds?: number | null;
          relative_effort?: number | null;
          source?: ActivitySource;
          external_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          type?: ActivityType;
          name?: string;
          description?: string | null;
          privacy?: PrivacyLevel;
          started_at?: string;
          elapsed_time_seconds?: number;
          moving_time_seconds?: number | null;
          distance_meters?: number;
          elevation_gain_meters?: number | null;
          elevation_loss_meters?: number | null;
          avg_heart_rate?: number | null;
          max_heart_rate?: number | null;
          avg_pace_seconds_per_km?: number | null;
          avg_speed_kmh?: number | null;
          calories?: number | null;
          start_point?: string | null;
          end_point?: string | null;
          bounds_sw?: string | null;
          bounds_ne?: string | null;
          polyline?: string | null;
          best_1km_seconds?: number | null;
          best_5km_seconds?: number | null;
          best_10km_seconds?: number | null;
          relative_effort?: number | null;
          source?: ActivitySource;
          external_id?: string | null;
          updated_at?: string;
        };
      };
      gps_points: {
        Row: {
          id: string;
          activity_id: string;
          sequence: number;
          timestamp: string;
          position: string;
          altitude_meters: number | null;
          heart_rate: number | null;
          cadence: number | null;
          speed_ms: number | null;
          power_watts: number | null;
          temperature_celsius: number | null;
        };
        Insert: {
          id?: string;
          activity_id: string;
          sequence: number;
          timestamp: string;
          position: string;
          altitude_meters?: number | null;
          heart_rate?: number | null;
          cadence?: number | null;
          speed_ms?: number | null;
          power_watts?: number | null;
          temperature_celsius?: number | null;
        };
        Update: {
          activity_id?: string;
          sequence?: number;
          timestamp?: string;
          position?: string;
          altitude_meters?: number | null;
          heart_rate?: number | null;
          cadence?: number | null;
          speed_ms?: number | null;
          power_watts?: number | null;
          temperature_celsius?: number | null;
        };
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
      };
    };
    Enums: {
      activity_type: ActivityType;
      privacy_level: PrivacyLevel;
    };
  };
}
