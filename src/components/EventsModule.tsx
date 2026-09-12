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
  ThumbsUp,
  Archive,
  Trash2,
  Maximize2,
  X,
  AlertCircle
} from 'lucide-react';
import { EventItem, EventReview, formatGoogleDriveUrl, isEventOneDayOver } from '../types';
import { ClassReviewSection } from './ClassReviewSection';

interface EventsModuleProps {
  events: EventItem[];
  onRegisterEvent: (id: string) => void;
  onDeleteEvent?: (id: string, title: string) => void;
}

export const EventsModule: React.FC<EventsModuleProps> = ({ 
  events, 
  onRegisterEvent,
  onDeleteEvent 
}) => {
  const [localEvents, setLocalEvents] = useState<EventItem[]>(events);
  const [registeredIds, setRegisteredIds] = useState<string[]>([]);
  const [selectedView, setSelectedView] = useState<'ACTIVE' | 'ARCHIVE' | 'ALL'>('ACTIVE');
  const [fullscreenPoster, setFullscreenPoster] = useState<string | null>(null);
  
  // Deletion states
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [deleteFeedback, setDeleteFeedback] = useState<string | null>(null);

  // Sync incoming events
  useEffect(() => {
    setLocalEvents(events);
  }, [events]);

  // Split into active events vs archive (where meeting date is 1+ day over)
  const { activeEvents, archivedEvents } = useMemo(() => {
    const active: EventItem[] = [];
    const archived: EventItem[] = [];

    localEvents.forEach(evt => {
      if (isEventOneDayOver(evt.date)) {
        archived.push(evt);
      } else {
        active.push(evt);
      }
    });

    return { activeEvents: active, archivedEvents: archived };
  }, [localEvents]);

  // Filtered events based on selected tab view
  const displayedEvents = useMemo(() => {
    if (selectedView === 'ACTIVE') return activeEvents;
    if (selectedView === 'ARCHIVE') return archivedEvents;
    return localEvents;
  }, [selectedView, activeEvents, archivedEvents, localEvents]);

  const handleRegister = (id: string) => {
    if (!registeredIds.includes(id)) {
      setRegisteredIds(prev => [...prev, id]);
      onRegisterEvent(id);
    }
  };

  const handleDeleteEventPost = async (eventId: string, title: string) => {
    setIsDeletingId(eventId);
    setDeleteFeedback(null);

    // Optimistic removal
    setLocalEvents(prev => prev.filter(e => e.id !== eventId));

    try {
      if (onDeleteEvent) {
        onDeleteEvent(eventId, title);
      } else {
        await fetch(`/api/admin/events/${encodeURIComponent(eventId)}?title=${encodeURIComponent(title)}`, {
          method: 'DELETE'
        });
      }
      setDeleteFeedback(`✓ Event post "${title}" has been deleted successfully.`);
      setTimeout(() => setDeleteFeedback(null), 4000);
    } catch (err) {
      console.error("Error deleting event post:", err);
      setDeleteFeedback(`❌ Failed to delete event post: ${(err as Error).message}`);
    } finally {
      setIsDeletingId(null);
      setConfirmingDeleteId(null);
    }
  };

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
          Participate in alumni reunions, industrial automation factory visits, technical masterclasses, and annual research forums. Access current sessions, or browse past meetings in the Archive section.
        </p>

        {/* View Selection Tabs: Active vs Archive vs All */}
        <div className="pt-3 flex flex-wrap items-center gap-2.5 border-t border-slate-800">
          <button
            onClick={() => setSelectedView('ACTIVE')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 ${
              selectedView === 'ACTIVE'
                ? 'bg-amber-500 text-slate-950 shadow-md scale-[1.02]'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Active & Upcoming Events</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
              selectedView === 'ACTIVE' ? 'bg-slate-950 text-amber-400' : 'bg-slate-700 text-slate-300'
            }`}>
              {activeEvents.length}
            </span>
          </button>

          <button
            onClick={() => setSelectedView('ARCHIVE')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 ${
              selectedView === 'ARCHIVE'
                ? 'bg-amber-500 text-slate-950 shadow-md scale-[1.02]'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archive Section (1+ Day Over)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
              selectedView === 'ARCHIVE' ? 'bg-slate-950 text-amber-400' : 'bg-slate-700 text-slate-300'
            }`}>
              {archivedEvents.length}
            </span>
          </button>

          <button
            onClick={() => setSelectedView('ALL')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 ${
              selectedView === 'ALL'
                ? 'bg-amber-500 text-slate-950 shadow-md scale-[1.02]'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>All Programs</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
              selectedView === 'ALL' ? 'bg-slate-950 text-amber-400' : 'bg-slate-700 text-slate-300'
            }`}>
              {localEvents.length}
            </span>
          </button>
        </div>
      </div>

      {/* Deletion Feedback Banner */}
      {deleteFeedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between animate-fadeIn">
          <span>{deleteFeedback}</span>
          <button onClick={() => setDeleteFeedback(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Archive Context Banner (shown when viewing Archive) */}
      {selectedView === 'ARCHIVE' && (
        <div className="bg-slate-800/95 border border-slate-700 rounded-3xl p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md animate-fadeIn">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center space-x-2">
                <span>Archive Section — Concluded Meetings</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 text-[10px] font-mono uppercase font-bold">
                  1+ Day Over
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                All PGD alumni meetings and workshop sessions whose scheduled date passed over 24 hours ago are archived here. You can inspect attendees, review discussions, and view recordings.
              </p>
            </div>
          </div>
          <span className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 text-xs font-mono font-bold shrink-0">
            {archivedEvents.length} Meeting{archivedEvents.length === 1 ? '' : 's'} Archived
          </span>
        </div>
      )}

      {/* Empty State */}
      {displayedEvents.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
          {selectedView === 'ARCHIVE' ? (
            <>
              <Archive className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">Archive Section Empty</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                There are currently no meetings that are 1 day past their event date. Once a meeting date has completed by 1 day, it will automatically transition to this Archive section.
              </p>
            </>
          ) : (
            <>
              <Calendar className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Active Events Available</h3>
              <p className="text-xs text-slate-500">There are no active upcoming events posted at this moment.</p>
            </>
          )}
        </div>
      )}

      {/* Events List */}
      <div className="space-y-6">
        {displayedEvents.map((evt) => {
          const isRegistered = registeredIds.includes(evt.id);
          const currentCount = isRegistered ? evt.registeredCount + 1 : evt.registeredCount;
          const isFull = evt.maxSeats ? currentCount >= evt.maxSeats : false;
          const isOverOneDay = isEventOneDayOver(evt.date);
          const formattedPosterUrl = formatGoogleDriveUrl(evt.thumbnailUrl) || evt.thumbnailUrl;

          return (
            <div 
              key={evt.id} 
              className={`bg-white rounded-3xl border transition-all overflow-hidden shadow-sm hover:shadow-xl ${
                isOverOneDay ? 'border-slate-300/80 bg-slate-50/40' : 'border-slate-200'
              }`}
            >
              
              {/* Event Card: Responsive Flex with Left Poster Banner */}
              <div className="flex flex-col lg:flex-row">

                {/* Event Poster / Visual Banner (Displayed Front and Center!) */}
                {evt.thumbnailUrl ? (
                  <div 
                    onClick={() => setFullscreenPoster(formattedPosterUrl)}
                    className="lg:w-64 xl:w-72 bg-slate-950 shrink-0 relative group cursor-pointer overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-200 aspect-[5/7] sm:aspect-[16/9] lg:aspect-auto flex items-center justify-center"
                    title="Click to expand high-resolution event poster"
                  >
                    <img
                      src={formattedPosterUrl}
                      alt={evt.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80";
                      }}
                    />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-3">
                      <span className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center space-x-1.5 shadow-lg">
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>View Full Screen</span>
                      </span>
                    </div>

                    {/* Badge: Archived vs Live */}
                    {isOverOneDay ? (
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/90 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center space-x-1">
                        <Archive className="w-3 h-3 text-amber-400" />
                        <span>Archived (1+ Day Over)</span>
                      </div>
                    ) : (
                      <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-emerald-600/90 text-white text-[10px] font-bold uppercase tracking-wider">
                        Active Event
                      </div>
                    )}

                    {/* Venue tag */}
                    <div className="absolute bottom-3 right-3 bg-slate-950/90 text-amber-300 px-2.5 py-1 rounded-lg text-[10px] font-mono border border-amber-500/30">
                      {evt.venueType || 'In Person'}
                    </div>
                  </div>
                ) : (
                  <div className="hidden lg:flex lg:w-48 bg-slate-100 border-r border-slate-200 items-center justify-center p-4 text-center">
                    <Calendar className="w-10 h-10 text-slate-300" />
                  </div>
                )}

                {/* Event Card Content Details */}
                <div className="p-5 sm:p-7 space-y-3 flex-1 flex flex-col justify-between">
                  
                  <div className="space-y-3">
                    {/* Top Row: Title + Delete Button */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-xs flex items-start justify-between gap-3">
                      <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug flex flex-wrap items-center gap-2">
                        <span>
                          <span className="font-extrabold text-slate-900">Event Title : </span>
                          <span className="font-semibold text-slate-800">{evt.title}</span>
                        </span>
                        {evt.category && evt.category.trim() !== '' && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px]">
                            {evt.category.trim()}
                          </span>
                        )}
                      </h3>

                      {/* Delete Option for Event Post */}
                      {confirmingDeleteId === evt.id ? (
                        <div className="flex items-center space-x-1.5 shrink-0 bg-rose-50 border border-rose-300 p-1.5 rounded-xl">
                          <span className="text-[10px] font-bold text-rose-800">Confirm delete?</span>
                          <button
                            onClick={() => handleDeleteEventPost(evt.id, evt.title)}
                            disabled={isDeletingId === evt.id}
                            className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded-lg transition-all disabled:opacity-50"
                          >
                            {isDeletingId === evt.id ? 'Deleting...' : 'Yes, Delete'}
                          </button>
                          <button
                            onClick={() => setConfirmingDeleteId(null)}
                            className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[10px] rounded-lg transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmingDeleteId(evt.id)}
                          className="px-2.5 py-1 text-[10px] font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg inline-flex items-center space-x-1 transition-all shrink-0 active:scale-95"
                          title="Delete this event post entirely"
                        >
                          <Trash2 className="w-3 h-3 text-rose-600" />
                          <span>Delete</span>
                        </button>
                      )}
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

                    {/* Box 4: Date / Time / Venue */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-800 font-medium">
                      <div>
                        <strong className="font-extrabold text-slate-900">Date : </strong>
                        <span className={isOverOneDay ? 'text-amber-900 font-bold' : ''}>{evt.date}</span>
                        {isOverOneDay && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                            1+ Day Over
                          </span>
                        )}
                      </div>
                      <div>
                        <strong className="font-extrabold text-slate-900">Time : </strong>{evt.time}
                      </div>
                      <div className="truncate">
                        <strong className="font-extrabold text-slate-900">Venue : </strong>{evt.venue}
                      </div>
                    </div>
                  </div>

                  {/* Action & Status Row */}
                  <div className="pt-2">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                      
                      {/* Left Pill: Capacity */}
                      <div className="w-full sm:w-auto bg-sky-100 text-sky-900 border border-sky-200/80 px-4 py-2 rounded-full font-bold text-xs text-center shadow-xs">
                        {currentCount} alumni register{evt.maxSeats ? `/${evt.maxSeats} capacity` : ''}
                      </div>

                      {/* Right Status Pill or Registration Button */}
                      {isOverOneDay || evt.status?.toLowerCase().includes('completed') || evt.status?.toLowerCase().includes('past') || evt.status?.toLowerCase().includes('closed') ? (
                        <div className="w-full sm:w-auto bg-slate-200 text-slate-800 border border-slate-300 px-5 py-2 rounded-xl font-extrabold text-xs text-center shadow-xs flex items-center justify-center space-x-1.5">
                          <Archive className="w-3.5 h-3.5 text-slate-600" />
                          <span>Meeting Concluded & Archived</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRegister(evt.id)}
                          disabled={isRegistered || isFull}
                          className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 ${
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

              </div>

            </div>
          );
        })}
      </div>

      {/* Lightbox Modal for Full-Resolution Poster */}
      {fullscreenPoster && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn"
          onClick={() => setFullscreenPoster(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between text-white">
              <span className="text-xs font-bold text-amber-400 flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>Event Program Poster — High Resolution</span>
              </span>
              <button
                onClick={() => setFullscreenPoster(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                title="Close Lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 sm:p-5 flex justify-center max-h-[80vh] overflow-auto">
              <img
                src={fullscreenPoster}
                alt="Full Resolution Event Poster"
                className="max-h-[75vh] w-auto object-contain rounded-2xl shadow-2xl border border-slate-800"
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
