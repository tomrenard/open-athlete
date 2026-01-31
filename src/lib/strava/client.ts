import { createClient } from "@/lib/supabase/server";

const STRAVA_API_BASE = "https://www.strava.com/api/v3";
const STRAVA_AUTH_URL = "https://www.strava.com/oauth/authorize";
const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";

export interface StravaTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  athleteId: number;
}

export interface StravaAthlete {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  profile: string;
}

export interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  start_date: string;
  start_date_local: string;
  elapsed_time: number;
  moving_time: number;
  distance: number;
  total_elevation_gain: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_speed: number;
  max_speed: number;
  calories?: number;
  start_latlng?: [number, number];
  end_latlng?: [number, number];
  map?: {
    id: string;
    polyline?: string;
    summary_polyline?: string;
  };
  average_cadence?: number;
  average_watts?: number;
  kilojoules?: number;
}

export interface StravaStream {
  type: string;
  data: number[];
  series_type: string;
  original_size: number;
  resolution: string;
}

export function getStravaAuthUrl(redirectUri: string, state?: string): string {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "read,activity:read_all",
    approval_prompt: "auto",
  });

  if (state) {
    params.set("state", state);
  }

  return `${STRAVA_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string
): Promise<{ tokens: StravaTokens; athlete: StravaAthlete }> {
  const response = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code: ${error}`);
  }

  const data = await response.json();

  return {
    tokens: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(data.expires_at * 1000),
      athleteId: data.athlete.id,
    },
    athlete: data.athlete,
  };
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<StravaTokens> {
  const response = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(data.expires_at * 1000),
    athleteId: 0,
  };
}

export async function getValidAccessToken(userId: string): Promise<string> {
  const supabase = await createClient();

  const { data: tokenData, error } = await supabase
    .from("strava_tokens")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !tokenData) {
    throw new Error("No Strava tokens found for user");
  }

  const expiresAt = new Date(tokenData.expires_at);
  const now = new Date();
  const bufferMs = 5 * 60 * 1000;

  if (expiresAt.getTime() - bufferMs > now.getTime()) {
    return tokenData.access_token;
  }

  const newTokens = await refreshAccessToken(tokenData.refresh_token);

  await supabase
    .from("strava_tokens")
    .update({
      access_token: newTokens.accessToken,
      refresh_token: newTokens.refreshToken,
      expires_at: newTokens.expiresAt.toISOString(),
    })
    .eq("user_id", userId);

  return newTokens.accessToken;
}

export async function getActivity(
  accessToken: string,
  activityId: number
): Promise<StravaActivity> {
  const response = await fetch(`${STRAVA_API_BASE}/activities/${activityId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch activity: ${response.statusText}`);
  }

  return response.json();
}

export async function getActivityStreams(
  accessToken: string,
  activityId: number,
  streamTypes: string[] = ["latlng", "altitude", "heartrate", "cadence", "time"]
): Promise<Record<string, StravaStream>> {
  const keys = streamTypes.join(",");
  const response = await fetch(
    `${STRAVA_API_BASE}/activities/${activityId}/streams?keys=${keys}&key_by_type=true`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return {};
    }
    throw new Error(`Failed to fetch streams: ${response.statusText}`);
  }

  return response.json();
}

export async function getAthleteActivities(
  accessToken: string,
  options: { before?: number; after?: number; page?: number; perPage?: number } = {}
): Promise<StravaActivity[]> {
  const params = new URLSearchParams();

  if (options.before) params.set("before", options.before.toString());
  if (options.after) params.set("after", options.after.toString());
  if (options.page) params.set("page", options.page.toString());
  params.set("per_page", (options.perPage || 30).toString());

  const response = await fetch(
    `${STRAVA_API_BASE}/athlete/activities?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch activities: ${response.statusText}`);
  }

  return response.json();
}
