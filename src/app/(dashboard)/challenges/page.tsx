import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/actions/auth.actions";
import {
  getMyChallenges,
  getActiveChallenges,
} from "@/actions/challenges.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChallengeJoinButton } from "@/components/challenges/ChallengeJoinButton";
import type { ChallengeType } from "@/actions/challenges.actions";

export const dynamic = "force-dynamic";

const challengeTypeLabels: Record<ChallengeType, string> = {
  distance: "Distance (km)",
  elevation: "Elevation (m)",
  time: "Time (hours)",
  activities: "Activities",
};

export default async function ChallengesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [myChallenges, activeChallenges] = await Promise.all([
    getMyChallenges(),
    getActiveChallenges(20),
  ]);

  const activeNotJoined = activeChallenges.filter((c) => !c.isParticipant);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Challenges</h1>
        <Link href="/challenges/new">
          <Button size="sm" className="glass-button">
            Create challenge
          </Button>
        </Link>
      </div>
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>My challenges</CardTitle>
        </CardHeader>
        <CardContent>
          {myChallenges.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              You haven&apos;t joined any challenges. Browse active challenges
              below.
            </p>
          ) : (
            <ul className="space-y-3">
              {myChallenges.map((challenge) => (
                <li key={challenge.id}>
                  <Link
                    href={`/challenges/${challenge.id}`}
                    className="flex items-center justify-between gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge variant="secondary" className="shrink-0">
                        {challengeTypeLabels[challenge.type]}
                      </Badge>
                      <div>
                        <p className="font-medium truncate">{challenge.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {challenge.participantsCount} participants · ends{" "}
                          {challenge.endAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Active challenges</CardTitle>
        </CardHeader>
        <CardContent>
          {activeChallenges.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No active challenges. Create one!
            </p>
          ) : (
            <ul className="space-y-3">
              {activeChallenges.map((challenge) => (
                <li key={challenge.id}>
                  <div className="flex items-center justify-between gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                    <Link
                      href={`/challenges/${challenge.id}`}
                      className="flex items-center gap-3 min-w-0 flex-1"
                    >
                      <Badge variant="secondary" className="shrink-0">
                        {challengeTypeLabels[challenge.type]}
                      </Badge>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{challenge.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Target: {challenge.targetValue}{" "}
                          {challenge.type === "distance"
                            ? "km"
                            : challenge.type === "elevation"
                            ? "m"
                            : challenge.type === "time"
                            ? "hrs"
                            : "activities"}{" "}
                          · {challenge.participantsCount} participants
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {challenge.startAt.toLocaleDateString()} –{" "}
                          {challenge.endAt.toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                    <ChallengeJoinButton
                      challengeId={challenge.id}
                      isParticipant={challenge.isParticipant ?? false}
                      endAt={challenge.endAt}
                      className="shrink-0"
                    />
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
