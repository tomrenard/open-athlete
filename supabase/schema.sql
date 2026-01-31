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
  max_heart_rate INTEGER,
  rest_heart_rate INTEGER,
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
  relative_effort NUMERIC(10, 2),
  
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

-- Strava tokens table (for API access)
CREATE TABLE public.strava_tokens (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  athlete_id BIGINT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
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
CREATE INDEX idx_strava_tokens_athlete ON public.strava_tokens(athlete_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gps_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strava_tokens ENABLE ROW LEVEL SECURITY;

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

-- RLS Policies for strava_tokens
CREATE POLICY "Users can view own strava tokens"
  ON public.strava_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own strava tokens"
  ON public.strava_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own strava tokens"
  ON public.strava_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own strava tokens"
  ON public.strava_tokens FOR DELETE
  USING (auth.uid() = user_id);

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

CREATE TRIGGER update_strava_tokens_updated_at
  BEFORE UPDATE ON public.strava_tokens
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

-- Activity kudos (Phase 1.3)
CREATE TABLE public.activity_kudos (
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (activity_id, user_id)
);

CREATE INDEX idx_activity_kudos_activity ON public.activity_kudos(activity_id);
CREATE INDEX idx_activity_kudos_user ON public.activity_kudos(user_id);

ALTER TABLE public.activity_kudos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kudos viewable if activity is viewable"
  ON public.activity_kudos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.activities a
      WHERE a.id = activity_kudos.activity_id
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

CREATE POLICY "Users can give kudos"
  ON public.activity_kudos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own kudos"
  ON public.activity_kudos FOR DELETE
  USING (auth.uid() = user_id);

-- Activity comments (Phase 1.4)
CREATE TABLE public.activity_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_comments_activity ON public.activity_comments(activity_id);
CREATE INDEX idx_activity_comments_user ON public.activity_comments(user_id);

ALTER TABLE public.activity_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments viewable if activity is viewable"
  ON public.activity_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.activities a
      WHERE a.id = activity_comments.activity_id
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

CREATE POLICY "Users can insert comments"
  ON public.activity_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.activity_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Goals (Phase 2.2)
CREATE TYPE goal_type AS ENUM ('distance', 'time', 'elevation', 'activities');
CREATE TYPE goal_period AS ENUM ('week', 'month', 'year');

CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type goal_type NOT NULL,
  period goal_period NOT NULL,
  target_value NUMERIC(12, 2) NOT NULL,
  period_start DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, type, period, period_start)
);

CREATE INDEX idx_goals_user ON public.goals(user_id);
CREATE INDEX idx_goals_period ON public.goals(user_id, period, period_start);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own goals"
  ON public.goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Clubs (Phase 3)
CREATE TYPE club_visibility AS ENUM ('public', 'invite_only');
CREATE TYPE club_member_role AS ENUM ('member', 'admin');

CREATE TABLE public.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  sport_type activity_type NOT NULL,
  visibility club_visibility DEFAULT 'public',
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.club_members (
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role club_member_role DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (club_id, user_id)
);

CREATE TABLE public.club_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (club_id, user_id)
);

CREATE INDEX idx_clubs_owner ON public.clubs(owner_id);
CREATE INDEX idx_clubs_slug ON public.clubs(slug);
CREATE INDEX idx_club_members_club ON public.club_members(club_id);
CREATE INDEX idx_club_members_user ON public.club_members(user_id);
CREATE INDEX idx_club_join_requests_club ON public.club_join_requests(club_id);

ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clubs are viewable by everyone"
  ON public.clubs FOR SELECT USING (true);

CREATE POLICY "Users can create clubs"
  ON public.clubs FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners and admins can update club"
  ON public.clubs FOR UPDATE
  USING (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_id = clubs.id AND user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Owners can delete club"
  ON public.clubs FOR DELETE USING (auth.uid() = owner_id);

CREATE POLICY "Club members are viewable by everyone"
  ON public.club_members FOR SELECT USING (true);

CREATE POLICY "Users can join public clubs or if approved"
  ON public.club_members FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave club or owners can remove"
  ON public.club_members FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.clubs WHERE id = club_members.club_id AND owner_id = auth.uid())
  );

CREATE POLICY "Join requests viewable by club members"
  ON public.club_join_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_id = club_join_requests.club_id AND user_id = auth.uid()
    )
    OR auth.uid() = club_join_requests.user_id
  );

