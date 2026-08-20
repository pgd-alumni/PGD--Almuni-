import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  CheckCircle2, 
  Sparkles, 
  PlusCircle, 
  Filter, 
  Star, 
  MessageSquare, 
  Send, 
  ChevronDown, 
  ChevronUp, 
  UserCheck,
  ThumbsUp
} from 'lucide-react';
import { EventItem, EventReview } from '../types';
import { ClassReviewSection } from './ClassReviewSection';

interface EventsModuleProps {
  events: EventItem[];
  onRegisterEvent: (id: string) => void;
}

export const EventsModule: React.FC<EventsModuleProps> = ({ events, onRegisterEvent }) => {
  const [registeredIds, setRegisteredIds] = useState<string[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'UPCOMING' | 'COMPLETED'>('ALL');
  
  // Reviews state per event
  const [reviewsMap, setReviewsMap] = useState<Record<string, EventReview[]>>({});
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Form states for submitting new review
  const [reviewAuthor, setReviewAuthor] = useState<string>('');
  const [reviewRoll, setReviewRoll] = useState<string>('');
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch all reviews on mount
  useEffect(() => {
    fetch('/api/events/all-reviews')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          const mapped: Record<string, EventReview[]> = {};
          data.data.forEach((rev: EventReview) => {
            if (!mapped[rev.eventId]) mapped[rev.eventId] = [];
            mapped[rev.eventId].push(rev);
          });
          setReviewsMap(mapped);
        }
      })
      .catch(err => console.error("Failed to load event reviews:", err));
  }, []);

  const isEventReviewable = (evt: EventItem): boolean => {
    const status = (evt.status || '').toLowerCase();
    if (status.includes('completed') || status.includes('ongoing') || status.includes('past') || status.includes('closed')) {
      return true;
    }
    if (evt.date) {
      const eventDate = new Date(evt.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (eventDate <= today) return true;
    }
    return false;
  };

  const handleRegister = (id: string) => {
    if (!registeredIds.includes(id)) {
      setRegisteredIds(prev => [...prev, id]);
      onRegisterEvent(id);
    }
  };

  const toggleReviewsExpand = (eventId: string) => {
    if (expandedEventId === eventId) {
      setExpandedEventId(null);
    } else {
      setExpandedEventId(eventId);
      setSuccessMessage(null);
      // Fetch fresh reviews for this event
      fetch(`/api/events/${eventId}/reviews`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setReviewsMap(prev => ({ ...prev, [eventId]: data.data }));
          }
        })
        .catch(err => console.error(err));
    }
  };

  const handleSubmitReview = async (e: React.FormEvent, eventId: string) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    setIsSubmitting(true);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/events/${eventId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: reviewAuthor.trim() || 'Verified PGD Member',
          studentRoll: reviewRoll.trim() || '',
          rating: reviewRating,
          comment: reviewComment.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.review) {
        setReviewsMap(prev => ({
          ...prev,
          [eventId]: [data.review, ...(prev[eventId] || [])]
        }));
        setReviewComment('');
        setSuccessMessage("Thank you! Your review & rating have been published for all members.");
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (err) {
      console.error("Error submitting review:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter(evt => {
      if (selectedFilter === 'UPCOMING') return evt.status?.toLowerCase().includes('upcoming') || evt.status?.toLowerCase().includes('open');
      if (selectedFilter === 'COMPLETED') return evt.status?.toLowerCase().includes('completed') || evt.status?.toLowerCase().includes('closed');
      return true;
    });
  }, [events, selectedFilter]);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-4 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-2 text-xs font-semibold text-amber-400">
          <Sparkles className="w-4 h-4" />
          <span>PGD Reunions, Factory Visits & Technical Workshops</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Events & Industrial Visits</h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
          Participate in alumni reunions, industrial automation factory visits, technical masterclasses, and annual research forums. Read and share member reviews for all programs.
        </p>

        {/* Quick Filter Bar */}
        <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-slate-800">
          <div className="flex items-center space-x-1 text-xs text-slate-400 mr-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Status:</span>
          </div>
          {(['ALL', 'UPCOMING', 'COMPLETED'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedFilter === filter
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {filter === 'ALL' ? 'All Events' : filter === 'UPCOMING' ? 'Upcoming' : 'Completed / Past'}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filteredEvents.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Events Found</h3>
          <p className="text-xs text-slate-500">There are no events matching your selected filter criteria right now.</p>
        </div>
      )}

      {/* Events List */}
      <div className="space-y-6">
        {filteredEvents.map((evt) => {
          const isRegistered = registeredIds.includes(evt.id);
          const currentCount = isRegistered ? evt.registeredCount + 1 : evt.registeredCount;
          const isFull = evt.maxSeats ? currentCount >= evt.maxSeats : false;

          const reviews = reviewsMap[evt.id] || [];
          const avgRating = reviews.length > 0 
            ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
            : null;

          const isExpanded = expandedEventId === evt.id;
          const canReview = isEventReviewable(evt);

          return (
            <div key={evt.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all overflow-hidden">
              
              {/* Event Card Content - Wireframe Layout */}
              <div className="p-5 sm:p-7 space-y-3">
                
                {/* Box 1: Event Title */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-xs">
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug">
                    <span className="font-extrabold text-slate-900">Event Title : </span>
                    <span className="font-semibold text-slate-800">{evt.title}</span>
                  </h3>
                </div>

                {/* Box 2: Host Name */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-xs">
                  <p className="text-xs text-slate-800 leading-relaxed">
                    <strong className="font-extrabold text-slate-900">Host Name : </strong>
                    <span className="font-semibold text-slate-800">{evt.hostName || 'BUTEX PGD Central Committee'}</span>
                  </p>
                </div>

                {/* Box 3: Event Details */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-xs">
                  <p className="text-xs text-slate-800 leading-relaxed">
                    <strong className="font-extrabold text-slate-900">Event Details : </strong>
                    {evt.description}
                  </p>
                </div>

                {/* Box 3: Date / Time / Venue */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-800 font-medium">
                  <div>
                    <strong className="font-extrabold text-slate-900">Date : </strong>{evt.date}
                  </div>
                  <div>
                    <strong className="font-extrabold text-slate-900">Time : </strong>{evt.time}
                  </div>
                  <div className="truncate">
                    <strong className="font-extrabold text-slate-900">Venue : </strong>{evt.venue}
                  </div>
                </div>

                {/* Action & Status Row: 3 Pills/Buttons Across */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  
                  {/* Left Blue Pill: Capacity */}
                  <div className="w-full sm:w-auto bg-sky-100 text-sky-900 border border-sky-200/80 px-4 py-2 rounded-full font-bold text-xs text-center shadow-xs">
                    {currentCount} alumni register{evt.maxSeats ? `/${evt.maxSeats} capacity` : ''}
                  </div>

                  {/* Middle Button: Review (Gold / Amber button) */}
                  <button
                    onClick={() => toggleReviewsExpand(evt.id)}
                    className="w-full sm:w-auto px-8 py-2.5 bg-[#D99B26] hover:bg-[#B8801A] text-white font-extrabold text-xs rounded-xl shadow-md transition-all hover:scale-105 flex items-center justify-center space-x-1.5"
                  >
                    <span>Review</span>
                  </button>

                  {/* Right Status Pill or Registration Button */}
                  {evt.status?.toLowerCase().includes('completed') || evt.status?.toLowerCase().includes('past') || evt.status?.toLowerCase().includes('closed') ? (
                    <div className="w-full sm:w-auto bg-rose-200/80 text-rose-900 border border-rose-300 px-5 py-2 rounded-xl font-extrabold text-xs text-center shadow-xs">
                      Event ended
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRegister(evt.id)}
                      disabled={isRegistered || isFull}
                      className={`w-full sm:w-auto px-6 py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-1.5 shadow-sm ${
                        isRegistered
                          ? 'bg-emerald-600 text-white cursor-default'
                          : isFull
                          ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                          : 'bg-[#0B192C] hover:bg-[#1E3A8A] text-white'
                      }`}
                    >
                      {isRegistered ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Registered</span>
                        </>
                      ) : isFull ? (
                        <span>Full</span>
                      ) : (
                        <>
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Register</span>
                        </>
                      )}
                    </button>
                  )}

                </div>

                {/* Blue Horizontal Divider Line */}
                <hr className="border-t-2 border-[#1E3A8A]/80 my-3" />

                {/* Always-visible Review & Comment Section matching Wireframe */}
                <div className="pt-1">
                  <ClassReviewSection event={evt} variant="light" />
                </div>

              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
