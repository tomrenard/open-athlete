import { notFound } from "next/navigation";
import Link from "next/link";
import { RouteMap } from "@/components/maps/RouteMap";
import { KudosButton } from "@/components/activity/KudosButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getActivityById } from "@/actions/activity.actions";
import { getKudosCount, hasUserGivenKudos } from "@/actions/kudos.actions";
import { getActivityComments } from "@/actions/comments.actions";
import { getCurrentUser } from "@/actions/auth.actions";
import { CommentsSection } from "@/components/activity/CommentsSection";
import { SaveRouteButton } from "@/components/activity/SaveRouteButton";
import {
  formatDistance,
  formatDuration,
  formatPace,
  formatElevation,
  formatHeartRate,
  formatCalories,
  formatDateFull,
  formatTime,
} from "@/lib/utils/pace";
import type { ActivityType } from "@/types";

interface ActivityPageProps {
  params: Promise<{ id: string }>;
}

const activityTypeLabels: Record<ActivityType, string> = {
  run: "Run",
  ride: "Ride",
  swim: "Swim",
};

export default async function ActivityPage({ params }: ActivityPageProps) {
  const { id } = await params;
  const [activity, currentUser] = await Promise.all([
    getActivityById(id),
    getCurrentUser(),
  ]);

  if (!activity) {
    notFound();
  }

  const [kudosCount, hasKudos, comments] = await Promise.all([
    getKudosCount(id),
    currentUser
      ? hasUserGivenKudos(id, currentUser.id)
      : Promise.resolve(false),
    getActivityComments(id),
  ]);

  const initials = activity.author.displayName
    ? activity.author.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : activity.author.username.slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
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
                  {formatDateFull(activity.startedAt)} at{" "}
                  {formatTime(activity.startedAt)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
            <CardTitle className="text-2xl">{activity.name}</CardTitle>
            <div className="flex items-center gap-2">
              {currentUser?.id === activity.userId && (
                <Link href={`/activity/${id}/edit`}>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </Link>
              )}
              {currentUser && (
                <KudosButton
                  activityId={id}
                  initialCount={kudosCount}
                  initialHasKudos={hasKudos}
                />
              )}
              {currentUser?.id === activity.userId && activity.polyline && (
                <SaveRouteButton activityId={id} activityName={activity.name} />
              )}
            </div>
          </div>
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
              label={activity.type === "run" ? "Pace" : "Speed"}
              value={
                activity.type === "run"
                  ? `${formatPace(activity.avgPaceSecondsPerKm)}/km`
                  : `${activity.avgSpeedKmh?.toFixed(1) || "--"} km/h`
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
            <StatCard
              label="Calories"
              value={formatCalories(activity.calories)}
              small
            />
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
            <RouteMap
              polyline={activity.polyline}
              className="h-[400px] md:h-[500px]"
            />
          </CardContent>
        </Card>
      )}

      <Card id="comments" className="glass-card scroll-mt-4">
        <CardHeader>
          <CardTitle>Comments</CardTitle>
        </CardHeader>
        <CardContent>
          <CommentsSection
            activityId={id}
            initialComments={comments}
            currentUserId={currentUser?.id ?? null}
          />
        </CardContent>
      </Card>
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
    <div
      className={`text-center p-4 rounded-lg bg-muted/50 ${small ? "p-3" : ""}`}
    >
      <p
        className={`font-bold ${highlight ? "text-gradient" : ""} ${
          small ? "text-lg" : "text-2xl md:text-3xl"
        }`}
      >
        {value}
      </p>
      <p
        className={`text-muted-foreground uppercase tracking-wider ${
          small ? "text-[10px]" : "text-xs"
        }`}
      >
        {label}
      </p>
    </div>
  );
}
