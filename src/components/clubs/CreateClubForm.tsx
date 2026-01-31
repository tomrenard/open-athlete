"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClub } from "@/actions/clubs.actions";
import type { ActivityType } from "@/types";
import type { ClubVisibility } from "@/actions/clubs.actions";

export function CreateClubForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sportType, setSportType] = useState<ActivityType>("run");
  const [visibility, setVisibility] = useState<ClubVisibility>("public");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createClub(
        name.trim(),
        description.trim() || null,
        sportType,
        visibility
      );
      if (result.success && result.slug) {
        router.push(`/clubs/${result.slug}`);
        router.refresh();
      } else {
        setError(result.error ?? "Failed to create club");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="club-name">Name</Label>
        <Input
          id="club-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Weekend Runners"
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="club-description">Description (optional)</Label>
        <textarea
          id="club-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this club about?"
          rows={3}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="club-sport">Sport</Label>
          <select
            id="club-sport"
            value={sportType}
            onChange={(e) => setSportType(e.target.value as ActivityType)}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="run">Run</option>
            <option value="ride">Ride</option>
            <option value="swim">Swim</option>
          </select>
        </div>
        <div>
          <Label htmlFor="club-visibility">Visibility</Label>
          <select
            id="club-visibility"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as ClubVisibility)}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="public">Public – anyone can join</option>
            <option value="invite_only">
              Invite only – approve join requests
            </option>
          </select>
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create club"}
      </Button>
    </form>
  );
}
