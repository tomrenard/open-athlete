import { notFound } from "next/navigation";
import Link from "next/link";
import { getProfileByUsername, isFollowing } from "@/actions/follow.actions";
import {
  getUserActivities,
  getActivityStats,
} from "@/actions/activity.actions";
import { getCurrentUser } from "@/actions/auth.actions";
import { FollowButton } from "@/components/athlete/FollowButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  formatDistance,
  formatDuration,
  formatDateShort,
} from "@/lib/utils/pace";
import type { ActivityType } from "@/types";

export const dynamic = "force-dynamic";

interface AthletePageProps {
  params: Promise<{ username: string }>;
}

const activityTypeLabels: Record<ActivityType, string> = {
  run: "Run",
  ride: "Ride",
  swim: "Swim",
};

export default async function AthletePage({ params }: AthletePageProps) {
  const { username } = await params;
  const [profile, currentUser] = await Promise.all([
    getProfileByUsername(username),
    getCurrentUser(),
  ]);

  if (!profile) {
    notFound();
  }

  const [following, recentActivities, stats] = await Promise.all([
    currentUser && currentUser.id !== profile.id
      ? isFollowing(currentUser.id, profile.id)
      : Promise.resolve(false),
    getUserActivities(profile.id, 1, 10),
    getActivityStats(profile.id),
  ]);

  const initials = profile.displayName
    ? profile.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : profile.username.slice(0, 2).toUpperCase();

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-2 border-border">
                <AvatarImage src={profile.avatarUrl} alt={profile.username} />
                <AvatarFallback className="bg-muted text-xl font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">
                  {profile.displayName || profile.username}
                </h1>
                <p className="text-muted-foreground">@{profile.username}</p>
                {profile.bio && (
                  <p className="text-sm text-muted-foreground mt-2 max-w-md">
                    {profile.bio}
                  </p>
                )}
                {profile.location && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {profile.location}
                  </p>
                )}
              </div>
            </div>
            {currentUser && !isOwnProfile && (
              <FollowButton
                username={profile.username}
                isFollowing={following}
                className="shrink-0"
              />
            )}
          </div>
          <div className="flex gap-6 mt-6 pt-6 border-t border-border">
            <div className="text-center">
              <p className="text-2xl font-bold">{profile.followersCount}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Followers
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{profile.followingCount}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Following
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{profile.activitiesCount}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Activities
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Distance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatDistance(stats.totalDistanceMeters)}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatDuration(stats.totalDurationSeconds)}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Elevation Gain
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {Math.round(stats.totalElevationGainMeters).toLocaleString()}m
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalActivities}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities.activities.length === 0 ? (
            <p className="text-muted-foreground text-sm">No activities yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentActivities.activities.map((activity) => (
                <li key={activity.id}>
                  <Link
                    href={`/activity/${activity.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge
                        variant="secondary"
                        className="shrink-0 bg-accent text-accent-foreground"
                      >
                        {activityTypeLabels[activity.type]}
                      </Badge>
                      <span className="font-medium truncate group-hover:text-primary">
                        {activity.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 text-sm text-muted-foreground">
                      <span>{formatDateShort(activity.startedAt)}</span>
                      <span className="font-medium text-foreground">
                        {formatDistance(activity.distanceMeters)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
