import { Suspense } from "react";
import { InfiniteFeed } from "@/components/feed/InfiniteFeed";
import { Skeleton } from "@/components/ui/skeleton";
import { getFeedActivities } from "@/actions/activity.actions";
import { getCurrentProfile, getCurrentUser } from "@/actions/auth.actions";
import {
  getKudosCounts,
  getActivityIdsUserHasKudos,
} from "@/actions/kudos.actions";
import { getCommentCounts } from "@/actions/comments.actions";

export const dynamic = "force-dynamic";

async function FeedContent() {
  const [currentUser, { activities }] = await Promise.all([
    getCurrentUser(),
    getFeedActivities(1, 10),
  ]);
  const activityIds = activities.map((a) => a.id);
  const [kudosCounts, hasKudosIds, commentCounts] = await Promise.all([
    getKudosCounts(activityIds),
    currentUser
      ? getActivityIdsUserHasKudos(activityIds, currentUser.id)
      : Promise.resolve(new Set<string>()),
    getCommentCounts(activityIds),
  ]);
  const activitiesWithKudos = activities.map((a) => ({
    ...a,
    kudosCount: kudosCounts[a.id] ?? 0,
    hasKudos: hasKudosIds.has(a.id),
    commentCount: commentCounts[a.id] ?? 0,
  }));
  return (
    <InfiniteFeed
      initialActivities={activitiesWithKudos}
      currentUserId={currentUser?.id}
    />
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="glass-card rounded-xl p-6 space-y-4">
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
      ))}
    </div>
  );
}

export default async function FeedPage() {
  const profile = await getCurrentProfile();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {profile && (
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-muted-foreground">
            Welcome back,{" "}
            <span className="font-medium text-foreground">
              {profile.display_name || profile.username}
            </span>
          </p>
        </div>
      )}

      <Suspense fallback={<FeedSkeleton />}>
        <FeedContent />
      </Suspense>
    </div>
  );
}
