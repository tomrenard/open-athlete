import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth.actions";
import { CreateChallengeForm } from "@/components/challenges/CreateChallengeForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function NewChallengePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>New challenge</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateChallengeForm />
        </CardContent>
      </Card>
    </div>
  );
}
