'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Trash2, MoreVertical } from 'lucide-react';

function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = Math.floor(seconds / 86400);
  if (interval >= 1) return `${interval}d ago`;
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return `${interval}h ago`;
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return `${interval}m ago`;
  return 'Just now';
}

const AVATAR_COLORS = [
  'bg-orange-500',
  'bg-rose-500',
  'bg-amber-700',
  'bg-slate-500',
  'bg-teal-600',
  'bg-indigo-500',
];

function avatarColor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function PartnerMessagesPage() {
  const router = useRouter();
  const [rawMessages, setRawMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeContactId, setActiveContactId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [menuOpenFor, setMenuOpenFor] = useState(null);

  const threadEndRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/partner/messages');
      const json = await res.json();
      if (json.success) {
        setRawMessages(json.messages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeContactId, rawMessages]);

  const conversations = Object.values(
    rawMessages.reduce((acc, m) => {
      if (!acc[m.contactId]) {
        acc[m.contactId] = {
          contactId: m.contactId,
          contactName: m.contactName,
          contactPhoto: m.contactPhoto,
          messages: [],
        };
      }
      acc[m.contactId].messages.push(m);
      return acc;
    }, {})
  )
    .map(c => ({ ...c, messages: c.messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) }))
    .sort((a, b) => {
      const aLast = a.messages[a.messages.length - 1];
      const bLast = b.messages[b.messages.length - 1];
      return new Date(bLast.createdAt) - new Date(aLast.createdAt);
    });

  const activeConv = conversations.find(c => c.contactId === activeContactId);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeContactId) return;
    setIsSending(true);

    try {
      const res = await fetch('/api/partner/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: activeContactId, text: replyText.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        setRawMessages(prev => [...prev, data.message]);
        setReplyText('');
      } else {
        alert(data.error || 'Reply failed to send.');
      }
    } catch (err) {
      console.error(err);
      alert('Reply failed to send.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Me message eka delete karanna oona ma confirm da?')) return;
    try {
      const res = await fetch(`/api/partner/messages/${messageId}`, { method: 'DELETE' });
      if (res.ok) {
        setRawMessages(prev => prev.filter(m => m._id !== messageId));
      } else {
        const data = await res.json();
        alert(data.error || 'Delete failed.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteConversation = async (contactId) => {
    if (!confirm('Me sampurna conversation eka delete karanna oona ma confirm da? Meka undo karanna behe.')) return;
    try {
      const res = await fetch(`/api/partner/messages/conversation/${contactId}`, { method: 'DELETE' });
      if (res.ok) {
        setRawMessages(prev => prev.filter(m => m.contactId !== contactId));
        if (activeContactId === contactId) setActiveContactId(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Delete failed.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMenuOpenFor(null);
    }
  };

  return (
    <div className="h-screen w-full bg-white flex flex-col overflow-hidden font-sans">
      
      {/* Top Labels (Hidden on mobile) */}
      <div className="hidden md:flex w-full bg-white py-3 border-b border-gray-200 shrink-0 shadow-sm z-10">
        <div className="w-1/2 text-center text-slate-700 text-lg font-bold">Conversation List</div>
        <div className="w-1/2 text-center text-slate-700 text-lg font-bold border-l border-gray-200">Chat Thread</div>
      </div>

      <div className="flex-1 flex overflow-hidden w-full">
        {/* ===================== LEFT PANE: Conversation list ===================== */}
        <div
          className={`
            w-full md:w-1/2 shrink-0 md:border-r border-gray-300 flex flex-col bg-white
            ${activeConv ? 'hidden md:flex' : 'flex'}
          `}
        >
          <header className="bg-orange-500 text-white px-5 py-4 flex items-center justify-between shrink-0 md:border-r border-orange-600/30">
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/partner/dashboard')}
                className="p-1.5 hover:bg-white/20 rounded-full md:hidden transition"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="font-semibold text-xl tracking-wide">Messages</h1>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {loading ? (
              <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="p-10 text-center text-gray-400 text-sm">No messages yet.</div>
            ) : (
              conversations.map((conv) => {
                const last = conv.messages[conv.messages.length - 1];
                const isActive = conv.contactId === activeContactId;
                return (
                  <div
                    key={conv.contactId}
                    className={`p-4 flex items-start gap-4 relative cursor-pointer transition ${
                      isActive ? 'bg-orange-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div
                      onClick={() => setActiveContactId(conv.contactId)}
                      className="flex items-center gap-4 flex-1 min-w-0"
                    >
                      <div className={`w-12 h-12 rounded-full overflow-hidden shrink-0 flex items-center justify-center shadow-sm ${avatarColor(conv.contactName)}`}>
                        {conv.contactPhoto ? (
                          <img src={conv.contactPhoto} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white font-medium text-lg">
                            {conv.contactName?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 mt-0.5">
                        <p className="text-[15px] font-bold text-slate-900 truncate">{conv.contactName}</p>
                        <p className="text-sm text-slate-500 truncate mt-1">
                          {last.sender === 'provider' ? 'You: ' : ''}{last.text}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-xs text-slate-400 font-medium">{timeAgo(last.createdAt)}</span>
                      <div className="relative">
                        <button
                          onClick={() => setMenuOpenFor(menuOpenFor === conv.contactId ? null : conv.contactId)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
                        >
                          <MoreVertical size={18} />
                        </button>
                        {menuOpenFor === conv.contactId && (
                          <div className="absolute right-0 top-8 bg-white border border-gray-200 shadow-lg rounded-md z-20 w-48 py-1">
                            <button
                              onClick={() => handleDeleteConversation(conv.contactId)}
                              className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2 transition"
                            >
                              <Trash2 size={15} /> Delete conversation
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ===================== RIGHT PANE: Chat thread ===================== */}
        <div className={`w-full md:w-1/2 flex-col bg-[#F8FAFC] ${activeConv ? 'flex' : 'hidden md:flex'}`}>
          {!activeConv ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              Conversation ekak select karanna
            </div>
          ) : (
            <>
              {/* FIXED HEADER LAYOUT (No more overlap) */}
              <header className="bg-orange-500 text-white px-4 py-4 flex items-center justify-between shrink-0">
                {/* Left: Back Button */}
                <div className="flex-1 flex justify-start">
                  <button
                    onClick={() => setActiveContactId(null)}
                    className="flex items-center gap-1.5 px-2 py-1 hover:bg-white/20 rounded-md transition"
                  >
                    <ArrowLeft size={20} />
                    <span className="text-sm font-medium hidden sm:block">Back</span>
                  </button>
                </div>

                {/* Center: Contact Info */}
                <div className="flex-[2] flex items-center justify-center gap-3">
                  <div className={`w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center shadow-sm ${avatarColor(activeConv.contactName)}`}>
                    {activeConv.contactPhoto ? (
                      <img src={activeConv.contactPhoto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-medium text-sm">
                        {activeConv.contactName?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  <h1 className="font-bold text-[15px] truncate max-w-[150px] sm:max-w-[200px]">
                    {activeConv.contactName}
                  </h1>
                </div>

                {/* Right: Delete Button */}
                <div className="flex-1 flex justify-end">
                  <button
                    onClick={() => handleDeleteConversation(activeConv.contactId)}
                    className="flex items-center gap-2 px-2 py-1 hover:bg-white/20 rounded-md transition text-sm font-medium"
                    title="Delete conversation"
                  >
                    <span className="hidden sm:inline">Delete</span>
                    <Trash2 size={18} />
                  </button>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {activeConv.messages.map((msg) => (
                  <div key={msg._id} className={`flex w-full ${msg.sender === 'provider' ? 'justify-end' : 'justify-start'}`}>
                    
                    {msg.sender === 'contact' ? (
                      // Contact Message Style
                      <div className="flex flex-col max-w-[90%] sm:max-w-[75%]">
                        <div className="bg-white rounded-xl p-4 shadow-sm flex items-start gap-4 border border-gray-200 min-w-[200px] sm:min-w-[250px]">
                          <div className={`w-10 h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center ${avatarColor(msg.contactName)}`}>
                            {msg.contactPhoto ? (
                              <img src={msg.contactPhoto} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white font-medium text-sm">
                                {msg.contactName?.charAt(0)?.toUpperCase() || '?'}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-3">
                              <p className="font-bold text-slate-900 text-[15px]">{msg.contactName}</p>
                              <button
                                onClick={() => handleDeleteMessage(msg._id)}
                                className="text-slate-300 hover:text-red-500 transition p-0.5 shrink-0"
                                title="Delete message"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                            <p className="text-slate-700 text-[15px] mt-1.5 whitespace-pre-wrap">{msg.text}</p>
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 mt-2 ml-1">{timeAgo(msg.createdAt)}</span>
                      </div>
                    ) : (
                      // Provider (Your) Message Style - FIXED: Black Text & Light Orange Background
                      <div className="flex flex-col items-end max-w-[90%] sm:max-w-[75%] relative group">
                        <div className="bg-orange-100 border border-orange-200 rounded-xl p-4 shadow-sm flex flex-col gap-1 min-w-[150px] sm:min-w-[200px]">
                          {/* Akuru Kalu Karala Thiyenne Methana (text-slate-900) */}
                          <p className="text-[15px] text-slate-900 font-medium whitespace-pre-wrap">{msg.text}</p>
                          
                          <span className="text-[11px] text-slate-500 font-medium text-right mt-1">
                            {timeAgo(msg.createdAt)}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteMessage(msg._id)}
                          className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-red-500 p-1"
                          title="Delete message"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}

                  </div>
                ))}
                <div ref={threadEndRef} />
              </div>

              <form
                onSubmit={handleSendReply}
                className="bg-white p-4 flex items-center gap-3 shrink-0 border-t border-gray-200 shadow-sm"
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Reply karanna..."
                  className="flex-1 bg-white border border-gray-300 text-slate-900 placeholder-slate-400 rounded-md px-4 py-3 text-[15px] focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
                />
                <button
                  type="submit"
                  disabled={isSending || !replyText.trim()}
                  className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white px-8 py-3 rounded-md text-[15px] font-bold transition shadow-sm"
                >
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}