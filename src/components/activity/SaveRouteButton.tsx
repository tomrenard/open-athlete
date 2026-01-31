"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createRouteFromActivity } from "@/actions/routes.actions";

interface SaveRouteButtonProps {
  activityId: string;
  activityName: string;
  className?: string;
}

export function SaveRouteButton({
  activityId,
  activityName,
  className,
}: SaveRouteButtonProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(activityName);
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
      const result = await createRouteFromActivity(activityId, name.trim());
      if (result.success && result.routeId) {
        setShowForm(false);
        router.push(`/routes/${result.routeId}`);
        router.refresh();
      } else {
        setError(result.error ?? "Failed to save route");
      }
    });
  }

  if (showForm) {
    return (
      <form
        onSubmit={handleSubmit}
        className={`flex items-end gap-2 ${className ?? ""}`}
      >
        <div className="flex-1 min-w-0">
          <Label htmlFor="route-name" className="sr-only">
            Route name
          </Label>
          <Input
            id="route-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Route name"
            className="h-9"
            required
          />
        </div>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "..." : "Save"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowForm(false)}
          disabled={isPending}
        >
          Cancel
        </Button>
        {error && (
          <p className="absolute top-full left-0 mt-1 text-xs text-destructive">
            {error}
          </p>
        )}
      </form>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setShowForm(true)}
      className={className}
    >
      Save as route
    </Button>
  );
}
