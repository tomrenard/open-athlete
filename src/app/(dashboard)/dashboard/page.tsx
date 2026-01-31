import { redirect } from "next/navigation";
import { SeasonPRs } from "@/components/dashboard/SeasonPRs";
import { ContributionGraph } from "@/components/dashboard/ContributionGraph";
import { StravaConnect } from "@/components/dashboard/StravaConnect";
import { GoalsCard } from "@/components/dashboard/GoalsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCurrentProfile, getCurrentUser } from "@/actions/auth.actions";
import { isStravaConnected } from "@/actions/strava.actions";
import {
  getSeasonPRs,
  getWeeklyActivityData,
  getActivityStats,
} from "@/actions/activity.actions";
import { getGoalsWithProgress } from "@/actions/goals.actions";
import { getTrainingLoadData } from "@/actions/training-load.actions";
import { FitnessFatigueCard } from "@/components/dashboard/FitnessFatigueCard";
import { FitnessFatigueChart } from "@/components/dashboard/FitnessFatigueChart";
import { formatDistance, formatDuration } from "@/lib/utils/pace";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [
    profile,
    prs,
    weeklyData,
    stats,
    stravaConnected,
    goals,
    trainingLoad,
  ] = await Promise.all([
    getCurrentProfile(),
    getSeasonPRs(user.id),
    getWeeklyActivityData(user.id, 52),
    getActivityStats(user.id),
    isStravaConnected(),
    getGoalsWithProgress(user.id),
    getTrainingLoadData(90),
  ]);

  const hasTrainingLoad = trainingLoad.data.some((d) => d.load > 0);

  if (!profile) {
    redirect("/login");
  }

  const initials = profile.display_name
    ? profile.display_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    : profile.username.slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-border">
              <AvatarImage
                src={profile.avatar_url || undefined}
                alt={profile.username}
              />
              <AvatarFallback className="bg-muted text-lg font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">
                {profile.display_name || profile.username}
              </h1>
              <p className="text-muted-foreground">@{profile.username}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <StravaConnect isConnected={stravaConnected} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Activities"
          value={stats.totalActivities.toString()}
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          }
        />
        <StatCard
          title="Total Distance"
          value={formatDistance(stats.totalDistanceMeters)}
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          }
        />
        <StatCard
          title="Total Time"
          value={formatDuration(stats.totalDurationSeconds)}
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        <StatCard
          title="Elevation Gain"
          value={`${Math.round(
            stats.totalElevationGainMeters
          ).toLocaleString()}m`}
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
          }
        />
      </div>

      <GoalsCard initialGoals={goals} />

      {hasTrainingLoad && trainingLoad.latest && (
        <>
          <FitnessFatigueCard latest={trainingLoad.latest} />
          <FitnessFatigueChart data={trainingLoad.data} />
        </>
      )}

      <SeasonPRs prs={prs} />

      <ContributionGraph data={weeklyData} />
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <span className="text-primary">{icon}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
