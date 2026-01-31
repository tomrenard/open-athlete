"use server";

import { createClient } from "@/lib/supabase/server";
import { getStravaAuthUrl } from "@/lib/strava/client";
import { syncRecentActivities } from "@/lib/strava/sync";
import { revalidatePath } from "next/cache";

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export async function getStravaConnectUrl(): Promise<string> {
  const baseUrl = getBaseUrl();
  const redirectUri = `${baseUrl}/api/strava/callback`;
  return getStravaAuthUrl(redirectUri);
}

export async function disconnectStrava(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    await supabase.from("strava_tokens").delete().eq("user_id", user.id);

    await supabase
      .from("profiles")
      .update({ strava_athlete_id: null })
      .eq("id", user.id);

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Disconnect Strava error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to disconnect",
    };
  }
}

export async function isStravaConnected(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    const { data } = await supabase
      .from("strava_tokens")
      .select("user_id")
      .eq("user_id", user.id)
      .single();

    return !!data;
  } catch {
    return false;
  }
}

export async function syncStravaActivities(): Promise<{
  success: boolean;
  synced?: number;
  errors?: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await syncRecentActivities(user.id, 30);

    revalidatePath("/feed");
    revalidatePath("/dashboard");

    return {
      success: true,
      synced: result.synced,
      errors: result.errors,
    };
  } catch (error) {
    console.error("Sync Strava activities error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to sync",
    };
  }
}
