"use client";

import { useActionState, useRef } from "react";
import { createPost, type PostState } from "@/app/actions/posts";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

export function PostComposer() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<PostState, FormData>(
    async (prevState, formData) => {
      const result = await createPost(prevState, formData);
      if (!result?.error) formRef.current?.reset();
      return result;
    },
    undefined
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <form ref={formRef} action={action} className="flex flex-col gap-3">
          <Textarea
            name="body"
            required
            maxLength={2000}
            placeholder="What are you working on?"
          />
          <div className="flex items-center justify-between gap-3">
            <input
              type="file"
              name="image"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="text-xs text-muted"
            />
            <Button type="submit" disabled={pending}>
              {pending ? "Posting…" : "Post"}
            </Button>
          </div>
          {state?.error ? (
            <p className="text-sm text-red-700" role="alert">
              {state.error}
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
