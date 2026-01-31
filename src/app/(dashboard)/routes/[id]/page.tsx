import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/actions/auth.actions";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RouteMap } from "@/components/maps/RouteMap";
import { formatDistance, formatElevation } from "@/lib/utils/pace";
import type { ActivityType } from "@/types";

export const dynamic = "force-dynamic";

const activityTypeLabels: Record<ActivityType, string> = {
  run: "Run",
  ride: "Ride",
  swim: "Swim",
};

interface RoutePageProps {
  params: Promise<{ id: string }>;
}

export default async function RoutePage({ params }: RoutePageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    notFound();
  }

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("routes")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !row) {
    notFound();
  }

  const route = row as {
    id: string;
    name: string;
    polyline: string;
    distance_meters: number | null;
    elevation_gain_meters: number | null;
    activity_type: ActivityType;
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardContent className="pt-6">
          <Badge variant="secondary" className="mb-2 bg-accent">
            {activityTypeLabels[route.activity_type]}
          </Badge>
          <h1 className="text-2xl font-bold">{route.name}</h1>
          <div className="flex gap-4 mt-2 text-muted-foreground">
            {route.distance_meters != null && (
              <span>{formatDistance(route.distance_meters)}</span>
            )}
            {route.elevation_gain_meters != null && (
              <span>{formatElevation(route.elevation_gain_meters)}</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card overflow-hidden">
        <CardHeader>
          <CardTitle>Map</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <RouteMap polyline={route.polyline} className="h-[400px]" />
        </CardContent>
      </Card>
    </div>
  );
}
