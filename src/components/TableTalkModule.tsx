import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  Camera, 
  Calendar, 
  Clock, 
  Star, 
  CheckCircle, 
  Share2, 
  Lock, 
  Unlock, 
  AlertCircle,
  FileText,
  Image as ImageIcon,
  User,
  Trash2,
  ExternalLink,
  MessageCircle,
  Sparkles,
  Video,
  Smile,
  Globe,
  ChevronDown,
  X,
  ThumbsUp,
  Crown,
  CheckCircle2
} from 'lucide-react';
import { TableTalkPost, TableTalkReview, UserProfile, AlumniRecord } from '../types';
import { getInitialTableTalk } from '../utils/dataEngine';

interface TableTalkModuleProps {
  isAuthenticated?: boolean;
  onOpenAuth?: () => void;
  currentUser?: UserProfile | null;
  alumniList?: AlumniRecord[];
  onUpdateCurrentUser?: (user: UserProfile) => void;
}

export const TableTalkModule: React.FC<TableTalkModuleProps> = ({
  isAuthenticated = false,
  onOpenAuth,
  currentUser,
  alumniList = [],
  onUpdateCurrentUser
}) => {
  const [posts, setPosts] = useState<TableTalkPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Facebook composer expanded state
  const [isComposerExpanded, setIsComposerExpanded] = useState(false);

  // Host Input Form state
  const [discussionTopic, setDiscussionTopic] = useState(
    "Please put your comments on USTER Statistics (5% and 25%) for the Preparation of an USTER Report on 30 Ne Carded and Combed Yarn"
  );
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [dueTime, setDueTime] = useState<string>("10:30");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<File | null>(null);
  const [hostName, setHostName] = useState<string>(currentUser?.name || "PGD Alumni Member");
  const [hostRoll, setHostRoll] = useState<string>(currentUser?.rollNo || "PGD-FACULTY");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [showMasterSelector, setShowMasterSelector] = useState<boolean>(false);
  const isMasterUser = Boolean(currentUser?.isMaster);

  // Submission result / notification state
  const [submitting, setSubmitting] = useState(false);
  const [lastSubmissionResult, setLastSubmissionResult] = useState<{
    whatsappAlertText: string;
    message: string;
    post: TableTalkPost;
  } | null>(null);

  // Participant Review Modal / Inline Form state
  const [activePostForReview, setActivePostForReview] = useState<string | null>(null);
  const [reviewerName, setReviewerName] = useState<string>(currentUser?.name || "PGD Alumni Member");
  const [reviewerRoll, setReviewerRoll] = useState<string>(currentUser?.rollNo || "PGD-FACULTY");
  const [rating, setRating] = useState<number>(5);
  const [commentText, setCommentText] = useState<string>("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccessToast, setReviewSuccessToast] = useState<{ postId: string; message: string } | null>(null);

  // Facebook interactions state
  const [likedPosts, setLikedPosts] = useState<{ [key: string]: boolean }>({});
  const [postLikes, setPostLikes] = useState<{ [key: string]: number }>({});
  const [likedComments, setLikedComments] = useState<{ [key: string]: boolean }>({});
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});

  const toggleLikePost = (postId: string) => {
    setLikedPosts(prev => {
      const isCurrentlyLiked = prev[postId];
      setPostLikes(prevLikes => ({
        ...prevLikes,
        [postId]: (prevLikes[postId] || 38) + (isCurrentlyLiked ? -1 : 1)
      }));
      return { ...prev, [postId]: !isCurrentlyLiked };
    });
  };

  const toggleLikeComment = (commentKey: string) => {
    setLikedComments(prev => ({
      ...prev,
      [commentKey]: !prev[commentKey]
    }));
  };

  const handleSendFacebookComment = async (postId: string) => {
    const textToSubmit = commentInputs[postId]?.trim();
    if (!textToSubmit) return;

    setReviewSubmitting(true);
    try {
      const nameToSubmit = reviewerName.trim() || hostName.trim() || currentUser?.name || "PGD Alumni Member";
      const rollToSubmit = reviewerRoll.trim() || hostRoll.trim() || currentUser?.rollNo || "PGD-ALUMNI";

      const fallbackReview: TableTalkReview = {
        id: `TTR-${Date.now().toString().slice(-4)}`,
        postId,
        participantName: nameToSubmit,
        participantRoll: rollToSubmit,
        rating: 5,
        comment: textToSubmit,
        createdAt: new Date().toISOString()
      };

      try {
        const res = await fetch(`/api/tabletalk/${postId}/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participantName: nameToSubmit,
            participantRoll: rollToSubmit,
            rating: 5,
            comment: textToSubmit
          })
        });

        const json = await res.json();
        if (json.success && json.review) {
          fallbackReview.id = json.review.id;
        }
      } catch (apiErr) {}

      setPosts(prevPosts => {
        const updated = prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              reviews: [...(post.reviews || []), fallbackReview]
            };
          }
          return post;
        });
        try {
          localStorage.setItem('butex_table_talk_posts', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      setCommentInputs(prev => ({ ...prev, [postId]: "" }));
      setReviewSuccessToast({ postId, message: "Comment published!" });
      setTimeout(() => setReviewSuccessToast(null), 3000);
    } catch (err) {
      console.error(err);
      alert("Error posting comment.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const getFormattedTimeAgo = (dateStr?: string) => {
    if (!dateStr) return '1m';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    if (isNaN(diffMs)) return '1m';
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  // Fetch Table Talk posts
  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      let loadedPosts: TableTalkPost[] = [];
      try {
        const res = await fetch('/api/tabletalk');
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data) && json.data.length > 0) {
            loadedPosts = json.data;
          }
        }
      } catch (apiErr) {}

      if (loadedPosts.length === 0) {
        loadedPosts = getInitialTableTalk();
      }
      setPosts(loadedPosts);
    } catch (err) {
      console.error(err);
      setPosts(getInitialTableTalk());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Update host name if currentUser changes
  useEffect(() => {
    if (currentUser?.name) {
      setHostName(currentUser.name);
      setReviewerName(currentUser.name);
    }
    if (currentUser?.rollNo) {
      setHostRoll(currentUser.rollNo);
      setReviewerRoll(currentUser.rollNo);
    }
  }, [currentUser]);

  // File Upload Handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0]);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCapturedPhoto(e.target.files[0]);
    }
  };

  // Submit Host Question / Industry News
  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discussionTopic.trim()) {
      alert("Please enter a discussion topic or question text.");
      return;
    }

    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      else alert("Sign in to unlock posting and comments!");
      return;
    }

    setSubmitting(true);
    try {
      // Simulate object URL links for attached file and photo if uploaded
      const fileUrl = attachedFile 
        ? `https://drive.google.com/file/d/upload_${Date.now()}/view?filename=${encodeURIComponent(attachedFile.name)}`
        : "";
      const photoUrl = capturedPhoto 
        ? URL.createObjectURL(capturedPhoto)
        : "";

      const newPost: TableTalkPost = {
        id: `TT-${Date.now().toString().slice(-4)}`,
        hostName: hostName || currentUser?.name || "PGD Alumni Member",
        hostEmail: currentUser?.email || "member@butex.edu.bd",
        hostRoll: hostRoll || currentUser?.rollNo || "PGD-ALUMNI",
        discussionTopic,
        dueDate,
        dueTime,
        attachedFileLink: fileUrl,
        attachedFileName: attachedFile ? attachedFile.name : "",
        takenPictureLink: photoUrl,
        publishedAt: new Date().toISOString(),
        whatsappAlertSent: true,
        reviews: []
      };

      try {
        const res = await fetch('/api/tabletalk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hostName: hostName || currentUser?.name || "PGD Alumni Member",
            hostEmail: currentUser?.email || "member@butex.edu.bd",
            hostRoll: hostRoll || currentUser?.rollNo || "PGD-ALUMNI",
            discussionTopic,
            dueDate,
            dueTime,
            attachedFileLink: fileUrl,
            attachedFileName: attachedFile ? attachedFile.name : "",
            takenPictureLink: photoUrl
          })
        });

        const json = await res.json();
        if (json.success && json.post) {
          newPost.id = json.post.id;
        }
      } catch (apiErr) {}

      setLastSubmissionResult({
        whatsappAlertText: `*WhatsApp Notification to PGD Group:*\nNew Table Talk Topic: "${discussionTopic}"\nHost: ${newPost.hostName} (${newPost.hostRoll})\nDiscussion Date: ${dueDate} (${dueTime})`,
        message: "Table Talk discussion published successfully!",
        post: newPost
      });

      setPosts(prev => {
        const updated = [newPost, ...prev];
        try {
          localStorage.setItem('butex_table_talk_posts', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      setDiscussionTopic("");
      setAttachedFile(null);
      setCapturedPhoto(null);
    } catch (err) {
      console.error("Submission error:", err);
      alert("Network error submitting Table Talk post.");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Participant Review / Comment
  const handleSubmitReview = async (postId: string) => {
    if (!commentText.trim()) {
      alert("Please write a comment or review before submitting.");
      return;
    }

    setReviewSubmitting(true);
    try {
      const nameToSubmit = reviewerName.trim() || hostName.trim() || currentUser?.name || "PGD Alumni Member";
      const rollToSubmit = reviewerRoll.trim() || hostRoll.trim() || currentUser?.rollNo || "PGD-ALUMNI";

      const newReview: TableTalkReview = {
        id: `TTR-${Date.now().toString().slice(-4)}`,
        postId,
        participantName: nameToSubmit,
        participantRoll: rollToSubmit,
        rating,
        comment: commentText,
        createdAt: new Date().toISOString()
      };

      try {
        const res = await fetch(`/api/tabletalk/${postId}/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participantName: nameToSubmit,
            participantRoll: rollToSubmit,
            rating,
            comment: commentText
          })
        });

        const json = await res.json();
        if (json.success && json.review) {
          newReview.id = json.review.id;
        }
      } catch (apiErr) {}

      // Update local state immediately so review appears live
      setPosts(prevPosts => {
        const updated = prevPosts.map(post => {
          if (post.id === postId) {
            const updatedReviews = [newReview, ...(post.reviews || [])];
            return {
              ...post,
              reviews: updatedReviews
            };
          }
          return post;
        });
        try {
          localStorage.setItem('butex_table_talk_posts', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      setCommentText("");
      setReviewSuccessToast({ postId, message: "Review posted successfully!" });
      setTimeout(() => setReviewSuccessToast(null), 5000);
      setActivePostForReview(null);
    } catch (err) {
      console.error("Review submit error:", err);
      alert("Error submitting review.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const categories = [
    "All",
    "Yarn Quality & USTER",
    "Dyeing & Finishing",
    "Apparel Merchandising",
    "IE & Operations",
    "Supply Chain"
  ];

  const facultySpeakers = [
    { name: "Dr. Kamruzzaman", title: "Head of Textile Eng., BUTEX", topics: 14, status: "Active" },
    { name: "Prof. Dr. Shah Alimuzzaman", title: "Dean & PGD Coordinator", topics: 8, status: "Active" },
    { name: "Engr. Mahmudul Hasan", title: "Senior GM, Quality Assurance", topics: 11, status: "Active" },
    { name: "Dr. Reazuddin Ahmed", title: "Associate Professor, Wet Processing", topics: 6, status: "Offline" },
  ];

  // Filtered posts
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.discussionTopic.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.hostName.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedCategory === "All") return matchesSearch;
    return matchesSearch && post.discussionTopic.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  return (
    <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0B192C] via-[#002147] to-[#0B192C] rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-[#FFBF00]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FFBF00]/20 border border-[#FFBF00]/40 rounded-full text-[#FFBF00] text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Technical QA & Industry Forum</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-[#FFBF00]" />
              Table Talk Hub
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              Engage directly with faculty members, industry experts, and senior apparel GMs. Post technical inquiries, share factory observations, and join active peer discussions.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-3 bg-slate-900/90 p-3 rounded-xl border border-slate-700 text-xs text-slate-300 shadow-inner">
              <Clock className="w-5 h-5 text-[#FFBF00] shrink-0 animate-pulse" />
              <div>
                <span className="block text-slate-400 font-medium text-[11px]">Auto Erase Policy</span>
                <span className="text-white font-bold">14 Days Expiration</span>
              </div>
            </div>

            <a
              href="https://wa.me/?text=Join%20BUTEX%20Table%20Talk%20Discussions"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition-all shrink-0"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Join WhatsApp Group</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main 12-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (8 cols): Host Form + Active Discussion Feed */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Facebook-Style Post Creation Box */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 space-y-3 relative transition-all">
            {/* Lock Banner if Guest */}
            {!isAuthenticated && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-amber-900 text-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span><strong>Guest Mode:</strong> Sign in to publish topics or post comments.</span>
                </div>
                <button
                  onClick={onOpenAuth}
                  className="px-3 py-1 bg-[#002147] text-white hover:bg-slate-800 font-bold rounded-lg shrink-0"
                >
                  Sign In
                </button>
              </div>
            )}

            {/* Header row: Facebook Avatar + Pill Input */}
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-[#002147] text-[#FFBF00] font-extrabold text-sm flex items-center justify-center border-2 border-slate-100 shadow-xs">
                  {hostName ? hostName.slice(0, 2).toUpperCase() : 'AM'}
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" title="Online" />
              </div>

              {/* Facebook Rounded Input Pill ("What's on your mind, Nayeem?") */}
              <div
                onClick={() => setIsComposerExpanded(true)}
                className="bg-[#F0F2F5] hover:bg-[#E4E6EB] transition-colors rounded-full px-4 py-2.5 flex-1 flex items-center justify-between cursor-pointer group"
              >
                <span className="text-slate-500 text-sm font-normal truncate">
                  {`What's on your mind, ${hostName || 'Alumni Member'}?`}
                </span>

                {/* Quick Action Icons inside Pill (Exact Facebook UI match) */}
                <div className="flex items-center gap-2 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0 pl-2">
                  <Video className="w-5 h-5 text-[#F3425F] hover:scale-110 transition-transform" />
                  <ImageIcon className="w-5 h-5 text-[#45BD62] hover:scale-110 transition-transform" />
                  <Smile className="w-5 h-5 text-[#F7B928] hover:scale-110 transition-transform" />
                </div>
              </div>
            </div>

            {/* Facebook Bottom Action Bar (Live video, Photo/video, File Attachment) */}
            {!isComposerExpanded && (
              <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between text-xs font-semibold text-slate-600">
                <button
                  type="button"
                  onClick={() => setIsComposerExpanded(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-700"
                >
                  <Video className="w-5 h-5 text-[#F3425F]" />
                  <span>Live video</span>
                </button>

                <label className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-slate-700">
                  <ImageIcon className="w-5 h-5 text-[#45BD62]" />
                  <span>Photo/video</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                      handlePhotoSelect(e);
                      setIsComposerExpanded(true);
                    }}
                    className="hidden"
                  />
                </label>

                <label className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-slate-700">
                  <Paperclip className="w-5 h-5 text-[#1877F2]" />
                  <span>Attach File</span>
                  <input
                    type="file"
                    onChange={(e) => {
                      handleFileSelect(e);
                      setIsComposerExpanded(true);
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* Expanded Facebook Post Form */}
            {isComposerExpanded && (
              <form onSubmit={handleSubmitPost} className="pt-2 space-y-4 border-t border-slate-100 animate-fadeIn">
                {/* Expanded Header info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-[#002147] text-[#FFBF00] font-bold text-sm flex items-center justify-center">
                      {hostName ? hostName.slice(0, 2).toUpperCase() : 'AM'}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm leading-tight">{hostName}</h3>
                      <div className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-[11px] px-2 py-0.5 rounded-md font-medium mt-0.5">
                        <Globe className="w-3 h-3 text-slate-500" />
                        <span>Public / PGD Members</span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsComposerExpanded(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition-colors"
                    title="Close Composer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Logged in member status or Master Admin switcher */}
                {isMasterUser || showMasterSelector ? (
                  <div className="bg-amber-50/90 border border-amber-200/80 p-2.5 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-950">
                      <span className="flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5 text-amber-600" />
                        <span>Master Admin Mode: Post as Any Member</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowMasterSelector(false)}
                        className="text-[10px] font-bold text-amber-800 hover:text-amber-950 underline"
                      >
                        Hide Selector
                      </button>
                    </div>
                    <select
                      value={selectedMemberId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setSelectedMemberId(id);
                        const member = alumniList.find(a => a.id === id);
                        if (member) {
                          setHostName(member.name);
                          setHostRoll(member.rollNo || member.slNo || "PGD-ALUMNI");
                          setReviewerName(member.name);
                          setReviewerRoll(member.rollNo || member.slNo || "PGD-ALUMNI");
                          if (onUpdateCurrentUser) {
                            onUpdateCurrentUser({
                              ...currentUser,
                              name: member.name,
                              rollNo: member.rollNo || member.slNo || "PGD-ALUMNI",
                              email: member.email || "",
                              company: member.company || "",
                              designation: member.designation || ""
                            });
                          }
                        }
                      }}
                      className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
                    >
                      <option value="">-- Choose Member Profile to Post As --</option>
                      {alumniList.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.rollNo || 'PGD'}) {a.designation ? `- ${a.designation}` : ''} {a.company ? `at ${a.company}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="bg-emerald-50/90 border border-emerald-200/90 p-2.5 rounded-xl flex items-center justify-between text-xs text-emerald-950 font-medium">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Posting as: <strong className="font-extrabold text-emerald-950">{hostName}</strong> <span className="font-mono text-emerald-800 text-[11px]">({hostRoll})</span></span>
                    </div>
                  </div>
                )}

                {/* Host Name & Roll Input row (Master Mode only) */}
                {(isMasterUser || showMasterSelector) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Custom Post Name</label>
                      <input
                        type="text"
                        value={hostName}
                        onChange={(e) => {
                          setHostName(e.target.value);
                          setReviewerName(e.target.value);
                          if (onUpdateCurrentUser) {
                            onUpdateCurrentUser({ ...currentUser, name: e.target.value });
                          }
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 outline-none focus:ring-1 focus:ring-[#002147]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Custom ID / Roll</label>
                      <input
                        type="text"
                        value={hostRoll}
                        onChange={(e) => {
                          setHostRoll(e.target.value);
                          setReviewerRoll(e.target.value);
                          if (onUpdateCurrentUser) {
                            onUpdateCurrentUser({ ...currentUser, rollNo: e.target.value });
                          }
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 outline-none focus:ring-1 focus:ring-[#002147]"
                      />
                    </div>
                  </div>
                )}

                {/* Main Textarea */}
                <div>
                  <textarea
                    rows={4}
                    value={discussionTopic}
                    onChange={(e) => setDiscussionTopic(e.target.value)}
                    placeholder={`What's on your mind, ${hostName || 'Alumni Member'}?`}
                    className="w-full p-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 text-sm sm:text-base leading-relaxed placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#002147] focus:border-transparent outline-none transition-all resize-y"
                    required
                  />
                </div>

                {/* Attached Media Badges */}
                {(attachedFile || capturedPhoto) && (
                  <div className="flex flex-wrap gap-2 p-2 bg-slate-100 rounded-xl border border-slate-200">
                    {attachedFile && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold">
                        <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                        <span>{attachedFile.name}</span>
                        <button type="button" onClick={() => setAttachedFile(null)} className="hover:text-red-600 font-bold ml-1">✕</button>
                      </span>
                    )}
                    {capturedPhoto && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold">
                        <Camera className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Photo Attached</span>
                        <button type="button" onClick={() => setCapturedPhoto(null)} className="hover:text-red-600 font-bold ml-1">✕</button>
                      </span>
                    )}
                  </div>
                )}

                {/* Facebook "Add to your post" toolbar */}
                <div className="p-3 bg-white border border-slate-300 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
                  <span className="text-xs font-extrabold text-slate-700">Add to your post:</span>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Photo Button */}
                    <label className="p-2 hover:bg-slate-100 rounded-full cursor-pointer text-[#45BD62] transition-colors" title="Attach Photo">
                      <Camera className="w-5 h-5" />
                      <input type="file" accept="image/*" capture="environment" onChange={handlePhotoSelect} className="hidden" />
                    </label>

                    {/* File Attachment Button */}
                    <label className="p-2 hover:bg-slate-100 rounded-full cursor-pointer text-[#1877F2] transition-colors" title="Attach Document">
                      <Paperclip className="w-5 h-5" />
                      <input type="file" onChange={handleFileSelect} className="hidden" />
                    </label>

                    {/* Date Selector */}
                    <div className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-xl text-xs text-slate-700 cursor-pointer transition-colors" title="Select Due Date">
                      <Calendar className="w-4 h-4 text-[#F7B928]" />
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
                      />
                    </div>

                    {/* Time Selector */}
                    <div className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-xl text-xs text-slate-700 cursor-pointer transition-colors" title="Select Due Time">
                      <Clock className="w-4 h-4 text-[#9360F7]" />
                      <input
                        type="time"
                        value={dueTime}
                        onChange={(e) => setDueTime(e.target.value)}
                        className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-[#002147] hover:bg-slate-800 text-white font-extrabold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <span>Publishing to Table Talk...</span>
                  ) : (
                    <>
                      <span>Post Discussion</span>
                      <Send className="w-4 h-4 text-[#FFBF00]" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

            {/* Successful Dispatch Toast / Notification */}
            {lastSubmissionResult && (
              <div className="mt-6 p-5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between text-emerald-800">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span>Published to Table Talk & WhatsApp Alert Triggered!</span>
                  </div>
                  <button 
                    onClick={() => setLastSubmissionResult(null)}
                    className="text-emerald-600 hover:text-emerald-900 text-xs font-bold"
                  >
                    Dismiss ✕
                  </button>
                </div>

                <div className="bg-white p-3 rounded-lg border border-emerald-100 text-xs text-slate-700 space-y-1 font-mono">
                  <p className="font-semibold text-emerald-900">{lastSubmissionResult.whatsappAlertText}</p>
                  <p className="text-slate-500">✔ Automatically logged into Google Sheet (Column A: Topic, Column B: File, Column C: Picture)</p>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`${hostName} requested to join on table talk: "${discussionTopic.slice(0, 80)}..." Published on ${dueDate}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Share Alert to WhatsApp Group</span>
                  </a>
                </div>
              </div>
            )}

          {/* Discussion Category Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Search discussion topics or hosts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#002147] outline-none"
                />
                <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 w-full sm:w-auto justify-end">
                <span>Filter topics:</span>
                <span className="font-bold text-[#002147] bg-slate-100 px-2 py-0.5 rounded">
                  {filteredPosts.length} Results
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-[#002147] text-[#FFBF00] shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Participant Section: Active Discussions & Reviews */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#002147] mx-auto mb-3" />
                <p className="text-sm text-slate-500 font-medium">Loading Table Talk discussions...</p>
              </div>
            ) : error ? (
              <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center text-red-700 text-sm">
                {error}
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 space-y-3">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-700">No Active Table Talk Topics Found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Be the first host to post a question or news topic above to initiate peer discussion!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredPosts.map((post) => {
                  const reviews = post.reviews || [];
                  const avgRating = reviews.length > 0 
                    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
                    : "4.0";

                  return (
                    <div
                      key={post.id}
                      className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 hover:shadow-lg transition-all space-y-6"
                    >
                      {/* Post Top Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-[#002147] text-[#FFBF00] font-extrabold flex items-center justify-center text-sm shadow">
                            {post.hostName ? post.hostName.slice(0, 2).toUpperCase() : 'DR'}
                          </div>
                          <div>
                            <h3 className="text-base font-extrabold text-[#002147] flex items-center gap-2">
                              <span>{post.hostName}</span>
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                                Host
                              </span>
                            </h3>
                            <p className="text-xs text-slate-500">
                              Published: {new Date(post.publishedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
                          <div className="flex items-center gap-1 font-semibold text-slate-800">
                            <Calendar className="w-3.5 h-3.5 text-[#002147]" />
                            <span>Due: {post.dueDate}</span>
                          </div>
                          <div className="flex items-center gap-1 font-semibold text-slate-800">
                            <Clock className="w-3.5 h-3.5 text-[#002147]" />
                            <span>{post.dueTime}</span>
                          </div>
                        </div>
                      </div>

                      {/* Post Topic Content */}
                      <div className="space-y-3">
                        <p className="text-slate-900 text-base font-medium leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                          "{post.discussionTopic}"
                        </p>

                        {/* Attachments / Photos */}
                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          {post.attachedFileLink && (
                            <a
                              href={post.attachedFileLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-all"
                            >
                              <FileText className="w-4 h-4 text-blue-600" />
                              <span>{post.attachedFileName || 'View Attached Document'}</span>
                              <ExternalLink className="w-3 h-3 text-blue-500" />
                            </a>
                          )}

                          {post.takenPictureLink && (
                            <a
                              href={post.takenPictureLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold transition-all"
                            >
                              <ImageIcon className="w-4 h-4 text-purple-600" />
                              <span>View Taken Photo</span>
                              <ExternalLink className="w-3 h-3 text-purple-500" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Facebook Post Reaction & Interaction Bar */}
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        {/* Reaction Counter Row */}
                        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                          <div className="flex items-center gap-1.5">
                            <div className="flex -space-x-1 items-center">
                              <span className="w-4.5 h-4.5 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-[10px] shadow-2xs">👍</span>
                              <span className="w-4.5 h-4.5 rounded-full bg-[#F3425F] text-white flex items-center justify-center text-[10px] shadow-2xs">❤️</span>
                            </div>
                            <span className="font-extrabold text-slate-700">{postLikes[post.id] || 38}</span>
                          </div>
                          <div className="flex items-center gap-3 font-semibold text-slate-500">
                            <span className="hover:underline cursor-pointer">{reviews.length} {reviews.length === 1 ? 'comment' : 'comments'}</span>
                            <span>•</span>
                            <span className="hover:underline cursor-pointer">1 share</span>
                          </div>
                        </div>

                        {/* Facebook Action Buttons (Like, Comment, Share) */}
                        <div className="border-t border-b border-slate-200 py-1 flex items-center justify-between text-xs font-bold text-slate-600">
                          <button
                            type="button"
                            onClick={() => toggleLikePost(post.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 hover:bg-slate-100 rounded-xl transition-colors ${
                              likedPosts[post.id] ? 'text-[#1877F2] font-extrabold' : 'text-slate-600'
                            }`}
                          >
                            <ThumbsUp className={`w-4 h-4 ${likedPosts[post.id] ? 'fill-[#1877F2] text-[#1877F2]' : 'text-slate-500'}`} />
                            <span>Like</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const inputEl = document.getElementById(`comment-input-${post.id}`);
                              if (inputEl) inputEl.focus();
                            }}
                            className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
                          >
                            <MessageCircle className="w-4 h-4 text-slate-500" />
                            <span>Comment</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const text = `BUTEX Table Talk: "${post.discussionTopic.slice(0, 80)}..."`;
                              if (navigator.share) {
                                navigator.share({ title: 'BUTEX Table Talk', text, url: window.location.href }).catch(() => {});
                              } else {
                                navigator.clipboard.writeText(`${text} - ${window.location.href}`);
                                alert("Link copied to clipboard!");
                              }
                            }}
                            className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
                          >
                            <Share2 className="w-4 h-4 text-slate-500" />
                            <span>Share</span>
                          </button>
                        </div>

                        {/* Comment Section Header (Exact Facebook 'Most relevant ▾') */}
                        <div className="flex items-center justify-between pt-1 pb-1">
                          <button type="button" className="inline-flex items-center gap-1 hover:bg-slate-100 px-2 py-1 rounded-lg transition-colors text-xs font-bold text-slate-600">
                            <span>Most relevant</span>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                          </button>
                        </div>

                        {/* Facebook Comments List */}
                        {reviews.length > 0 && (
                          <div className="space-y-3 pt-1">
                            {reviews.map((rev, revIdx) => {
                              const initial = rev.participantName ? rev.participantName.charAt(0).toUpperCase() : 'M';
                              const avatarColors = [
                                'bg-[#002147] text-[#FFBF00]',
                                'bg-[#1877F2] text-white',
                                'bg-emerald-600 text-white',
                                'bg-purple-600 text-white',
                                'bg-indigo-600 text-white'
                              ];
                              const colorClass = avatarColors[revIdx % avatarColors.length];
                              const commentKey = rev.id || `${post.id}-${revIdx}`;

                              return (
                                <div key={commentKey} className="flex items-start gap-2.5 group animate-fadeIn">
                                  {/* Avatar */}
                                  <div className={`w-8 h-8 rounded-full ${colorClass} font-extrabold text-xs flex items-center justify-center shrink-0 border border-slate-200 shadow-2xs mt-0.5`}>
                                    {initial}
                                  </div>

                                  {/* Comment Bubble & Actions */}
                                  <div className="flex-1 space-y-1">
                                    <div className="bg-[#F0F2F5] hover:bg-[#E4E6EB]/80 transition-colors rounded-2xl px-3.5 py-2.5 inline-block max-w-[92%] sm:max-w-[95%]">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-extrabold text-xs text-slate-900 hover:underline cursor-pointer">
                                          {rev.participantName}
                                        </span>
                                        {rev.participantRoll && (
                                          <span className="text-[10px] text-slate-500 font-mono font-normal">
                                            ({rev.participantRoll})
                                          </span>
                                        )}
                                      </div>

                                      <p className="text-xs text-slate-800 leading-normal mt-1 font-normal">
                                        {rev.comment}
                                      </p>
                                    </div>

                                    {/* Facebook Comment Actions: Like · Reply · 1m */}
                                    <div className="flex items-center gap-3 pl-3 text-[11px] font-bold text-slate-500">
                                      <button
                                        type="button"
                                        onClick={() => toggleLikeComment(commentKey)}
                                        className={`hover:underline ${likedComments[commentKey] ? 'text-[#1877F2] font-extrabold' : 'hover:text-slate-700'}`}
                                      >
                                        Like
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setCommentInputs(prev => ({
                                            ...prev,
                                            [post.id]: `@${rev.participantName} `
                                          }));
                                          const inputEl = document.getElementById(`comment-input-${post.id}`);
                                          if (inputEl) inputEl.focus();
                                        }}
                                        className="hover:underline hover:text-slate-700"
                                      >
                                        Reply
                                      </button>
                                      <span className="text-[10px] text-slate-400 font-normal">
                                        {getFormattedTimeAgo(rev.createdAt)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Facebook "Write a comment..." Input Bar */}
                        <div className="flex items-center gap-2.5 pt-3">
                          <div className="w-8 h-8 rounded-full bg-[#002147] text-[#FFBF00] font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                            {hostName ? hostName.slice(0, 2).toUpperCase() : (currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'AM')}
                          </div>

                          <div className="flex-1 bg-[#F0F2F5] hover:bg-[#E4E6EB]/70 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#002147]/20 border border-transparent focus-within:border-slate-300 rounded-full px-4 py-2 flex items-center gap-2 transition-all shadow-2xs">
                            <input
                              id={`comment-input-${post.id}`}
                              type="text"
                              placeholder="Write a comment..."
                              value={commentInputs[post.id] || ""}
                              onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendFacebookComment(post.id);
                                }
                              }}
                              className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-500 outline-none font-normal"
                            />

                            <div className="flex items-center gap-2 text-slate-400 shrink-0">
                              <Smile className="w-4 h-4 hover:text-amber-500 cursor-pointer transition-colors" title="Insert Emoji" />
                              <Camera className="w-4 h-4 hover:text-emerald-500 cursor-pointer transition-colors" title="Attach Photo" />
                              <button
                                type="button"
                                onClick={() => handleSendFacebookComment(post.id)}
                                disabled={!commentInputs[post.id]?.trim() || reviewSubmitting}
                                className="p-1 text-[#1877F2] hover:scale-110 disabled:opacity-30 disabled:hover:scale-100 transition-transform"
                                title="Post Comment"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Success Toast */}
                        {reviewSuccessToast?.postId === post.id && (
                          <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between animate-fadeIn mt-2">
                            <span className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>{reviewSuccessToast.message}</span>
                            </span>
                            <button onClick={() => setReviewSuccessToast(null)} className="text-xs text-emerald-700 hover:text-emerald-900 font-bold">
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Bento Sidebar Widgets */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Bento Card 1: Key Forum Guidelines & Expiration Rule */}
          <div className="bg-gradient-to-br from-[#0B192C] to-[#002147] text-white p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
              <MessageSquare className="w-28 h-28 text-white" />
            </div>
            <div className="flex items-center gap-2 text-[#FFBF00] font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Forum Regulations</span>
            </div>
            <h3 className="text-lg font-bold text-white">14-Day Auto Cleanup Policy</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              To keep technical discussions fresh and relevant, all Table Talk posts are auto-archived after 14 days (336 hours). Submissions are recorded synchronously into Google Sheets.
            </p>

            <div className="space-y-2 pt-2 border-t border-slate-700/60 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>Google Sheet Integration:</span>
                <span className="font-bold text-emerald-400">Connected ✔</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>WhatsApp Notification:</span>
                <span className="font-bold text-emerald-400">Active ✔</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Expiration Timer:</span>
                <span className="font-bold text-amber-400">336 Hours</span>
              </div>
            </div>
          </div>

          {/* Bento Card 2: Faculty & Key Industry Speakers */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#002147] flex items-center gap-2">
                <User className="w-4 h-4 text-[#FFBF00]" />
                <span>Featured Hosts & Faculty</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-semibold">BUTEX PGD</span>
            </div>

            <div className="space-y-3">
              {facultySpeakers.map((spk, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/70 transition-all">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#002147] text-[#FFBF00] font-bold text-xs flex items-center justify-center">
                      {spk.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{spk.name}</h4>
                      <p className="text-[10px] text-slate-500">{spk.title}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    spk.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {spk.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bento Card 3: Quick Stats */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-lg space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Table Talk Analytics
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 text-center">
                <span className="text-2xl font-extrabold text-[#FFBF00] block">{posts.length}</span>
                <span className="text-[10px] text-slate-400 font-medium">Active Topics</span>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 text-center">
                <span className="text-2xl font-extrabold text-emerald-400 block">
                  {posts.reduce((acc, p) => acc + (p.reviews?.length || 0), 0)}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Total Reviews</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
