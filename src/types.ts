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
  meetingLink?: string;
  createdAt?: string;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  eventTitle: string;
  studentId: string;
  studentName: string;
  memberEmail?: string;
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
  emailNotified?: boolean;
  googleFormSynced?: boolean;
  meetingLink?: string;
}

export interface MemberJoinRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  rollNo: string;
  batch?: string;
  company: string;
  designation: string;
  experience?: string;
  address?: string;
  university?: string;
  photoUrl?: string;
  resumeUrl?: string;
  badges?: string[];
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedAt: string;
  emailNotified?: boolean;
  whatsappNotified?: boolean;
}

export interface EmailNotificationPayload {
  to: string;
  subject: string;
  recipientName: string;
  type: 'event_approval' | 'welcome_member' | 'custom';
  contentHtml: string;
  contentText: string;
}

export interface EventReview {
  id: string;
  eventId: string;
  studentName: string;
  studentRoll?: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string; // ISO date string
  likesCount?: number;
  reactions?: { [type: string]: number };
}

export interface TableTalkReview {
  id: string;
  postId: string;
  participantName: string;
  participantRoll?: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
  likesCount?: number;
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
  likesCount?: number;
  sharesCount?: number;
  reactions?: { [type: string]: number };
}

export interface PartnerCompany {
  id: string;
  name: string;
  sector: string; // e.g. 'Garments & RMG', 'Textile Spinning & Weaving', 'Buying House & Sourcing', 'Dyeing & Finishing', 'Brand Liaison Office', 'Apparel Accessories', 'Testing & Compliance', 'IT & Automation'
  location?: string;
  headOffice?: string;
  website?: string;
  logoUrl?: string;
  contactPerson?: string;
  contactDesignation?: string;
  contactEmail?: string;
  contactPhone?: string;
  partnershipType?: 'Corporate Partner' | 'Recruiting Partner' | 'MoU Signed' | 'Alumni Employer' | 'Industry Sponsor' | string;
  description?: string;
  employeeCountRange?: string; // e.g. '500-1000', '5000+'
  createdAt?: string;
  updatedAt?: string;
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

  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  if (trimmed.startsWith('/api/drive-image/') || trimmed.startsWith('https://lh3.googleusercontent.com') || trimmed.startsWith('https://drive.google.com/thumbnail')) {
    return trimmed;
  }

  const match = trimmed.match(/(?:id=|\/d\/)([\w-]+)/);
  if (match && match[1]) {
    return `/api/drive-image/${match[1]}`;
  }

  return trimmed;
};

/**
 * Calculates whether an event date is over 1 full day (24+ hours) in the past.
 * Used to automatically transition expired meetings to the Archive section.
 */
export const isEventOneDayOver = (dateStr?: string): boolean => {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const trimmed = dateStr.trim();
  if (!trimmed) return false;

  try {
    let timestamp = Date.parse(trimmed);

    // If standard parsing failed, try "17-Sep-2026", "17 Sep 2026", "17/09/2026", etc.
    if (isNaN(timestamp)) {
      const matchWord = trimmed.match(/^(\d{1,2})[-/ ]([A-Za-z]{3,9})[-/ ](\d{4})/);
      if (matchWord) {
        timestamp = Date.parse(`${matchWord[2]} ${matchWord[1]}, ${matchWord[3]}`);
      } else {
        const matchNum = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
        if (matchNum) {
          timestamp = Date.parse(`${matchNum[3]}-${matchNum[2]}-${matchNum[1]}`);
        }
      }
    }

    if (isNaN(timestamp)) return false;

    // Check if the current time is more than 1 day (24 hours) after the event timestamp
    const eventTime = timestamp;
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    return (now - eventTime) > oneDayMs;
  } catch {
    return false;
  }
};