"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { followAthlete, unfollowAthlete } from "@/actions/follow.actions";

interface FollowButtonProps {
  username: string;
  isFollowing: boolean;
  className?: string;
}

export function FollowButton({
  username,
  isFollowing,
  className,
}: FollowButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      if (isFollowing) {
        await unfollowAthlete(username);
      } else {
        await followAthlete(username);
      }
    });
  }

  return (
    <Button
      variant={isFollowing ? "secondary" : "default"}
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className={className}
    >
      {isPending ? "..." : isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
}
