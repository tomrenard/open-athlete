import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/actions/auth.actions";
import { getMyRoutes } from "@/actions/routes.actions";
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

export default async function RoutesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const routes = await getMyRoutes(50);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My routes</h1>
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Saved routes</CardTitle>
          <p className="text-sm text-muted-foreground">
            Save routes from your activities for reuse. Export to GPX coming
            soon.
          </p>
        </CardHeader>
        <CardContent>
          {routes.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No saved routes. Save a route from an activity detail page.
            </p>
          ) : (
            <ul className="space-y-3">
              {routes.map((route) => (
                <li key={route.id}>
                  <Link
                    href={`/routes/${route.id}`}
                    className="flex items-center justify-between gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge variant="secondary" className="shrink-0">
                        {activityTypeLabels[route.activityType]}
                      </Badge>
                      <div>
                        <p className="font-medium truncate">{route.name}</p>
                        <div className="flex gap-3 text-sm text-muted-foreground">
                          {route.distanceMeters != null && (
                            <span>{formatDistance(route.distanceMeters)}</span>
                          )}
                          {route.elevationGainMeters != null && (
                            <span>
                              {formatElevation(route.elevationGainMeters)}
                            </span>
                          )}
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