CREATE POLICY "Users can request to join"
  ON public.club_join_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Requesters can withdraw or admins can delete"
  ON public.club_join_requests FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_id = club_join_requests.club_id AND user_id = auth.uid() AND role = 'admin'
    )
    OR EXISTS (SELECT 1 FROM public.clubs WHERE id = club_join_requests.club_id AND owner_id = auth.uid())
  );

CREATE TRIGGER update_clubs_updated_at
  BEFORE UPDATE ON public.clubs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Challenges (Phase 4)
CREATE TYPE challenge_type AS ENUM ('distance', 'elevation', 'time', 'activities');

CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type challenge_type NOT NULL,
  target_value NUMERIC(12, 2) NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.challenge_participants (
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (challenge_id, user_id)
);

CREATE INDEX idx_challenges_start ON public.challenges(start_at);
CREATE INDEX idx_challenges_end ON public.challenges(end_at);
CREATE INDEX idx_challenge_participants_challenge ON public.challenge_participants(challenge_id);
CREATE INDEX idx_challenge_participants_user ON public.challenge_participants(user_id);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Challenges are viewable by everyone"
  ON public.challenges FOR SELECT USING (true);

CREATE POLICY "Users can create challenges"
  ON public.challenges FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can delete challenge"
  ON public.challenges FOR DELETE USING (auth.uid() = creator_id);

CREATE POLICY "Challenge participants are viewable by everyone"
  ON public.challenge_participants FOR SELECT USING (true);

CREATE POLICY "Users can join challenges"
  ON public.challenge_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave challenge"
  ON public.challenge_participants FOR DELETE USING (auth.uid() = user_id);

-- Segments (Phase 5)
CREATE TABLE public.segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  activity_type activity_type NOT NULL,
  polyline TEXT,
  distance_meters NUMERIC(10, 2),
  elevation_gain_meters NUMERIC(7, 2),
  created_from_activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.segment_efforts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID NOT NULL REFERENCES public.segments(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  elapsed_time_seconds INTEGER NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (segment_id, activity_id)
);

CREATE INDEX idx_segments_activity_type ON public.segments(activity_type);
CREATE INDEX idx_segments_creator ON public.segments(creator_id);
CREATE INDEX idx_segment_efforts_segment ON public.segment_efforts(segment_id);
CREATE INDEX idx_segment_efforts_user ON public.segment_efforts(user_id);

ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.segment_efforts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Segments are viewable by everyone"
  ON public.segments FOR SELECT USING (true);

CREATE POLICY "Users can create segments"
  ON public.segments FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can delete segment"
  ON public.segments FOR DELETE USING (auth.uid() = creator_id);

CREATE POLICY "Segment efforts viewable by everyone"
  ON public.segment_efforts FOR SELECT USING (true);

CREATE POLICY "Users can insert own segment efforts"
  ON public.segment_efforts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Routes (Phase 6.1)
CREATE TABLE public.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  polyline TEXT NOT NULL,
  distance_meters NUMERIC(10, 2),
  elevation_gain_meters NUMERIC(7, 2),
  activity_type activity_type NOT NULL,
  created_from_activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_routes_user ON public.routes(user_id);

ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Routes viewable by owner"
  ON public.routes FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create routes"
  ON public.routes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own routes"
  ON public.routes FOR DELETE USING (auth.uid() = user_id);

-- Notifications (Phase 6.3)
CREATE TYPE notification_type AS ENUM ('kudos', 'comment', 'follow', 'challenge');

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE SET NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read_at);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications (mark read)"
  ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Training load (Relative effort, Fitness/Fatigue/Form)
CREATE TABLE public.training_load_daily (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  load NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ctl NUMERIC(10, 2) NOT NULL DEFAULT 0,
  atl NUMERIC(10, 2) NOT NULL DEFAULT 0,
  tsb NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, date)
);

CREATE INDEX idx_training_load_daily_user ON public.training_load_daily(user_id);
CREATE INDEX idx_training_load_daily_date ON public.training_load_daily(user_id, date DESC);

ALTER TABLE public.training_load_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own training load"
  ON public.training_load_daily FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own training load"
  ON public.training_load_daily FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own training load"
  ON public.training_load_daily FOR UPDATE USING (auth.uid() = user_id);
