import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getClubBySlug,
  getClubActivities,
  getClubLeaderboard,
} from "@/actions/clubs.actions";
import { ClubJoinButton } from "@/components/clubs/ClubJoinButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActivityCard } from "@/components/feed/ActivityCard";
import { formatDistance, formatDuration } from "@/lib/utils/pace";
import type { ActivityType } from "@/types";

export const dynamic = "force-dynamic";

const activityTypeLabels: Record<ActivityType, string> = {
  run: "Run",
  ride: "Ride",
  swim: "Swim",
};

interface ClubPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ClubPage({ params }: ClubPageProps) {
  const { slug } = await params;
  const club = await getClubBySlug(slug);

  if (!club) {
    notFound();
  }

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const [feedResult, leaderboard] = await Promise.all([
    getClubActivities(club.id, 1, 20),
    getClubLeaderboard(club.id, weekStart),
  ]);

  const activities = feedResult.activities as Array<{
    id: string;
    user_id: string;
    type: ActivityType;
    name: string;
    description: string | null;
    privacy: string;
    started_at: string;
    elapsed_time_seconds: number;
    moving_time_seconds: number | null;
    distance_meters: number;
    elevation_gain_meters: number | null;
    avg_heart_rate: number | null;
    avg_pace_seconds_per_km: number | null;
    avg_speed_kmh: number | null;
    polyline: string | null;
    source: string;
    created_at: string;
    updated_at: string;
    author: {
      id: string;
      username: string;
      display_name: string | null;
      avatar_url: string | null;
    } | null;
  }>;

  const activitiesWithAuthor = activities.map((a) => ({
    id: a.id,
    userId: a.user_id,
    type: a.type,
    name: a.name,
    description: a.description ?? undefined,
    privacy: a.privacy as "public" | "followers" | "private",
    startedAt: new Date(a.started_at),
    elapsedTimeSeconds: a.elapsed_time_seconds,
    movingTimeSeconds: a.moving_time_seconds ?? undefined,
    distanceMeters: a.distance_meters,
    elevationGainMeters: a.elevation_gain_meters ?? undefined,
    avgHeartRate: a.avg_heart_rate ?? undefined,
    avgPaceSecondsPerKm: a.avg_pace_seconds_per_km ?? undefined,
    avgSpeedKmh: a.avg_speed_kmh ?? undefined,
    polyline: a.polyline ?? undefined,
    source: a.source as "upload" | "strava" | "manual",
    createdAt: new Date(a.created_at),
    updatedAt: new Date(a.updated_at),
    author: a.author
      ? {
          id: a.author.id,
          username: a.author.username,
          displayName: a.author.display_name ?? undefined,
          avatarUrl: a.author.avatar_url ?? undefined,
        }
      : {
          id: "",
          username: "unknown",
          displayName: undefined,
          avatarUrl: undefined,
        },
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{club.name}</h1>
        <ClubJoinButton
          slug={club.slug}
          isMember={club.isMember ?? false}
          isOwner={club.isOwner ?? false}
          isInviteOnly={club.visibility === "invite_only"}
          className="shrink-0"
        />
      </div>
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="bg-accent">
                  {activityTypeLabels[club.sportType]}
                </Badge>
                {club.visibility === "invite_only" && (
                  <Badge variant="outline">Invite only</Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold">{club.name}</h1>
              {club.description && (
                <p className="text-muted-foreground mt-2">{club.description}</p>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                {club.membersCount} members
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>This week&apos;s leaderboard</CardTitle>
          <p className="text-sm text-muted-foreground">
            Distance · elevation · time
          </p>
        </CardHeader>
        <CardContent>
          {leaderboard.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No activities this week yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {leaderboard.map((row, idx) => (
                <li
                  key={row.userId}
                  className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-muted-foreground w-6">
                      #{idx + 1}
                    </span>
                    <Link
                      href={`/athlete/${row.username}`}
                      className="font-medium hover:text-primary"
                    >
                      {row.displayName || row.username}
                    </Link>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{formatDistance(row.distance)}</span>
                    <span>{Math.round(row.elevation)}m</span>
                    <span>{formatDuration(row.time)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Club feed</CardTitle>
          <p className="text-sm text-muted-foreground">
            Recent public activities from members
          </p>
        </CardHeader>
        <CardContent>
          {activitiesWithAuthor.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No activities in the feed yet.
            </p>
          ) : (
            <div className="space-y-6">
              {activitiesWithAuthor.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  kudosCount={0}
                  hasKudos={false}
                  commentCount={0}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
