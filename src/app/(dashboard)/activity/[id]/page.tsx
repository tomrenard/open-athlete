import { notFound } from 'next/navigation';
import Link from 'next/link';
import { RouteMap } from '@/components/maps/RouteMap';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getActivityById } from '@/actions/activity.actions';
import {
  formatDistance,
  formatDuration,
  formatPace,
  formatElevation,
  formatHeartRate,
  formatCalories,
  formatDateFull,
  formatTime,
} from '@/lib/utils/pace';
import type { ActivityType } from '@/types';

interface ActivityPageProps {
  params: Promise<{ id: string }>;
}

const activityTypeLabels: Record<ActivityType, string> = {
  run: 'Run',
  ride: 'Ride',
  swim: 'Swim',
};

export default async function ActivityPage({ params }: ActivityPageProps) {
  const { id } = await params;
  const activity = await getActivityById(id);

  if (!activity) {
    notFound();
  }

  const initials = activity.author.displayName
    ? activity.author.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : activity.author.username.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/feed" className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="btn-touch">
              <svg
                className="w-5 h-5 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </Button>
          </Link>
          <Badge variant="secondary" className="bg-accent text-accent-foreground">
            {activityTypeLabels[activity.type]}
          </Badge>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Link href={`/athlete/${activity.author.username}`}>
                  <Avatar className="h-12 w-12 border-2 border-border">
                    <AvatarImage
                      src={activity.author.avatarUrl}
                      alt={activity.author.username}
                    />
                    <AvatarFallback className="bg-muted font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div>
                  <Link
                    href={`/athlete/${activity.author.username}`}
                    className="font-medium hover:text-primary transition-colors"
                  >
                    {activity.author.displayName || activity.author.username}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {formatDateFull(activity.startedAt)} at {formatTime(activity.startedAt)}
                  </p>
                </div>
              </div>
            </div>
            <CardTitle className="text-2xl mt-4">{activity.name}</CardTitle>
            {activity.description && (
              <p className="text-muted-foreground mt-2">{activity.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Distance"
                value={formatDistance(activity.distanceMeters)}
                highlight
              />
              <StatCard
                label="Time"
                value={formatDuration(
                  activity.movingTimeSeconds || activity.elapsedTimeSeconds
                )}
              />
              <StatCard
                label={activity.type === 'run' ? 'Pace' : 'Speed'}
                value={
                  activity.type === 'run'
                    ? `${formatPace(activity.avgPaceSecondsPerKm)}/km`
                    : `${activity.avgSpeedKmh?.toFixed(1) || '--'} km/h`
                }
              />
              <StatCard
                label="Elevation"
                value={formatElevation(activity.elevationGainMeters)}
              />
            </div>

            <Separator className="my-6" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Elapsed Time"
                value={formatDuration(activity.elapsedTimeSeconds)}
                small
              />
              <StatCard
                label="Avg Heart Rate"
                value={formatHeartRate(activity.avgHeartRate)}
                small
              />
              <StatCard
                label="Max Heart Rate"
                value={formatHeartRate(activity.maxHeartRate)}
                small
              />
              <StatCard label="Calories" value={formatCalories(activity.calories)} small />
            </div>

            {(activity.best1kmSeconds ||
              activity.best5kmSeconds ||
              activity.best10kmSeconds) && (
              <>
                <Separator className="my-6" />
                <div>
                  <h3 className="font-semibold mb-4">Best Efforts</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {activity.best1kmSeconds && (
                      <StatCard
                        label="1 km"
                        value={formatDuration(activity.best1kmSeconds)}
                        small
                      />
                    )}
                    {activity.best5kmSeconds && (
                      <StatCard
                        label="5 km"
                        value={formatDuration(activity.best5kmSeconds)}
                        small
                      />
                    )}
                    {activity.best10kmSeconds && (
                      <StatCard
                        label="10 km"
                        value={formatDuration(activity.best10kmSeconds)}
                        small
                      />
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {activity.polyline && (
          <Card className="glass-card overflow-hidden">
            <CardHeader>
              <CardTitle>Route</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <RouteMap polyline={activity.polyline} className="h-[400px] md:h-[500px]" />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight = false,
  small = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  small?: boolean;
}) {
  return (
    <div className={`text-center p-4 rounded-lg bg-muted/50 ${small ? 'p-3' : ''}`}>
      <p
        className={`font-bold ${highlight ? 'text-gradient' : ''} ${
          small ? 'text-lg' : 'text-2xl md:text-3xl'
        }`}
      >
        {value}
      </p>
      <p
        className={`text-muted-foreground uppercase tracking-wider ${
          small ? 'text-[10px]' : 'text-xs'
        }`}
      >
        {label}
      </p>
    </div>
  );
}
