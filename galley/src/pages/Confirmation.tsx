import { RouteLine } from "../components/RouteLine";
import { LinkButton } from "../components/Button";

interface ConfirmationProps {
  heading: string;
  body: string;
}

export function Confirmation({ heading, body }: ConfirmationProps) {
  return (
    <section className="bg-navy px-6 py-24 text-linen">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-8 text-center">
        <RouteLine className="h-32 w-full max-w-sm" />
        <h1 className="text-3xl">{heading}</h1>
        <p className="text-linen/70">{body}</p>
        <LinkButton to="/" variant="secondary">
          Back to the homepage
        </LinkButton>
      </div>
    </section>
  );
}

export function OwnerConfirmation() {
  return (
    <Confirmation
      heading="Your request is in."
      body="We're reviewing it personally and will be in touch by email once we have chefs worth introducing you to. No account, no waiting on a dashboard — just a real reply."
    />
  );
}

export function ChefConfirmation() {
  return (
    <Confirmation
      heading="Your application is in."
      body="We review every application by hand before it ever reaches an owner. If there's a fit, we'll be in touch directly to make the introduction."
    />
  );
}
