import { requireUser } from "@/lib/dal";
import { AccountForm } from "@/components/account-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function AccountPage() {
  const profile = await requireUser();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-extrabold">Account</h1>
      <p className="mt-2 text-muted">Private to you — nothing here is shown to anyone else.</p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Your details</CardTitle>
          <CardDescription>Roles determine which planner sections show up.</CardDescription>
        </CardHeader>
        <CardContent>
          <AccountForm profile={profile} />
        </CardContent>
      </Card>
    </div>
  );
}
