"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/actions/notifications.actions";
import type { ProfileWithStats } from "@/types";

interface ProfileRow {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  strava_athlete_id: number | null;
  created_at: string;
  updated_at: string;
}

function toProfile(
  row: ProfileRow
): Omit<
  ProfileWithStats,
  "followersCount" | "followingCount" | "activitiesCount"
> {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name || undefined,
    avatarUrl: row.avatar_url || undefined,
    bio: row.bio || undefined,
    location: row.location || undefined,
    stravaAthleteId: row.strava_athlete_id ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function getProfileByUsername(
  username: string
): Promise<ProfileWithStats | null> {
  const supabase = await createClient();

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username.toLowerCase())
    .single();

  if (profileError || !profileData) {
    return null;
  }

  const profileRow = profileData as unknown as ProfileRow;
  const profileId = profileRow.id;

  const [followersResult, followingResult, activitiesResult] =
    await Promise.all([
      supabase
        .from("follows")
        .select("follower_id", { count: "exact", head: true })
        .eq("following_id", profileId),
      supabase
        .from("follows")
        .select("following_id", { count: "exact", head: true })
        .eq("follower_id", profileId),
      supabase
        .from("activities")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profileId),
    ]);

  const followersCount = followersResult.count ?? 0;
  const followingCount = followingResult.count ?? 0;
  const activitiesCount = activitiesResult.count ?? 0;

  return {
    ...toProfile(profileRow),
    followersCount,
    followingCount,
    activitiesCount,
  };
}

export async function isFollowing(
  currentUserId: string,
  targetProfileId: string
): Promise<boolean> {
  if (currentUserId === targetProfileId) {
    return false;
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", currentUserId)
    .eq("following_id", targetProfileId)
    .maybeSingle();
  return !error && !!data;
}

export async function followAthlete(
  username: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username.toLowerCase())
    .single();

  if (!profile) {
    return { success: false, error: "Athlete not found" };
  }

  const targetId = (profile as { id: string }).id;
  if (targetId === user.id) {
    return { success: false, error: "Cannot follow yourself" };
  }

  const { error } = await supabase.from("follows").insert({
    follower_id: user.id,
    following_id: targetId,
  });

  if (error) {
    if (error.code === "23505") {
      return { success: true };
    }
    return { success: false, error: error.message };
  }

  await createNotification(targetId, "follow", { actorId: user.id });

  revalidatePath("/feed");
  revalidatePath(`/athlete/${username}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function unfollowAthlete(
  username: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username.toLowerCase())
    .single();

  if (!profile) {
    return { success: false, error: "Athlete not found" };
  }

  const targetId = (profile as { id: string }).id;

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", targetId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/feed");
  revalidatePath(`/athlete/${username}`);
  revalidatePath("/dashboard");
  return { success: true };
}
