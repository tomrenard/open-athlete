import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/actions/auth.actions";
import { getSegments } from "@/actions/segments.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistance, formatElevation } from "@/lib/utils/pace";
import type { ActivityType } from "@/types";

export const dynamic = "force-dynamic";

const activityTypeLabels: Record<ActivityType, string> = {
  run: "Run",
  ride: "Ride",
  swim: "Swim",
};

export default async function SegmentsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const segments = await getSegments(undefined, 50);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Segments</h1>
        <Link href="/segments/new">
          <Button size="sm" className="glass-button">
            Create segment
          </Button>
        </Link>
      </div>
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Segments</CardTitle>
          <p className="text-sm text-muted-foreground">
            Create segments from your activities. Leaderboards show best efforts
            (segment matching coming soon).
          </p>
        </CardHeader>
        <CardContent>
          {segments.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No segments yet. Create a segment from an activity.
            </p>
          ) : (
            <ul className="space-y-3">
              {segments.map((segment) => (
                <li key={segment.id}>
                  <Link
                    href={`/segments/${segment.id}`}
                    className="flex items-center justify-between gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge variant="secondary" className="shrink-0">
                        {activityTypeLabels[segment.activityType]}
                      </Badge>
                      <div>
                        <p className="font-medium truncate">{segment.name}</p>
                        <div className="flex gap-3 text-sm text-muted-foreground">
                          {segment.distanceMeters != null && (
                            <span>
                              {formatDistance(segment.distanceMeters)}
                            </span>
                          )}
                          {segment.elevationGainMeters != null && (
                            <span>
                              {formatElevation(segment.elevationGainMeters)}
                            </span>
                          )}
                          <span>{segment.effortsCount ?? 0} efforts</span>
                        </div>
                      </div>
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
