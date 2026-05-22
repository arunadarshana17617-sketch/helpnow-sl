"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import { MessageCircle, Send, Trash2, CornerDownRight, X, ChevronDown, ChevronUp, Loader2, ThumbsUp } from "lucide-react";

function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function Avatar({ name, photo, size = "sm" }) {
  const sz = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  if (photo) {
    return <img src={photo} alt={name} className={`${sz} rounded-full object-cover flex-shrink-0 ring-2 ring-white shadow-sm`} />;
  }
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold flex-shrink-0 ring-2 ring-white shadow-sm`}>
      {getInitials(name)}
    </div>
  );
}

function AuthorBadge({ isProvider, isOwn }) {
  if (isProvider) {
    return (
      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
        Service Provider
      </span>
    );
  }
  if (isOwn) {
    return <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">You</span>;
  }
  return null;
}

// ── Reply Item ──────────────────────────────────────────────────────────────
function ReplyItem({ reply, currentUserId, providerId, commentId, onDeleteReply, onReactReply }) {
  const isOwn = reply.author?.toString() === currentUserId;
  const isPageOwner = providerId === currentUserId;
  const canDelete = isOwn || isPageOwner;
  const hasReacted = currentUserId && (reply.reactions || []).includes(currentUserId);
  const reactionCount = (reply.reactions || []).length;

  return (
    <div className="flex gap-2.5">
      <div className="mt-0.5 ml-4 flex-shrink-0">
        <Avatar name={reply.authorName} photo={reply.authorPhoto} size="sm" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-blue-50 rounded-xl px-3 py-2">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-blue-950 text-xs">{reply.authorName}</span>
              <AuthorBadge isProvider={reply.authorModel === "ServiceProvider"} isOwn={isOwn} />
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-gray-400 text-xs">{timeAgo(reply.createdAt)}</span>
              {canDelete && (
                <button
                  onClick={() => onDeleteReply(commentId, reply._id)}
                  className="text-red-400 hover:text-red-600 hover:bg-red-50 p-0.5 rounded transition"
                  title="Delete reply"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">{reply.text}</p>
        </div>
        {/* React button for reply */}
        {currentUserId && (
          <button
            onClick={() => onReactReply(commentId, reply._id)}
            className={`mt-1 ml-2 flex items-center gap-1 text-xs rounded-full px-2 py-0.5 transition border ${
              hasReacted
                ? "bg-blue-100 text-blue-600 border-blue-200 font-semibold"
                : "bg-white text-gray-400 border-gray-200 hover:border-blue-300 hover:text-blue-500"
            }`}
          >
            <ThumbsUp size={11} className={hasReacted ? "fill-blue-500 text-blue-500" : ""} />
            {reactionCount > 0 && <span>{reactionCount}</span>}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Comment Card ────────────────────────────────────────────────────────────
function CommentCard({ comment, currentUserId, providerId, onDelete, onReply, onDeleteReply, onReact, onReactReply }) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReplies, setShowReplies] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const replyRef = useRef(null);

  const isOwn = comment.author?.toString() === currentUserId;
  const isPageOwner = providerId === currentUserId;
  const canDelete = isOwn || isPageOwner;
  const hasReacted = currentUserId && (comment.reactions || []).includes(currentUserId);
  const reactionCount = (comment.reactions || []).length;
  const replyCount = comment.replies?.length || 0;

  const handleReplySubmit = async () => {
    if (!replyText.trim() || submitting) return;
    setSubmitting(true);
    await onReply(comment._id, replyText.trim());
    setReplyText("");
    setShowReplyBox(false);
    setShowReplies(true);
    setSubmitting(false);
  };

  return (
    <div>
      <div className="flex gap-3">
        <Avatar name={comment.authorName} photo={comment.authorPhoto} size="md" />
        <div className="flex-1 min-w-0">
          {/* Bubble */}
          <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-blue-950 text-sm">{comment.authorName}</span>
                <AuthorBadge isProvider={comment.authorModel === "ServiceProvider"} isOwn={isOwn} />
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-gray-400 text-xs whitespace-nowrap">{timeAgo(comment.createdAt)}</span>
                {canDelete && (
                  <button
                    onClick={() => onDelete(comment._id)}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 p-0.5 rounded transition"
                    title="Delete comment"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">{comment.text}</p>
          </div>

          {/* Actions row */}
          <div className="flex items-center gap-3 mt-1.5 ml-1 flex-wrap">
            {/* React button */}
            {currentUserId && (
              <button
                onClick={() => onReact(comment._id)}
                className={`flex items-center gap-1 text-xs rounded-full px-2.5 py-1 transition border ${
                  hasReacted
                    ? "bg-blue-100 text-blue-600 border-blue-200 font-semibold"
                    : "bg-white text-gray-400 border-gray-200 hover:border-blue-300 hover:text-blue-500"
                }`}
              >
                <ThumbsUp size={12} className={hasReacted ? "fill-blue-500 text-blue-500" : ""} />
                {reactionCount > 0 ? <span>{reactionCount}</span> : <span>Like</span>}
              </button>
            )}

            {/* Reply button */}
            {currentUserId && (
              <button
                onClick={() => {
                  setShowReplyBox((v) => !v);
                  if (!showReplyBox) setTimeout(() => replyRef.current?.focus(), 50);
                }}
                className="text-xs font-semibold text-blue-400 hover:text-orange-500 transition-colors flex items-center gap-1"
              >
                <CornerDownRight size={12} />
                Reply
              </button>
            )}

            {/* Show/hide replies */}
            {replyCount > 0 && (
              <button
                onClick={() => setShowReplies((v) => !v)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
              >
                {showReplies ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {replyCount} {replyCount === 1 ? "reply" : "replies"}
              </button>
            )}
          </div>

          {/* Reply input */}
          {showReplyBox && (
            <div className="mt-2 ml-1 flex gap-2 items-center">
              <input
                ref={replyRef}
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleReplySubmit()}
                placeholder="Write a reply…"
                maxLength={500}
                className="flex-1 text-sm bg-blue-50 border border-blue-100 focus:border-blue-400 focus:ring-1 focus:ring-blue-200 rounded-full px-4 py-2 outline-none transition"
              />
              <button
                onClick={handleReplySubmit}
                disabled={!replyText.trim() || submitting}
                className="w-8 h-8 flex items-center justify-center bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 text-white rounded-full transition flex-shrink-0"
              >
                {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              </button>
              <button
                onClick={() => { setShowReplyBox(false); setReplyText(""); }}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition flex-shrink-0"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {/* Replies list */}
          {showReplies && replyCount > 0 && (
            <div className="mt-3 space-y-2 border-l-2 border-blue-100 pl-2 ml-1">
              {comment.replies.map((reply) => (
                <ReplyItem
                  key={reply._id}
                  reply={reply}
                  currentUserId={currentUserId}
                  providerId={providerId}
                  commentId={comment._id}
                  onDeleteReply={onDeleteReply}
                  onReactReply={onReactReply}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Export ─────────────────────────────────────────────────────────────
export default function CommentSection({ providerId }) {
  const { data: session, status } = useSession();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/user-role")
        .then((r) => r.json())
        .then((d) => { if (d.userId) setCurrentUserId(d.userId); })
        .catch(() => {});
    }
  }, [status]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comments?providerId=${providerId}`);
      const data = await res.json();
      if (data.success) setComments(data.comments);
    } catch {
      setError("Failed to load comments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (providerId) fetchComments(); }, [providerId]);

  const handleSubmit = async () => {
    if (!newText.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId, text: newText.trim() }),
      });
      const data = await res.json();
      if (data.success) { setComments((prev) => [data.comment, ...prev]); setNewText(""); }
      else setError(data.error || "Failed to post comment.");
    } catch { setError("Something went wrong."); }
    finally { setSubmitting(false); }
  };

  const handleReply = async (commentId, text) => {
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ providerId, text, commentId }),
    });
    const data = await res.json();
    if (data.success) setComments((prev) => prev.map((c) => c._id === commentId ? data.comment : c));
  };

  const handleDelete = async (commentId) => {
    if (!confirm("Delete this comment?")) return;
    const res = await fetch("/api/comments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId }),
    });
    const data = await res.json();
    if (data.success) setComments((prev) => prev.filter((c) => c._id !== commentId));
  };

  const handleDeleteReply = async (commentId, replyId) => {
    if (!confirm("Delete this reply?")) return;
    const res = await fetch("/api/comments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId, replyId }),
    });
    const data = await res.json();
    if (data.success) {
      setComments((prev) =>
        prev.map((c) => c._id === commentId ? { ...c, replies: c.replies.filter((r) => r._id !== replyId) } : c)
      );
    }
  };

  // Toggle react on comment
  const handleReact = async (commentId) => {
    if (!currentUserId) return;
    const res = await fetch("/api/comments/react", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId }),
    });
    const data = await res.json();
    if (data.success) {
      setComments((prev) =>
        prev.map((c) => c._id === commentId ? { ...c, reactions: data.reactions } : c)
      );
    }
  };

  // Toggle react on reply
  const handleReactReply = async (commentId, replyId) => {
    if (!currentUserId) return;
    const res = await fetch("/api/comments/react", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId, replyId }),
    });
    const data = await res.json();
    if (data.success) {
      setComments((prev) =>
        prev.map((c) =>
          c._id === commentId
            ? { ...c, replies: c.replies.map((r) => r._id === replyId ? { ...r, reactions: data.reactions } : r) }
            : c
        )
      );
    }
  };

  const isLoggedIn = status === "authenticated";

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle size={16} className="text-blue-400" />
        <h4 className="font-bold text-blue-950 text-sm">
          Comments{" "}
          {comments.length > 0 && <span className="text-gray-400 font-normal">({comments.length})</span>}
        </h4>
      </div>

      {isLoggedIn ? (
        <div className="flex gap-2 items-center mb-5">
          <Avatar name={session.user?.name || "You"} photo={session.user?.image} size="sm" />
          <div className="flex-1 flex gap-2 items-center">
            <input
              ref={inputRef}
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmit()}
              placeholder="Write a comment…"
              maxLength={1000}
              className="flex-1 text-sm bg-gray-50 border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-full px-4 py-2.5 outline-none transition"
            />
            <button
              onClick={handleSubmit}
              disabled={!newText.trim() || submitting}
              className="w-9 h-9 flex items-center justify-center bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:cursor-not-allowed text-white rounded-full transition shadow-sm flex-shrink-0"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-4 px-4 py-3 bg-blue-50 rounded-xl text-sm text-blue-700 border border-blue-100">
          Please{" "}
          <button onClick={() => signIn("google")} className="font-bold underline hover:text-orange-600 transition">
            sign in
          </button>{" "}
          to leave a comment.
        </div>
      )}

      {error && <p className="text-red-500 text-xs mb-3 px-1">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 size={20} className="animate-spin text-blue-300" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle size={28} className="text-gray-200 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">No comments yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentCard
              key={comment._id}
              comment={comment}
              currentUserId={currentUserId}
              providerId={providerId}
              onDelete={handleDelete}
              onReply={handleReply}
              onDeleteReply={handleDeleteReply}
              onReact={handleReact}
              onReactReply={handleReactReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}