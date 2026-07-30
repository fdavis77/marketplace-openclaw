import { RouteLine } from "../components/RouteLine";
import { LinkButton } from "../components/Button";
import { WaitlistForm } from "../components/WaitlistForm";
import { APP_NAME } from "../config";

export function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-navy px-6 pb-20 pt-16 text-linen sm:pt-24">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 text-center">
          <p className="font-display text-xs uppercase tracking-[0.3em] text-brass">
            {APP_NAME}
          </p>
          <h1 className="max-w-3xl text-4xl leading-tight sm:text-5xl">
            The right chef, found the way a good introduction should be made.
          </h1>
          <p className="max-w-xl text-lg text-linen/70">
            Tell us about your season. We'll find a private chef who actually fits it — vetted by
            hand, matched by a person, not a listings board.
          </p>
          <RouteLine className="h-40 w-full max-w-xl sm:h-52" />
          <div className="flex flex-col gap-4 sm:flex-row">
            <LinkButton to="/owners" variant="primary">
              I'm an owner or captain
            </LinkButton>
            <LinkButton to="/chefs/apply" variant="secondary">
              I'm a chef
            </LinkButton>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 sm:grid-cols-2">
          <div>
            <h2 className="mb-3 text-2xl text-navy">For owners and captains</h2>
            <p className="mb-6 text-navy/70">
              Requesting a chef here isn't posting a job. Tell us about the vessel, the season, and
              the kind of food you want on board — we do the searching.
            </p>
            <ol className="space-y-3 text-sm text-navy/80">
              <li>
                <span className="font-display text-brass">01 · </span>Submit a request with your
                season, region, and preferences.
              </li>
              <li>
                <span className="font-display text-brass">02 · </span>We review it personally and
                shortlist chefs who genuinely fit.
              </li>
              <li>
                <span className="font-display text-brass">03 · </span>We make the introduction. You
                take it from there.
              </li>
            </ol>
          </div>
          <div>
            <h2 className="mb-3 text-2xl text-navy">For chefs</h2>
            <p className="mb-6 text-navy/70">
              This isn't a job board. Applying here means putting your work in front of owners who
              are looking for someone like you — not everyone.
            </p>
            <ol className="space-y-3 text-sm text-navy/80">
              <li>
                <span className="font-display text-brass">01 · </span>Apply with your experience,
                specialties, and availability.
              </li>
              <li>
                <span className="font-display text-brass">02 · </span>We review every application
                before it's ever shown to an owner.
              </li>
              <li>
                <span className="font-display text-brass">03 · </span>When there's a fit, we make
                the introduction directly.
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <section className="bg-linen-dark px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-2 text-2xl text-navy">Not ready to submit yet?</h2>
          <p className="mb-8 text-navy/70">
            Join the waitlist and tell us which waters you're sailing this season. We'll reach out
            as the right matches come together.
          </p>
          <WaitlistForm />
        </div>
      </section>
    </div>
  );
}
