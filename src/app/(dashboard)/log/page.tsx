import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth.actions";
import { getActivitiesForLog } from "@/actions/activity.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrainingLogView } from "@/components/dashboard/TrainingLogView";

export const dynamic = "force-dynamic";

export default async function LogPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const twelveWeeksAgo = new Date();
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 12 * 7);
  const activities = await getActivitiesForLog(user.id, {
    from: twelveWeeksAgo,
    limit: 200,
  });

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Last 12 weeks</CardTitle>
          <p className="text-sm text-muted-foreground">
            Activities grouped by week. Filter by sport or date range on the
            client.
          </p>
        </CardHeader>
        <CardContent>
          <TrainingLogView initialActivities={activities} />
        </CardContent>
      </Card>
    </div>
  );
}
