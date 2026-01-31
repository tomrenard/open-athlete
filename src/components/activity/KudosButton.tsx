"use client";

import { useTransition, useOptimistic } from "react";
import { useRouter } from "next/navigation";
import { addKudos, removeKudos } from "@/actions/kudos.actions";

interface KudosButtonProps {
  activityId: string;
  initialCount: number;
  initialHasKudos: boolean;
  variant?: "default" | "compact";
  className?: string;
}

export function KudosButton({
  activityId,
  initialCount,
  initialHasKudos,
  variant = "default",
  className,
}: KudosButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [optimistic, setOptimistic] = useOptimistic(
    { count: initialCount, hasKudos: initialHasKudos },
    (state, delta: { count: number; hasKudos: boolean }) => ({
      count: state.count + delta.count,
      hasKudos: delta.hasKudos,
    })
  );

  function handleClick() {
    startTransition(async () => {
      const hadKudos = optimistic.hasKudos;
      setOptimistic({
        count: hadKudos ? -1 : 1,
        hasKudos: !hadKudos,
      });
      if (hadKudos) {
        await removeKudos(activityId);
      } else {
        await addKudos(activityId);
      }
      router.refresh();
    });
  }

  const hasKudos = optimistic.hasKudos;
  const count = optimistic.count;

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 ${
          className ?? ""
        }`}
        aria-label={hasKudos ? "Remove kudos" : "Give kudos"}
      >
        <span className={hasKudos ? "text-primary" : ""} aria-hidden>
          {hasKudos ? "👍" : "👏"}
        </span>
        {count > 0 && <span>{count}</span>}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
        hasKudos
          ? "bg-primary/10 text-primary hover:bg-primary/20"
          : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
      } ${className ?? ""}`}
      aria-label={hasKudos ? "Remove kudos" : "Give kudos"}
    >
      <span aria-hidden>{hasKudos ? "👍" : "👏"}</span>
      <span>{hasKudos ? "Kudos" : "Give kudos"}</span>
      {count > 0 && <span className="tabular-nums">{count}</span>}
    </button>
  );
}
