import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth.actions";
import { getUserActivities } from "@/actions/activity.actions";
import { CreateSegmentForm } from "@/components/segments/CreateSegmentForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function NewSegmentPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { activities } = await getUserActivities(user.id, 1, 100);
  const activitiesWithPolyline = activities.filter((a) => a.polyline);

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>New segment from activity</CardTitle>
          <p className="text-sm text-muted-foreground">
            Create a segment using the full route of an activity. Segment
            matching (auto-detect efforts) will be added later.
          </p>
        </CardHeader>
        <CardContent>
          <CreateSegmentForm activities={activitiesWithPolyline} />
        </CardContent>
      </Card>
    </div>
  );
}
