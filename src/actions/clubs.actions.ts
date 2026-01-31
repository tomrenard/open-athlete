"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActivityType } from "@/types";

export type ClubVisibility = "public" | "invite_only";
export type ClubMemberRole = "member" | "admin";

export interface Club {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sportType: ActivityType;
  visibility: ClubVisibility;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  membersCount?: number;
  isMember?: boolean;
  isOwner?: boolean;
}

export interface ClubMember {
  clubId: string;
  userId: string;
  role: ClubMemberRole;
  joinedAt: Date;
  profile?: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createClub(
  name: string,
  description: string | null,
  sportType: ActivityType,
  visibility: ClubVisibility
): Promise<{ success: boolean; slug?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const baseSlug = slugify(name);
  let slug = baseSlug;
  let attempt = 0;
  while (true) {
    const { data: existing } = await supabase
      .from("clubs")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }

  const { data: inserted, error } = await supabase
    .from("clubs")
    .insert({
      name: name.trim(),
      slug,
      description: description?.trim() || null,
      sport_type: sportType,
      visibility,
      owner_id: user.id,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  const clubId = (inserted as { id: string }).id;
  await supabase.from("club_members").insert({
    club_id: clubId,
    user_id: user.id,
    role: "admin",
  });

  revalidatePath("/clubs");
  return { success: true, slug };
}

export async function getClubBySlug(slug: string): Promise<Club | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: clubRow, error } = await supabase
    .from("clubs")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !clubRow) return null;

  const { count } = await supabase
    .from("club_members")
    .select("*", { count: "exact", head: true })
    .eq("club_id", (clubRow as { id: string }).id);

  let isMember = false;
  let isOwner = false;
  if (user) {
    const { data: member } = await supabase
      .from("club_members")
      .select("role")
      .eq("club_id", (clubRow as { id: string }).id)
      .eq("user_id", user.id)
      .maybeSingle();
    isMember = !!member;
    isOwner = (clubRow as { owner_id: string }).owner_id === user.id;
  }

  return {
    id: (clubRow as { id: string }).id,
    name: (clubRow as { name: string }).name,
    slug: (clubRow as { slug: string }).slug,
    description: (clubRow as { description: string | null }).description,
    sportType: (clubRow as { sport_type: ActivityType }).sport_type,
    visibility: (clubRow as { visibility: ClubVisibility }).visibility,
    ownerId: (clubRow as { owner_id: string }).owner_id,
    createdAt: new Date((clubRow as { created_at: string }).created_at),
    updatedAt: new Date((clubRow as { updated_at: string }).updated_at),
    membersCount: count ?? 0,
    isMember,
    isOwner,
  };
}

export async function getMyClubs(): Promise<Club[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: memberships } = await supabase
    .from("club_members")
    .select("club_id")
    .eq("user_id", user.id);

  if (!memberships || memberships.length === 0) return [];

  const clubIds = (memberships as { club_id: string }[]).map((m) => m.club_id);
  const { data: clubs } = await supabase
    .from("clubs")
    .select("*")
    .in("id", clubIds);

  if (!clubs) return [];

  const result: Club[] = [];
  for (const row of clubs as Array<Record<string, unknown>>) {
    const { count } = await supabase
      .from("club_members")
      .select("*", { count: "exact", head: true })
      .eq("club_id", row.id);
    result.push({
      id: row.id as string,
      name: row.name as string,
      slug: row.slug as string,
      description: row.description as string | null,
      sportType: row.sport_type as ActivityType,
      visibility: row.visibility as ClubVisibility,
      ownerId: row.owner_id as string,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      membersCount: count ?? 0,
      isMember: true,
      isOwner: row.owner_id === user.id,
    });
  }
  return result.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export async function getClubsDiscover(limit = 20): Promise<Club[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: clubs, error } = await supabase
    .from("clubs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !clubs) return [];

  const result: Club[] = [];
  for (const row of clubs as Array<Record<string, unknown>>) {
    const { count } = await supabase
      .from("club_members")
      .select("*", { count: "exact", head: true })
      .eq("club_id", row.id);
    let isMember = false;
    let isOwner = false;
    if (user) {
      const { data: member } = await supabase
        .from("club_members")
        .select("role")
        .eq("club_id", row.id)
        .eq("user_id", user.id)
        .maybeSingle();
      isMember = !!member;
      isOwner = row.owner_id === user.id;
    }
    result.push({
      id: row.id as string,
      name: row.name as string,
      slug: row.slug as string,
      description: row.description as string | null,
      sportType: row.sport_type as ActivityType,
      visibility: row.visibility as ClubVisibility,
      ownerId: row.owner_id as string,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      membersCount: count ?? 0,
      isMember,
      isOwner,
    });
  }
  return result;
}

