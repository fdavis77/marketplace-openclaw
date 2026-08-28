import { User } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { AccountForm } from "@/components/account-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function AccountPage() {
  const profile = await requireUser();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="flex items-center gap-2 font-display text-3xl">
        <User className="h-5 w-5 text-accent" />
        Account
      </h1>
      <p className="mt-2 text-muted">
        Private to you by default — the network directory below is the one exception, and it&rsquo;s opt-in.
      </p>

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
