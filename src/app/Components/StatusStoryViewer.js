'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { X } from 'lucide-react';

const EMOJI_MAP = {
  like: '👍',
  haha: '😂',
  angry: '😡',
  heart: '❤️',
  care: '🥰'
};

function getInitials(name) {
  if (!name) return '?';
  return name.trim().charAt(0).toUpperCase();
}

// group = { provider: {...}, statuses: [...] } for ONE provider
export default function StatusStoryViewer({ group, onClose }) {
  const { data: session } = useSession();
  const [statuses, setStatuses] = useState(group.statuses);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isPaused, setIsPaused] = useState(false); // ✅ NEW — true while user is holding down (touch or mouse)

  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const isPausedRef = useRef(false); // ✅ NEW — read latest isPaused inside setInterval without restarting it

  const activeStatus = statuses[activeIndex];

  // ✅ NEW — keep the ref in sync so the interval always sees the latest value
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // ✅ NEW — pause/resume the actual <video> element too, so it matches the progress bar
  useEffect(() => {
    if (activeStatus?.mediaType === 'video' && videoRef.current) {
      if (isPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isPaused, activeStatus]);

  const isOwnStatus =
    session?.user?.email && group.provider.email === session.user.email;

  const markAsViewed = async (statusId) => {
    try {
      const res = await fetch(`/api/statuses/${statusId}/view`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setStatuses(prev => {
          const updated = [...prev];
          const idx = updated.findIndex(s => s._id === statusId);
          if (idx !== -1) updated[idx] = { ...updated[idx], viewers: data.viewers };
          return updated;
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!activeStatus) {
      onClose();
      return;
    }

    markAsViewed(activeStatus._id);

    clearInterval(timerRef.current);
    setProgress(0);
    setIsPaused(false); // ✅ NEW — don't carry a held-down pause over to the next status

    let duration = 5000;
    if (activeStatus.mediaType === 'video' && videoRef.current) {
      duration = videoRef.current.duration ? videoRef.current.duration * 1000 : 15000;
    }

    const step = 100;
    let elapsed = 0;
    timerRef.current = setInterval(() => {
      if (isPausedRef.current) return; // ✅ NEW — held down, don't advance
      elapsed += step;
      setProgress(Math.min((elapsed / duration) * 100, 100));
      if (elapsed >= duration) {
        clearInterval(timerRef.current);
        handleNext();
      }
    }, step);

    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  const handleNext = () => {
    if (activeIndex < statuses.length - 1) {
      setActiveIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) setActiveIndex(prev => prev - 1);
  };

  const handleReact = async (reactionType) => {
    try {
      const res = await fetch(`/api/statuses/${activeStatus._id}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: reactionType }),
      });
      if (res.ok) {
        const data = await res.json();
        setStatuses(prev => {
          const updated = [...prev];
          updated[activeIndex] = { ...updated[activeIndex], reactions: data.reactions };
          return updated;
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setIsReplying(true);
    try {
      const res = await fetch(`/api/statuses/${activeStatus._id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: replyText }),
      });
      if (res.ok) {
        alert('Reply eka sent!');
        setReplyText('');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to reply.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsReplying(false);
    }
  };

  if (!activeStatus) return null;

  return (
    <div className="fixed inset-0 bg-black/95 z-[70] flex flex-col justify-between items-center text-white select-none">
      <div className="w-full max-w-md px-4 pt-4 z-10 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex space-x-1 mb-3">
          {statuses.map((s, idx) => (
            <div key={s._id} className="h-[3px] flex-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 transition-all duration-100 ease-linear"
                style={{ width: idx === activeIndex ? `${progress}%` : idx < activeIndex ? '100%' : '0%' }}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {group.provider.photo ? (
              <img src={group.provider.photo} alt="" className="w-10 h-10 rounded-full object-cover border border-white" />
            ) : (
              <div className="w-10 h-10 rounded-full border border-white bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                {getInitials(group.provider.businessName || group.provider.name)}
              </div>
            )}
            <div>
              <h4 className="font-bold text-sm">{group.provider.businessName || group.provider.name}</h4>
              <p className="text-[10px] text-gray-300">
                {new Date(activeStatus.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:text-red-400 bg-black/40 rounded-full w-8 h-8 flex items-center justify-center">
            <X size={18} />
          </button>
        </div>
      </div>

      <div
        className="flex-1 w-full max-w-md relative flex items-center justify-center"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        onTouchCancel={() => setIsPaused(false)}
      >
        <div className="absolute left-0 top-0 bottom-0 w-1/3 z-20 cursor-w-resize" onClick={handlePrev} />
        <div className="absolute right-0 top-0 bottom-0 w-1/3 z-20 cursor-e-resize" onClick={handleNext} />

        {activeStatus.mediaType === 'image' ? (
          <img src={activeStatus.mediaUrl} alt="Status" className="w-full max-h-[75vh] object-contain" />
        ) : (
          <video ref={videoRef} src={activeStatus.mediaUrl} className="w-full max-h-[75vh] object-contain" autoPlay playsInline />
        )}

        {/* ✅ NEW — subtle pause indicator while held down */}
        {isPaused && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/40 rounded-full p-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            </div>
          </div>
        )}
      </div>

      <div className="w-full max-w-md px-4 pb-6 bg-gradient-to-t from-black/80 to-transparent z-10 flex flex-col items-center">
        {isOwnStatus && (
          <div className="w-full flex items-center justify-start text-xs text-gray-300 mb-2 space-x-1">
            <span>👁️</span>
            <span>{activeStatus.viewers?.length || 0} views</span>
          </div>
        )}

        <div className="flex space-x-4 mb-4 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md">
          {Object.entries(EMOJI_MAP).map(([type, emoji]) => (
            <button key={type} onClick={() => handleReact(type)} className="text-2xl transform transition hover:scale-125 duration-100">
              {emoji}
            </button>
          ))}
        </div>

        {activeStatus.reactions?.length > 0 && (
          <div className="text-xs text-gray-300 mb-2 flex items-center space-x-1">
            <span>Reactions:</span>
            {activeStatus.reactions.map((r, i) => <span key={i}>{EMOJI_MAP[r.type]}</span>)}
          </div>
        )}

        {!isOwnStatus && (
          <form onSubmit={handleReply} className="flex items-center space-x-2 w-full">
            <input
              type="text"
              placeholder="Inbox ekata reply ekak danna..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex-1 bg-white/20 border border-white/30 text-white rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-white/60"
            />
            <button
              type="submit"
              disabled={isReplying}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-4 py-2 rounded-full text-sm font-bold"
            >
              Send
            </button>
          </form>
        )}
      </div>
    </div>
  );
}