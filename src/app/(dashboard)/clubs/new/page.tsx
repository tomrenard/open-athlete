import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth.actions";
import { CreateClubForm } from "@/components/clubs/CreateClubForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function NewClubPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>New club</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateClubForm />
        </CardContent>
      </Card>
    </div>
  );
}
