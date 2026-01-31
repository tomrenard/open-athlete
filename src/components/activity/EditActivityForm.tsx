"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateActivity } from "@/actions/activity.actions";
import type { ActivityType, PrivacyLevel } from "@/types";

interface EditActivityFormProps {
  activityId: string;
  initialName: string;
  initialDescription: string;
  initialType: ActivityType;
  initialPrivacy: PrivacyLevel;
  initialStartedAt: Date;
}

export function EditActivityForm({
  activityId,
  initialName,
  initialDescription,
  initialType,
  initialPrivacy,
  initialStartedAt,
}: EditActivityFormProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [type, setType] = useState<ActivityType>(initialType);
  const [privacy, setPrivacy] = useState<PrivacyLevel>(initialPrivacy);
  const [startedAt, setStartedAt] = useState(
    new Date(initialStartedAt).toISOString().slice(0, 16)
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await updateActivity(activityId, {
        name: name.trim(),
        description: description.trim() || null,
        type,
        privacy,
        startedAt: new Date(startedAt),
      });
      if (result.success) {
        router.push(`/activity/${activityId}`);
        router.refresh();
      } else {
        setError(result.error ?? "Failed to update");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="edit-name">Name</Label>
        <Input
          id="edit-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Activity name"
          className="mt-1"
          required
        />
      </div>
      <div>
        <Label htmlFor="edit-description">Description</Label>
        <textarea
          id="edit-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          className="mt-1 w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="edit-type">Type</Label>
          <select
            id="edit-type"
            value={type}
            onChange={(e) => setType(e.target.value as ActivityType)}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="run">Run</option>
            <option value="ride">Ride</option>
            <option value="swim">Swim</option>
          </select>
        </div>
        <div>
          <Label htmlFor="edit-privacy">Privacy</Label>
          <select
            id="edit-privacy"
            value={privacy}
            onChange={(e) => setPrivacy(e.target.value as PrivacyLevel)}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="public">Public</option>
            <option value="followers">Followers only</option>
            <option value="private">Private</option>
          </select>
        </div>
      </div>
      <div>
        <Label htmlFor="edit-started">Date & time</Label>
        <Input
          id="edit-started"
          type="datetime-local"
          value={startedAt}
          onChange={(e) => setStartedAt(e.target.value)}
          className="mt-1"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
