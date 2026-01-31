"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ChallengeType = "distance" | "elevation" | "time" | "activities";

export interface Challenge {
  id: string;
  name: string;
  type: ChallengeType;
  targetValue: number;
  startAt: Date;
  endAt: Date;
  creatorId: string;
  createdAt: Date;
  participantsCount?: number;
  isParticipant?: boolean;
}

export interface ChallengeWithProgress extends Challenge {
  leaderboard: Array<{
    userId: string;
    username: string;
    displayName: string | null;
    progress: number;
    unit: string;
  }>;
}

export async function createChallenge(
  name: string,
  type: ChallengeType,
  targetValue: number,
  startAt: Date,
  endAt: Date
): Promise<{ success: boolean; challengeId?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("challenges")
    .insert({
      name: name.trim(),
      type,
      target_value: targetValue,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      creator_id: user.id,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("challenge_participants").insert({
    challenge_id: (data as { id: string }).id,
    user_id: user.id,
  });

  revalidatePath("/challenges");
  return { success: true, challengeId: (data as { id: string }).id };
}

export async function getActiveChallenges(limit = 20): Promise<Challenge[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: challenges, error } = await supabase
    .from("challenges")
    .select("*")
    .lte("start_at", now)
    .gte("end_at", now)
    .order("end_at", { ascending: true })
    .limit(limit);

  if (error || !challenges) return [];

  const result: Challenge[] = [];
  for (const row of challenges as Array<Record<string, unknown>>) {
    const { count } = await supabase
      .from("challenge_participants")
      .select("*", { count: "exact", head: true })
      .eq("challenge_id", row.id);
    let isParticipant = false;
    if (user) {
      const { data: p } = await supabase
        .from("challenge_participants")
        .select("user_id")
        .eq("challenge_id", row.id)
        .eq("user_id", user.id)
        .maybeSingle();
      isParticipant = !!p;
    }
    result.push({
      id: row.id as string,
      name: row.name as string,
      type: row.type as ChallengeType,
      targetValue: Number(row.target_value),
      startAt: new Date(row.start_at as string),
      endAt: new Date(row.end_at as string),
      creatorId: row.creator_id as string,
      createdAt: new Date(row.created_at as string),
      participantsCount: count ?? 0,
      isParticipant,
    });
  }
  return result;
}

export async function getMyChallenges(): Promise<Challenge[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: memberships } = await supabase
    .from("challenge_participants")
    .select("challenge_id")
    .eq("user_id", user.id);

  if (!memberships || memberships.length === 0) return [];

  const challengeIds = (memberships as { challenge_id: string }[]).map(
    (m) => m.challenge_id
  );
  const { data: challenges } = await supabase
    .from("challenges")
    .select("*")
    .in("id", challengeIds)
    .order("end_at", { ascending: true });

  if (!challenges) return [];

  const result: Challenge[] = [];
  for (const row of challenges as Array<Record<string, unknown>>) {
    const { count } = await supabase
      .from("challenge_participants")
      .select("*", { count: "exact", head: true })
      .eq("challenge_id", row.id);
    result.push({
      id: row.id as string,
      name: row.name as string,
      type: row.type as ChallengeType,
      targetValue: Number(row.target_value),
      startAt: new Date(row.start_at as string),
      endAt: new Date(row.end_at as string),
      creatorId: row.creator_id as string,
      createdAt: new Date(row.created_at as string),
      participantsCount: count ?? 0,
      isParticipant: true,
    });
  }
  return result;
}

export async function getChallengeById(
  challengeId: string
): Promise<ChallengeWithProgress | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: row, error } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", challengeId)
    .single();

  if (error || !row) return null;

  const challengeRow = row as Record<string, unknown>;
  const startAt = new Date(challengeRow.start_at as string);
  const endAt = new Date(challengeRow.end_at as string);

  const { count } = await supabase
    .from("challenge_participants")
    .select("*", { count: "exact", head: true })
    .eq("challenge_id", challengeId);
  let isParticipant = false;
  if (user) {
    const { data: p } = await supabase
      .from("challenge_participants")
      .select("user_id")
      .eq("challenge_id", challengeId)
      .eq("user_id", user.id)
      .maybeSingle();
    isParticipant = !!p;
  }

  const { data: participantRows } = await supabase
    .from("challenge_participants")
    .select("user_id")
    .eq("challenge_id", challengeId);
  if (!participantRows || participantRows.length === 0) {
    return {
      id: challengeRow.id as string,
      name: challengeRow.name as string,
      type: challengeRow.type as ChallengeType,
      targetValue: Number(challengeRow.target_value),
      startAt,
      endAt,
      creatorId: challengeRow.creator_id as string,
      createdAt: new Date(challengeRow.created_at as string),
      participantsCount: count ?? 0,
      isParticipant,
      leaderboard: [],
    };
  }

  const userIds = (participantRows as { user_id: string }[]).map(
    (r) => r.user_id
  );
  const { data: activities } = await supabase
    .from("activities")
    .select(
      "user_id, distance_meters, elevation_gain_meters, elapsed_time_seconds"
    )
    .in("user_id", userIds)
    .gte("started_at", startAt.toISOString())
    .lte("started_at", endAt.toISOString());

  const type = challengeRow.type as ChallengeType;
  const byUser: Record<string, number> = {};
  for (const u of userIds) {
    byUser[u] = 0;
  }
  for (const a of (activities ?? []) as Array<{
    user_id: string;
    distance_meters: number;
    elevation_gain_meters: number | null;
    elapsed_time_seconds: number;
  }>) {
    if (type === "distance") {
      byUser[a.user_id] += Number(a.distance_meters) / 1000;
    } else if (type === "elevation") {
      byUser[a.user_id] += Number(a.elevation_gain_meters ?? 0);
    } else if (type === "time") {
      byUser[a.user_id] += a.elapsed_time_seconds / 3600;
    } else {
      byUser[a.user_id] += 1;
    }
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

  const unit =
    type === "distance"
      ? "km"
      : type === "elevation"
      ? "m"
      : type === "time"
      ? "hrs"
      : "";

  const leaderboard = userIds
    .map((userId) => ({
      userId,
      username: profileMap.get(userId)?.username ?? "unknown",
      displayName: profileMap.get(userId)?.displayName ?? null,
      progress: Math.round(byUser[userId] * 100) / 100,
      unit,
    }))
    .sort((a, b) => b.progress - a.progress);

  return {
    id: challengeRow.id as string,
    name: challengeRow.name as string,
    type: challengeRow.type as ChallengeType,
    targetValue: Number(challengeRow.target_value),
    startAt,
    endAt,
    creatorId: challengeRow.creator_id as string,
    createdAt: new Date(challengeRow.created_at as string),
    participantsCount: count ?? 0,
    isParticipant,
    leaderboard,
  };
}

export async function joinChallenge(
  challengeId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase.from("challenge_participants").insert({
    challenge_id: challengeId,
    user_id: user.id,
  });
  if (error) {
    if (error.code === "23505") return { success: true };
    return { success: false, error: error.message };
  }
  revalidatePath("/challenges");
  revalidatePath(`/challenges/${challengeId}`);
  return { success: true };
}

export async function leaveChallenge(
  challengeId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("challenge_participants")
    .delete()
    .eq("challenge_id", challengeId)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/challenges");
  revalidatePath(`/challenges/${challengeId}`);
  return { success: true };
}
