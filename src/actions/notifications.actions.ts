"use server";

import { createClient } from "@/lib/supabase/server";

export type NotificationType = "kudos" | "comment" | "follow" | "challenge";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  actorId: string | null;
  activityId: string | null;
  challengeId: string | null;
  readAt: Date | null;
  createdAt: Date;
  actor?: {
    username: string;
    displayName: string | null;
  };
}

export async function createNotification(
  userId: string,
  type: NotificationType,
  options: { actorId?: string; activityId?: string; challengeId?: string }
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("notifications").insert({
    user_id: userId,
    type,
    actor_id: options.actorId ?? null,
    activity_id: options.activityId ?? null,
    challenge_id: options.challengeId ?? null,
  });
}

export async function getNotifications(limit = 50): Promise<Notification[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select(
      `
      id,
      user_id,
      type,
      actor_id,
      activity_id,
      challenge_id,
      read_at,
      created_at,
      profiles:actor_id (username, display_name)
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return (
    data as unknown as Array<{
      id: string;
      user_id: string;
      type: string;
      actor_id: string | null;
      activity_id: string | null;
      challenge_id: string | null;
      read_at: string | null;
      created_at: string;
      profiles: { username: string; display_name: string | null } | null;
    }>
  ).map((row) => ({
    id: row.id,
    userId: row.user_id,
    type: row.type as NotificationType,
    actorId: row.actor_id,
    activityId: row.activity_id,
    challengeId: row.challenge_id,
    readAt: row.read_at ? new Date(row.read_at) : null,
    createdAt: new Date(row.created_at),
    actor: row.profiles
      ? {
          username: row.profiles.username,
          displayName: row.profiles.display_name ?? null,
        }
      : undefined,
  }));
}

export async function markNotificationRead(
  notificationId: string
): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false };

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  return { success: true };
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  return count ?? 0;
}
