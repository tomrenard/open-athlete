import { notFound } from "next/navigation";
import Link from "next/link";
import { getChallengeById } from "@/actions/challenges.actions";
import { ChallengeJoinButton } from "@/components/challenges/ChallengeJoinButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ChallengeType } from "@/actions/challenges.actions";

export const dynamic = "force-dynamic";

const challengeTypeLabels: Record<ChallengeType, string> = {
  distance: "Distance (km)",
  elevation: "Elevation (m)",
  time: "Time (hours)",
  activities: "Activities",
};

interface ChallengePageProps {
  params: Promise<{ id: string }>;
}

export default async function ChallengePage({ params }: ChallengePageProps) {
  const { id } = await params;
  const challenge = await getChallengeById(id);

  if (!challenge) {
    notFound();
  }

  const isEnded = challenge.endAt < new Date();

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge variant="secondary" className="mb-2 bg-accent">
                {challengeTypeLabels[challenge.type]}
              </Badge>
              <h1 className="text-2xl font-bold">{challenge.name}</h1>
              <p className="text-muted-foreground mt-2">
                Target: {challenge.targetValue}{" "}
                {challenge.type === "distance"
                  ? "km"
                  : challenge.type === "elevation"
                  ? "m"
                  : challenge.type === "time"
                  ? "hours"
                  : "activities"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {challenge.startAt.toLocaleDateString()} –{" "}
                {challenge.endAt.toLocaleDateString()} ·{" "}
                {challenge.participantsCount} participants
              </p>
              {isEnded && (
                <Badge variant="outline" className="mt-2">
                  Ended
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          {challenge.leaderboard.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No progress yet. Join and log activities during the challenge
              period.
            </p>
          ) : (
            <ul className="space-y-2">
              {challenge.leaderboard.map((row, idx) => (
                <li
                  key={row.userId}
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
                  </div>
                  <span className="font-bold">
                    {row.progress} {row.unit}
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
