import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, MapPin, Sparkles, ChevronLeft, ChevronRight, FileText, UserCheck, Star, Lock, Unlock, MessageSquare, Send, Maximize2, X, Archive } from 'lucide-react';
import { EventItem, EventReview, formatGoogleDriveUrl, isEventOneDayOver } from '../types';

interface EventProgramSidebarProps {
  events: EventItem[];
  onOpenRegisterModal: (event: EventItem) => void;
  onGoToEventDetails?: (event?: EventItem) => void;
  onGoToArchive?: () => void;
}

export const EventProgramSidebar: React.FC<EventProgramSidebarProps> = ({
  events = [],
  onOpenRegisterModal,
  onGoToEventDetails,
  onGoToArchive
}) => {
  // Filter to strictly active upcoming events (expired events belong only to the Archive section)
  const activeEvents = useMemo(() => {
    return (events || []).filter(e => !isEventOneDayOver(e.date));
  }, [events]);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [reviewsMap, setReviewsMap] = useState<Record<string, EventReview[]>>({});
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>('');
  const [authorName, setAuthorName] = useState<string>('');
  const [unlockedMap, setUnlockedMap] = useState<Record<string, boolean>>({});
  const [submittingReview, setSubmittingReview] = useState(false);
  const [fullscreenPoster, setFullscreenPoster] = useState<string | null>(null);

  // Keep slide index in bounds when active events change
  useEffect(() => {
    if (currentSlide >= activeEvents.length && activeEvents.length > 0) {
      setCurrentSlide(0);
    }
  }, [activeEvents.length, currentSlide]);

  // Active event based on slide index
  const safeSlideIndex = activeEvents.length > 0 ? (currentSlide % activeEvents.length + activeEvents.length) % activeEvents.length : 0;
  const activeEvent = activeEvents[safeSlideIndex] || activeEvents[0];

  const handlePrevSlide = () => {
    if (activeEvents.length <= 1) return;
    setCurrentSlide(prev => (prev === 0 ? activeEvents.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    if (activeEvents.length <= 1) return;
    setCurrentSlide(prev => (prev === activeEvents.length - 1 ? 0 : prev + 1));
  };

  // No automatic changing of slide; user controls navigation with prev/next arrows or indicator dots
  // This ensures updated content remains steady and visible without unexpected auto-switching

  // Fetch reviews for active event
  useEffect(() => {
    if (!activeEvent || !activeEvent.id) return;

    fetch(`/api/events/${encodeURIComponent(activeEvent.id)}/reviews`)
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
          setReviewsMap(prev => ({ ...prev, [activeEvent.id]: data.data }));
        }
      })
      .catch(err => console.error("Error fetching event reviews:", err));

    const isUnlocked = true; // Enabled for preview feedback
    setUnlockedMap(prev => ({ ...prev, [activeEvent.id]: isUnlocked }));
  }, [activeEvent?.id]);

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEvent || !activeEvent.id || !newComment.trim()) return;

    try {
      setSubmittingReview(true);
      const res = await fetch(`/api/events/${encodeURIComponent(activeEvent.id)}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: authorName.trim() || "Verified PGD Member",
          rating: newRating,
          comment: newComment.trim()
        })
      });

      if (!res.ok) {
        throw new Error("Failed to post review");
      }
      const data = await res.json();
      if (data.success && data.review) {
        setReviewsMap(prev => ({
          ...prev,
          [activeEvent.id]: [data.review, ...(prev[activeEvent.id] || [])]
        }));
        setNewComment('');
      }
    } catch (err) {
      console.error("Failed to post review:", err);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (activeEvents.length === 0) {
    const archivedCount = events.filter(e => isEventOneDayOver(e.date)).length;
    return (
      <div className="bg-amber-400 border-2 border-amber-500 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4 text-slate-950 h-full flex flex-col justify-between transition-all">
        {/* Sidebar Header */}
        <div className="flex items-center justify-between border-b border-amber-500/60 pb-2.5">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-slate-950 fill-amber-300" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">UPCOMING EVENT</h3>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="px-2 py-0.5 rounded-full bg-slate-950 text-amber-400 text-[10px] font-extrabold shadow-sm">
              0 Active Events
            </span>
          </div>
        </div>

        {/* Empty Active Events State */}
        <div className="relative flex-1 bg-slate-950 text-white rounded-2xl p-6 shadow-2xl border border-amber-500/40 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
            <Calendar className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-100">No Active Events Scheduled</h4>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            All recent meetings have concluded and are safely archived. Past event recordings and discussion notes are available in the Archive.
          </p>
          <button
            onClick={() => {
              if (onGoToArchive) {
                onGoToArchive();
              } else if (onGoToEventDetails) {
                onGoToEventDetails();
              }
            }}
            className="mt-2 py-2 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all shadow flex items-center space-x-1.5"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Browse Past Event Archive {archivedCount > 0 ? `(${archivedCount})` : ''}</span>
          </button>
        </div>
      </div>
    );
  }

  const currentReviews = activeEvent ? (reviewsMap[activeEvent.id] || []) : [];
  const isSectionUnlocked = activeEvent ? (unlockedMap[activeEvent.id] ?? true) : true;

  return (
    <div className="bg-amber-400 border-2 border-amber-500 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4 text-slate-950 h-full flex flex-col justify-between transition-all">
      
      {/* Sidebar Header - Upper design title word size & color remaining same as current */}
      <div className="flex items-center justify-between border-b border-amber-500/60 pb-2.5">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-slate-950 fill-amber-300" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">UPCOMING EVENT</h3>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="px-2 py-0.5 rounded-full bg-slate-950 text-amber-400 text-[10px] font-extrabold shadow-sm">
            {activeEvents.length} Active {activeEvents.length === 1 ? 'Event' : 'Events'}
          </span>
        </div>
      </div>

      {/* Front Page Yellow Slide Bar System */}
      <div className="relative flex-1 bg-slate-950 text-white rounded-2xl p-4 shadow-2xl border border-amber-500/40 flex flex-col justify-between overflow-hidden">
        
        {/* Slide navigation controls */}
        {activeEvents.length > 1 && (
          <div className="flex items-center justify-between mb-2.5 border-b border-slate-800 pb-2 shrink-0">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              Slide {safeSlideIndex + 1} of {activeEvents.length}
            </span>
            <div className="flex items-center space-x-1">
              <button
                onClick={handlePrevSlide}
                className="p-1 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 transition-all"
                title="Previous Event Poster"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleNextSlide}
                className="p-1 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 transition-all"
                title="Next Event Poster"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Poster Media Slide Content */}
        {activeEvent && (
          <div className="space-y-3 flex-1 min-h-0 flex flex-col justify-between">
            {/* Visual Class Thumbnail Poster - Exact 3.3:5 Aspect Ratio & Full-Height Fit */}
            {activeEvent.thumbnailUrl && (
              <div 
                onClick={() => setFullscreenPoster(formatGoogleDriveUrl(activeEvent.thumbnailUrl) || activeEvent.thumbnailUrl || null)}
                style={{ aspectRatio: '3.3 / 5' }}
                className="w-full flex-1 min-h-[360px] sm:min-h-[420px] max-h-[580px] rounded-2xl overflow-hidden relative group border border-slate-800 bg-slate-900 shadow-md cursor-pointer flex items-center justify-center mx-auto"
                title="Click to expand full screen poster preview"
              >
                <img
                  src={formatGoogleDriveUrl(activeEvent.thumbnailUrl) || activeEvent.thumbnailUrl}
                  alt={activeEvent.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80";
                  }}
                />
                
                {/* Full-Screen Hover Badge Overlay */}
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 text-white font-bold text-xs bg-gradient-to-t from-slate-950/80 via-transparent to-transparent p-3">
                  <div className="bg-amber-500 text-slate-950 px-3 py-1.5 rounded-lg shadow-lg flex items-center space-x-1.5 font-extrabold text-[11px]">
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>View Full Screen Poster</span>
                  </div>
                </div>

                <div className="absolute bottom-2.5 right-2.5 bg-slate-950/90 text-amber-300 px-2.5 py-1 rounded-md text-[10px] font-mono border border-amber-500/30">
                  {activeEvent.venueType || 'Online'}
                </div>
              </div>
            )}

            {/* Slider Dots Indicator - Interactive Carousel Control */}
            {activeEvents.length > 1 && (
              <div className="flex flex-col items-center justify-center space-y-1 pt-1 shrink-0">
                <div className="flex justify-center items-center space-x-2">
                  {activeEvents.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-2.5 rounded-full transition-all duration-300 ${
                        idx === safeSlideIndex
                          ? 'w-7 bg-amber-400 ring-2 ring-amber-400/40'
                          : 'w-2.5 bg-slate-700 hover:bg-slate-500'
                      }`}
                      title={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
                <span className="text-[9px] text-slate-400 font-medium">
                  dots: click to jump, active dot filled
                </span>
              </div>
            )}
          </div>
        )}

        {/* TWO ACTION BUTTONS (Inline 50/50 ratio, Dark Navy Buttons) directly under thumbnail poster */}
        {activeEvent && (
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80 mt-2 shrink-0">
            {/* Button 1: Details */}
            <button
              onClick={() => {
                if (onGoToEventDetails) {
                  onGoToEventDetails(activeEvent);
                }
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-[#0B192C] hover:bg-[#1E3A8A] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 border border-slate-700/60 hover:scale-[1.01]"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Details</span>
            </button>

            {/* Button 2: Register now */}
            <button
              onClick={() => onOpenRegisterModal(activeEvent)}
              className="w-full py-2.5 px-3 rounded-xl bg-[#0B192C] hover:bg-[#1E3A8A] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 border border-slate-700/60 hover:scale-[1.01]"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Register now</span>
            </button>
          </div>
        )}
      </div>

      {/* High-Resolution Full Screen Lightbox Modal */}
      {fullscreenPoster && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          onClick={() => setFullscreenPoster(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 border border-amber-500/30 rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between p-3 border-b border-slate-800 text-white">
              <span className="text-xs font-bold text-amber-400 flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>Full Screen Event Poster Preview ({activeEvent?.title})</span>
              </span>
              <button
                onClick={() => setFullscreenPoster(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                title="Close Lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-auto max-h-[80vh] w-full flex justify-center p-2">
              <img
                src={formatGoogleDriveUrl(fullscreenPoster) || fullscreenPoster}
                alt="Full Screen Event Poster"
                className="max-h-[75vh] w-auto object-contain rounded-xl shadow-lg border border-slate-800"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80";
                }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
