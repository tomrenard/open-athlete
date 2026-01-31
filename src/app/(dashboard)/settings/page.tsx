import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentProfile } from "@/actions/auth.actions";
import { EditProfileForm } from "@/components/settings/EditProfileForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <p className="text-sm text-muted-foreground">
            Update your display name, bio, and location.
          </p>
        </CardHeader>
        <CardContent>
          <EditProfileForm
            initialDisplayName={profile.display_name ?? ""}
            initialBio={profile.bio ?? ""}
            initialLocation={profile.location ?? ""}
          />
        </CardContent>
      </Card>
    </div>
  );
}