export async function joinClub(
  slug: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: club } = await supabase
    .from("clubs")
    .select("id, visibility")
    .eq("slug", slug)
    .single();
  if (!club) return { success: false, error: "Club not found" };

  const clubId = (club as { id: string }).id;
  const visibility = (club as { visibility: ClubVisibility }).visibility;

  if (visibility === "invite_only") {
    const { error } = await supabase.from("club_join_requests").insert({
      club_id: clubId,
      user_id: user.id,
    });
    if (error) {
      if (error.code === "23505") return { success: true };
      return { success: false, error: error.message };
    }
    revalidatePath("/clubs");
    revalidatePath(`/clubs/${slug}`);
    return { success: true };
  }

  const { error } = await supabase.from("club_members").insert({
    club_id: clubId,
    user_id: user.id,
    role: "member",
  });
  if (error) {
    if (error.code === "23505") return { success: true };
    return { success: false, error: error.message };
  }
  revalidatePath("/clubs");
  revalidatePath(`/clubs/${slug}`);
  return { success: true };
}

export async function leaveClub(
  slug: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: club } = await supabase
    .from("clubs")
    .select("id, owner_id")
    .eq("slug", slug)
    .single();
  if (!club) return { success: false, error: "Club not found" };
  if ((club as { owner_id: string }).owner_id === user.id) {
    return {
      success: false,
      error: "Owner cannot leave; transfer ownership or delete club",
    };
  }

  const { error } = await supabase
    .from("club_members")
    .delete()
    .eq("club_id", (club as { id: string }).id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/clubs");
  revalidatePath(`/clubs/${slug}`);
  return { success: true };
}

export async function getClubActivities(
  clubId: string,
  page = 1,
  limit = 20
): Promise<{ activities: Array<Record<string, unknown>>; hasMore: boolean }> {
  const supabase = await createClient();
  const offset = (page - 1) * limit;

  const { data: memberIds } = await supabase
    .from("club_members")
    .select("user_id")
    .eq("club_id", clubId);
  if (!memberIds || memberIds.length === 0) {
    return { activities: [], hasMore: false };
  }
  const userIds = (memberIds as { user_id: string }[]).map((m) => m.user_id);

  const { data, error } = await supabase
    .from("activities")
    .select(
      `
      *,
      profiles:user_id (id, username, display_name, avatar_url)
    `
    )
    .in("user_id", userIds)
    .eq("privacy", "public")
    .order("started_at", { ascending: false })
    .range(offset, offset + limit);

  if (error || !data) return { activities: [], hasMore: false };

  const activities = (data as Array<Record<string, unknown>>).map((row) => ({
    ...row,
    author: row.profiles,
  }));
  return { activities, hasMore: data.length > limit };
}

export async function getClubLeaderboard(
  clubId: string,
  weekStart: Date
): Promise<
  Array<{
    userId: string;
    username: string;
    displayName: string | null;
    distance: number;
    elevation: number;
    time: number;
  }>
> {
  const supabase = await createClient();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const { data: memberIds } = await supabase
    .from("club_members")
    .select("user_id")
    .eq("club_id", clubId);
  if (!memberIds || memberIds.length === 0) return [];
  const userIds = (memberIds as { user_id: string }[]).map((m) => m.user_id);

  const { data: activities } = await supabase
    .from("activities")
    .select(
      "user_id, distance_meters, elevation_gain_meters, elapsed_time_seconds"
    )
    .in("user_id", userIds)
    .gte("started_at", weekStart.toISOString())
    .lte("started_at", weekEnd.toISOString());

  if (!activities) return [];

  const byUser: Record<
    string,
    { distance: number; elevation: number; time: number }
  > = {};
  for (const u of userIds) {
    byUser[u] = { distance: 0, elevation: 0, time: 0 };
  }
  for (const a of activities as Array<{
    user_id: string;
    distance_meters: number;
    elevation_gain_meters: number | null;
    elapsed_time_seconds: number;
  }>) {
    byUser[a.user_id].distance += Number(a.distance_meters);
    byUser[a.user_id].elevation += Number(a.elevation_gain_meters ?? 0);
    byUser[a.user_id].time += a.elapsed_time_seconds;
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .in("id", userIds);

  const profileMap = new Map(
    (
      (profiles as Array<{
        id: string;
        username: string;
        display_name: string | null;
      }>) ?? []
    ).map((p) => [p.id, { username: p.username, displayName: p.display_name }])
  );

  return userIds
    .map((userId) => ({
      userId,
      username: profileMap.get(userId)?.username ?? "unknown",
      displayName: profileMap.get(userId)?.displayName ?? null,
      distance: byUser[userId].distance,
      elevation: byUser[userId].elevation,
      time: byUser[userId].time,
    }))
    .filter((r) => r.distance > 0 || r.elevation > 0 || r.time > 0)
    .sort((a, b) => b.distance - a.distance);
}
