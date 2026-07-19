'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

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

export default function StatusTray({ isProvider: isProviderProp } = {}) {
  const { data: session } = useSession();
  const [providerGroups, setProviderGroups] = useState([]);
  const [activeGroupIndex, setActiveGroupIndex] = useState(null);
  const [activeStatusIndex, setActiveStatusIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [progress, setProgress] = useState(0);

  // Preview-before-post state
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewType, setPreviewType] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  // If the parent page already knows this is a partner (e.g. the partner
  // dashboard, which is only reachable by logged-in partners), it can pass
  // isProvider={true} directly. Otherwise we fall back to session.role,
  // which is unreliable for Google-login partners (defaults to "customer").
  const isProvider =
    isProviderProp !== undefined
      ? isProviderProp
      : session?.user?.role === 'provider' || session?.user?.role === 'partner';

  const fetchStatuses = async () => {
    try {
      const res = await fetch('/api/statuses');
      if (res.ok) {
        const data = await res.json();

        // On the partner dashboard (isProviderProp === true), only show the
        // logged-in provider's OWN status — not everyone else's. Matching by
        // email since session.user.id is unreliable for Google-login partners.
        if (isProviderProp && session?.user?.email) {
          setProviderGroups(data.filter(g => g.provider?.email === session.user.email));
        } else if (isProviderProp) {
          // Session not loaded yet — show nothing until we know who "own" means
          setProviderGroups([]);
        } else {
          setProviderGroups(data);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, [session, isProviderProp]);

  // Multi-story progress bars animation & timing controllers
  useEffect(() => {
    if (activeGroupIndex === null) return;

    const currentGroup = providerGroups[activeGroupIndex];
    const currentStatus = currentGroup.statuses[activeStatusIndex];

    // Track this view (server ignores it if it's the owner viewing their own status)
    markAsViewed(currentStatus._id);

    clearInterval(timerRef.current);
    setProgress(0);

    let duration = 5000; // 5 seconds for Images
    if (currentStatus.mediaType === 'video' && videoRef.current) {
      duration = videoRef.current.duration ? videoRef.current.duration * 1000 : 15000;
    }

    const intervalStep = 100;
    let elapsed = 0;

    timerRef.current = setInterval(() => {
      elapsed += intervalStep;
      setProgress(Math.min((elapsed / duration) * 100, 100));

      if (elapsed >= duration) {
        clearInterval(timerRef.current);
        handleNext();
      }
    }, intervalStep);

    return () => clearInterval(timerRef.current);
  }, [activeGroupIndex, activeStatusIndex]);

  const markAsViewed = async (statusId) => {
    try {
      const res = await fetch(`/api/statuses/${statusId}/view`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setProviderGroups(prev => {
          const updated = [...prev];
          const group = updated[activeGroupIndex];
          if (group) {
            const sIdx = group.statuses.findIndex(s => s._id === statusId);
            if (sIdx !== -1) {
              group.statuses[sIdx].viewers = data.viewers;
            }
          }
          return updated;
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNext = () => {
    const currentGroup = providerGroups[activeGroupIndex];
    if (activeStatusIndex < currentGroup.statuses.length - 1) {
      setActiveStatusIndex(prev => prev + 1);
    } else if (activeGroupIndex < providerGroups.length - 1) {
      setActiveGroupIndex(prev => prev + 1);
      setActiveStatusIndex(0);
    } else {
      closeStory();
    }
  };

  const handlePrev = () => {
    if (activeStatusIndex > 0) {
      setActiveStatusIndex(prev => prev - 1);
    } else if (activeGroupIndex > 0) {
      setActiveGroupIndex(prev => prev - 1);
      setActiveStatusIndex(providerGroups[activeGroupIndex - 1].statuses.length - 1);
    }
  };

  const closeStory = () => {
    setActiveGroupIndex(null);
    setActiveStatusIndex(0);
    clearInterval(timerRef.current);
  };

  // STEP 1: user picks a file -> just show a preview, don't upload yet
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.type.startsWith('video/') ? 'video' : 'image';

    if (fileType === 'video') {
      const videoElem = document.createElement('video');
      videoElem.preload = 'metadata';
      videoElem.src = URL.createObjectURL(file);
      videoElem.onloadedmetadata = () => {
        if (videoElem.duration > 60) {
          alert('Video eka uparima 1 min (60 seconds) wenna ona, Machan!');
          URL.revokeObjectURL(videoElem.src);
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }
        openPreview(file, videoElem.src, 'video');
      };
    } else {
      const localUrl = URL.createObjectURL(file);
      openPreview(file, localUrl, 'image');
    }
  };

  const openPreview = (file, url, type) => {
    setPreviewFile(file);
    setPreviewUrl(url);
    setPreviewType(type);
    setShowPreviewModal(true);
  };

  const cancelPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewFile(null);
    setPreviewUrl(null);
    setPreviewType(null);
    setShowPreviewModal(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // STEP 2: user confirms in the modal -> actually upload + save
  const confirmAndPost = async () => {
    if (!previewFile || !previewType) return;
    await uploadToCloudinaryAndSave(previewFile, previewType);
    cancelPreview();
  };

  const uploadToCloudinaryAndSave = async (file, fileType) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      // The file is sent to our own API route, which uploads it to
      // Cloudinary server-side (using the CLOUDINARY_* env vars) and saves it.
      const saveRes = await fetch('/api/statuses', {
        method: 'POST',
        body: formData,
      });

      const responseData = await saveRes.json();
      if (!saveRes.ok) {
        alert(responseData.error || 'Upload error occurred.');
      } else {
        alert('Status eka posted! 🔥');
        fetchStatuses();
      }
    } catch (err) {
      alert('Media uploading failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReact = async (statusId, reactionType) => {
    try {
      const res = await fetch(`/api/statuses/${statusId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: reactionType }),
      });
      if (res.ok) {
        const data = await res.json();
        const updatedGroups = [...providerGroups];
        updatedGroups[activeGroupIndex].statuses[activeStatusIndex].reactions = data.reactions;
        setProviderGroups(updatedGroups);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReply = async (e, statusId) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setIsReplying(true);

    try {
      const res = await fetch(`/api/statuses/${statusId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: replyText }),
      });

      if (res.ok) {
        alert('Reply eka sent!');
        setReplyText('');
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to reply.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsReplying(false);
    }
  };

  const handleDeleteStatus = async (statusId) => {
    if (!confirm('Me status eka delete karanna oona ma confirm da?')) return;

    try {
      const res = await fetch(`/api/statuses/${statusId}`, { method: 'DELETE' });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || 'Delete failed.');
        return;
      }

      setProviderGroups(prev => {
        const updated = [...prev];
        const group = updated[activeGroupIndex];
        if (!group) return updated;

        const remainingStatuses = group.statuses.filter(s => s._id !== statusId);

        if (remainingStatuses.length === 0) {
          // No statuses left for this provider — remove the whole group and close the viewer
          updated.splice(activeGroupIndex, 1);
          closeStory();
          return updated;
        }

        group.statuses = remainingStatuses;
        // Keep the index in range after removal
        if (activeStatusIndex >= remainingStatuses.length) {
          setActiveStatusIndex(remainingStatuses.length - 1);
        }
        return updated;
      });
    } catch (err) {
      console.error(err);
      alert('Delete failed. Please try again.');
    }
  };

  const activeGroup = activeGroupIndex !== null ? providerGroups[activeGroupIndex] : null;
  const activeStatus = activeGroup ? activeGroup.statuses[activeStatusIndex] : null;
  const isOwnStatus =
    activeGroup &&
    session?.user?.email &&
    activeGroup.provider.email === session.user.email;

  return (
    <div className="w-full bg-white px-4 py-3 shadow-sm border-b border-gray-100 my-2 rounded-lg">
      <div className="flex items-center space-x-4 overflow-x-auto pb-1 scrollbar-none">
        
        {/* Creator's uploading circle */}
        {isProvider && (
          <div className="flex flex-col items-center flex-shrink-0 relative">
            <label className="cursor-pointer relative group">
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*,video/*" 
                className="hidden" 
                onChange={handleFileSelect} 
                disabled={isUploading}
              />
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-green-500 flex items-center justify-center bg-green-50 relative">
                {isUploading ? (
                  <span className="text-xs text-green-600 font-bold animate-pulse">Wait..</span>
                ) : (
                  <span className="text-2xl text-green-600">+</span>
                )}
              </div>
              <span className="absolute bottom-6 right-0 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs border border-white font-bold">+</span>
            </label>
            <span className="text-xs mt-1 text-gray-500 font-medium">My Status</span>
          </div>
        )}

        {/* Dynamic circles list of active statuses */}
        {providerGroups.map((group, groupIdx) => (
          <div 
            key={group.provider._id} 
            className="flex flex-col items-center flex-shrink-0 cursor-pointer"
            onClick={() => {
              setActiveGroupIndex(groupIdx);
              setActiveStatusIndex(0);
            }}
          >
            <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-green-500 to-emerald-400 flex items-center justify-center border border-gray-100">
              {group.provider.photo ? (
                <img 
                  src={group.provider.photo} 
                  alt={group.provider.businessName || group.provider.name || 'Profile'}
                  className="w-full h-full rounded-full object-cover border-2 border-white"
                />
              ) : (
                <div className="w-full h-full rounded-full border-2 border-white bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                  {getInitials(group.provider.businessName || group.provider.name)}
                </div>
              )}
            </div>
            <span className="text-xs mt-1 font-semibold text-gray-700 max-w-[75px] truncate text-center">
              {group.provider.businessName || group.provider.name}
            </span>
          </div>
        ))}
      </div>

      {/* Preview Modal - shown after file select, before posting */}
      {showPreviewModal && previewUrl && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex flex-col items-center justify-center text-white">
          <div className="w-full max-w-md flex items-center justify-between px-4 py-3">
            <span className="font-bold">Preview Status</span>
            <button onClick={cancelPreview} className="text-2xl font-bold">&times;</button>
          </div>

          <div className="flex-1 w-full max-w-md flex items-center justify-center px-4">
            {previewType === 'image' ? (
              <img src={previewUrl} alt="Preview" className="w-full max-h-[65vh] object-contain rounded-lg" />
            ) : (
              <video src={previewUrl} className="w-full max-h-[65vh] object-contain rounded-lg" controls autoPlay />
            )}
          </div>

          <div className="w-full max-w-md flex items-center justify-center space-x-4 px-4 py-6">
            <button 
              onClick={cancelPreview}
              disabled={isUploading}
              className="flex-1 bg-white/10 border border-white/30 text-white py-3 rounded-full font-bold disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              onClick={confirmAndPost}
              disabled={isUploading}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-full font-bold disabled:opacity-50"
            >
              {isUploading ? 'Posting...' : 'Post Status'}
            </button>
          </div>
        </div>
      )}

      {/* Story Viewer Modal */}
      {activeGroup && activeStatus && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col justify-between items-center text-white select-none">
          <div className="w-full max-w-md px-4 pt-4 z-10 bg-gradient-to-b from-black/80 to-transparent">
            
            {/* Top Timed Progress Indicator segments */}
            <div className="flex space-x-1 mb-3">
              {activeGroup.statuses.map((s, idx) => (
                <div key={s._id} className="h-[3px] flex-1 bg-white/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-100 ease-linear"
                    style={{ 
                      width: idx === activeStatusIndex ? `${progress}%` : idx < activeStatusIndex ? '100%' : '0%' 
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Profile info on top */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {activeGroup.provider.photo ? (
                  <img 
                    src={activeGroup.provider.photo} 
                    alt={activeGroup.provider.businessName || activeGroup.provider.name || ''} 
                    className="w-10 h-10 rounded-full object-cover border border-white"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full border border-white bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {getInitials(activeGroup.provider.businessName || activeGroup.provider.name)}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-sm">
                    {activeGroup.provider.businessName || activeGroup.provider.name}
                  </h4>
                  <p className="text-[10px] text-gray-300">
                    {new Date(activeStatus.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <button onClick={closeStory} className="text-white hover:text-red-400 text-2xl font-bold bg-black/40 rounded-full w-8 h-8 flex items-center justify-center">×</button>
            </div>
          </div>

          {/* Media Player Layer */}
          <div className="flex-1 w-full max-w-md relative flex items-center justify-center">
            <div className="absolute left-0 top-0 bottom-0 w-1/3 z-20 cursor-w-resize" onClick={handlePrev} />
            <div className="absolute right-0 top-0 bottom-0 w-1/3 z-20 cursor-e-resize" onClick={handleNext} />

            {activeStatus.mediaType === 'image' ? (
              <img 
                src={activeStatus.mediaUrl} 
                alt="Status" 
                className="w-full max-h-[75vh] object-contain"
              />
            ) : (
              <video 
                ref={videoRef}
                src={activeStatus.mediaUrl} 
                className="w-full max-h-[75vh] object-contain"
                autoPlay 
                playsInline
              />
            )}
          </div>

          {/* Controls: Reactions & Comments */}
          <div className="w-full max-w-md px-4 pb-6 bg-gradient-to-t from-black/80 to-transparent z-10 flex flex-col items-center">

            {/* View count + Delete option - only visible to the status owner */}
            {isOwnStatus && (
              <div className="w-full flex items-center justify-between text-xs text-gray-300 mb-2">
                <div className="flex items-center space-x-1">
                  <span>👁️</span>
                  <span>{activeStatus.viewers?.length || 0} views</span>
                </div>
                <button
                  onClick={() => handleDeleteStatus(activeStatus._id)}
                  className="flex items-center space-x-1 text-red-400 hover:text-red-300 font-bold"
                >
                  <span>🗑️</span>
                  <span>Delete</span>
                </button>
              </div>
            )}
            
            {/* Quick React buttons */}
            <div className="flex space-x-4 mb-4 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md">
              {Object.entries(EMOJI_MAP).map(([type, emoji]) => (
                <button 
                  key={type} 
                  onClick={() => handleReact(activeStatus._id, type)}
                  className="text-2xl transform transition hover:scale-125 duration-100"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Reactions summary view */}
            {activeStatus.reactions?.length > 0 && (
              <div className="text-xs text-gray-300 mb-2 flex items-center space-x-1">
                <span>Reactions:</span>
                {activeStatus.reactions.map((react, i) => (
                  <span key={i}>{EMOJI_MAP[react.type]}</span>
                ))}
              </div>
            )}

            {/* Message Reply Box */}
            <form 
              onSubmit={(e) => handleReply(e, activeStatus._id)}
              className="flex items-center space-x-2 w-full"
            >
              <input 
                type="text" 
                placeholder="Inbox ekata reply ekak danna..." 
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 bg-white/20 border border-white/30 text-white rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-white/60"
              />
              <button 
                type="submit" 
                disabled={isReplying}
                className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-4 py-2 rounded-full text-sm font-bold"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}