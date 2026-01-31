"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/actions/notifications.actions";

export interface ActivityComment {
  id: string;
  activityId: string;
  userId: string;
  text: string;
  createdAt: Date;
  author: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

export async function getActivityComments(
  activityId: string
): Promise<ActivityComment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_comments")
    .select(
      `
      id,
      activity_id,
      user_id,
      text,
      created_at,
      profiles:user_id (
        id,
        username,
        display_name,
        avatar_url
      )
    `
    )
    .eq("activity_id", activityId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return (
    data as unknown as Array<{
      id: string;
      activity_id: string;
      user_id: string;
      text: string;
      created_at: string;
      profiles: {
        id: string;
        username: string;
        display_name: string | null;
        avatar_url: string | null;
      } | null;
    }>
  ).map((row) => ({
    id: row.id,
    activityId: row.activity_id,
    userId: row.user_id,
    text: row.text,
    createdAt: new Date(row.created_at),
    author: row.profiles
      ? {
          id: row.profiles.id,
          username: row.profiles.username,
          displayName: row.profiles.display_name || undefined,
          avatarUrl: row.profiles.avatar_url || undefined,
        }
      : {
          id: row.user_id,
          username: "unknown",
          displayName: undefined,
          avatarUrl: undefined,
        },
  }));
}

export async function getCommentCounts(
  activityIds: string[]
): Promise<Record<string, number>> {
  if (activityIds.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_comments")
    .select("activity_id")
    .in("activity_id", activityIds);
  if (error) return {};
  const counts: Record<string, number> = {};
  for (const id of activityIds) {
    counts[id] = 0;
  }
  for (const row of data as { activity_id: string }[]) {
    counts[row.activity_id] = (counts[row.activity_id] ?? 0) + 1;
  }
  return counts;
}

export async function createComment(
  activityId: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return { success: false, error: "Comment cannot be empty" };
  }

  const { data: activity } = await supabase
    .from("activities")
    .select("user_id")
    .eq("id", activityId)
    .single();

  const { error } = await supabase.from("activity_comments").insert({
    activity_id: activityId,
    user_id: user.id,
    text: trimmed,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const ownerId = activity ? (activity as { user_id: string }).user_id : null;
  if (ownerId && ownerId !== user.id) {
    await createNotification(ownerId, "comment", {
      actorId: user.id,
      activityId,
    });
  }

  revalidatePath(`/activity/${activityId}`);
  revalidatePath("/feed");
  return { success: true };
}

export async function deleteComment(
  commentId: string,
  activityId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("activity_comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/activity/${activityId}`);
  revalidatePath("/feed");
  return { success: true };
}
