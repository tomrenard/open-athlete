import { notFound } from "next/navigation";
import { getActivityById } from "@/actions/activity.actions";
import { getCurrentUser } from "@/actions/auth.actions";
import { EditActivityForm } from "@/components/activity/EditActivityForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

interface EditActivityPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditActivityPage({
  params,
}: EditActivityPageProps) {
  const { id } = await params;
  const [activity, currentUser] = await Promise.all([
    getActivityById(id),
    getCurrentUser(),
  ]);

  if (!activity) {
    notFound();
  }

  if (!currentUser || currentUser.id !== activity.userId) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Edit activity</CardTitle>
        </CardHeader>
        <CardContent>
          <EditActivityForm
            activityId={id}
            initialName={activity.name}
            initialDescription={activity.description ?? ""}
            initialType={activity.type}
            initialPrivacy={activity.privacy}
            initialStartedAt={activity.startedAt}
          />
        </CardContent>
      </Card>
    </div>
  );
}
