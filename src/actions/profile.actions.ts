"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface UpdateProfileInput {
  displayName?: string | null;
  bio?: string | null;
  location?: string | null;
}

export async function updateProfile(
  input: UpdateProfileInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const updates: Record<string, unknown> = {};
  if (input.displayName !== undefined) updates.display_name = input.displayName;
  if (input.bio !== undefined) updates.bio = input.bio;
  if (input.location !== undefined) updates.location = input.location;

  if (Object.keys(updates).length === 0) {
    return { success: true };
  }

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/feed");
  revalidatePath("/settings");
  return { success: true };
}
