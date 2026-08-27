import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/dal";
import { PostComposer } from "@/components/post-composer";
import { PostCard } from "@/components/post-card";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 10;

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE; // fetch one extra to detect a next page

  const supabase = await createClient();
  const profile = await getCurrentUser();

  const { data: rows } = await supabase
    .from("posts")
    .select("*, author:profiles(*)")
    .order("created_at", { ascending: false })
    .range(from, to);

  const posts = (rows ?? []).slice(0, PAGE_SIZE);
  const hasNextPage = (rows ?? []).length > PAGE_SIZE;
  const postIds = posts.map((p) => p.id);

  const [{ data: comments }, { data: likes }] = await Promise.all([
    postIds.length
      ? supabase
          .from("comments")
          .select("*, author:profiles(*)")
          .in("post_id", postIds)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] as never[] }),
    postIds.length
      ? supabase.from("post_likes").select("post_id, user_id").in("post_id", postIds)
      : Promise.resolve({ data: [] as never[] }),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-extrabold">Community</h1>
      <p className="mt-2 text-muted">What the community is working on, right now.</p>

      {profile ? (
        <div className="mt-8">
          <PostComposer />
        </div>
      ) : (
        <div className="mt-8 rounded-card border border-border bg-muted-surface p-6 text-center">
          <p className="text-sm text-muted">
            <Link href="/login" className="font-medium text-accent hover:underline">
              Sign in
            </Link>{" "}
            to post, comment, and like.
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-6">
        {posts.length ? (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              comments={(comments ?? []).filter((c) => c.post_id === post.id)}
              likeCount={(likes ?? []).filter((l) => l.post_id === post.id).length}
              likedByMe={
                !!profile && (likes ?? []).some((l) => l.post_id === post.id && l.user_id === profile.id)
              }
              currentProfile={profile}
            />
          ))
        ) : (
          <div className="rounded-card border border-dashed border-border p-12 text-center text-muted">
            No posts yet — be the first to share something.
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-between">
        {page > 1 ? (
          <Button variant="outline" asChild>
            <Link href={`/community?page=${page - 1}`}>← Newer</Link>
          </Button>
        ) : <span />}
        {hasNextPage ? (
          <Button variant="outline" asChild>
            <Link href={`/community?page=${page + 1}`}>Older →</Link>
          </Button>
        ) : <span />}
      </div>
    </div>
  );
}
