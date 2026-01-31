"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createComment, deleteComment } from "@/actions/comments.actions";
import { formatTimeAgo } from "@/lib/utils/pace";
import type { ActivityComment } from "@/actions/comments.actions";

interface CommentsSectionProps {
  activityId: string;
  initialComments: ActivityComment[];
  currentUserId: string | null;
}

export function CommentsSection({
  activityId,
  initialComments,
  currentUserId,
}: CommentsSectionProps) {
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUserId || !text.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await createComment(activityId, text);
      if (result.success) {
        setText("");
        router.refresh();
      } else {
        setError(result.error ?? "Failed to post comment");
      }
    });
  }

  function handleDelete(commentId: string) {
    if (!currentUserId) return;
    startTransition(async () => {
      await deleteComment(commentId, activityId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {currentUserId && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1"
            disabled={isPending}
            maxLength={2000}
          />
          <Button type="submit" size="sm" disabled={isPending || !text.trim()}>
            {isPending ? "..." : "Post"}
          </Button>
        </form>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <ul className="space-y-3">
        {comments.map((comment) => {
          const initials = comment.author.displayName
            ? comment.author.displayName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
            : comment.author.username.slice(0, 2).toUpperCase();
          const isOwn = currentUserId === comment.userId;

          return (
            <li
              key={comment.id}
              className="flex gap-3 p-3 rounded-lg bg-muted/30"
            >
              <Link href={`/athlete/${comment.author.username}`}>
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarImage
                    src={comment.author.avatarUrl}
                    alt={comment.author.username}
                  />
                  <AvatarFallback className="text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/athlete/${comment.author.username}`}
                    className="font-medium text-sm hover:text-primary"
                  >
                    {comment.author.displayName || comment.author.username}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm mt-0.5 break-words">{comment.text}</p>
              </div>
              {isOwn && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(comment.id)}
                  disabled={isPending}
                >
                  Delete
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      {comments.length === 0 && (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      )}
    </div>
  );
}
