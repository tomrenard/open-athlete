"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSegmentFromActivity } from "@/actions/segments.actions";
import { formatDistance, formatDateShort } from "@/lib/utils/pace";
import type { Activity } from "@/types";

interface CreateSegmentFormProps {
  activities: Activity[];
}

export function CreateSegmentForm({ activities }: CreateSegmentFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [activityId, setActivityId] = useState(activities[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!activityId) {
      setError("Select an activity");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createSegmentFromActivity(activityId, name.trim());
      if (result.success && result.segmentId) {
        router.push(`/segments/${result.segmentId}`);
        router.refresh();
      } else {
        setError(result.error ?? "Failed to create segment");
      }
    });
  }

  if (activities.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No activities with a route (polyline) found. Upload a FIT or GPX file
        first.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="segment-name">Segment name</Label>
        <Input
          id="segment-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Hill climb"
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="segment-activity">From activity</Label>
        <select
          id="segment-activity"
          value={activityId}
          onChange={(e) => setActivityId(e.target.value)}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {activities.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} · {formatDistance(a.distanceMeters)} ·{" "}
              {formatDateShort(a.startedAt)}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create segment"}
      </Button>
    </form>
  );
}
