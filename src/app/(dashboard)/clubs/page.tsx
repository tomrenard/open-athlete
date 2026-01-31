import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/actions/auth.actions";
import { getMyClubs, getClubsDiscover } from "@/actions/clubs.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClubJoinButton } from "@/components/clubs/ClubJoinButton";
import type { ActivityType } from "@/types";

export const dynamic = "force-dynamic";

const activityTypeLabels: Record<ActivityType, string> = {
  run: "Run",
  ride: "Ride",
  swim: "Swim",
};

export default async function ClubsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [myClubs, discover] = await Promise.all([
    getMyClubs(),
    getClubsDiscover(20),
  ]);

  const discoverFiltered = discover.filter(
    (c) => !myClubs.some((m) => m.id === c.id)
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clubs</h1>
        <Link href="/clubs/new">
          <Button size="sm" className="glass-button">
            Create club
          </Button>
        </Link>
      </div>
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>My clubs</CardTitle>
        </CardHeader>
        <CardContent>
          {myClubs.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              You haven&apos;t joined any clubs yet. Discover clubs below or
              create your own.
            </p>
          ) : (
            <ul className="space-y-3">
              {myClubs.map((club) => (
                <li key={club.id}>
                  <Link
                    href={`/clubs/${club.slug}`}
                    className="flex items-center justify-between gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge variant="secondary" className="shrink-0">
                        {activityTypeLabels[club.sportType]}
                      </Badge>
                      <div>
                        <p className="font-medium truncate">{club.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {club.membersCount} members
                          {club.visibility === "invite_only" &&
                            " · Invite only"}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground shrink-0">
                      {club.isOwner ? "Owner" : "Member"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Discover clubs</CardTitle>
        </CardHeader>
        <CardContent>
          {discoverFiltered.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No other clubs to show. Create the first one!
            </p>
          ) : (
            <ul className="space-y-3">
              {discoverFiltered.map((club) => (
                <li key={club.id}>
                  <div className="flex items-center justify-between gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                    <Link
                      href={`/clubs/${club.slug}`}
                      className="flex items-center gap-3 min-w-0 flex-1"
                    >
                      <Badge variant="secondary" className="shrink-0">
                        {activityTypeLabels[club.sportType]}
                      </Badge>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{club.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {club.description || "No description"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {club.membersCount} members
                        </p>
                      </div>
                    </Link>
                    <ClubJoinButton
                      slug={club.slug}
                      isMember={club.isMember ?? false}
                      isOwner={club.isOwner ?? false}
                      isInviteOnly={club.visibility === "invite_only"}
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
