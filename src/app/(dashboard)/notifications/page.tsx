import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/actions/auth.actions";
import { getNotifications } from "@/actions/notifications.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTimeAgo } from "@/lib/utils/pace";
import type { NotificationType } from "@/actions/notifications.actions";

export const dynamic = "force-dynamic";

const notificationLabels: Record<NotificationType, string> = {
  kudos: "gave you kudos",
  comment: "commented on your activity",
  follow: "started following you",
  challenge: "invited you to a challenge",
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const notifications = await getNotifications(50);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Notifications</h1>
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No notifications yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`flex items-center justify-between gap-4 p-3 rounded-lg transition-colors ${
                    n.readAt ? "bg-transparent" : "bg-muted/30"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    {n.actorId ? (
                      <Link
                        href={`/athlete/${n.actor?.username ?? "unknown"}`}
                        className="font-medium hover:text-primary"
                      >
                        {n.actor?.displayName || n.actor?.username || "Someone"}
                      </Link>
                    ) : (
                      <span className="font-medium">Someone</span>
                    )}{" "}
                    <span className="text-muted-foreground">
                      {notificationLabels[n.type]}
                    </span>
                    {n.activityId && (
                      <>
                        {" "}
                        <Link
                          href={`/activity/${n.activityId}`}
                          className="text-primary hover:underline"
                        >
                          View activity
                        </Link>
                      </>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatTimeAgo(n.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
