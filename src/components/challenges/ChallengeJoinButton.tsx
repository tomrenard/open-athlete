"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { joinChallenge, leaveChallenge } from "@/actions/challenges.actions";

interface ChallengeJoinButtonProps {
  challengeId: string;
  isParticipant: boolean;
  endAt: Date;
  className?: string;
}

export function ChallengeJoinButton({
  challengeId,
  isParticipant,
  endAt,
  className,
}: ChallengeJoinButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isEnded = new Date(endAt) < new Date();

  function handleClick() {
    startTransition(async () => {
      if (isParticipant) {
        await leaveChallenge(challengeId);
      } else {
        await joinChallenge(challengeId);
      }
      router.refresh();
    });
  }

  if (isEnded) return null;
  return (
    <Button
      variant={isParticipant ? "secondary" : "default"}
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className={className}
    >
      {isPending ? "..." : isParticipant ? "Leave" : "Join"}
    </Button>
  );
}
