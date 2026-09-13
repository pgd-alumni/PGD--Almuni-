import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Send, Lock, Unlock, ShieldCheck, CheckCircle2, AlertCircle, X, Trash2, ThumbsUp, Heart, Lightbulb, Award } from 'lucide-react';
import { EventItem, EventReview } from '../types';

interface ClassReviewSectionProps {
  event: EventItem;
  isAdmin?: boolean;
  variant?: 'light' | 'dark';
}

// Exact Star Rating Renderer supporting fractional percentages (e.g. 4.2, 3.5, 5.0, 0.0)
export const ExactStarRating: React.FC<{
  rating: number; // 0 to 5
  size?: string; // e.g. "w-3.5 h-3.5"
  showNumber?: boolean;
  totalReviews?: number;
}> = ({ rating, size = "w-3.5 h-3.5", showNumber = true, totalReviews }) => {
  const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));

  return (
    <div className="flex items-center space-x-1.5" title={`${safeRating.toFixed(1)} out of 5 stars`}>
      {showNumber && (
        <span className="text-sm font-black text-slate-900 tracking-tight">
          {totalReviews !== undefined && totalReviews === 0 ? '0.0' : safeRating.toFixed(1)}
        </span>
      )}
      <div className="flex items-center space-x-0.5">
        {[1, 2, 3, 4, 5].map((starIndex) => {
          // Fraction of this specific star to fill (0 to 1)
          const fillFraction = Math.max(0, Math.min(1, safeRating - (starIndex - 1)));
          const fillPercent = Math.round(fillFraction * 100);

          return (
            <div key={starIndex} className={`relative ${size} shrink-0`}>
              {/* Background Unfilled Star */}
              <Star className={`${size} text-slate-300 fill-slate-100`} />
              
              {/* Proportional Amber Fill */}
              {fillPercent > 0 && (
                <div 
                  className="absolute inset-0 overflow-hidden" 
                  style={{ width: `${fillPercent}%` }}
                >
                  <Star className={`${size} fill-amber-400 text-amber-400`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ClassReviewSection: React.FC<ClassReviewSectionProps> = ({ 
  event, 
  isAdmin = false,
  variant = 'light'
}) => {
  const [reviews, setReviews] = useState<EventReview[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userContact, setUserContact] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [userRoll, setUserRoll] = useState<string>('');

  // Local Reaction tracking: { [reviewId_reactionType]: true }
  const [userReactions, setUserReactions] = useState<{ [key: string]: boolean }>(() => {
    try {
      const saved = localStorage.getItem(`butex_event_reactions_${event?.id || 'general'}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

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
  const [devUnlocked, setDevUnlocked] = useState<boolean>(true); // Enabled for preview

  // Admin status check (prop or localStorage)
  const isLocalAdmin = isAdmin || Boolean(typeof window !== 'undefined' && localStorage.getItem('butex_admin_role'));

  // Check current session from localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('butex_current_user');
      const savedExpiry = localStorage.getItem('butex_auth_expiry');
      if (savedUser && savedExpiry && Date.now() < parseInt(savedExpiry, 10)) {
        const user = JSON.parse(savedUser);
        if (user?.name) {
          setIsAuthenticated(true);
          setUserName(user.name);
          setUserContact(user.phone || user.email || '');
          if (user.roll) setUserRoll(user.roll);
        }
      }
    } catch (e) {
      console.error("Auth auto-load error:", e);
    }
  }, []);

  // Save reactions to localStorage when changed
  useEffect(() => {
    try {
      if (event?.id) {
        localStorage.setItem(`butex_event_reactions_${event.id}`, JSON.stringify(userReactions));
      }
    } catch (e) {}
  }, [userReactions, event?.id]);

  // Check 20-minute post-start time
  const checkTimeUnlocked = (): boolean => {
    if (devUnlocked) return true;
    if (!event.date) return true;
    try {
      const startDateTime = new Date(`${event.date} ${event.time || '10:00 AM'}`).getTime();
      const now = Date.now();
      // 20 minutes = 1,200,000 ms
      return now >= (startDateTime + 1200000);
    } catch (e) {
      return true;
    }
  };

  const isUnlocked20Min = checkTimeUnlocked();

  // Load reviews for this event
  const loadReviews = () => {
    if (!event || !event.id) return;
    fetch(`/api/events/${encodeURIComponent(event.id)}/reviews`)
      .then(async res => {
        if (!res.ok) return null;
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          return res.json();
        }
        return null;
      })
      .then(data => {
        if (data?.success && Array.isArray(data.data)) {
          setReviews(data.data);
        }
      })
      .catch(err => console.error("Error fetching class reviews:", err));
  };

  useEffect(() => {
    loadReviews();
  }, [event?.id]);

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
        if (data.alumni?.roll) setUserRoll(data.alumni.roll);
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
      if (!userName) setUserName(inputContact.trim() || "Verified PGD Member");
      setShowLoginModal(false);
    } else {
      setModalError("Invalid Passcode! (Try: BUTEX2026)");
    }
  };

  // Handle Submit Comment with Exact Rating
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
          studentRoll: userRoll || "",
          rating: rating,
          comment: commentText.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCommentText('');
        setSuccessMsg(`✓ Your ${rating}-Star review and comment have been posted!`);
        loadReviews();
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error("Failed to submit review:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Reaction on Review / Comment
  const handleToggleReaction = async (reviewId: string, reactionType: 'helpful' | 'heart' | 'insightful' | 'clap') => {
    const reactionKey = `${reviewId}_${reactionType}`;
    const isCurrentlyActive = !!userReactions[reactionKey];
    const newAction = isCurrentlyActive ? 'remove' : 'add';

    // Optimistic UI Update
    setUserReactions(prev => ({ ...prev, [reactionKey]: !isCurrentlyActive }));
    setReviews(prev => prev.map(r => {
      if (r.id !== reviewId) return r;
      const currentCount = r.reactions?.[reactionType] || 0;
      const nextCount = newAction === 'add' ? currentCount + 1 : Math.max(0, currentCount - 1);
      return {
        ...r,
        reactions: { ...(r.reactions || {}), [reactionType]: nextCount },
        likesCount: newAction === 'add' ? (r.likesCount || 0) + 1 : Math.max(0, (r.likesCount || 0) - 1)
      };
    }));

    try {
      await fetch(`/api/events/${event.id}/reviews/${reviewId}/reaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: reactionType, action: newAction })
      });
    } catch (err) {
      console.error("Failed to update reaction:", err);
    }
  };

  // Admin or Author Erase Comment
  const handleEraseComment = async (reviewId: string) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      const res = await fetch(`/api/events/${event.id}/reviews/${reviewId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setReviews(prev => prev.filter(r => r.id !== reviewId));
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  const activeStarCount = hoverRating !== null ? hoverRating : rating;

  // Real Calculated Exact Rating
  const totalReviewsCount = reviews.length;
  const numericAvgRating = totalReviewsCount > 0
    ? reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / totalReviewsCount
    : 0;

  const isLight = variant === 'light';

  // Distinct real reviewer names
  const uniqueReviewers: string[] = Array.from(new Set(reviews.map(r => r.studentName).filter(Boolean) as string[]));

  // Rating descriptor tags
  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 5: return '5★ - Excellent & Highly Recommended';
      case 4: return '4★ - Very Good & Informative';
      case 3: return '3★ - Good / Satisfactory';
      case 2: return '2★ - Fair / Needs Practical Content';
      case 1: return '1★ - Poor / Significant Room for Improvement';
      default: return `${stars}★ Stars`;
    }
  };

  // Relative Time helper
  const formatTimeAgo = (isoDate: string) => {
    try {
      const time = new Date(isoDate).getTime();
      if (isNaN(time)) return 'Recently';
      const diffMinutes = Math.floor((Date.now() - time) / 60000);
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return new Date(isoDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className={`rounded-3xl p-4 sm:p-5 border space-y-4 transition-all ${
      isLight 
        ? 'bg-amber-50/70 border-amber-200/80 text-slate-900 shadow-sm' 
        : 'bg-slate-900 border-slate-800 text-white'
    }`}>
      
      {/* Header & Lock Status Toggle */}
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
            title="Toggle 20-min post-start lock condition"
          >
            {isUnlocked20Min ? <Unlock className="w-3 h-3 text-emerald-600" /> : <Lock className="w-3 h-3 text-rose-500" />}
            <span className="font-semibold">{isUnlocked20Min ? 'Unlocked' : 'Locked'}</span>
          </button>
        </div>
      </div>

      {/* Overall Functional Rating Bar: Exact Fractional Stars + Actual Reviewer Badges */}
      <div className={`flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border ${
        isLight ? 'bg-amber-50/40 border-amber-300/80 text-slate-900' : 'bg-slate-800/80 border-slate-700 text-white'
      }`}>
        {/* Exact Star Rating Display */}
        <div className="flex items-center space-x-2 border border-amber-300/90 px-3 py-1.5 rounded-xl bg-white shadow-xs">
          <ExactStarRating 
            rating={numericAvgRating} 
            size="w-4 h-4" 
            totalReviews={totalReviewsCount}
            showNumber={true} 
          />
          <span className="text-xs font-bold text-slate-600">
            ({totalReviewsCount} {totalReviewsCount === 1 ? 'Review' : 'Reviews'})
          </span>
        </div>

        {/* Real Reviewer Avatar Badges (rendered only when real reviews exist!) */}
        {totalReviewsCount > 0 ? (
          <div className="flex items-center -space-x-1.5 overflow-hidden" title={`${uniqueReviewers.length} unique reviewers`}>
            {uniqueReviewers.slice(0, 5).map((revName, idx) => {
              const initial = (revName || 'A').charAt(0).toUpperCase();
              const colors = ['bg-[#0B192C]', 'bg-[#1E3A8A]', 'bg-amber-600', 'bg-emerald-700', 'bg-indigo-700'];
              const bg = colors[idx % colors.length];
              return (
                <div
                  key={idx}
                  className={`w-6 h-6 rounded-full ${bg} text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white shadow-xs shrink-0`}
                  title={revName}
                >
                  {initial}
                </div>
              );
            })}
            {uniqueReviewers.length > 5 && (
              <div className="px-1.5 h-6 rounded-full bg-slate-200 text-slate-700 text-[9px] font-black flex items-center justify-center ring-2 ring-white shadow-xs shrink-0">
                +{uniqueReviewers.length - 5}
              </div>
            )}
          </div>
        ) : (
          <div className="text-[11px] font-semibold text-amber-800/80 bg-amber-100/60 px-2.5 py-1 rounded-lg border border-amber-200">
            Be the first to review!
          </div>
        )}
      </div>

      {/* Real Reviews & Comments List (Zero Dummy Content!) */}
      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
        {reviews.length === 0 ? (
          /* Clean, friendly empty state when no reviews exist yet */
          <div className="py-7 px-4 text-center space-y-1.5 rounded-2xl bg-white/70 border border-amber-200/70 shadow-xs">
            <MessageSquare className="w-7 h-7 text-amber-500/70 mx-auto" />
            <p className="text-xs font-black text-slate-800">No event reviews or comments yet</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
              Have you participated or planning to attend? Share your authentic feedback and star rating below!
            </p>
          </div>
        ) : (
          reviews.map((rev) => {
            const authorInitial = rev.studentName ? rev.studentName.charAt(0).toUpperCase() : 'A';
            const isAuthor = userName && rev.studentName && userName.toLowerCase() === rev.studentName.toLowerCase();
            const canDelete = isLocalAdmin || isAuthor;

            const helpfulKey = `${rev.id}_helpful`;
            const heartKey = `${rev.id}_heart`;
            const insightfulKey = `${rev.id}_insightful`;

            const isHelpfulActive = !!userReactions[helpfulKey];
            const isHeartActive = !!userReactions[heartKey];
            const isInsightfulActive = !!userReactions[insightfulKey];

            return (
              <div 
                key={rev.id} 
                className={`p-3.5 rounded-2xl border flex flex-col space-y-2 transition-all ${
                  isLight ? 'bg-white border-amber-200/90 shadow-xs hover:border-amber-300' : 'bg-slate-800/80 border-slate-700'
                }`}
              >
                {/* Review Header: Avatar, Name, Roll, Time, Exact Stars, and Delete */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#0B192C] text-amber-400 font-black text-xs flex items-center justify-center shrink-0 ring-2 ring-amber-400/40 shadow-xs">
                      {authorInitial}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-extrabold text-slate-900 text-xs">{rev.studentName}</span>
                        {rev.studentRoll && (
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {rev.studentRoll}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {formatTimeAgo(rev.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {/* Exact 5-star rating for this review */}
                    <div className="flex items-center space-x-1 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-lg">
                      <div className="flex items-center space-x-0.5">
                        {[1, 2, 3, 4, 5].map((starNum) => (
                          <Star 
                            key={starNum} 
                            className={`w-3 h-3 ${
                              starNum <= rev.rating 
                                ? 'fill-amber-400 text-amber-400' 
                                : 'text-slate-300 fill-transparent'
                            }`} 
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-black text-amber-800">{rev.rating}.0</span>
                    </div>

                    {canDelete && (
                      <button
                        onClick={() => handleEraseComment(rev.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        title="Delete this comment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Comment Content */}
                <p className="text-xs text-slate-800 font-medium leading-relaxed pl-10">
                  "{rev.comment}"
                </p>

                {/* Interactive Reactions Bar for Comments */}
                <div className="flex items-center space-x-1.5 pl-10 pt-1">
                  {/* Helpful Reaction */}
                  <button
                    type="button"
                    onClick={() => handleToggleReaction(rev.id, 'helpful')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition-all border ${
                      isHelpfulActive
                        ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-xs scale-105'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                    title="Mark comment as helpful"
                  >
                    <ThumbsUp className={`w-3 h-3 ${isHelpfulActive ? 'fill-amber-500 text-amber-600' : 'text-slate-400'}`} />
                    <span>Helpful</span>
                    {(rev.reactions?.helpful || 0) > 0 && (
                      <span className="font-mono text-[9px] font-extrabold ml-0.5">
                        {rev.reactions?.helpful}
                      </span>
                    )}
                  </button>

                  {/* Heart / Love Reaction */}
                  <button
                    type="button"
                    onClick={() => handleToggleReaction(rev.id, 'heart')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition-all border ${
                      isHeartActive
                        ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-xs scale-105'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                    title="Love this review"
                  >
                    <Heart className={`w-3 h-3 ${isHeartActive ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                    {(rev.reactions?.heart || 0) > 0 && (
                      <span className="font-mono text-[9px] font-extrabold ml-0.5">
                        {rev.reactions?.heart}
                      </span>
                    )}
                  </button>

                  {/* Insightful Reaction */}
                  <button
                    type="button"
                    onClick={() => handleToggleReaction(rev.id, 'insightful')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition-all border ${
                      isInsightfulActive
                        ? 'bg-sky-50 border-sky-300 text-sky-900 shadow-xs scale-105'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                    title="Insightful feedback"
                  >
                    <Lightbulb className={`w-3 h-3 ${isInsightfulActive ? 'fill-sky-500 text-sky-600' : 'text-slate-400'}`} />
                    {(rev.reactions?.insightful || 0) > 0 && (
                      <span className="font-mono text-[9px] font-extrabold ml-0.5">
                        {rev.reactions?.insightful}
                      </span>
                    )}
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Main Comment Section Container with Lock / Blur State */}
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
            <div className={`p-4 rounded-2xl text-center space-y-2.5 border ${
              isLight ? 'bg-amber-100/60 border-amber-300/80 text-slate-900' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}>
              <p className="text-xs font-bold">
                Please sign in to leave a comment and rate this event.
              </p>
              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="px-5 py-2 bg-[#0B192C] hover:bg-[#1E3A8A] text-white font-black text-xs rounded-xl shadow-md transition-all hover:scale-105 active:scale-95"
              >
                Sign In to Leave Feedback
              </button>
            </div>
          ) : (
            /* Authenticated State: Interactive Star Track + Rating Descriptor + Comment Input */
            <form onSubmit={handleSubmitComment} className={`space-y-3 p-4 rounded-2xl border ${
              isLight ? 'bg-white/95 border-amber-200 shadow-xs' : 'bg-slate-800/60 border-slate-700'
            }`}>
              
              {/* Interactive 5-Star Track with Real-Time Feedback */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-2.5">
                <div>
                  <span className={`text-[11px] font-extrabold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    Select Your Rating:
                  </span>
                  <p className="text-[10px] font-bold text-amber-700">
                    {getRatingLabel(activeStarCount)}
                  </p>
                </div>

                <div className="flex items-center space-x-1.5 bg-amber-50/70 border border-amber-200/80 px-3 py-1 rounded-xl">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="p-1 hover:scale-125 transition-transform focus:outline-none"
                      title={`Rate ${star} Star${star > 1 ? 's' : ''}`}
                    >
                      <Star
                        className={`w-5 h-5 transition-colors ${
                          star <= activeStarCount
                            ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                            : 'text-slate-300 fill-transparent'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-black text-amber-800 ml-1">
                    {rating}/5
                  </span>
                </div>
              </div>

              {/* Interactive Comment Input Box */}
              <div className="space-y-2">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={`Write your genuine experience or comment for ${event.title}...`}
                  rows={2}
                  required
                  className={`w-full border rounded-xl p-3 text-xs focus:outline-none transition-all ${
                    isLight 
                      ? 'bg-slate-50 border-amber-200 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white' 
                      : 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-amber-400'
                  }`}
                />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-emerald-700 font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Commenting as: {userName || userContact || "Verified Alumni"}</span>
                  </span>

                  <button
                    type="submit"
                    disabled={isSubmitting || !commentText.trim()}
                    className="px-4 py-2 bg-[#0B192C] hover:bg-[#1E3A8A] text-white font-extrabold text-xs rounded-xl flex items-center space-x-1.5 shadow-sm transition-all disabled:opacity-50 active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Posting...' : 'Post Review & Rating'}</span>
                  </button>
                </div>
              </div>

              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2 rounded-xl text-[11px] font-bold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}
            </form>
          )}

        </div>
      </div>

      {/* LOGIN / VERIFICATION MODAL POPUP */}
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
              <p className="text-xs text-slate-400">Sign in to leave a real comment and rating on class events.</p>
            </div>

            {/* TAB CHOICES */}
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
