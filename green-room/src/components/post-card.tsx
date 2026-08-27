import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { createComment, deleteComment, deletePost, toggleHidePost, toggleHideComment, toggleLike } from "@/app/actions/posts";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Profile } from "@/lib/dal";
import type { Tables } from "@/lib/supabase/database.types";

type PostWithAuthor = Tables<"posts"> & { author: Profile | null };
type CommentWithAuthor = Tables<"comments"> & { author: Profile | null };

export function PostCard({
  post,
  comments,
  likeCount,
  likedByMe,
  currentProfile,
}: {
  post: PostWithAuthor;
  comments: CommentWithAuthor[];
  likeCount: number;
  likedByMe: boolean;
  currentProfile: Profile | null;
}) {
  const isAdmin = currentProfile?.role === "admin";
  const isAuthor = currentProfile?.id === post.author_id;

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        {post.author?.photo_url ? (
          <img src={post.author.photo_url} alt="" className="h-10 w-10 rounded-full" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-muted-surface" />
        )}
        <div className="flex-1">
          <Link href={`/profile/${post.author_id}`} className="font-medium hover:underline">
            {post.author?.display_name ?? "Former member"}
          </Link>
          <p className="text-xs text-muted">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            {post.is_hidden ? " · hidden by moderators" : ""}
          </p>
        </div>
        {isAuthor || isAdmin ? (
          <div className="flex gap-2">
            {isAdmin ? (
              <form action={toggleHidePost}>
                <input type="hidden" name="postId" value={post.id} />
                <input type="hidden" name="hide" value={(!post.is_hidden).toString()} />
                <Button type="submit" variant="ghost" size="sm">
                  {post.is_hidden ? "Unhide" : "Hide"}
                </Button>
              </form>
            ) : null}
            <form action={deletePost}>
              <input type="hidden" name="postId" value={post.id} />
              <Button type="submit" variant="ghost" size="sm">
                Delete
              </Button>
            </form>
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="whitespace-pre-line text-sm">{post.body}</p>
        {post.image_url ? (
          <img src={post.image_url} alt="" className="max-h-96 w-full rounded-lg object-cover" />
        ) : null}
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-4">
        {currentProfile ? (
          <form action={toggleLike} className="flex items-center gap-2">
            <input type="hidden" name="postId" value={post.id} />
            <Button type="submit" variant={likedByMe ? "default" : "outline"} size="sm">
              {likedByMe ? "♥ Liked" : "♡ Like"}
            </Button>
            <span className="text-xs text-muted">
              {likeCount} {likeCount === 1 ? "like" : "likes"}
            </span>
          </form>
        ) : (
          <p className="text-xs text-muted">{likeCount} likes</p>
        )}

        {comments.length ? (
          <ul className="flex flex-col gap-3 border-t border-border pt-3">
            {comments.map((comment) => (
              <li key={comment.id} className="flex items-start justify-between gap-2 text-sm">
                <div>
                  <Link href={`/profile/${comment.author_id}`} className="font-medium hover:underline">
                    {comment.author?.display_name ?? "Former member"}
                  </Link>{" "}
                  <span className={comment.is_hidden ? "italic text-muted" : ""}>
                    {comment.is_hidden ? "Comment hidden by moderators." : comment.body}
                  </span>
                </div>
                {currentProfile?.id === comment.author_id || isAdmin ? (
                  <div className="flex shrink-0 gap-1">
                    {isAdmin ? (
                      <form action={toggleHideComment}>
                        <input type="hidden" name="commentId" value={comment.id} />
                        <input type="hidden" name="hide" value={(!comment.is_hidden).toString()} />
                        <button className="text-xs text-muted hover:text-accent" type="submit">
                          {comment.is_hidden ? "Unhide" : "Hide"}
                        </button>
                      </form>
                    ) : null}
                    <form action={deleteComment}>
                      <input type="hidden" name="commentId" value={comment.id} />
                      <button className="text-xs text-muted hover:text-accent" type="submit">
                        Delete
                      </button>
                    </form>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        {currentProfile ? (
          <form action={createComment} className="flex gap-2 border-t border-border pt-3">
            <input type="hidden" name="postId" value={post.id} />
            <Textarea name="body" required maxLength={1000} placeholder="Write a comment…" className="min-h-10" />
            <Button type="submit" size="sm">
              Reply
            </Button>
          </form>
        ) : null}
      </CardFooter>
    </Card>
  );
}
