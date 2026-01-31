import { notFound } from "next/navigation";
import Link from "next/link";
import { getSegmentById } from "@/actions/segments.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RouteMap } from "@/components/maps/RouteMap";
import {
  formatDuration,
  formatDistance,
  formatElevation,
} from "@/lib/utils/pace";
import type { ActivityType } from "@/types";

export const dynamic = "force-dynamic";

const activityTypeLabels: Record<ActivityType, string> = {
  run: "Run",
  ride: "Ride",
  swim: "Swim",
};

interface SegmentPageProps {
  params: Promise<{ id: string }>;
}

export default async function SegmentPage({ params }: SegmentPageProps) {
  const { id } = await params;
  const segment = await getSegmentById(id);

  if (!segment) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardContent className="pt-6">
          <Badge variant="secondary" className="mb-2 bg-accent">
            {activityTypeLabels[segment.activityType]}
          </Badge>
          <h1 className="text-2xl font-bold">{segment.name}</h1>
          <div className="flex gap-4 mt-2 text-muted-foreground">
            {segment.distanceMeters != null && (
              <span>{formatDistance(segment.distanceMeters)}</span>
            )}
            {segment.elevationGainMeters != null && (
              <span>{formatElevation(segment.elevationGainMeters)}</span>
            )}
            <span>{segment.leaderboard.length} efforts</span>
          </div>
        </CardContent>
      </Card>

      {segment.polyline && (
        <Card className="glass-card overflow-hidden">
          <CardHeader>
            <CardTitle>Route</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <RouteMap polyline={segment.polyline} className="h-[300px]" />
          </CardContent>
        </Card>
      )}

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
          <p className="text-sm text-muted-foreground">
            Best efforts. Segment matching (auto-detect from activities) coming
            soon.
          </p>
        </CardHeader>
        <CardContent>
          {segment.leaderboard.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No efforts yet. When segment matching is enabled, efforts will
              appear here.
            </p>
          ) : (
            <ul className="space-y-2">
              {segment.leaderboard.map((row, idx) => (
                <li
                  key={`${row.userId}-${row.activityId}`}
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
                    <Link
                      href={`/activity/${row.activityId}`}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {row.startDate.toLocaleDateString()}
                    </Link>
                  </div>
                  <span className="font-bold">
                    {formatDuration(row.elapsedTimeSeconds)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
