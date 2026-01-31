"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ActivityCard } from "./ActivityCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getFeedActivities } from "@/actions/activity.actions";
import {
  getKudosCounts,
  getActivityIdsUserHasKudos,
} from "@/actions/kudos.actions";
import { getCommentCounts } from "@/actions/comments.actions";
import type { ActivityWithAuthor } from "@/types";

export type ActivityWithKudos = ActivityWithAuthor & {
  kudosCount: number;
  hasKudos: boolean;
  commentCount: number;
};

interface InfiniteFeedProps {
  initialActivities: ActivityWithKudos[];
  currentUserId?: string;
}

export function InfiniteFeed({
  initialActivities,
  currentUserId,
}: InfiniteFeedProps) {
  const [activities, setActivities] =
    useState<ActivityWithKudos[]>(initialActivities);
  const [page, setPage] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const { activities: newActivities, hasMore: more } =
        await getFeedActivities(page);
      const ids = newActivities.map((a) => a.id);
      const [kudosCounts, hasKudosIds, commentCounts] = await Promise.all([
        getKudosCounts(ids),
        currentUserId
          ? getActivityIdsUserHasKudos(ids, currentUserId)
          : Promise.resolve(new Set<string>()),
        getCommentCounts(ids),
      ]);
      const withKudos: ActivityWithKudos[] = newActivities.map((a) => ({
        ...a,
        kudosCount: kudosCounts[a.id] ?? 0,
        hasKudos: hasKudosIds.has(a.id),
        commentCount: commentCounts[a.id] ?? 0,
      }));
      setActivities((prev) => {
        const existingIds = new Set(prev.map((a) => a.id));
        const toAdd = withKudos.filter((a) => !existingIds.has(a.id));
        return toAdd.length === 0 ? prev : [...prev, ...toAdd];
      });
      setHasMore(more);
      setPage((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to load more activities:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, isLoading, hasMore, currentUserId]);

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore]);

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <svg
            className="w-8 h-8 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2">No activities yet</h3>
        <p className="text-muted-foreground">
          Upload your first activity or follow other athletes to see their
          workouts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {activities.map((activity) => (
        <ActivityCard
          key={activity.id}
          activity={activity}
          kudosCount={activity.kudosCount}
          hasKudos={activity.hasKudos}
          commentCount={activity.commentCount}
        />
      ))}

      <div ref={loadMoreRef} className="py-4">
        {isLoading && (
          <div className="space-y-6">
            <ActivityCardSkeleton />
            <ActivityCardSkeleton />
          </div>
        )}
        {!hasMore && activities.length > 0 && (
          <p className="text-center text-muted-foreground py-4">
            You&apos;ve reached the end of your feed
          </p>
        )}
      </div>
    </div>
  );
}

function ActivityCardSkeleton() {
  return (
    <div className="glass-card rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-6 w-3/4" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
      </div>
      <Skeleton className="h-48 rounded-lg" />
    </div>
  );
}
