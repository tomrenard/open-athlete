import { getCurrentUser, getCurrentProfile } from "@/actions/auth.actions";
import { getUnreadCount } from "@/actions/notifications.actions";
import { DashboardNav } from "@/components/layout/DashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, profile, unreadCount] = await Promise.all([
    getCurrentUser(),
    getCurrentProfile(),
    getUnreadCount(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav user={user} profile={profile} unreadCount={unreadCount} />
      <main className="container max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
