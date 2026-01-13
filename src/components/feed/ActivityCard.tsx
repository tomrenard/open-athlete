'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MapThumbnail } from '@/components/maps/MapThumbnail';
import {
  formatDistance,
  formatDuration,
  formatPace,
  formatTimeAgo,
  formatElevation,
  formatHeartRate,
} from '@/lib/utils/pace';
import type { ActivityWithAuthor, ActivityType } from '@/types';

interface ActivityCardProps {
  activity: ActivityWithAuthor;
}

const activityTypeIcons: Record<ActivityType, React.ReactNode> = {
  run: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
  ),
  ride: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="5" cy="18" r="3" strokeWidth={2} />
      <circle cx="19" cy="18" r="3" strokeWidth={2} />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 18V9l4-4h3"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 18l3-9" />
    </svg>
  ),
  swim: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 15c2.483 0 4.345-3 6-3s3.517 3 6 3 4.517-3 6-3"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 19c2.483 0 4.345-3 6-3s3.517 3 6 3 4.517-3 6-3"
      />
    </svg>
  ),
};

const activityTypeLabels: Record<ActivityType, string> = {
  run: 'Run',
  ride: 'Ride',
  swim: 'Swim',
};

export function ActivityCard({ activity }: ActivityCardProps) {
  const initials = activity.author.displayName
    ? activity.author.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : activity.author.username.slice(0, 2).toUpperCase();

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/athlete/${activity.author.username}`}>
              <Avatar className="h-10 w-10 border-2 border-border">
                <AvatarImage src={activity.author.avatarUrl} alt={activity.author.username} />
                <AvatarFallback className="bg-muted text-sm font-medium">
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
                {formatTimeAgo(activity.startedAt)}
              </p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="flex items-center gap-1.5 bg-accent text-accent-foreground"
          >
            {activityTypeIcons[activity.type]}
            {activityTypeLabels[activity.type]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Link href={`/activity/${activity.id}`} className="block group">
          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
            {activity.name}
          </h3>
          {activity.description && (
            <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
              {activity.description}
            </p>
          )}
        </Link>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-gradient">
              {formatDistance(activity.distanceMeters)}
            </p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Distance</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">
              {formatDuration(activity.movingTimeSeconds || activity.elapsedTimeSeconds)}
            </p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Time</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">
              {activity.type === 'run'
                ? `${formatPace(activity.avgPaceSecondsPerKm)}/km`
                : `${activity.avgSpeedKmh?.toFixed(1) || '--'} km/h`}
            </p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              {activity.type === 'run' ? 'Pace' : 'Speed'}
            </p>
          </div>
        </div>

        {(activity.elevationGainMeters || activity.avgHeartRate) && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {activity.elevationGainMeters && (
              <div className="flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                <span>{formatElevation(activity.elevationGainMeters)}</span>
              </div>
            )}
            {activity.avgHeartRate && (
              <div className="flex items-center gap-1">
                <svg
                  className="w-4 h-4 text-red-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <span>{formatHeartRate(activity.avgHeartRate)}</span>
              </div>
            )}
          </div>
        )}

        {activity.polyline && (
          <Link href={`/activity/${activity.id}`} className="block">
            <div className="rounded-lg overflow-hidden h-48 bg-muted">
              <MapThumbnail polyline={activity.polyline} className="h-full w-full" />
            </div>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
