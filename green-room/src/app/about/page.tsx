import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <span className="inline-flex items-center rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
          Founder
        </span>
        <h1 className="font-display mt-4 text-4xl tracking-tight">Aysha Scott</h1>
        <p className="mt-2 text-muted">Independent filmmaker · Deptford, South London</p>
      </div>

      <div className="mt-10 flex flex-col gap-6 text-[15px] leading-relaxed">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Two decades on stage and screen</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-muted">
            <p>
              Aysha began her career in 2005 after training at the Anna Scher Theatre School. Over
              more than twenty years across film, TV, and theatre, she has worked as an actor,
              director, writer, producer, editor, and casting director. In 2014 she earned a BA
              (Hons) Creative Writing degree from South Bank University, receiving the Course
              Director&rsquo;s Prize for outstanding scriptwriting — her work is now studied there.
            </p>
            <p>
              Her theatre piece <em>Unspoken</em> was commissioned and showcased for nine nights
              after graduating. She founded A-Scott Productions to support her films, and her first
              independent feature, <em>Residential</em>, premiered at the British Urban Film Festival
              in 2016 with two award nominations. She went on to complete a Director&rsquo;s
              Certificate at Raindance.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Award-winning work</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-muted">
            <p>
              In 2017, Aysha wrote and produced the short film <em>It Still Hurts</em>, which won
              Best International Short at the Validate Yourself Film Festival in New York. She was
              awarded a Women in TV and Film membership and mentored by Nicola Lees.
            </p>
            <p>
              She produced the multi-award-winning <em>Voice of Reason</em> in 2018, then made her
              directorial debut with <em>Dismissed</em> — selected for twelve festivals, now with
              over 1.1 million views on her YouTube channel and available on Amazon Prime, Apple TV,
              and Bohemia. Her plays <em>Collide</em> (2022) and <em>Misconduct</em> (2023) were
              commissioned and produced by Matchstick Theatre Company at the Matchstick Pie House.
            </p>
            <p>
              In 2023, Aysha joined the BFI Cohort at the European Film Market with her feature
              debut <em>Angel</em> in development, alongside the &rsquo;90s crime drama <em>Tanya</em>,
              also in development.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Why Filmmaking Planner exists</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-muted">
            <p>
              Also in 2023, Aysha launched Filmmaking Planner — a company dedicated to providing
              custom planning tools and stationery to empower and inspire other independent
              filmmakers. This planner is the digital side of that mission: the same discipline that
              got her scripts submitted, her sets scheduled, and her auditions booked, built as a
              tool for writers, directors, producers, and actors to run their own work.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 text-center">
        <Button size="lg" asChild>
          <Link href="/signup">Start planning your own work</Link>
        </Button>
      </div>
    </div>
  );
}
