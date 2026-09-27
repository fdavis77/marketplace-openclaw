import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-4xl">Not found</h1>
      <p className="mt-2 text-sm text-ink-soft">That page doesn&rsquo;t exist, or the record has been deleted.</p>
      <Link href="/" className="mt-6 inline-block text-ember underline">
        Back to today
      </Link>
    </main>
  );
}
