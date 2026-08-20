export type JobStatusType = 
  | 'Stable' 
  | 'Critical (Seeking Job)' 
  | 'Moderate (Looking for Better)' 
  | string;

export interface UserProfile {
  id?: string;
  name: string;
  email?: string;
  rollNo?: string;
  company?: string;
  designation?: string;
  phone?: string;
  photoUrl?: string;
  isMaster?: boolean;
}

export interface AlumniRecord {
  id: string;
  timestamp?: string;
  name: string;
  email?: string;
  phone?: string;
  rollNo?: string;
  company?: string;
  designation?: string;
  experience?: string;
  address?: string;
  university?: string;
  photo?: string;
  photoUrl?: string;
  resumeUrl?: string;
  jobStatus?: JobStatusType;
  skills?: string[];
  department?: string;
  industry?: string;
  city?: string;
  country?: string;
  isPublic?: boolean;
  hideContact?: boolean;
  isVerified?: boolean;
  batch?: string;
  badges?: string[];
}

export interface JobPost {
  id: string;
  title: string;
  company: string;
  source?: string;
  originalUrl?: string;
  location?: string;
  category?: string;
  requiredSkills?: string[];
  experienceRequired?: string;
  salaryRange?: string;
  postedDate?: string;
  deadline?: string;
  jobDescription?: string;
  posterName?: string;
  posterEmail?: string;
  posterAlumniId?: string;
  status: 'approved' | 'pending' | 'rejected';
  createdAt?: string;
}

export interface EventItem {
  id: string;
  title: string;
  hostName?: string;
  category: 'Event' | 'Reunion' | 'Factory Visit' | 'Workshop' | string;
  date: string;
  time?: string;
  venue?: string;
  venueType?: 'In Person' | 'Online' | string;
  description?: string;
  thumbnailUrl?: string;
  registrationUrl?: string;
  registeredCount?: number;
  maxSeats?: number;
  status: 'Upcoming' | 'Completed' | string;
  createdAt?: string;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  eventTitle: string;
  studentId: string;
  studentName: string;
  memberPhone?: string;
  paymentGateway?: string;
  paymentMethod: 'bKash' | 'Nagad' | 'Bank Transfer' | 'Rocket' | string;
  paymentRefNo?: string;
  senderNumber?: string;
  transactionId: string;
  paymentSubmissionDate?: string;
  emailOrWhatsApp: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedAt: string;
  isVerifiedMember?: boolean;
  matchedAlumniName?: string;
}

export interface EventReview {
  id: string;
  eventId: string;
  studentName: string;
  studentRoll?: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string; // ISO date string
}

export interface TableTalkReview {
  id: string;
  postId: string;
  participantName: string;
  participantRoll?: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface TableTalkPost {
  id: string;
  hostName: string;
  hostEmail?: string;
  hostRoll?: string;
  discussionTopic: string;
  dueDate: string;
  dueTime: string;
  attachedFileLink?: string;
  attachedFileName?: string;
  takenPictureLink?: string;
  publishedAt: string; // ISO date string for 14-day auto-expiration
  whatsappAlertSent?: boolean;
  reviews?: TableTalkReview[];
}

export interface MentorProfile {
  id: string;
  name: string;
  designation?: string;
  company?: string;
  specialization?: string;
  experience?: string;
  availableFor?: string[];
  email?: string;
  linkedin?: string;
  photoUrl?: string;
}

export interface StatsData {
  totalAlumni: number;
  totalBatches: number;
  partnerCompanies: number;
  countriesRepresented: number;
  hiringManagers: number;
  mentors: number;
  activeJobPosts: number;
  criticalJobSeekers: number;
  femaleRatio: string;
  upcomingEvents: number;
}

/**
 * Converts Google Drive sharing links into direct image viewer stream URLs
 * to prevent CORS and rendering errors in <img> elements.
 */
export const formatGoogleDriveUrl = (url?: string): string => {
  if (!url || typeof url !== 'string') return '';
  let trimmed = url.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('https://lh3.googleusercontent.com') || trimmed.startsWith('https://drive.google.com/thumbnail')) {
    return trimmed;
  }

  const match = trimmed.match(/(?:id=|\/d\/)([\w-]+)/);
  if (match && match[1]) {
    return `https://lh3.googleusercontent.com/d/${match[1]}=w800`;
  }

  return trimmed;
};