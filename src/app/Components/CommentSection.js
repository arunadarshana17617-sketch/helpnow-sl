"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import { MessageCircle, Send, Trash2, CornerDownRight, X, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

// ── Reaction config ──────────────────────────────────────────────────────────
const REACTIONS = [
  { type: 'like',  emoji: '👍', label: 'Like',  color: 'text-blue-500' },
  { type: 'love',  emoji: '❤️', label: 'Love',  color: 'text-red-500' },
  { type: 'haha',  emoji: '😂', label: 'Haha',  color: 'text-yellow-500' },
  { type: 'wow',   emoji: '😮', label: 'Wow',   color: 'text-yellow-500' },
  { type: 'sad',   emoji: '😢', label: 'Sad',   color: 'text-yellow-500' },
  { type: 'angry', emoji: '😡', label: 'Angry', color: 'text-orange-500' },
];

const EMOJI_MAP = Object.fromEntries(REACTIONS.map(r => [r.type, r.emoji]));
const LABEL_MAP = Object.fromEntries(REACTIONS.map(r => [r.type, r.label]));
const COLOR_MAP = Object.fromEntries(REACTIONS.map(r => [r.type, r.color]));

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
  if (photo) return <img src={photo} alt={name} className={`${sz} rounded-full object-cover flex-shrink-0 ring-2 ring-white shadow-sm`} />;
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold flex-shrink-0 ring-2 ring-white shadow-sm`}>
      {getInitials(name)}
    </div>
  );
}

function AuthorBadge({ isProvider, isOwn }) {
  if (isProvider) return (
    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>Service Provider
    </span>
  );
  if (isOwn) return <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">You</span>;
  return null;
}

// ── Reaction summary: top 3 emojis + total count ────────────────────────────
function ReactionSummary({ reactions }) {
  if (!reactions || reactions.length === 0) return null;

  // Count per type
  const counts = {};
  reactions.forEach(r => { counts[r.type] = (counts[r.type] || 0) + 1; });

  // Top 3 types by count
  const top = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type]) => type);

  return (
    <div className="flex items-center gap-1">
      <div className="flex -space-x-1">
        {top.map(type => (
          <span key={type} className="text-sm leading-none drop-shadow-sm">{EMOJI_MAP[type]}</span>
        ))}
      </div>
      <span className="text-xs text-gray-500 ml-1">{reactions.length}</span>
    </div>
  );
}

// ── Reaction breakdown tooltip ───────────────────────────────────────────────
function ReactionBreakdown({ reactions }) {
  if (!reactions || reactions.length === 0) return null;
  const counts = {};
  reactions.forEach(r => { counts[r.type] = (counts[r.type] || 0) + 1; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="absolute bottom-full left-0 mb-2 bg-gray-900 text-white text-xs rounded-xl px-3 py-2 shadow-xl z-50 whitespace-nowrap min-w-max">
      <div className="space-y-1">
        {sorted.map(([type, count]) => (
          <div key={type} className="flex items-center gap-2">
            <span className="text-sm">{EMOJI_MAP[type]}</span>
            <span className="text-gray-300">{LABEL_MAP[type]}</span>
            <span className="font-bold ml-auto pl-3">{count}</span>
          </div>
        ))}
        <div className="border-t border-gray-700 mt-1 pt-1 flex justify-between">
          <span className="text-gray-400">Total</span>
          <span className="font-bold">{reactions.length}</span>
        </div>
      </div>
      {/* Arrow */}
      <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900"></div>
    </div>
  );
}

// ── Reaction Picker + Button ─────────────────────────────────────────────────
function ReactionButton({ reactions = [], currentUserId, onReact, small = false }) {
  const [showPicker, setShowPicker] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const hoverTimer = useRef(null);
  const pickerTimer = useRef(null);

  const myReaction = currentUserId ? reactions.find(r => r.userId === currentUserId)?.type : null;

  const handleMouseEnter = () => {
    clearTimeout(pickerTimer.current);
    hoverTimer.current = setTimeout(() => setShowPicker(true), 400);
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimer.current);
    pickerTimer.current = setTimeout(() => setShowPicker(false), 300);
  };

  const handleClick = () => {
    if (showPicker) { setShowPicker(false); return; }
    // Quick click → toggle like or remove current
    if (myReaction) onReact(null); // remove
    else onReact('like');
  };

  const handlePickerReact = (type) => {
    setShowPicker(false);
    onReact(type);
  };

  const btnBase = small
    ? "text-xs px-2 py-0.5 rounded-full border transition flex items-center gap-1"
    : "text-xs px-3 py-1 rounded-full border transition flex items-center gap-1.5 font-medium";

  const btnStyle = myReaction
    ? `${btnBase} bg-blue-50 border-blue-200 ${COLOR_MAP[myReaction] || 'text-blue-600'}`
    : `${btnBase} bg-white border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-500`;

  return (
    <div className="relative flex items-center gap-2">
      {/* Reaction picker popup */}
      {showPicker && currentUserId && (
        <div
          className="absolute bottom-full left-0 mb-2 z-50 flex items-center gap-1 bg-white border border-gray-100 rounded-full shadow-xl px-2 py-1.5"
          onMouseEnter={() => clearTimeout(pickerTimer.current)}
          onMouseLeave={handleMouseLeave}
        >
          {REACTIONS.map((r, i) => (
            <button
              key={r.type}
              onClick={() => handlePickerReact(r.type)}
              title={r.label}
              className="text-xl hover:scale-125 transition-transform duration-150 leading-none px-0.5"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              {r.emoji}
            </button>
          ))}
        </div>
      )}

      {/* Main react button */}
      <button
        className={btnStyle}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        disabled={!currentUserId}
      >
        {myReaction ? (
          <>
            <span className="text-sm leading-none">{EMOJI_MAP[myReaction]}</span>
            <span>{LABEL_MAP[myReaction]}</span>
          </>
        ) : (
          <>
            <span className="text-sm leading-none">👍</span>
            <span>Like</span>
          </>
        )}
      </button>

      {/* Reaction summary with breakdown on hover */}
      {reactions.length > 0 && (
        <div
          className="relative cursor-default"
          onMouseEnter={() => setShowBreakdown(true)}
          onMouseLeave={() => setShowBreakdown(false)}
        >
          <ReactionSummary reactions={reactions} />
          {showBreakdown && <ReactionBreakdown reactions={reactions} />}
        </div>
      )}
    </div>
  );
}

// ── Reply Item ───────────────────────────────────────────────────────────────
function ReplyItem({ reply, currentUserId, providerId, commentId, onDeleteReply, onReactReply }) {
  const rawReplyAuthor = reply.author?._id ?? reply.author;
  const isOwn = rawReplyAuthor?.toString() === currentUserId?.toString();
  const isPageOwner = providerId?.toString() === currentUserId?.toString();
  const canDelete = isOwn || isPageOwner;

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
                <button onClick={() => onDeleteReply(commentId, reply._id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-0.5 rounded transition" title="Delete reply">
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">{reply.text}</p>
        </div>
        <div className="mt-1.5 ml-1">
          <ReactionButton
            reactions={reply.reactions || []}
            currentUserId={currentUserId}
            onReact={(type) => onReactReply(commentId, reply._id, type)}
            small
          />
        </div>
      </div>
    </div>
  );
}

// ── Comment Card ─────────────────────────────────────────────────────────────
function CommentCard({ comment, currentUserId, providerId, onDelete, onReply, onDeleteReply, onReact, onReactReply }) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReplies, setShowReplies] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const replyRef = useRef(null);

  const rawAuthor = comment.author?._id ?? comment.author;
  const isOwn = rawAuthor?.toString() === currentUserId?.toString();
  const isPageOwner = providerId?.toString() === currentUserId?.toString();
  const canDelete = isOwn || isPageOwner;
  const replyCount = comment.replies?.length || 0;

  const handleReplySubmit = async () => {
    if (!replyText.trim() || submitting) return;
    setSubmitting(true);
    await onReply(comment._id, replyText.trim());
    setReplyText(""); setShowReplyBox(false); setShowReplies(true);
    setSubmitting(false);
  };

  return (
    <div>
      <div className="flex gap-3">
        <Avatar name={comment.authorName} photo={comment.authorPhoto} size="md" />
        <div className="flex-1 min-w-0">
          <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-blue-950 text-sm">{comment.authorName}</span>
                <AuthorBadge isProvider={comment.authorModel === "ServiceProvider"} isOwn={isOwn} />
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-gray-400 text-xs whitespace-nowrap">{timeAgo(comment.createdAt)}</span>
                {canDelete && (
                  <button onClick={() => onDelete(comment._id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-0.5 rounded transition" title="Delete comment">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">{comment.text}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-1.5 ml-1 flex-wrap">
            <ReactionButton
              reactions={comment.reactions || []}
              currentUserId={currentUserId}
              onReact={(type) => onReact(comment._id, type)}
            />
            {currentUserId && (
              <button
                onClick={() => { setShowReplyBox(v => !v); if (!showReplyBox) setTimeout(() => replyRef.current?.focus(), 50); }}
                className="text-xs font-medium text-blue-400 hover:text-orange-500 transition-colors flex items-center gap-1"
              >
                <CornerDownRight size={12} />Reply
              </button>
            )}
            {replyCount > 0 && (
              <button onClick={() => setShowReplies(v => !v)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1">
                {showReplies ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {replyCount} {replyCount === 1 ? "reply" : "replies"}
              </button>
            )}
          </div>

          {/* Reply input */}
          {showReplyBox && (
            <div className="mt-2 ml-1 flex gap-2 items-center">
              <input ref={replyRef} type="text" value={replyText} onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleReplySubmit()}
                placeholder="Write a reply…" maxLength={500}
                className="flex-1 text-sm bg-blue-50 border border-blue-100 focus:border-blue-400 focus:ring-1 focus:ring-blue-200 rounded-full px-4 py-2 outline-none transition"
              />
              <button onClick={handleReplySubmit} disabled={!replyText.trim() || submitting}
                className="w-8 h-8 flex items-center justify-center bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 text-white rounded-full transition flex-shrink-0">
                {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              </button>
              <button onClick={() => { setShowReplyBox(false); setReplyText(""); }}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition flex-shrink-0">
                <X size={13} />
              </button>
            </div>
          )}

          {/* Replies */}
          {showReplies && replyCount > 0 && (
            <div className="mt-3 space-y-2 border-l-2 border-blue-100 pl-2 ml-1">
              {comment.replies.map(reply => (
                <ReplyItem key={reply._id} reply={reply} currentUserId={currentUserId}
                  providerId={providerId} commentId={comment._id}
                  onDeleteReply={onDeleteReply} onReactReply={onReactReply}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Export ──────────────────────────────────────────────────────────────
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
      fetch("/api/user-role").then(r => r.json()).then(d => { if (d.userId) setCurrentUserId(d.userId); }).catch(() => {});
    }
  }, [status]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comments?providerId=${providerId}`);
      const data = await res.json();
      if (data.success) setComments(data.comments);
    } catch { setError("Failed to load comments."); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (providerId) fetchComments(); }, [providerId]);

  const handleSubmit = async () => {
    if (!newText.trim() || submitting) return;
    setSubmitting(true); setError(null);
    try {
      const res = await fetch("/api/comments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ providerId, text: newText.trim() }) });
      const data = await res.json();
      if (data.success) { setComments(prev => [data.comment, ...prev]); setNewText(""); }
      else setError(data.error || "Failed to post comment.");
    } catch { setError("Something went wrong."); }
    finally { setSubmitting(false); }
  };

  const handleReply = async (commentId, text) => {
    const res = await fetch("/api/comments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ providerId, text, commentId }) });
    const data = await res.json();
    if (data.success) setComments(prev => prev.map(c => c._id === commentId ? data.comment : c));
  };

  const handleDelete = async (commentId) => {
    if (!confirm("Delete this comment?")) return;
    const res = await fetch("/api/comments", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ commentId }) });
    const data = await res.json();
    if (data.success) setComments(prev => prev.filter(c => c._id !== commentId));
  };

  const handleDeleteReply = async (commentId, replyId) => {
    if (!confirm("Delete this reply?")) return;
    const res = await fetch("/api/comments", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ commentId, replyId }) });
    const data = await res.json();
    if (data.success) setComments(prev => prev.map(c => c._id === commentId ? { ...c, replies: c.replies.filter(r => r._id !== replyId) } : c));
  };

  const handleReact = async (commentId, type) => {
    if (!currentUserId) return;
    // Find current reaction type BEFORE optimistic update (needed for remove API call)
    const currentReactionType = comments
      .find(c => c._id === commentId)
      ?.reactions?.find(r => r.userId === currentUserId)?.type || null;
    // Optimistic update
    setComments(prev => prev.map(c => {
      if (c._id !== commentId) return c;
      const existing = (c.reactions || []).findIndex(r => r.userId === currentUserId);
      let newReactions = [...(c.reactions || [])];
      if (existing !== -1) {
        if (newReactions[existing].type === type || type === null) newReactions.splice(existing, 1);
        else newReactions[existing] = { ...newReactions[existing], type };
      } else if (type) {
        newReactions.push({ userId: currentUserId, type });
      }
      return { ...c, reactions: newReactions };
    }));
    // API call — always send a valid type
    // type=null means remove, so send currentReactionType to toggle it off
    const apiType = type ?? currentReactionType;
    if (apiType) {
      await fetch("/api/comments/react", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ commentId, type: apiType }) });
    }
  };

  const handleReactReply = async (commentId, replyId, type) => {
    if (!currentUserId) return;
    // Find current reply reaction BEFORE optimistic update
    const currentReactionType = comments
      .find(c => c._id === commentId)
      ?.replies?.find(r => r._id === replyId)
      ?.reactions?.find(x => x.userId === currentUserId)?.type || null;
    setComments(prev => prev.map(c => {
      if (c._id !== commentId) return c;
      return {
        ...c, replies: c.replies.map(r => {
          if (r._id !== replyId) return r;
          const existing = (r.reactions || []).findIndex(x => x.userId === currentUserId);
          let newReactions = [...(r.reactions || [])];
          if (existing !== -1) {
            if (newReactions[existing].type === type || type === null) newReactions.splice(existing, 1);
            else newReactions[existing] = { ...newReactions[existing], type };
          } else if (type) {
            newReactions.push({ userId: currentUserId, type });
          }
          return { ...r, reactions: newReactions };
        })
      };
    }));
    // API call — always send a valid type
    const apiType = type ?? currentReactionType;
    if (apiType) {
      await fetch("/api/comments/react", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ commentId, replyId, type: apiType }) });
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle size={16} className="text-blue-400" />
        <h4 className="font-bold text-blue-950 text-sm">
          Comments {comments.length > 0 && <span className="text-gray-400 font-normal">({comments.length})</span>}
        </h4>
      </div>

      {status === "authenticated" ? (
        <div className="flex gap-2 items-center mb-5">
          <Avatar name={session.user?.name || "You"} photo={session.user?.image} size="sm" />
          <div className="flex-1 flex gap-2 items-center">
            <input ref={inputRef} type="text" value={newText} onChange={e => setNewText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSubmit()}
              placeholder="Write a comment…" maxLength={1000}
              className="flex-1 text-sm bg-gray-50 border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-full px-4 py-2.5 outline-none transition"
            />
            <button onClick={handleSubmit} disabled={!newText.trim() || submitting}
              className="w-9 h-9 flex items-center justify-center bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:cursor-not-allowed text-white rounded-full transition shadow-sm flex-shrink-0">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-4 px-4 py-3 bg-blue-50 rounded-xl text-sm text-blue-700 border border-blue-100">
          Please <button onClick={() => signIn("google")} className="font-bold underline hover:text-orange-600 transition">sign in</button> to leave a comment.
        </div>
      )}

      {error && <p className="text-red-500 text-xs mb-3 px-1">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-blue-300" /></div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle size={28} className="text-gray-200 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">No comments yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map(comment => (
            <CommentCard key={comment._id + (currentUserId||'')} comment={comment} currentUserId={currentUserId}
              providerId={providerId} onDelete={handleDelete} onReply={handleReply}
              onDeleteReply={handleDeleteReply} onReact={handleReact} onReactReply={handleReactReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}