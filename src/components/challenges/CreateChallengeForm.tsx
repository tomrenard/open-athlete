"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createChallenge } from "@/actions/challenges.actions";
import type { ChallengeType } from "@/actions/challenges.actions";

export function CreateChallengeForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<ChallengeType>("distance");
  const [targetValue, setTargetValue] = useState("");
  const [startAt, setStartAt] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [endAt, setEndAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    d.setHours(23, 59, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const target = parseFloat(targetValue);
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (Number.isNaN(target) || target <= 0) {
      setError("Enter a valid target");
      return;
    }
    const start = new Date(startAt);
    const end = new Date(endAt);
    if (end <= start) {
      setError("End date must be after start date");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createChallenge(
        name.trim(),
        type,
        target,
        start,
        end
      );
      if (result.success && result.challengeId) {
        router.push(`/challenges/${result.challengeId}`);
        router.refresh();
      } else {
        setError(result.error ?? "Failed to create challenge");
      }
    });
  }

  const unit =
    type === "distance"
      ? "km"
      : type === "elevation"
      ? "m"
      : type === "time"
      ? "hours"
      : "activities";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="challenge-name">Name</Label>
        <Input
          id="challenge-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. January 100km"
          required
          className="mt-1"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="challenge-type">Type</Label>
          <select
            id="challenge-type"
            value={type}
            onChange={(e) => setType(e.target.value as ChallengeType)}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="distance">Distance (km)</option>
            <option value="elevation">Elevation (m)</option>
            <option value="time">Time (hours)</option>
            <option value="activities">Activities (count)</option>
          </select>
        </div>
        <div>
          <Label htmlFor="challenge-target">Target ({unit})</Label>
          <Input
            id="challenge-target"
            type="number"
            min="0.01"
            step="0.01"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            placeholder={type === "activities" ? "10" : "100"}
            required
            className="mt-1"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="challenge-start">Start</Label>
          <Input
            id="challenge-start"
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            className="mt-1"
            required
          />
        </div>
        <div>
          <Label htmlFor="challenge-end">End</Label>
          <Input
            id="challenge-end"
            type="datetime-local"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
            className="mt-1"
            required
          />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create challenge"}
      </Button>
    </form>
  );
}
