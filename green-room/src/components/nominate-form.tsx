"use client";

import { useActionState } from "react";
import { submitNomination, type NominateState } from "@/app/actions/nominations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function NominateForm() {
  const [state, action, pending] = useActionState<NominateState, FormData>(
    submitNomination,
    undefined
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Nominate someone</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nominate someone for Spotlight</DialogTitle>
          <DialogDescription>
            Tell us who deserves recognition and why. Our team reviews every nomination.
          </DialogDescription>
        </DialogHeader>
        {state?.success ? (
          <p className="text-sm font-medium text-accent">
            Thanks — your nomination has been sent for review.
          </p>
        ) : (
          <form action={action} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nomineeName">Their name</Label>
              <Input id="nomineeName" name="nomineeName" required maxLength={120} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nomineeContact">Their email or Instagram (optional)</Label>
              <Input id="nomineeContact" name="nomineeContact" maxLength={200} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reason">Why do they deserve the Spotlight?</Label>
              <Textarea id="reason" name="reason" required minLength={10} maxLength={1000} />
            </div>
            {state?.error ? (
              <p className="text-sm text-red-700" role="alert">
                {state.error}
              </p>
            ) : null}
            <Button type="submit" disabled={pending}>
              {pending ? "Sending…" : "Send nomination"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
