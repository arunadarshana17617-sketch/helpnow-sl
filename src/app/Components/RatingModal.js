'use client';
import { useState } from 'react';
import { Star, X, CheckCircle2, Loader2 } from 'lucide-react';

const RATING_LABELS = ['', 'දුර්වලයි', 'සාමාන්‍යයි', 'හොඳයි', 'ඉතා හොඳයි', 'විශිෂ්ටයි! 🎉'];

export default function RatingModal({ booking, onClose, onRated }) {
  const [hovered, setHovered]   = useState(0);
  const [selected, setSelected] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]         = useState(false);

  if (!booking) return null;

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/bookings/${booking._id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: selected }),
      });
      const data = await res.json();
      if (data.success) {
        setDone(true);
        onRated && onRated(booking._id, selected);
        // 2 seconds පස්සේ auto-close
        setTimeout(() => onClose(), 2000);
      } else {
        alert(data.error || 'Rating දෙන්න බැරි උනා');
        setSubmitting(false);
      }
    } catch {
      alert('Server error');
      setSubmitting(false);
    }
  };

  const initials = booking.providerName
    ? booking.providerName.split(' ').map(n => n[0]).join('').toUpperCase()
    : '?';

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* ── Success View ── */}
        {done ? (
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
            <CheckCircle2 size={56} className="text-green-500 mb-4" />
            <p className="text-xl font-bold text-gray-900 mb-1">ස්තූතියි!</p>
            <p className="text-sm text-gray-500 mb-4">ඔයාගේ rating එකෙන් අනිත් අයට help වෙනවා</p>
            <div className="flex gap-1 mb-2">
              {[1,2,3,4,5].map(i => (
                <Star
                  key={i}
                  size={28}
                  className={i <= selected ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}
                />
              ))}
            </div>
            <p className="text-xs text-gray-400">Closing...</p>
          </div>

        ) : (
          <>
            {/* ── Header ── */}
            <div className="relative bg-gradient-to-br from-orange-50 to-amber-50 px-6 pt-6 pb-5 text-center">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
              >
                <X size={20} />
              </button>

              {/* Provider avatar */}
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl mx-auto mb-3">
                {initials}
              </div>
              <p className="font-bold text-gray-900 text-lg leading-tight">{booking.providerName}</p>
              <p className="text-sm text-gray-500 mt-0.5">{booking.serviceProfession}</p>
              <span className="inline-block mt-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                ✓ Completed
              </span>
            </div>

            {/* ── Body ── */}
            <div className="px-6 py-5 text-center">
              <p className="text-sm text-gray-600 mb-1">Service එකට rating දෙන්නකෝ</p>
              <p className="text-xs text-gray-400 mb-4">ඔයාගේ experience එක share කරන්න</p>

              {/* Stars */}
              <div className="flex justify-center gap-2 mb-2">
                {[1,2,3,4,5].map(i => (
                  <button
                    key={i}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setSelected(i)}
                    className="transition-transform hover:scale-125 active:scale-110"
                    aria-label={`${i} star`}
                  >
                    <Star
                      size={40}
                      className={
                        i <= (hovered || selected)
                          ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm'
                          : 'text-gray-200'
                      }
                    />
                  </button>
                ))}
              </div>

              {/* Rating label */}
              <p className={`text-sm font-semibold h-6 transition-all ${selected || hovered ? 'text-orange-500' : 'text-gray-300'}`}>
                {RATING_LABELS[hovered || selected] || 'Star එකක් click කරන්න'}
              </p>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!selected || submitting}
                className="mt-5 w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition flex items-center justify-center gap-2"
              >
                {submitting
                  ? <><Loader2 size={16} className="animate-spin" /> Saving...</>
                  : 'Rating Submit කරන්න ⭐'
                }
              </button>

              <button
                onClick={onClose}
                className="mt-3 text-xs text-gray-400 hover:text-gray-500 underline transition"
              >
                දැනට skip කරන්න
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}