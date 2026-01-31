"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/actions/profile.actions";

interface EditProfileFormProps {
  initialDisplayName: string;
  initialBio: string;
  initialLocation: string;
}

export function EditProfileForm({
  initialDisplayName,
  initialBio,
  initialLocation,
}: EditProfileFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [location, setLocation] = useState(initialLocation);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateProfile({
        displayName: displayName.trim() || null,
        bio: bio.trim() || null,
        location: location.trim() || null,
      });
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Failed to update");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="display-name">Display name</Label>
        <Input
          id="display-name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="bio">Bio</Label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="A short bio"
          rows={3}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City, Country"
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
