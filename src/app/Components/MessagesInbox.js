'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Heart } from 'lucide-react';

const REACTION_EMOJI = {
  like: '👍', haha: '😂', angry: '😡', heart: '❤️', care: '🥰'
};

function timeAgo(date, language) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = Math.floor(seconds / 86400);
  if (interval >= 1) return language === 'si' ? `දින ${interval} කට පෙර` : `${interval}d ago`;
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return language === 'si' ? `පැය ${interval} කට පෙර` : `${interval}h ago`;
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return language === 'si' ? `මිනිත්තු ${interval} කට පෙර` : `${interval}m ago`;
  return language === 'si' ? 'දැන් ලැබුණා' : 'Just now';
}

export default function MessagesInbox({ notifications = [], onMarkAsRead, onMarkAllRead, language = 'en' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeThread, setActiveThread] = useState(null); // a single notification opened as a "chat"
  const panelRef = useRef(null);

  const messages = notifications.filter(
    n => n.type === 'status_reply' || n.type === 'status_reaction'
  );
  const unreadCount = messages.filter(m => !m.isRead).length;

  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
        setActiveThread(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openThread = (msg) => {
    setActiveThread(msg);
    if (!msg.isRead) onMarkAsRead?.(msg);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl hover:bg-gray-100 transition relative"
      >
        <MessageCircle size={18} className="text-gray-500" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 bg-blue-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">

          {/* List view */}
          {!activeThread && (
            <>
              <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-blue-500">
                <h4 className="font-extrabold text-xs text-white">
                  {language === 'si' ? 'පණිවිඩ' : 'Messages'}
                </h4>
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllRead}
                    className="text-[10px] text-white/90 hover:underline font-bold"
                  >
                    {language === 'si' ? 'සියල්ල කියවූ බව ලකුණු කරන්න' : 'Mark all as read'}
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {messages.length > 0 ? (
                  messages.map((msg) => (
                    <div
                      key={msg._id}
                      onClick={() => openThread(msg)}
                      className={`p-3 flex items-start gap-3 cursor-pointer transition-colors ${
                        msg.isRead ? 'bg-white hover:bg-slate-50' : 'bg-[#eaf4ff] hover:bg-[#dcecff]'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-blue-100 flex items-center justify-center border border-gray-100">
                        {msg.senderPhoto ? (
                          <img src={msg.senderPhoto} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-blue-500 font-bold text-sm">
                            {msg.senderName?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-slate-800 truncate">{msg.senderName}</p>
                        <p className="text-[10px] text-slate-600 line-clamp-2 mt-0.5">
                          {msg.type === 'status_reaction' ? msg.message : `"${msg.message}"`}
                        </p>
                        <span className="text-[8px] text-slate-400 font-semibold mt-1 inline-block">
                          {timeAgo(msg.createdAt, language)}
                        </span>
                      </div>
                      {!msg.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-400 text-xs font-semibold">
                    {language === 'si' ? 'තවම පණිවිඩ නැත' : 'No messages yet'}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Single-message "chat" view */}
          {activeThread && (
            <>
              <div className="p-3 border-b border-gray-100 flex items-center gap-2 bg-blue-500">
                <button onClick={() => setActiveThread(null)} className="text-white font-bold text-sm">
                  ←
                </button>
                <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-white/20 flex items-center justify-center">
                  {activeThread.senderPhoto ? (
                    <img src={activeThread.senderPhoto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-xs">
                      {activeThread.senderName?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold text-white truncate">{activeThread.senderName}</span>
              </div>

              <div className="p-4 bg-slate-50 min-h-[140px] flex flex-col justify-end">
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-blue-100 flex items-center justify-center">
                    {activeThread.senderPhoto ? (
                      <img src={activeThread.senderPhoto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-blue-500 font-bold text-xs">
                        {activeThread.senderName?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm max-w-[75%]">
                    {activeThread.type === 'status_reaction' ? (
                      <p className="text-sm flex items-center gap-1">
                        <Heart size={12} className="text-red-400" />
                        <span className="text-slate-700 text-xs font-semibold">{activeThread.message}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-slate-700">{activeThread.message}</p>
                    )}
                  </div>
                </div>
                <span className="text-[9px] text-slate-400 font-semibold mt-2 ml-9">
                  {timeAgo(activeThread.createdAt, language)}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}