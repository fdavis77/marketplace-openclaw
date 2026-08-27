import { createClient } from "@/lib/supabase/server";
import { toggleHidePost, deletePost, toggleHideComment, deleteComment } from "@/app/actions/posts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export async function ModerationSection() {
  const supabase = await createClient();
  const [{ data: posts }, { data: comments }] = await Promise.all([
    supabase
      .from("posts")
      .select("*, author:profiles(display_name)")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("comments")
      .select("*, author:profiles(display_name)")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="font-display font-semibold">Posts</h3>
        <div className="mt-3 flex flex-col gap-3">
          {posts?.map((post) => (
            <div key={post.id} className="rounded-card border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{post.author?.display_name ?? "Former member"}</p>
                  <p className="text-xs text-muted">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {post.is_hidden ? <Badge variant="warning">Hidden</Badge> : null}
                  <form action={toggleHidePost}>
                    <input type="hidden" name="postId" value={post.id} />
                    <input type="hidden" name="hide" value={(!post.is_hidden).toString()} />
                    <Button type="submit" size="sm" variant="outline">
                      {post.is_hidden ? "Unhide" : "Hide"}
                    </Button>
                  </form>
                  <form action={deletePost}>
                    <input type="hidden" name="postId" value={post.id} />
                    <Button type="submit" size="sm" variant="ghost">Delete</Button>
                  </form>
                </div>
              </div>
              <p className="mt-2 text-sm">{post.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-display font-semibold">Comments</h3>
        <div className="mt-3 flex flex-col gap-3">
          {comments?.map((comment) => (
            <div key={comment.id} className="rounded-card border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{comment.author?.display_name ?? "Former member"}</p>
                  <p className="text-xs text-muted">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {comment.is_hidden ? <Badge variant="warning">Hidden</Badge> : null}
                  <form action={toggleHideComment}>
                    <input type="hidden" name="commentId" value={comment.id} />
                    <input type="hidden" name="hide" value={(!comment.is_hidden).toString()} />
                    <Button type="submit" size="sm" variant="outline">
                      {comment.is_hidden ? "Unhide" : "Hide"}
                    </Button>
                  </form>
                  <form action={deleteComment}>
                    <input type="hidden" name="commentId" value={comment.id} />
                    <Button type="submit" size="sm" variant="ghost">Delete</Button>
                  </form>
                </div>
              </div>
              <p className="mt-2 text-sm">{comment.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
