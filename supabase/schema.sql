-- OpenAthlete Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- Enable PostGIS extension for spatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Activity types enum
CREATE TYPE activity_type AS ENUM ('run', 'ride', 'swim');

-- Privacy enum
CREATE TYPE privacy_level AS ENUM ('public', 'followers', 'private');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  strava_athlete_id BIGINT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activities table
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type activity_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  privacy privacy_level DEFAULT 'followers',
  
  -- Timing
  started_at TIMESTAMPTZ NOT NULL,
  elapsed_time_seconds INTEGER NOT NULL,
  moving_time_seconds INTEGER,
  
  -- Distance & elevation
  distance_meters NUMERIC(10, 2) NOT NULL,
  elevation_gain_meters NUMERIC(7, 2),
  elevation_loss_meters NUMERIC(7, 2),
  
  -- Performance
  avg_heart_rate INTEGER,
  max_heart_rate INTEGER,
  avg_pace_seconds_per_km NUMERIC(6, 2),
  avg_speed_kmh NUMERIC(5, 2),
  calories INTEGER,
  
  -- Geospatial (bounding box for quick queries)
  start_point GEOGRAPHY(POINT, 4326),
  end_point GEOGRAPHY(POINT, 4326),
  bounds_sw GEOGRAPHY(POINT, 4326),
  bounds_ne GEOGRAPHY(POINT, 4326),
  polyline TEXT,
  
  -- Computed PRs (cached)
  best_1km_seconds INTEGER,
  best_5km_seconds INTEGER,
  best_10km_seconds INTEGER,
  
  -- Source
  source TEXT DEFAULT 'upload',
  external_id TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- GPS Points table (for detailed analysis)
CREATE TABLE public.gps_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  position GEOGRAPHY(POINT, 4326) NOT NULL,
  altitude_meters NUMERIC(6, 2),
  heart_rate INTEGER,
  cadence INTEGER,
  speed_ms NUMERIC(5, 2),
  power_watts INTEGER,
  temperature_celsius NUMERIC(4, 1)
);

-- Follows table
CREATE TABLE public.follows (
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Performance indexes
CREATE INDEX idx_activities_user_id ON public.activities(user_id);
CREATE INDEX idx_activities_started_at ON public.activities(started_at DESC);
CREATE INDEX idx_activities_type ON public.activities(type);
CREATE INDEX idx_activities_start_point ON public.activities USING GIST(start_point);
CREATE INDEX idx_activities_privacy ON public.activities(privacy);
CREATE INDEX idx_activities_source ON public.activities(source);
CREATE INDEX idx_gps_points_activity ON public.gps_points(activity_id, sequence);
CREATE INDEX idx_gps_points_position ON public.gps_points USING GIST(position);
CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gps_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for activities
CREATE POLICY "Public activities are viewable by everyone"
  ON public.activities FOR SELECT
  USING (
    privacy = 'public'
    OR user_id = auth.uid()
    OR (
      privacy = 'followers'
      AND EXISTS (
        SELECT 1 FROM public.follows
        WHERE follower_id = auth.uid()
        AND following_id = activities.user_id
      )
    )
  );

CREATE POLICY "Users can insert own activities"
  ON public.activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activities"
  ON public.activities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own activities"
  ON public.activities FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for gps_points
CREATE POLICY "GPS points viewable if activity is viewable"
  ON public.gps_points FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.activities a
      WHERE a.id = gps_points.activity_id
      AND (
        a.privacy = 'public'
        OR a.user_id = auth.uid()
        OR (
          a.privacy = 'followers'
          AND EXISTS (
            SELECT 1 FROM public.follows
            WHERE follower_id = auth.uid()
            AND following_id = a.user_id
          )
        )
      )
    )
  );

CREATE POLICY "Users can insert GPS points for own activities"
  ON public.gps_points FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.activities
      WHERE id = gps_points.activity_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete GPS points for own activities"
  ON public.gps_points FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.activities
      WHERE id = gps_points.activity_id
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for follows
CREATE POLICY "Follows are viewable by everyone"
  ON public.follows FOR SELECT
  USING (true);

CREATE POLICY "Users can follow others"
  ON public.follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON public.follows FOR DELETE
  USING (auth.uid() = follower_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to find activities near a point (spatial query)
CREATE OR REPLACE FUNCTION find_activities_near(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_meters INTEGER DEFAULT 5000,
  limit_count INTEGER DEFAULT 20
)
RETURNS SETOF public.activities AS $$
BEGIN
  RETURN QUERY
  SELECT a.*
  FROM public.activities a
  WHERE ST_DWithin(
    a.start_point,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
    radius_meters
  )
  AND (
    a.privacy = 'public'
    OR a.user_id = auth.uid()
    OR (
      a.privacy = 'followers'
      AND EXISTS (
        SELECT 1 FROM public.follows
        WHERE follower_id = auth.uid()
        AND following_id = a.user_id
      )
    )
  )
  ORDER BY a.started_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get season PRs for a user
CREATE OR REPLACE FUNCTION get_season_prs(
  target_user_id UUID,
  year_start DATE DEFAULT date_trunc('year', CURRENT_DATE)::DATE
)
RETURNS TABLE (
  distance TEXT,
  time_seconds INTEGER,
  activity_id UUID,
  activity_name TEXT,
  achieved_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH prs AS (
    SELECT 
      '1km' as dist,
      MIN(best_1km_seconds) as best_time,
      (ARRAY_AGG(id ORDER BY best_1km_seconds ASC))[1] as act_id,
      (ARRAY_AGG(name ORDER BY best_1km_seconds ASC))[1] as act_name,
      (ARRAY_AGG(started_at ORDER BY best_1km_seconds ASC))[1] as act_date
    FROM public.activities
    WHERE user_id = target_user_id
      AND started_at >= year_start
      AND best_1km_seconds IS NOT NULL
    UNION ALL
    SELECT 
      '5km' as dist,
      MIN(best_5km_seconds) as best_time,
      (ARRAY_AGG(id ORDER BY best_5km_seconds ASC))[1] as act_id,
      (ARRAY_AGG(name ORDER BY best_5km_seconds ASC))[1] as act_name,
      (ARRAY_AGG(started_at ORDER BY best_5km_seconds ASC))[1] as act_date
    FROM public.activities
    WHERE user_id = target_user_id
      AND started_at >= year_start
      AND best_5km_seconds IS NOT NULL
    UNION ALL
    SELECT 
      '10km' as dist,
      MIN(best_10km_seconds) as best_time,
      (ARRAY_AGG(id ORDER BY best_10km_seconds ASC))[1] as act_id,
      (ARRAY_AGG(name ORDER BY best_10km_seconds ASC))[1] as act_name,
      (ARRAY_AGG(started_at ORDER BY best_10km_seconds ASC))[1] as act_date
    FROM public.activities
    WHERE user_id = target_user_id
      AND started_at >= year_start
      AND best_10km_seconds IS NOT NULL
  )
  SELECT dist, best_time, act_id, act_name, act_date
  FROM prs
  WHERE best_time IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
