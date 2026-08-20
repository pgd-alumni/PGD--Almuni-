import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Send, Lock, Unlock, ShieldCheck, Phone, Key, Sparkles, CheckCircle2, AlertCircle, X, Trash2 } from 'lucide-react';
import { EventItem, EventReview } from '../types';

interface ClassReviewSectionProps {
  event: EventItem;
  isAdmin?: boolean;
  variant?: 'light' | 'dark';
}

export const ClassReviewSection: React.FC<ClassReviewSectionProps> = ({ 
  event, 
  isAdmin = false,
  variant = 'light'
}) => {
  const [reviews, setReviews] = useState<EventReview[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userContact, setUserContact] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  // Login Modal State
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'otp' | 'credentials'>('otp');
  const [inputContact, setInputContact] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [passcode, setPasscode] = useState<string>('');
  const [sentOtp, setSentOtp] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Interactive 5-Star Track State
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [commentText, setCommentText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 20-minute post-start time unlock state
  const [devUnlocked, setDevUnlocked] = useState<boolean>(true); // Enabled for easy previewing

  // Check 20-minute post-start time
  const checkTimeUnlocked = (): boolean => {
    if (devUnlocked) return true;
    if (!event.date) return true;
    try {
      const startDateTime = new Date(`${event.date} ${event.time || '10:00 AM'}`).getTime();
      const now = Date.now();
      // 20 minutes = 20 * 60 * 1000 = 1,200,000 ms
      return now >= (startDateTime + 1200000);
    } catch (e) {
      return true;
    }
  };

  const isUnlocked20Min = checkTimeUnlocked();

  // Load reviews for this event
  const loadReviews = () => {
    fetch(`/api/events/${event.id}/reviews`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setReviews(data.data);
        }
      })
      .catch(err => console.error("Error fetching class reviews:", err));
  };

  useEffect(() => {
    loadReviews();
  }, [event.id]);

  // Handle OTP Send
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContact.trim()) {
      setModalError("Please enter your Phone Number or Email");
      return;
    }

    try {
      setModalLoading(true);
      setModalError(null);
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: inputContact.trim() })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSentOtp(data.otp);
        if (data.memberName) setUserName(data.memberName);
        setModalError(null);
      } else {
        setModalError(data.message || "Contact not found in Master Sheet!");
      }
    } catch (err) {
      setModalError("Failed to send OTP code.");
    } finally {
      setModalLoading(false);
    }
  };

  // Handle OTP Verify
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setModalError("Please enter the 6-digit OTP code");
      return;
    }

    try {
      setModalLoading(true);
      setModalError(null);
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: inputContact.trim(), code: otpCode.trim() })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setUserContact(inputContact.trim());
        if (data.alumni?.name) setUserName(data.alumni.name);
        setShowLoginModal(false);
      } else {
        setModalError(data.message || "Invalid OTP code!");
      }
    } catch (err) {
      setModalError("Verification failed.");
    } finally {
      setModalLoading(false);
    }
  };

  // Handle Credentials / Demo Passcode Verification
  const handlePasscodeLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = passcode.trim().toLowerCase();
    if (normalized === 'butex2026' || normalized === 'admin' || normalized === '123456') {
      setIsAuthenticated(true);
      setUserContact(inputContact || "Verified Alumni");
      if (!userName) setUserName("Verified PGD Member");
      setShowLoginModal(false);
    } else {
      setModalError("Invalid Passcode! (Try: BUTEX2026)");
    }
  };

  // Handle Submit Comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setIsSubmitting(true);
      setSuccessMsg(null);

      const res = await fetch(`/api/events/${event.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: userName || userContact || "Verified PGD Member",
          rating: rating,
          comment: commentText.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCommentText('');
        setSuccessMsg("✓ Comment and 5-Star rating submitted successfully!");
        loadReviews();
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error("Failed to submit review:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin Erase Specific Toxic Comment
  const handleEraseComment = async (reviewId: string) => {
    if (!window.confirm("Are you sure you want to erase this comment?")) return;
    try {
      const res = await fetch(`/api/admin/events/${event.id}/reviews/${reviewId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        loadReviews();
      }
    } catch (err) {
      console.error("Error erasing comment:", err);
    }
  };

  const activeStarCount = hoverRating !== null ? hoverRating : rating;

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '4.8';

  const isLight = variant === 'light';

  return (
    <div className={`rounded-3xl p-4 sm:p-5 border space-y-4 transition-all ${
      isLight 
        ? 'bg-amber-50/70 border-amber-200/80 text-slate-900 shadow-sm' 
        : 'bg-slate-900 border-slate-800 text-white'
    }`}>
      
      {/* Header & Lock Toggle */}
      <div className={`flex items-center justify-between border-b pb-3 ${isLight ? 'border-amber-200/60' : 'border-slate-800'}`}>
        <div className="flex items-center space-x-2">
          <MessageSquare className={`w-4 h-4 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
          <h4 className={`text-xs font-black uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-amber-300'}`}>
            Event Comments & Reviews
          </h4>
        </div>
        
        <div className="flex items-center space-x-2 text-[10px]">
          <button
            onClick={() => setDevUnlocked(!devUnlocked)}
            className={`flex items-center space-x-1 ${isLight ? 'text-slate-600 hover:text-amber-700' : 'text-slate-400 hover:text-amber-400'} transition-colors`}
            title="Toggle 20-min post-start lock simulation"
          >
            {isUnlocked20Min ? <Unlock className="w-3 h-3 text-emerald-600" /> : <Lock className="w-3 h-3 text-rose-500" />}
            <span className="font-semibold">{isUnlocked20Min ? 'Unlocked' : 'Locked'}</span>
          </button>
        </div>
      </div>

      {/* Wireframe-matched Overall Rating Bar: "4.3 ★★★★★ (6 Reviews)" + Circle Initial Badges */}
      <div className={`flex items-center justify-between px-3.5 py-2 rounded-xl border ${
        isLight ? 'bg-amber-50/30 border-amber-300/80 text-slate-900' : 'bg-slate-800/80 border-slate-700 text-white'
      }`}>
        <div className="flex items-center space-x-1.5 border border-amber-300/90 px-3 py-1 rounded-lg bg-white/90 shadow-xs">
          <span className="text-sm font-black text-slate-900">{avgRating}</span>
          <div className="flex items-center space-x-0.5 text-amber-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span className="text-xs font-bold text-slate-600">({reviews.length || 6} Reviews)</span>
        </div>

        {/* Wireframe Circle Initial Badges (E) (M) (T) (F) (R) (+1 more) */}
        <div className="flex items-center -space-x-1 overflow-hidden">
          {[
            { letter: 'E', bg: 'bg-[#0B192C]' },
            { letter: 'M', bg: 'bg-[#6B6158]' },
            { letter: 'T', bg: 'bg-[#827467]' },
            { letter: 'F', bg: 'bg-[#0B192C]' },
            { letter: 'R', bg: 'bg-[#827467]' },
            { letter: '+1 more', bg: 'bg-slate-200 !text-slate-700 !w-auto !px-1.5' }
          ].map((item, idx) => (
            <div
              key={idx}
              className={`w-6 h-6 rounded-full ${item.bg} text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white shadow-xs shrink-0`}
            >
              {item.letter}
            </div>
          ))}
        </div>
      </div>

      {/* Wireframe Comments List: Left Avatar + Quote Comment Text + Star Rating */}
      <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
        {reviews.length === 0 ? (
          /* Default Sample Comments matching wireframe structure if no reviews yet */
          <div className="space-y-2">
            {[
              {
                id: 'demo-1',
                initial: 'M',
                bg: 'bg-[#6B6158]',
                rating: 5,
                comment: 'Outstanding organization and invaluable networking!'
              },
              {
                id: 'demo-2',
                initial: 'E',
                bg: 'bg-[#0B192C]',
                rating: 5,
                comment: 'Their products are good, fresh. Recommended.'
              },
              {
                id: 'demo-3',
                initial: 'F',
                bg: 'bg-[#827467]',
                rating: 4,
                comment: 'Nice shop but price is high'
              }
            ].map((rev) => (
              <div key={rev.id} className={`p-3 rounded-2xl border flex items-start space-x-3 transition-all ${
                isLight ? 'bg-white/90 border-amber-200/80 shadow-xs' : 'bg-slate-800/80 border-slate-700'
              }`}>
                <div className={`w-8 h-8 rounded-full ${rev.bg} text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 ring-2 ring-white shadow-xs`}>
                  {rev.initial}
                </div>
                <div className="space-y-1 flex-1">
                  <p className="text-xs font-extrabold text-slate-900 leading-snug">
                    "{rev.comment}"
                  </p>
                  <div className="flex items-center space-x-0.5 text-amber-500">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          reviews.map((rev) => (
            <div key={rev.id} className={`p-3 rounded-2xl border flex items-start space-x-3 transition-all ${
              isLight ? 'bg-white/90 border-amber-200/80 shadow-sm' : 'bg-slate-800/80 border-slate-700'
            }`}>
              <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5 ring-2 ring-amber-400/50">
                {rev.studentName ? rev.studentName.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-xs">{rev.studentName}</span>
                  {isAdmin && (
                    <button
                      onClick={() => handleEraseComment(rev.id)}
                      className="p-1 text-rose-500 hover:text-rose-700 rounded transition-all"
                      title="Erase Toxic Comment"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-800 font-medium leading-relaxed">
                  "{rev.comment}"
                </p>
                <div className="flex items-center space-x-0.5 text-amber-500">
                  {Array.from({ length: rev.rating }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Main Comment Section Container with Lock / Blur View State */}
      <div className={`relative pt-2 border-t ${isLight ? 'border-amber-200/60' : 'border-slate-800'}`}>
        
        {/* Lock Overlay if time is < 20 mins post-start */}
        {!isUnlocked20Min && (
          <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-4 text-center space-y-2 border border-slate-800 text-white">
            <Lock className="w-6 h-6 text-amber-400" />
            <span className="text-xs font-bold">Class Comments Locked</span>
            <span className="text-[10px] text-slate-300 max-w-xs">
              This review section automatically unlocks 20 minutes after event start time ({event.time || '10:00 AM'}).
            </span>
          </div>
        )}

        <div className={`space-y-3 transition-all ${!isUnlocked20Min ? 'filter blur-sm select-none pointer-events-none' : ''}`}>
          
          {/* If NOT Authenticated: Show prompt "Please sign in to leave a comment." */}
          {!isAuthenticated ? (
            <div className={`p-4 rounded-2xl text-center space-y-2 border ${
              isLight ? 'bg-amber-100/60 border-amber-300/80 text-slate-900' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}>
              <p className="text-xs font-bold">
                Please sign in to leave a comment.
              </p>
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-5 py-2 bg-[#0B192C] hover:bg-[#1E3A8A] text-white font-black text-xs rounded-xl shadow-md transition-all hover:scale-105"
              >
                Sign In to Unlock Comments
              </button>
            </div>
          ) : (
            /* Authenticated State: Interactive 5-Star Track + Comment Input Box */
            <form onSubmit={handleSubmitComment} className={`space-y-3 p-3.5 rounded-2xl border ${
              isLight ? 'bg-white/90 border-amber-200' : 'bg-slate-800/60 border-slate-700'
            }`}>
              
              {/* Top 5-Star Track */}
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Rate Event (Hover & Click Stars):
                </span>

                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="p-1 hover:scale-125 transition-transform"
                    >
                      <Star
                        className={`w-5 h-5 transition-colors ${
                          star <= activeStarCount
                            ? 'fill-amber-400 text-amber-400 drop-shadow'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-600 ml-1.5">{rating}/5</span>
                </div>
              </div>

              {/* Interactive Comment Input Box */}
              <div className="space-y-2">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={`Write your feedback for ${event.title}...`}
                  rows={2}
                  required
                  className={`w-full border rounded-xl p-2.5 text-xs focus:outline-none ${
                    isLight 
                      ? 'bg-slate-50 border-amber-200 text-slate-900 placeholder-slate-400 focus:border-amber-500' 
                      : 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-amber-400'
                  }`}
                />

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-emerald-600 font-bold">
                    Logged in as: {userName || userContact || "Verified Member"}
                  </span>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-[#0B192C] hover:bg-[#1E3A8A] text-white font-extrabold text-xs rounded-xl flex items-center space-x-1.5 shadow transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Posting...' : 'Submit Comment'}</span>
                  </button>
                </div>
              </div>

              {successMsg && (
                <p className="text-[11px] text-emerald-600 font-bold pt-1">{successMsg}</p>
              )}
            </form>
          )}

        </div>
      </div>

      {/* LOGIN MODAL POPUP */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 text-white shadow-2xl relative space-y-4 animate-fadeIn">
            
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Member Verification</span>
              </h3>
              <p className="text-xs text-slate-400">Sign in to leave a comment on class events.</p>
            </div>

            {/* TWO TAB CHOICES */}
            <div className="grid grid-cols-2 gap-1 bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => { setActiveTab('otp'); setModalError(null); }}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'otp' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                [OTP Verification]
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('credentials'); setModalError(null); }}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'credentials' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                [Passcode / Roll]
              </button>
            </div>

            {modalError && (
              <div className="bg-rose-500/20 border border-rose-500/40 text-rose-300 p-2.5 rounded-xl text-xs flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {/* TAB 1: Enter Phone/Email for OTP */}
            {activeTab === 'otp' && (
              <div className="space-y-3">
                <form onSubmit={handleSendOtp} className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-400">Phone or Email:</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={inputContact}
                      onChange={(e) => setInputContact(e.target.value)}
                      placeholder="e.g. 01700000000"
                      required
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="submit"
                      disabled={modalLoading}
                      className="px-3 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-400 shrink-0"
                    >
                      {modalLoading ? 'Sending...' : 'Send OTP'}
                    </button>
                  </div>
                </form>

                {sentOtp && (
                  <form onSubmit={handleVerifyOtp} className="space-y-2 bg-slate-950 p-3 rounded-xl border border-amber-500/40">
                    <div className="text-[11px] text-amber-400 font-bold flex items-center justify-between">
                      <span>✓ OTP Sent: <code className="text-white font-mono">{sentOtp}</code></span>
                    </div>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="Enter 6-digit OTP code"
                      maxLength={6}
                      required
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-center tracking-widest text-amber-300 focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="submit"
                      disabled={modalLoading}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow"
                    >
                      {modalLoading ? 'Verifying...' : 'Verify OTP & Unlock'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* TAB 2: Member Credentials / Passcode Login */}
            {activeTab === 'credentials' && (
              <form onSubmit={handlePasscodeLogin} className="space-y-2.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Student Roll / Name:</label>
                  <input
                    type="text"
                    value={inputContact}
                    onChange={(e) => setInputContact(e.target.value)}
                    placeholder="e.g. PGD-3600001784"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Member Passcode:</label>
                  <input
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter Passcode (e.g. BUTEX2026)"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow"
                >
                  Verify Credentials & Unlock
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
