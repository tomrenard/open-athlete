import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/actions/auth.actions";
import { getActivitiesForLog } from "@/actions/activity.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  formatDistance,
  formatDuration,
  formatDateShort,
} from "@/lib/utils/pace";
import type { ActivityType } from "@/types";

export const dynamic = "force-dynamic";

const activityTypeLabels: Record<ActivityType, string> = {
  run: "Run",
  ride: "Ride",
  swim: "Swim",
};

export default async function YearInReviewPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const year = new Date().getFullYear();
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59);

  const activities = await getActivitiesForLog(user.id, {
    from: yearStart,
    to: yearEnd,
    limit: 500,
  });

  const yearActivities = activities.filter(
    (a) =>
      new Date(a.startedAt) >= yearStart && new Date(a.startedAt) <= yearEnd
  );

  const yearStats = {
    distance: yearActivities.reduce((s, a) => s + a.distanceMeters, 0),
    time: yearActivities.reduce(
      (s, a) => s + (a.movingTimeSeconds ?? a.elapsedTimeSeconds),
      0
    ),
    elevation: yearActivities.reduce(
      (s, a) => s + (a.elevationGainMeters ?? 0),
      0
    ),
    count: yearActivities.length,
  };

  const byType = (["run", "ride", "swim"] as ActivityType[]).map((type) => ({
    type,
    count: yearActivities.filter((a) => a.type === type).length,
    distance: yearActivities
      .filter((a) => a.type === type)
      .reduce((s, a) => s + a.distanceMeters, 0),
  }));

  const topByDistance = [...yearActivities]
    .sort((a, b) => b.distanceMeters - a.distanceMeters)
    .slice(0, 5);
  const topByElevation = [...yearActivities]
    .sort((a, b) => (b.elevationGainMeters ?? 0) - (a.elevationGainMeters ?? 0))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-2xl">{year} in review</CardTitle>
          <p className="text-muted-foreground">
            Your stats and highlights for this year so far.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-gradient">
                {formatDistance(yearStats.distance)}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Distance
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">
                {formatDuration(yearStats.time)}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Time
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">
                {Math.round(yearStats.elevation).toLocaleString()}m
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Elevation
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{yearStats.count}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Activities
              </p>
            </div>
          </div>

          <h3 className="font-semibold mb-3">By sport</h3>
          <div className="flex flex-wrap gap-4 mb-8">
            {byType
              .filter((x) => x.count > 0)
              .map((x) => (
                <div
                  key={x.type}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50"
                >
                  <Badge variant="secondary" className="bg-accent">
                    {activityTypeLabels[x.type]}
                  </Badge>
                  <span className="font-medium">{x.count} activities</span>
                  <span className="text-muted-foreground">
                    {formatDistance(x.distance)}
                  </span>
                </div>
              ))}
            {byType.every((x) => x.count === 0) && (
              <p className="text-muted-foreground text-sm">
                No activities this year yet.
              </p>
            )}
          </div>

          {topByDistance.length > 0 && (
            <>
              <h3 className="font-semibold mb-3">Longest activities</h3>
              <ul className="space-y-2 mb-8">
                {topByDistance.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/activity/${a.id}`}
                      className="flex items-center justify-between gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="secondary" className="shrink-0">
                          {activityTypeLabels[a.type]}
                        </Badge>
                        <span className="truncate font-medium">{a.name}</span>
                      </div>
                      <span className="shrink-0 text-muted-foreground">
                        {formatDateShort(a.startedAt)} ·{" "}
                        {formatDistance(a.distanceMeters)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          {topByElevation.some((a) => (a.elevationGainMeters ?? 0) > 0) && (
            <>
              <h3 className="font-semibold mb-3">Most elevation</h3>
              <ul className="space-y-2">
                {topByElevation
                  .filter((a) => (a.elevationGainMeters ?? 0) > 0)
                  .map((a) => (
                    <li key={a.id}>
                      <Link
                        href={`/activity/${a.id}`}
                        className="flex items-center justify-between gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge variant="secondary" className="shrink-0">
                            {activityTypeLabels[a.type]}
                          </Badge>
                          <span className="truncate font-medium">{a.name}</span>
                        </div>
                        <span className="shrink-0 text-muted-foreground">
                          {formatDateShort(a.startedAt)} ·{" "}
                          {Math.round(a.elevationGainMeters ?? 0)}m
                        </span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
