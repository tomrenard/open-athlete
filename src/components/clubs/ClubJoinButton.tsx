"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { joinClub, leaveClub } from "@/actions/clubs.actions";

interface ClubJoinButtonProps {
  slug: string;
  isMember: boolean;
  isOwner: boolean;
  isInviteOnly: boolean;
  hasRequested?: boolean;
  className?: string;
}

export function ClubJoinButton({
  slug,
  isMember,
  isOwner,
  isInviteOnly,
  hasRequested = false,
  className,
}: ClubJoinButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      if (isMember && !isOwner) {
        await leaveClub(slug);
      } else if (!isMember && !hasRequested) {
        await joinClub(slug);
      }
      router.refresh();
    });
  }

  if (isOwner) {
    return null;
  }
  if (isMember) {
    return (
      <Button
        variant="secondary"
        size="sm"
        onClick={handleClick}
        disabled={isPending}
        className={className}
      >
        {isPending ? "..." : "Leave club"}
      </Button>
    );
  }
  if (hasRequested) {
    return (
      <Button variant="outline" size="sm" disabled className={className}>
        Requested
      </Button>
    );
  }
  return (
    <Button
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className={className}
    >
      {isPending ? "..." : isInviteOnly ? "Request to join" : "Join club"}
    </Button>
  );
}
