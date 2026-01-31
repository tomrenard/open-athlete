"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/actions/notifications.actions";

export async function getKudosCount(activityId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("activity_kudos")
    .select("*", { count: "exact", head: true })
    .eq("activity_id", activityId);
  if (error) return 0;
  return count ?? 0;
}

export async function hasUserGivenKudos(
  activityId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_kudos")
    .select("user_id")
    .eq("activity_id", activityId)
    .eq("user_id", userId)
    .maybeSingle();
  return !error && !!data;
}

export async function addKudos(activityId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: activity } = await supabase
    .from("activities")
    .select("user_id")
    .eq("id", activityId)
    .single();

  const { error } = await supabase.from("activity_kudos").insert({
    activity_id: activityId,
    user_id: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return { success: true };
    }
    return { success: false, error: error.message };
  }

  const ownerId = activity ? (activity as { user_id: string }).user_id : null;
  if (ownerId && ownerId !== user.id) {
    await createNotification(ownerId, "kudos", {
      actorId: user.id,
      activityId,
    });
  }

  revalidatePath("/feed");
  revalidatePath(`/activity/${activityId}`);
  return { success: true };
}

export async function removeKudos(activityId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("activity_kudos")
    .delete()
    .eq("activity_id", activityId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/feed");
  revalidatePath(`/activity/${activityId}`);
  return { success: true };
}

export async function getKudosCounts(
  activityIds: string[]
): Promise<Record<string, number>> {
  if (activityIds.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_kudos")
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

export async function getActivityIdsUserHasKudos(
  activityIds: string[],
  userId: string
): Promise<Set<string>> {
  if (activityIds.length === 0) return new Set();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_kudos")
    .select("activity_id")
    .in("activity_id", activityIds)
    .eq("user_id", userId);
  if (error) return new Set();
  return new Set((data as { activity_id: string }[]).map((r) => r.activity_id));
}
