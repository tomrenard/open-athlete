import { Suspense } from 'react';
import Link from 'next/link';
import { InfiniteFeed } from '@/components/feed/InfiniteFeed';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getFeedActivities } from '@/actions/activity.actions';
import { getCurrentProfile } from '@/actions/auth.actions';

export const dynamic = 'force-dynamic';

async function FeedContent() {
  const { activities } = await getFeedActivities(1, 10);
  return <InfiniteFeed initialActivities={activities} />;
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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="container max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/feed" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-electric flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
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
            <span className="font-bold text-lg">OpenAthlete</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/upload">
              <Button size="sm" className="glass-button">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Upload
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="btn-touch">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-4 py-6">
        {profile && (
          <div className="glass-card rounded-xl p-4 mb-6">
            <p className="text-sm text-muted-foreground">
              Welcome back, <span className="font-medium text-foreground">{profile.display_name || profile.username}</span>
            </p>
          </div>
        )}

        <Suspense fallback={<FeedSkeleton />}>
          <FeedContent />
        </Suspense>
      </main>
    </div>
  );
}
