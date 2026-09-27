"use client";

import { useState } from "react";
import { saveWrapUp } from "@/actions/money";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Card, options, SelectField, TextAreaField } from "@/components/ui";
import type { PostWeddingRecord } from "@/db/schema";
import {
  MEDIA_CONSENT,
  MEDIA_CONSENT_LABELS,
  PORTFOLIO_STATUSES,
  PORTFOLIO_STATUS_LABELS,
} from "@/lib/domain";

export function WrapUpPanel({ clientId, record }: { clientId: string; record: PostWeddingRecord | null }) {
  const [testimonial, setTestimonial] = useState(record?.testimonialReceived ?? false);
  return (
    <Card className="p-4 sm:p-6">
      <h3 className="text-xl">Post-wedding wrap-up</h3>
      <p className="mb-4 text-sm text-ink-soft">Testimonial, photo/video consent, portfolio and the internal debrief.</p>
      <ActionForm action={saveWrapUp.bind(null, clientId)}>
        {(e, pending) => (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-line-strong bg-card px-3 sm:col-span-2">
              <input
                type="checkbox"
                name="testimonialReceived"
                checked={testimonial}
                onChange={(ev) => setTestimonial(ev.target.checked)}
                className="h-5 w-5 accent-ember"
              />
              <span className="text-sm font-medium">Testimonial received</span>
            </label>
            {testimonial && (
              <TextAreaField
                label="Testimonial"
                name="testimonialText"
                rows={4}
                defaultValue={record?.testimonialText ?? ""}
                className="sm:col-span-2"
              />
            )}
            <SelectField
              label="Photo/video consent"
              name="mediaConsent"
              defaultValue={record?.mediaConsent ?? "pending"}
              options={options(MEDIA_CONSENT, MEDIA_CONSENT_LABELS)}
              hint="Per the opt-out clause in the client agreement."
            />
            <SelectField
              label="Portfolio"
              name="portfolioStatus"
              defaultValue={record?.portfolioStatus ?? "not_started"}
              options={options(PORTFOLIO_STATUSES, PORTFOLIO_STATUS_LABELS)}
              error={e.portfolioStatus}
            />
            <TextAreaField
              label="Internal debrief — what went wrong or nearly went wrong"
              name="debriefNotes"
              rows={6}
              defaultValue={record?.debriefNotes ?? ""}
              className="sm:col-span-2"
            />
            <div className="flex justify-end sm:col-span-2">
              <SubmitButton pending={pending}>Save wrap-up</SubmitButton>
            </div>
          </div>
        )}
      </ActionForm>
    </Card>
  );
}
