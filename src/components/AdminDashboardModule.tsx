import React, { useState, useEffect } from 'react';
import { 
  CheckCircle,
  CheckCircle2, 
  XCircle, 
  Clock, 
  Key, 
  Sparkles, 
  Users, 
  Building2, 
  Briefcase,
  Calendar,
  Send,
  Upload,
  MessageSquare,
  Check,
  X,
  ExternalLink,
  FileSpreadsheet,
  Download,
  Link,
  Save,
  PlusCircle,
  Shield,
  Crown,
  Lock,
  Unlock,
  Trash2,
  AlertTriangle,
  Mail,
  UserCheck,
  UserPlus,
  RotateCcw,
  Copy,
  Settings,
  Archive,
  FileText,
  Edit3
} from 'lucide-react';
import { JobPost, EventItem, EventRegistration, TableTalkPost, MemberJoinRequest, AlumniRecord, formatGoogleDriveUrl, isEventOneDayOver } from '../types';
import { WhapiSettingsModule } from './WhapiSettingsModule';
import { AdminCompaniesModule } from './AdminCompaniesModule';

interface AdminDashboardModuleProps {
  adminJobs: JobPost[];
  onUpdateJobStatus: (id: string, status: 'approved' | 'rejected' | 'pending') => void;
  onDeleteJob?: (id: string, title: string) => void;
  onRefreshJobs?: () => void;
  events?: EventItem[];
  onRefreshEvents?: () => void;
  alumniList?: AlumniRecord[];
  onSelectCompany?: (company: string) => void;
}

type AdminTab = 'jobs' | 'events' | 'registrations' | 'member-requests' | 'directory' | 'companies' | 'table-talk' | 'whapi-config' | 'apps-script';
type AdminRole = 'super' | 'admin' | null;

export const AdminDashboardModule: React.FC<AdminDashboardModuleProps> = ({
  adminJobs,
  onUpdateJobStatus,
  onDeleteJob,
  onRefreshJobs,
  events = [],
  onRefreshEvents,
  alumniList = [],
  onSelectCompany
}) => {
  const [role, setRole] = useState<AdminRole>(() => {
    try {
      const savedExpiry = localStorage.getItem('butex_admin_session_expiry');
      const savedRole = localStorage.getItem('butex_admin_role') as AdminRole;
      if (savedExpiry && savedRole && Date.now() < parseInt(savedExpiry, 10)) {
        return savedRole;
      }
    } catch (e) {}
    return null;
  });
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    try {
      const savedExpiry = localStorage.getItem('butex_admin_session_expiry');
      if (savedExpiry && Date.now() < parseInt(savedExpiry, 10)) {
        return true;
      }
    } catch (e) {}
    return false;
  });
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('jobs');

  // Guard: Automatically redirect non-super admins away from super-admin-only tabs (whapi-config, apps-script)
  useEffect(() => {
    if (role === 'admin' && (activeTab === 'whapi-config' || activeTab === 'apps-script')) {
      setActiveTab('jobs');
    }
  }, [role, activeTab]);

  // Elevation Modal State
  const [elevateModalOpen, setElevateModalOpen] = useState(false);
  const [superPasscodeAttempt, setSuperPasscodeAttempt] = useState('');
  const [elevateError, setElevateError] = useState<string | null>(null);

  // Table Talk moderation state
  const [tableTalkPosts, setTableTalkPosts] = useState<TableTalkPost[]>([]);
  const [ttLoading, setTtLoading] = useState(false);

  // Cache Purge & Apps Script State
  const [cachePurging, setCachePurging] = useState(false);
  const [cachePurgeMsg, setCachePurgeMsg] = useState<string | null>(null);
  const [appsScriptCode, setAppsScriptCode] = useState<string>('');
  const [loadingCode, setLoadingCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handlePurgeCache = async () => {
    if (!window.confirm("Are you sure you want to purge stored cache memory? This will flush browser storage and query fresh data directly from the server & Google Sheets.")) return;
    setCachePurging(true);
    try {
      const roleBackup = localStorage.getItem('butex_admin_role');
      const expiryBackup = localStorage.getItem('butex_admin_session_expiry');
      const tokenBackup = localStorage.getItem('butex_admin_token');
      
      localStorage.clear();
      sessionStorage.clear();

      if (roleBackup) localStorage.setItem('butex_admin_role', roleBackup);
      if (expiryBackup) localStorage.setItem('butex_admin_session_expiry', expiryBackup);
      if (tokenBackup) localStorage.setItem('butex_admin_token', tokenBackup);

      const res = await fetch('/api/admin/clear-cache', { method: 'POST' });
      const data = await res.json();
      setCachePurgeMsg(data.message || "✓ Stored cache memory purged successfully!");
      if (onRefreshEvents) onRefreshEvents();
      fetchRegistrations();
      fetchTableTalkPosts();
    } catch (err) {
      setCachePurgeMsg("✓ Local cache cleared.");
    } finally {
      setCachePurging(false);
      setTimeout(() => setCachePurgeMsg(null), 5000);
    }
  };

  const fetchAppsScriptCode = async () => {
    setLoadingCode(true);
    try {
      const res = await fetch('/api/apps-script-code');
      const text = await res.text();
      setAppsScriptCode(text);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCode(false);
    }
  };

  const fetchTableTalkPosts = () => {
    setTtLoading(true);
    fetch('/api/admin/tabletalk')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTableTalkPosts(data.data || []);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setTtLoading(false));
  };

  const handleDeleteTableTalkPost = async (postId: string, topic: string) => {
    if (!window.confirm(`Are you sure you want to delete Table Talk discussion: "${topic.slice(0, 50)}..."?`)) return;
    try {
      const res = await fetch(`/api/admin/tabletalk/${postId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        try {
          const cached = localStorage.getItem('butex_table_talk_posts');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) {
              const updated = parsed.filter((p: any) => p.id !== postId);
              localStorage.setItem('butex_table_talk_posts', JSON.stringify(updated));
            }
          }
        } catch (e) {}
        setTableTalkPosts(prev => prev.filter(p => p.id !== postId));
        window.dispatchEvent(new CustomEvent('tabletalk-changed', { detail: { action: 'delete', postId } }));
        alert("✓ Table Talk discussion deleted successfully!");
        fetchTableTalkPosts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAllTableTalk = async () => {
    if (!window.confirm("Are you sure you want to delete ALL Table Talk discussions and comments? This will completely clear the forum queue.")) return;
    try {
      const res = await fetch('/api/admin/tabletalk/clear-all', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        try {
          localStorage.setItem('butex_table_talk_posts', JSON.stringify([]));
        } catch (e) {}
        setTableTalkPosts([]);
        window.dispatchEvent(new CustomEvent('tabletalk-changed', { detail: { action: 'clear-all' } }));
        alert("✓ All Table Talk discussions and comments cleared successfully!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Event Publish Form State
  const [evtTitle, setEvtTitle] = useState('');
  const [evtHost, setEvtHost] = useState('');
  const [evtDetails, setEvtDetails] = useState('');
  const [evtDate, setEvtDate] = useState('');
  const [evtTime, setEvtTime] = useState('');
  const [evtVenue, setEvtVenue] = useState('In Person');
  const [evtVenueName, setEvtVenueName] = useState('');
  const [evtMeetingLink, setEvtMeetingLink] = useState('');
  const [evtThumbnail, setEvtThumbnail] = useState('');
  const [evtCategory, setEvtCategory] = useState('');
  const [evtSuccess, setEvtSuccess] = useState<string | null>(null);

  // Erase Event State
  const [confirmingEraseId, setConfirmingEraseId] = useState<string | null>(null);
  const [erasingId, setErasingId] = useState<string | null>(null);
  const [eraseMsg, setEraseMsg] = useState<{ text: string; success: boolean } | null>(null);

  // Registrations state
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [regLoading, setRegLoading] = useState(false);
  const [sheetWebhookUrl, setSheetWebhookUrl] = useState('');
  const [sheetStatusMsg, setSheetStatusMsg] = useState<string | null>(null);

  // Approval Notification & Email Pass States
  const [approvedNotice, setApprovedNotice] = useState<{
    regId: string;
    studentName: string;
    recipientEmail: string;
    eventTitle: string;
    meetingLink?: string;
    whatsappUrl?: string;
    emailSubject?: string;
    emailBody?: string;
    htmlBody?: string;
    whapiDispatched?: boolean;
    emailDispatched?: boolean;
    emailVia?: string;
    emailError?: string;
    gmailComposeUrl?: string;
    mailtoUrl?: string;
    status: 'Approved' | 'Rejected';
  } | null>(null);

  const [selectedEmailPass, setSelectedEmailPass] = useState<EventRegistration | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [approvingRegId, setApprovingRegId] = useState<string | null>(null);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [emailSendStatus, setEmailSendStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [deletingRegId, setDeletingRegId] = useState<string | null>(null);
  const [confirmingDeleteRegId, setConfirmingDeleteRegId] = useState<string | null>(null);
  const [deleteRegFeedback, setDeleteRegFeedback] = useState<{ success: boolean; text: string } | null>(null);

  // Email / SMTP Settings Modal State
  const [showEmailConfigModal, setShowEmailConfigModal] = useState(false);
  const [emailConfigData, setEmailConfigData] = useState<{
    smtpHost: string;
    smtpPort: number;
    smtpSecure: boolean;
    smtpUser: string;
    smtpPass: string;
    hasPassword?: boolean;
    senderName: string;
    senderEmail: string;
  }>({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    smtpSecure: true,
    smtpUser: 'butexpgdalumni@gmail.com',
    smtpPass: '',
    senderName: 'BUTEX PGD Alumni Association',
    senderEmail: 'butexpgdalumni@gmail.com'
  });
  const [emailConfigLoading, setEmailConfigLoading] = useState(false);
  const [emailConfigMsg, setEmailConfigMsg] = useState<string | null>(null);
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmailMsg, setTestEmailMsg] = useState<string | null>(null);
  const [testEmailGmailUrl, setTestEmailGmailUrl] = useState<string | null>(null);

  // Member Join Requests state
  const [memberRequests, setMemberRequests] = useState<MemberJoinRequest[]>([]);
  const [memReqLoading, setMemReqLoading] = useState(false);
  const [sendingMemberEmailId, setSendingMemberEmailId] = useState<string | null>(null);
  const [approvedMemberNotice, setApprovedMemberNotice] = useState<{
    memberId: string;
    name: string;
    email: string;
    rollNo: string;
    gmailComposeUrl?: string;
    mailtoUrl?: string;
    dispatched?: boolean;
  } | null>(null);

  // Broadcast / Custom Email Modal State (from butexpgdalumni@gmail.com)
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastAudience, setBroadcastAudience] = useState<'single' | 'events' | 'members'>('single');
  const [broadcastSingleEmail, setBroadcastSingleEmail] = useState('');
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState<{ success: boolean; message: string; gmailUrl?: string } | null>(null);

  // New Member Modal State
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [newMemName, setNewMemName] = useState('');
  const [newMemEmail, setNewMemEmail] = useState('');
  const [newMemRoll, setNewMemRoll] = useState('');
  const [newMemCompany, setNewMemCompany] = useState('');
  const [newMemDesig, setNewMemDesig] = useState('');
  const [newMemPhone, setNewMemPhone] = useState('');
  const [newMemLoading, setNewMemLoading] = useState(false);
  const [newMemMsg, setNewMemMsg] = useState<string | null>(null);

  const fetchMemberRequests = () => {
    setMemReqLoading(true);
    fetch('/api/admin/members/requests')
      .then(async res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(data => {
        if (data?.success) {
          setMemberRequests(data.data || []);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setMemReqLoading(false));
  };

  const handleUpdateMemberRequestStatus = async (reqId: string, status: 'Approved' | 'Rejected') => {
    try {
      const res = await fetch(`/api/admin/members/requests/${reqId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchMemberRequests();
        if (status === 'Approved' && data.request) {
          setApprovedMemberNotice({
            memberId: reqId,
            name: data.request.name,
            email: data.request.email,
            rollNo: data.request.rollNo,
            gmailComposeUrl: data.gmailComposeUrl,
            mailtoUrl: data.mailtoUrl,
            dispatched: data.emailNotification?.dispatched
          });
        }
      } else {
        alert(`❌ Error: ${data.message || 'Failed to update member status'}`);
      }
    } catch (err) {
      console.error(err);
      alert(`❌ Network error: ${(err as Error).message}`);
    }
  };

  const handleResendMemberEmail = async (memberId: string) => {
    setSendingMemberEmailId(memberId);
    try {
      const res = await fetch(`/api/admin/members/requests/${memberId}/send-email`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.gmailComposeUrl) {
          const reqItem = memberRequests.find(m => m.id === memberId);
          setApprovedMemberNotice({
            memberId,
            name: reqItem?.name || 'Member',
            email: reqItem?.email || '',
            rollNo: reqItem?.rollNo || '',
            gmailComposeUrl: data.gmailComposeUrl,
            mailtoUrl: data.mailtoUrl,
            dispatched: true
          });
        }
        alert(`✓ ${data.message || 'Welcome email processed successfully!'}`);
        fetchMemberRequests();
      } else {
        alert(`Notice: ${data.message || 'Could not send automated email. Please use 1-Click Gmail.'}`);
      }
    } catch (err) {
      alert(`Notice: ${(err as Error).message}`);
    } finally {
      setSendingMemberEmailId(null);
    }
  };

  const handleBroadcastSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastSubject.trim() || !broadcastMessage.trim()) {
      alert("Subject and Message cannot be empty");
      return;
    }

    let recipients: string[] = [];
    if (broadcastAudience === 'single') {
      if (!broadcastSingleEmail.trim()) {
        alert("Please specify recipient email address");
        return;
      }
      recipients = [broadcastSingleEmail.trim()];
    } else if (broadcastAudience === 'events') {
      recipients = registrations.map(r => r.studentEmail).filter(e => e && e.includes('@'));
      if (recipients.length === 0) {
        alert("No event registrations with valid emails found");
        return;
      }
    } else if (broadcastAudience === 'members') {
      recipients = memberRequests.map(m => m.email).filter(e => e && e.includes('@'));
      if (recipients.length === 0) {
        alert("No member join requests with valid emails found");
        return;
      }
    }

    setBroadcastLoading(true);
    setBroadcastStatus(null);
    try {
      const res = await fetch('/api/admin/send-custom-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients,
          subject: broadcastSubject,
          message: broadcastMessage,
          audienceLabel: broadcastAudience === 'single' ? 'Direct Notification' : broadcastAudience === 'events' ? 'Event Registrants Broadcast' : 'Alumni Members Broadcast'
        })
      });
      const data = await res.json();
      setBroadcastStatus({
        success: data.success,
        message: data.message || (data.success ? "Emails sent successfully!" : "Failed to dispatch email"),
        gmailUrl: data.gmailComposeUrl
      });
    } catch (err) {
      setBroadcastStatus({
        success: false,
        message: `Error sending email: ${(err as Error).message}`
      });
    } finally {
      setBroadcastLoading(false);
    }
  };

  const handleMemberJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemName.trim()) {
      alert("Full Name is required.");
      return;
    }

    setNewMemLoading(true);
    setNewMemMsg(null);
    try {
      const res = await fetch('/api/alumni/member-join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newMemName,
          email: newMemEmail,
          rollNo: newMemRoll || "PGD Alumni",
          company: newMemCompany,
          designation: newMemDesig,
          phone: newMemPhone,
          autoApprove: true
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNewMemMsg(`✓ New Member registered! ${newMemEmail ? 'Welcome Email sent to ' + newMemEmail : ''} & WhatsApp Notification Dispatched!`);
        setNewMemName('');
        setNewMemEmail('');
        setNewMemRoll('');
        setNewMemCompany('');
        setNewMemDesig('');
        setNewMemPhone('');
        fetchMemberRequests();
        setTimeout(() => {
          setNewMemMsg(null);
          setShowMemberModal(false);
        }, 2500);
      } else {
        alert(`❌ Error: ${data.message || 'Failed to submit'}`);
      }
    } catch (err) {
      console.error(err);
      alert(`❌ Network exception: ${(err as Error).message}`);
    } finally {
      setNewMemLoading(false);
    }
  };

  const fetchRegistrations = () => {
    setRegLoading(true);
    fetch('/api/admin/event-registrations')
      .then(async res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(data => {
        if (data?.success) {
          setRegistrations(data.data || []);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setRegLoading(false));

    fetch('/api/admin/event-sheet-config')
      .then(async res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(data => {
        if (data?.success && data.webhookUrl) {
          setSheetWebhookUrl(data.webhookUrl);
        }
      })
      .catch(err => console.error(err));
  };

  const handleSaveWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/admin/event-sheet-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookUrl: sheetWebhookUrl })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSheetStatusMsg("✓ Google Sheet Webhook URL updated!");
          setTimeout(() => setSheetStatusMsg(null), 4000);
        }
      });
  };

  useEffect(() => {
    if (activeTab === 'registrations') {
      fetchRegistrations();
    }
    if (activeTab === 'member-requests') {
      fetchMemberRequests();
    }
    if (activeTab === 'table-talk') {
      fetchTableTalkPosts();
    }
  }, [activeTab]);

  // Local Events state for instant optimistic updates
  const [localEvents, setLocalEvents] = useState<EventItem[]>(events);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [isUpdatingEvent, setIsUpdatingEvent] = useState(false);
  const [adminEventFilter, setAdminEventFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ALL');

  // Job Post Editing State
  const [editingJob, setEditingJob] = useState<JobPost | null>(null);
  const [isUpdatingJob, setIsUpdatingJob] = useState(false);

  const handleSaveEditedJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;
    setIsUpdatingJob(true);
    try {
      const res = await fetch(`/api/admin/jobs/${encodeURIComponent(editingJob.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingJob)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (onRefreshJobs) onRefreshJobs();
        setEraseMsg({ success: true, text: `✓ Job posting "${editingJob.title}" updated successfully.` });
        setEditingJob(null);
      } else {
        alert(`Failed to update job post: ${data.message || 'Error occurred'}`);
      }
    } catch (err: any) {
      alert(`Error updating job: ${err.message}`);
    } finally {
      setIsUpdatingJob(false);
      setTimeout(() => setEraseMsg(null), 5000);
    }
  };

  // Table Talk Post Editing State
  const [editingTableTalk, setEditingTableTalk] = useState<TableTalkPost | null>(null);
  const [isUpdatingTableTalk, setIsUpdatingTableTalk] = useState(false);

  const handleSaveEditedTableTalk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTableTalk) return;
    setIsUpdatingTableTalk(true);
    try {
      const res = await fetch(`/api/admin/tabletalk/${encodeURIComponent(editingTableTalk.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTableTalk)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTableTalkPosts(prev => prev.map(p => p.id === editingTableTalk.id ? data.post : p));
        try {
          const cached = localStorage.getItem('butex_table_talk_posts');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) {
              const updated = parsed.map((p: any) => p.id === editingTableTalk.id ? data.post : p);
              localStorage.setItem('butex_table_talk_posts', JSON.stringify(updated));
            }
          }
        } catch (e) {}
        window.dispatchEvent(new CustomEvent('tabletalk-changed', { detail: { action: 'update', post: data.post } }));
        setEditingTableTalk(null);
        fetchTableTalkPosts();
        alert(`✓ Table Talk discussion updated successfully!`);
      } else {
        alert(`Failed to update Table Talk: ${data.message || 'Error occurred'}`);
      }
    } catch (err: any) {
      alert(`Error updating Table Talk: ${err.message}`);
    } finally {
      setIsUpdatingTableTalk(false);
    }
  };

  useEffect(() => {
    setLocalEvents(events);
  }, [events]);

  const handleSaveEditedEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    setIsUpdatingEvent(true);
    try {
      const res = await fetch(`/api/admin/events/${encodeURIComponent(editingEvent.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingEvent)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLocalEvents(prev => prev.map(evt => evt.id === editingEvent.id ? data.event : evt));
        setEraseMsg({ success: true, text: `✓ Event "${editingEvent.title}" updated successfully and persisted to database.` });
        setEditingEvent(null);
        if (onRefreshEvents) onRefreshEvents();
      } else {
        setEraseMsg({ success: false, text: `Failed to update event: ${data.message || 'Error occurred'}` });
      }
    } catch (err: any) {
      setEraseMsg({ success: false, text: `Error updating event: ${err.message}` });
    } finally {
      setIsUpdatingEvent(false);
      setTimeout(() => setEraseMsg(null), 5000);
    }
  };

  const handleEraseEventPost = (eventId: string) => {
    setConfirmingEraseId(eventId);
  };

  const handleCancelErase = () => {
    setConfirmingEraseId(null);
  };

  const handleConfirmErase = async (eventId: string, title: string) => {
    setErasingId(eventId);
    setEraseMsg(null);

    // Optimistic removal for instant admin UI responsiveness
    setLocalEvents(prev => prev.filter(e => e.id !== eventId && e.title !== title));

    // Update local storage if present
    try {
      const saved = localStorage.getItem('butex_portal_events');
      if (saved) {
        const list = JSON.parse(saved);
        if (Array.isArray(list)) {
          const updated = list.filter((e: EventItem) => e.id !== eventId && e.title !== title);
          localStorage.setItem('butex_portal_events', JSON.stringify(updated));
        }
      }
    } catch (e) {}

    try {
      const res = await fetch(`/api/admin/events/${encodeURIComponent(eventId)}?title=${encodeURIComponent(title)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data && data.success) {
        setEraseMsg({ success: true, text: `✓ Event post "${title}" has been erased entirely from portal & database.` });
      } else {
        setEraseMsg({ success: true, text: `✓ Event post "${title}" removed from registry.` });
      }
      setConfirmingEraseId(null);
      if (onRefreshEvents) onRefreshEvents();
      setTimeout(() => setEraseMsg(null), 5000);
    } catch (err) {
      console.error("Erase event request error:", err);
      setEraseMsg({ success: true, text: `✓ Event post "${title}" removed from active session.` });
      setConfirmingEraseId(null);
      if (onRefreshEvents) onRefreshEvents();
      setTimeout(() => setEraseMsg(null), 5000);
    } finally {
      setErasingId(null);
    }
  };

  const handlePublishEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evtTitle || !evtDate) return;

    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: evtTitle,
          hostName: evtHost,
          description: evtDetails,
          date: evtDate,
          time: evtTime || '10:00 AM',
          venueType: evtVenue,
          venue: evtVenueName || (evtVenue === 'Online' ? 'Google Meet / Zoom' : 'BUTEX Auditorium, Dhaka'),
          meetingLink: evtMeetingLink.trim(),
          thumbnailUrl: evtThumbnail || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
          category: evtCategory.trim()
        })
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Server returned error (${res.status}): ${text.slice(0, 100)}`);
      }

      if (res.ok && data.success) {
        setEvtSuccess("✓ Event Program Advertisement Published Successfully! WhatsApp Notification Dispatched & Media Backed Up to Google Drive.");
        setEvtTitle('');
        setEvtHost('');
        setEvtDetails('');
        setEvtDate('');
        setEvtTime('');
        setEvtVenueName('');
        setEvtMeetingLink('');
        setEvtThumbnail('');
        setEvtCategory('');
        
        if (data.event) {
          setLocalEvents(prev => [data.event, ...prev]);
        }

        if (onRefreshEvents) {
          onRefreshEvents();
        }

        setTimeout(() => setEvtSuccess(null), 5000);
      } else {
        setEvtSuccess(`❌ Failed to publish event: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      setEvtSuccess(`❌ Error publishing event: ${(err as Error).message}`);
    }
  };

  const handleUpdateRegStatus = async (regId: string, status: 'Approved' | 'Rejected') => {
    setApprovingRegId(regId);
    try {
      const res = await fetch(`/api/admin/event-registrations/${regId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        fetchRegistrations();
        if (status === 'Approved') {
          const notice = {
            regId,
            studentName: data.registration?.studentName || 'Member',
            recipientEmail: data.emailNotification?.to || data.registration?.memberEmail || '',
            eventTitle: data.registration?.eventTitle || 'Event',
            meetingLink: data.emailNotification?.meetingLink || data.registration?.meetingLink || '',
            whatsappUrl: data.whatsappUrl,
            emailSubject: data.emailNotification?.subject,
            emailBody: data.emailNotification?.body,
            htmlBody: data.emailNotification?.htmlBody,
            whapiDispatched: data.whapiDispatched,
            emailDispatched: data.emailNotification?.dispatched,
            emailVia: data.emailNotification?.via,
            emailError: data.emailNotification?.error,
            gmailComposeUrl: data.gmailComposeUrl || data.emailNotification?.gmailComposeUrl,
            mailtoUrl: data.mailtoUrl || data.emailNotification?.mailtoUrl,
            status: 'Approved' as const
          };
          setApprovedNotice(notice);

          // If the modal for this pass is open, update it
          if (selectedEmailPass && selectedEmailPass.id === regId) {
            setSelectedEmailPass({
              ...selectedEmailPass,
              status: 'Approved',
              emailNotified: Boolean(data.emailNotification?.dispatched),
              meetingLink: notice.meetingLink
            });
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setApprovingRegId(null);
    }
  };

  const handleDispatchEmail = async (regId: string) => {
    setSendingEmailId(regId);
    setEmailSendStatus(null);
    try {
      const res = await fetch(`/api/admin/event-registrations/${regId}/send-email`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEmailSendStatus({ success: true, message: data.message || 'Email successfully dispatched!' });
        fetchRegistrations();
      } else {
        setEmailSendStatus({ success: false, message: data.message || 'Email dispatch failed. Please use 1-Click Gmail Send.' });
      }
    } catch (err) {
      setEmailSendStatus({ success: false, message: `Error: ${(err as Error).message}` });
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleDeleteRegistration = async (regId: string, studentName?: string) => {
    setDeletingRegId(regId);
    setDeleteRegFeedback(null);
    try {
      const res = await fetch(`/api/admin/event-registrations/${encodeURIComponent(regId)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRegistrations(prev => prev.filter(r => r.id !== regId));
        setDeleteRegFeedback({ 
          success: true, 
          text: `✓ Registration for ${studentName || regId} deleted successfully.` 
        });
        setConfirmingDeleteRegId(null);
        setTimeout(() => setDeleteRegFeedback(null), 4000);
      } else {
        setDeleteRegFeedback({ 
          success: false, 
          text: `❌ Failed to delete: ${data.message || 'Unknown error'}` 
        });
      }
    } catch (err) {
      console.error(err);
      setDeleteRegFeedback({ 
        success: false, 
        text: `❌ Error deleting registration: ${(err as Error).message}` 
      });
    } finally {
      setDeletingRegId(null);
    }
  };

  const fetchEmailConfig = async () => {
    try {
      setEmailConfigLoading(true);
      const res = await fetch('/api/admin/email-config');
      const data = await res.json();
      if (data.success && data.config) {
        setEmailConfigData(prev => ({
          ...prev,
          smtpHost: data.config.smtpHost || 'smtp.gmail.com',
          smtpPort: data.config.smtpPort || 465,
          smtpSecure: data.config.smtpSecure ?? true,
          smtpUser: data.config.smtpUser || 'butexpgdalumni@gmail.com',
          hasPassword: data.config.hasPassword,
          senderName: data.config.senderName || 'BUTEX PGD Alumni Association',
          senderEmail: data.config.senderEmail || 'butexpgdalumni@gmail.com'
        }));
        if (!testEmailRecipient) {
          setTestEmailRecipient(data.config.smtpUser || 'butexpgdalumni@gmail.com');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEmailConfigLoading(false);
    }
  };

  const saveEmailConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setEmailConfigLoading(true);
      setEmailConfigMsg(null);
      const res = await fetch('/api/admin/email-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailConfigData)
      });
      const data = await res.json();
      if (data.success) {
        setEmailConfigMsg('✓ Email / SMTP configuration saved successfully!');
        fetchEmailConfig();
      } else {
        setEmailConfigMsg(`❌ ${data.message || 'Failed to save settings'}`);
      }
    } catch (e) {
      setEmailConfigMsg(`❌ Error: ${(e as Error).message}`);
    } finally {
      setEmailConfigLoading(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      setTestingEmail(true);
      setTestEmailMsg(null);
      setTestEmailGmailUrl(null);
      const res = await fetch('/api/admin/email-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail: testEmailRecipient })
      });
      const data = await res.json();
      if (data.success) {
        setTestEmailMsg(`✓ ${data.message}`);
        if (data.gmailComposeUrl) {
          setTestEmailGmailUrl(data.gmailComposeUrl);
        }
      } else {
        setTestEmailMsg(`Notice: ${data.message || 'Test email could not be sent directly.'}`);
        if (data.gmailComposeUrl) {
          setTestEmailGmailUrl(data.gmailComposeUrl);
        }
      }
    } catch (e) {
      setTestEmailMsg(`Notice: ${(e as Error).message}`);
    } finally {
      setTestingEmail(false);
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = passcode.trim().toLowerCase();
    const expiry = (Date.now() + 24 * 60 * 60 * 1000).toString();

    // Super Admin / Coding Admin Passcodes
    if (['superadmin', 'codingadmin', 'super2026', 'master2026', 'super', 'coding'].includes(normalized)) {
      setRole('super');
      setUnlocked(true);
      setPasscodeError(null);
      setPasscode('');
      try {
        localStorage.setItem('butex_admin_role', 'super');
        localStorage.setItem('butex_admin_session_expiry', expiry);
      } catch (e) {}
      return;
    }

    // Standard Admin Passcodes
    if (['admin', 'butex2026', '1234', 'moderator'].includes(normalized)) {
      setRole('admin');
      setUnlocked(true);
      setPasscodeError(null);
      setPasscode('');
      try {
        localStorage.setItem('butex_admin_role', 'admin');
        localStorage.setItem('butex_admin_session_expiry', expiry);
      } catch (e) {}
      return;
    }

    setPasscodeError("Invalid passcode! Please verify your admin credentials and try again.");
  };

  const handleElevateToSuper = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = superPasscodeAttempt.trim().toLowerCase();
    if (['superadmin', 'codingadmin', 'super2026', 'master2026', 'super', 'coding'].includes(normalized)) {
      setRole('super');
      setElevateModalOpen(false);
      setSuperPasscodeAttempt('');
      setElevateError(null);
      try {
        localStorage.setItem('butex_admin_role', 'super');
        localStorage.setItem('butex_admin_session_expiry', (Date.now() + 24 * 60 * 60 * 1000).toString());
      } catch (e) {}
      alert("👑 Role Elevated: You now have full Coding Admin privileges!");
    } else {
      setElevateError("Incorrect Coding Admin Passcode! Please enter valid credentials.");
    }
  };

  const pendingJobs = adminJobs.filter(j => j.status === 'pending');

  if (!unlocked) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl border border-slate-200 p-8 shadow-2xl space-y-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center mx-auto shadow-lg ring-4 ring-slate-100">
          <Key className="w-8 h-8" />
        </div>
        
        <div>
          <h2 className="text-2xl font-black text-slate-900">Admin Portal Authentication</h2>
          <p className="text-xs text-slate-500 mt-1">
            Access protected moderation workflows, job & event postings, and system controls.
          </p>
        </div>

        {/* Role Comparison Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          <div className="p-3.5 bg-gradient-to-br from-amber-50 to-amber-100/60 rounded-2xl border border-amber-200 space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-black text-amber-950">
              <Crown className="w-4 h-4 text-amber-600 fill-amber-500" />
              <span>Coding Admin Role</span>
            </div>
            <p className="text-[11px] text-amber-900 leading-snug">
              Full control over <strong>Whapi API keys</strong>, <strong>Google Sheet webhooks</strong>, plus job/event posting & deletion.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-black text-slate-900">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Standard Admin Role</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Operational control: <strong>Create/delete job & event posts</strong>, review event joining requests & member registrations.
            </p>
          </div>
        </div>

        {passcodeError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center justify-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{passcodeError}</span>
          </div>
        )}

        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="space-y-1 text-left">
            <label className="text-xs font-bold text-slate-700 block">Enter Admin Passcode *</label>
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter your admin passcode"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-center text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-md transition-all hover:scale-[1.01]"
          >
            Authenticate & Unlock Dashboard
          </button>
        </form>

        <p className="text-[11px] text-slate-400">
          Authorized personnel only. Contact the central committee for access credentials.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header with Role Status Badge */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-4 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-amber-400 mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Admin Control Center</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Portal Moderation & Management</h1>
            
            {/* Active Role Badge */}
            {role === 'super' ? (
              <span className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black text-xs flex items-center space-x-1.5 shadow-md">
                <Crown className="w-4 h-4 fill-slate-950" />
                <span>👑 SUPER ADMIN</span>
              </span>
            ) : (
              <span className="px-3.5 py-1.5 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow-md">
                <Shield className="w-4 h-4" />
                <span>🛡️ STANDARD ADMIN</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <a
            href="https://drive.google.com/file/d/1uMOI8R1PHXxq59k8mWVe7dEqOe60sePKmULDWbwrDEg/view?usp=sharing"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 transition-all flex items-center space-x-1.5 shadow-sm"
            title="Open Official Student ID Info PDF from Google Drive"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>STUDENT ID Info</span>
            <ExternalLink className="w-3 h-3 text-amber-400" />
          </a>

          {role === 'admin' && (
            <button
              onClick={() => setElevateModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 transition-all flex items-center space-x-1.5"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Elevate to Coding Admin</span>
            </button>
          )}

          <button
            onClick={() => {
              setUnlocked(false);
              setRole(null);
              try {
                localStorage.removeItem('butex_admin_role');
                localStorage.removeItem('butex_admin_session_expiry');
              } catch (e) {}
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors flex items-center space-x-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock Dashboard</span>
          </button>
        </div>
      </div>

      {/* Elevate to Coding Admin Modal */}
      {elevateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 border border-slate-200 shadow-2xl relative text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Crown className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="text-base font-extrabold">Elevate to Coding Admin</h3>
              </div>
              <button 
                onClick={() => setElevateModalOpen(false)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Enter the Coding Admin Passcode to unlock system configuration rights, Whapi API keys, and master webhook settings.
            </p>

            {elevateError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{elevateError}</span>
              </div>
            )}

            <form onSubmit={handleElevateToSuper} className="space-y-4">
              <input
                type="password"
                value={superPasscodeAttempt}
                onChange={(e) => setSuperPasscodeAttempt(e.target.value)}
                placeholder="Enter Coding Admin Passcode"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-center text-sm font-mono font-bold focus:outline-none focus:border-amber-500"
              />
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setElevateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow transition-all"
                >
                  Confirm Elevation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Button-based Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <button
          onClick={() => setActiveTab('jobs')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all ${
            activeTab === 'jobs'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Jobs ({adminJobs.length})</span>
          {pendingJobs.length > 0 && (
            <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ml-1">
              {pendingJobs.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('directory')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all ${
            activeTab === 'directory'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Alumni Directory Controls</span>
        </button>

        <button
          onClick={() => setActiveTab('companies')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all ${
            activeTab === 'companies'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Partner Companies</span>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all ${
            activeTab === 'events'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Event Published</span>
        </button>

        <button
          onClick={() => setActiveTab('registrations')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all ${
            activeTab === 'registrations'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Event Registrations</span>
          {registrations.filter(r => r.status === 'Pending').length > 0 && (
            <span className="bg-amber-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ml-1">
              {registrations.filter(r => r.status === 'Pending').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('member-requests')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all ${
            activeTab === 'member-requests'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>New Member Join Requests</span>
          {memberRequests.filter(m => m.status === 'Pending').length > 0 && (
            <span className="bg-emerald-700 text-white text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ml-1">
              {memberRequests.filter(m => m.status === 'Pending').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('table-talk')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all ${
            activeTab === 'table-talk'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Table Talk Moderation</span>
          {tableTalkPosts.length > 0 && (
            <span className="bg-[#002147] text-[#FFBF00] text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1">
              {tableTalkPosts.length}
            </span>
          )}
        </button>

        {role === 'super' && (
          <>
            <button
              onClick={() => setActiveTab('whapi-config')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all ${
                activeTab === 'whapi-config'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Whapi WhatsApp Settings</span>
              <span className="bg-emerald-800 text-emerald-100 text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1">
                API
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('apps-script');
                if (!appsScriptCode) fetchAppsScriptCode();
              }}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all ${
                activeTab === 'apps-script'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Google Sheet Sync & Code.gs</span>
              <span className="bg-amber-800 text-amber-100 text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1">
                SUPER
              </span>
            </button>
          </>
        )}
      </div>


      {/* Tab Panel 1: Job Postings */}
      {activeTab === 'jobs' && (
        <div className="space-y-8">
          {/* Moderation Pending Queue */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <span>Pending Moderation Queue ({pendingJobs.length})</span>
              </h2>
              <span className="text-xs text-slate-500 hidden sm:inline">Requires Admin Approval before displaying publicly</span>
            </div>

            {pendingJobs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-2xl border border-slate-100">
                ✓ No pending job postings in queue! All submitted jobs are moderated.
              </div>
            ) : (
              <div className="space-y-4">
                {pendingJobs.map(job => (
                  <div key={job.id} className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-sm">{job.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-bold">{job.category}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700">{job.company} • {job.location}</p>
                      <p className="text-xs text-slate-500">
                        Posted by <strong className="text-slate-800">{job.posterName}</strong> ({job.posterEmail})
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => setEditingJob({ ...job })}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center space-x-1 border border-slate-300 shadow-xs transition-colors"
                        title="Edit Job Posting Details"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => onUpdateJobStatus(job.id, 'approved')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1 shadow transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => onUpdateJobStatus(job.id, 'rejected')}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center space-x-1 shadow transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                      {onDeleteJob && (
                        <button
                          onClick={() => onDeleteJob(job.id, job.title)}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center space-x-1 shadow transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Approved / Rejected Jobs Table */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">All Job Submissions Overview ({adminJobs.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900 text-slate-200">
                    <th className="p-3">Job Title & Company</th>
                    <th className="p-3">Source</th>
                    <th className="p-3">Poster</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adminJobs.map(j => (
                    <tr key={j.id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900">{j.title} ({j.company})</td>
                      <td className="p-3 text-slate-600">{j.source}</td>
                      <td className="p-3 text-slate-600">{j.posterName}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          j.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                          j.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {j.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => setEditingJob({ ...j })}
                          className="text-blue-600 hover:underline font-bold text-[11px] inline-flex items-center gap-1"
                          title="Edit Job Post"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        {j.status !== 'approved' && (
                          <button onClick={() => onUpdateJobStatus(j.id, 'approved')} className="text-emerald-700 hover:underline font-bold text-[11px]">Approve</button>
                        )}
                        {j.status !== 'rejected' && (
                          <button onClick={() => onUpdateJobStatus(j.id, 'rejected')} className="text-amber-700 hover:underline font-bold text-[11px]">Reject</button>
                        )}
                        {onDeleteJob && (
                          <button onClick={() => onDeleteJob(j.id, j.title)} className="text-rose-700 hover:underline font-bold text-[11px]">Delete Job</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Edit Job Modal */}
          {editingJob && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 flex flex-col">
                <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between rounded-t-3xl">
                  <div className="flex items-center space-x-2">
                    <Edit3 className="w-5 h-5 text-amber-400" />
                    <h3 className="text-base font-extrabold">Edit Job Posting</h3>
                  </div>
                  <button 
                    onClick={() => setEditingJob(null)}
                    className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveEditedJob} className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Job Title *</label>
                      <input
                        type="text"
                        required
                        value={editingJob.title}
                        onChange={(e) => setEditingJob({ ...editingJob, title: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0B192C] focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Company Name *</label>
                      <input
                        type="text"
                        required
                        value={editingJob.company}
                        onChange={(e) => setEditingJob({ ...editingJob, company: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0B192C] focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                      <select
                        value={editingJob.category || 'Production'}
                        onChange={(e) => setEditingJob({ ...editingJob, category: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0B192C] focus:bg-white"
                      >
                        <option value="Production">Production</option>
                        <option value="Merchandising">Merchandising</option>
                        <option value="QA">QA & Testing</option>
                        <option value="IE">IE & Work Study</option>
                        <option value="Supply Chain">Supply Chain & Sourcing</option>
                        <option value="HR">HR & Compliance</option>
                        <option value="R&D">R&D / Washing</option>
                        <option value="General">General / Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Location</label>
                      <input
                        type="text"
                        value={editingJob.location || ''}
                        onChange={(e) => setEditingJob({ ...editingJob, location: e.target.value })}
                        placeholder="e.g. Gazipur, Dhaka"
                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0B192C] focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Experience Required</label>
                      <input
                        type="text"
                        value={editingJob.experienceRequired || ''}
                        onChange={(e) => setEditingJob({ ...editingJob, experienceRequired: e.target.value })}
                        placeholder="e.g. 3-5 Years"
                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0B192C] focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Salary Range</label>
                      <input
                        type="text"
                        value={editingJob.salaryRange || ''}
                        onChange={(e) => setEditingJob({ ...editingJob, salaryRange: e.target.value })}
                        placeholder="e.g. 50,000 - 70,000 BDT or Negotiable"
                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0B192C] focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Application Deadline</label>
                      <input
                        type="text"
                        value={editingJob.deadline || ''}
                        onChange={(e) => setEditingJob({ ...editingJob, deadline: e.target.value })}
                        placeholder="YYYY-MM-DD or text"
                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0B192C] focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Moderation Status</label>
                      <select
                        value={editingJob.status}
                        onChange={(e) => setEditingJob({ ...editingJob, status: e.target.value as any })}
                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0B192C] focus:bg-white"
                      >
                        <option value="approved">Approved (Live)</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Required Skills (Comma separated)</label>
                    <input
                      type="text"
                      value={Array.isArray(editingJob.requiredSkills) ? editingJob.requiredSkills.join(', ') : ''}
                      onChange={(e) => setEditingJob({ 
                        ...editingJob, 
                        requiredSkills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                      })}
                      placeholder="e.g. Knitting, Dyeing, ERP, Costing"
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0B192C] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Application / Circular Link</label>
                    <input
                      type="url"
                      value={editingJob.originalUrl || ''}
                      onChange={(e) => setEditingJob({ ...editingJob, originalUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0B192C] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Job Description & Responsibilities</label>
                    <textarea
                      rows={4}
                      value={editingJob.jobDescription || ''}
                      onChange={(e) => setEditingJob({ ...editingJob, jobDescription: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0B192C] focus:bg-white resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Poster Name</label>
                      <input
                        type="text"
                        value={editingJob.posterName || ''}
                        onChange={(e) => setEditingJob({ ...editingJob, posterName: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0B192C] focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Poster Email</label>
                      <input
                        type="email"
                        value={editingJob.posterEmail || ''}
                        onChange={(e) => setEditingJob({ ...editingJob, posterEmail: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0B192C] focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setEditingJob(null)}
                      disabled={isUpdatingJob}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdatingJob}
                      className="px-5 py-2 bg-[#0B192C] hover:bg-[#1E3A8A] text-white font-bold text-xs rounded-xl shadow transition-all flex items-center space-x-1.5 disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isUpdatingJob ? 'Saving Changes...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Panel: Event Published */}
      {activeTab === 'events' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-900">Publish New Event Program</h2>
              <p className="text-xs text-slate-500">
                Created event program advertisements save media directly and sync registrations automatically with Google Sheets & Forms.
              </p>
            </div>
            {role === 'super' && (
              <div className="flex items-center space-x-2 shrink-0">
                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLScT82KiXdAQg-Xlgr7xXfnbcoiAakTNm58FTt233tP_9BMEcw/viewform?usp=publish-editor"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center space-x-1 transition-all"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Google Form</span>
                </a>
                <a
                  href="https://docs.google.com/spreadsheets/d/1ZY76tbYUCTS8LA4DOe76cRAorDaTSRqVTsejD_UBspE/edit?resourcekey=&gid=1943182397#gid=1943182397"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1 transition-all"
                >
                  <FileSpreadsheet className="w-3 h-3" />
                  <span>Google Sheet</span>
                </a>
              </div>
            )}
          </div>

          {evtSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{evtSuccess}</span>
            </div>
          )}

          <form onSubmit={handlePublishEvent} className="space-y-4 text-xs">
            {/* Event Title */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-700 mb-1">
                Event Title * <span className="text-amber-600 font-normal">(Appears in Event Tab & Front Page Yellow Sidebar)</span>
              </label>
              <input
                type="text"
                value={evtTitle}
                onChange={(e) => setEvtTitle(e.target.value)}
                placeholder="e.g. Advanced Garment Quality & ERP Systems Masterclass 2026"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-amber-500 font-bold text-sm"
              />
            </div>

            {/* Host Name */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-700 mb-1">
                Host Name * <span className="text-amber-600 font-normal">(Appears under Event Title)</span>
              </label>
              <input
                type="text"
                value={evtHost}
                onChange={(e) => setEvtHost(e.target.value)}
                placeholder="e.g. Mst. Lia Moni (QAD Head) & BUTEX Faculty"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-amber-500 font-semibold"
              />
            </div>

            {/* Event Details */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-700 mb-1">
                Event Details * <span className="text-amber-600 font-normal">(Appears under Host Name)</span>
              </label>
              <textarea
                value={evtDetails}
                onChange={(e) => setEvtDetails(e.target.value)}
                placeholder="Enter full course agenda, syllabus, prerequisites, and learning outcomes for paid class..."
                rows={3}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Event Badge / Category Tag (Optional & Customizable) */}
            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="block text-[10px] uppercase font-bold text-amber-950">
                  Event Badge / Category Tag <span className="text-amber-700 font-normal">(Optional — Write custom badge or click a preset)</span>
                </label>
                <span className="text-[11px] text-amber-800 font-semibold">
                  Leave blank to publish without any badge
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  value={evtCategory}
                  onChange={(e) => setEvtCategory(e.target.value)}
                  placeholder="e.g. Workshop, Masterclass, Reunion, Webinar, Training, Industrial Visit..."
                  className="w-full sm:flex-1 bg-white border border-amber-300 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-amber-500 font-semibold text-xs"
                />
                {evtCategory && (
                  <button
                    type="button"
                    onClick={() => setEvtCategory('')}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs flex items-center space-x-1 shrink-0 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Clear Badge</span>
                  </button>
                )}
              </div>

              {/* Quick Selection Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 mr-1">Presets:</span>
                {[
                  'Workshop',
                  'Masterclass',
                  'Reunion',
                  'Webinar',
                  'Industrial Visit',
                  'Seminar',
                  'Training',
                  'Annual Forum',
                  'Networking'
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setEvtCategory(preset)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      evtCategory.toLowerCase() === preset.toLowerCase()
                        ? 'bg-amber-500 text-slate-950 shadow-sm border border-amber-600'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-amber-100 hover:border-amber-400'
                    }`}
                  >
                    +{preset}
                  </button>
                ))}
              </div>

              {/* Real-time Badge Appearance Preview */}
              <div className="flex items-center space-x-2 pt-1 text-xs text-slate-700 bg-white/80 p-2.5 rounded-xl border border-amber-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Live Title Preview:</span>
                <span className="font-extrabold text-slate-900 text-xs">{evtTitle || 'Event Title'}</span>
                {evtCategory?.trim() ? (
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px]">
                    {evtCategory.trim()}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 italic font-mono">(No badge will be shown)</span>
                )}
              </div>
            </div>

            {/* Date & Start Time + Venue Dropdown List */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200/80">
              {/* Date and Start Time */}
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-amber-900 mb-1">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    value={evtDate}
                    onChange={(e) => setEvtDate(e.target.value)}
                    required
                    className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-amber-900 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="text"
                    value={evtTime}
                    onChange={(e) => setEvtTime(e.target.value)}
                    placeholder="e.g. 10:00 AM - 01:00 PM"
                    required
                    className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Venue as Dropdown List (In Person / Online) */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-amber-900 mb-1">
                  Venue (Dropdown) *
                </label>
                <select
                  value={evtVenue}
                  onChange={(e) => setEvtVenue(e.target.value)}
                  className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500 font-bold"
                >
                  <option value="In Person">In Person</option>
                  <option value="Online">Online</option>
                </select>
                <input
                  type="text"
                  value={evtVenueName}
                  onChange={(e) => setEvtVenueName(e.target.value)}
                  placeholder={evtVenue === 'Online' ? 'e.g. Google Meet / Zoom' : 'e.g. BUTEX Auditorium'}
                  className="w-full mt-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-800"
                />
              </div>
            </div>

            {/* Designated Meeting Link (Google Meet / Zoom URL) */}
            <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200">
              <label className="block text-[10px] uppercase font-bold text-amber-950 mb-1 flex flex-wrap items-center justify-between gap-1">
                <span>Designated Online Meeting Link (Google Meet / Zoom URL)</span>
                <span className="text-amber-800 font-medium lowercase">(Automatically included in approved attendee confirmation emails)</span>
              </label>
              <input
                type="url"
                value={evtMeetingLink}
                onChange={(e) => setEvtMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/abc-defg-hij or https://zoom.us/j/123456789"
                className="w-full bg-white border border-amber-300 rounded-xl px-3.5 py-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* File Upload for JPG or PDF Visual Poster */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block text-[10px] uppercase font-bold text-slate-700">
                  Upload JPG or PDF for Visual Class Thumbnail Poster *
                </label>
                <div className="inline-flex items-center space-x-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg px-2.5 py-1 text-[11px] font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  <span>Recommended Size: <strong>1080 × 1512 px</strong> (5:7 Portrait)</span>
                </div>
              </div>

              {/* Poster Aspect Ratio & Size Guidance Box */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-xs text-amber-950 space-y-1">
                <p className="font-extrabold text-amber-900 flex items-center space-x-1">
                  <span>📐 Optimal Dimensions for Front Page & Full-Screen Preview:</span>
                </p>
                <ul className="list-disc list-inside text-[11px] text-amber-900/90 space-y-0.5 font-medium">
                  <li><strong>Aspect Ratio:</strong> 5:7 Vertical Portrait (e.g. <strong>1080 × 1512 px</strong> or <strong>1200 × 1680 px</strong>).</li>
                  <li><strong>Full Screen View:</strong> Vertical 5:7 portrait designs display seamlessly on mobile screens and the front page sidebar without clipping.</li>
                  <li><strong>Max File Size:</strong> Under 5 MB (JPG, PNG, or PDF).</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = (loadEvt) => {
                          const img = new Image();
                          img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const MAX_WIDTH = 1200;
                            const MAX_HEIGHT = 1680;
                            let width = img.width;
                            let height = img.height;

                            if (width > MAX_WIDTH || height > MAX_HEIGHT) {
                              const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
                              width = Math.round(width * ratio);
                              height = Math.round(height * ratio);
                            }

                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                              ctx.drawImage(img, 0, 0, width, height);
                              const compressed = canvas.toDataURL('image/jpeg', 0.88);
                              setEvtThumbnail(compressed);
                            } else {
                              setEvtThumbnail(loadEvt.target?.result as string);
                            }
                          };
                          img.src = loadEvt.target?.result as string;
                        };
                        reader.readAsDataURL(file);
                      } else {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setEvtThumbnail(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }
                  }}
                  className="w-full sm:w-auto text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 font-bold uppercase">or Direct / Drive URL:</span>
                <input
                  type="text"
                  value={evtThumbnail}
                  onChange={(e) => setEvtThumbnail(e.target.value)}
                  placeholder="https://drive.google.com/file/d/... or https://..."
                  className="flex-1 w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>
              
              <div className="flex items-center justify-between text-[11px] text-emerald-700 font-semibold pt-1">
                <span>📁 Uploaded poster media automatically backed up into Google Drive folder: <code className="bg-emerald-100 px-1.5 py-0.5 rounded font-mono font-bold">Google_Drive/Event_Class_Posters</code></span>
                {evtThumbnail && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-amber-700">✓ Poster Loaded</span>
                    <button
                      type="button"
                      onClick={() => setEvtThumbnail('')}
                      className="text-[10px] font-bold text-rose-600 hover:text-rose-800 underline ml-1 cursor-pointer"
                    >
                      Remove Poster
                    </button>
                  </div>
                )}
              </div>

              {evtThumbnail && (
                <div className="flex items-center space-x-3 mt-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                  <div className="w-20 aspect-[5/7] rounded-xl overflow-hidden border-2 border-amber-500 shadow-md bg-slate-900 shrink-0">
                    <img 
                      src={formatGoogleDriveUrl(evtThumbnail) || evtThumbnail} 
                      alt="Class Poster Preview" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80";
                      }}
                    />
                  </div>
                  <div className="text-xs text-slate-600">
                    <strong className="block text-slate-900 font-bold">5:7 Portrait Live Preview</strong>
                    <span className="text-[11px] text-emerald-600 font-semibold">✓ Ready for front page sidebar carousel and Events module</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-md flex items-center space-x-2 transition-all hover:scale-[1.02]"
              >
                <Send className="w-4 h-4" />
                <span>Publish Event Program Advertisement</span>
              </button>
            </div>
          </form>

          {/* Published Event Posts & Moderation */}
          <div className="pt-6 border-t border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Published Event Posts ({localEvents.length})
                </h3>
                <span className="text-xs text-slate-500">
                  Permanently saved in database • Admin can edit or erase anytime
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setAdminEventFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    adminEventFilter === 'ALL'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({localEvents.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAdminEventFilter('ACTIVE')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1 ${
                    adminEventFilter === 'ACTIVE'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Active</span>
                  <span className="text-[10px] opacity-90 font-mono">({localEvents.filter(e => !isEventOneDayOver(e.date)).length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdminEventFilter('ARCHIVED')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1 ${
                    adminEventFilter === 'ARCHIVED'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Archived</span>
                  <span className="text-[10px] opacity-90 font-mono">({localEvents.filter(e => isEventOneDayOver(e.date)).length})</span>
                </button>
              </div>
            </div>

            {/* Erase Feedback Message */}
            {eraseMsg && (
              <div className={`p-4 rounded-2xl text-xs font-bold flex items-center space-x-2 ${
                eraseMsg.success ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}>
                {eraseMsg.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />}
                <span>{eraseMsg.text}</span>
              </div>
            )}

            {localEvents.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-6 text-center text-xs text-slate-500">
                No event posts published currently. Use the form above to publish a new event program advertisement.
              </div>
            ) : (
              <div className="space-y-3">
                {localEvents
                  .filter(evt => {
                    if (adminEventFilter === 'ACTIVE') return !isEventOneDayOver(evt.date);
                    if (adminEventFilter === 'ARCHIVED') return isEventOneDayOver(evt.date);
                    return true;
                  })
                  .map((evt) => {
                  const isOverOneDay = isEventOneDayOver(evt.date);
                  const formattedThumbnail = formatGoogleDriveUrl(evt.thumbnailUrl) || evt.thumbnailUrl;

                  return (
                    <div key={evt.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all hover:border-slate-300">
                      <div className="flex items-start sm:items-center space-x-3">
                        {evt.thumbnailUrl ? (
                          <div className="w-24 h-16 rounded-xl overflow-hidden border border-slate-300 bg-slate-900 shadow-xs shrink-0">
                            <img
                              src={formattedThumbnail}
                              alt={evt.title}
                              className="w-full h-full object-cover object-center"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80";
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-16 rounded-xl bg-slate-200 border border-slate-300 flex items-center justify-center shrink-0 text-slate-400">
                            <Calendar className="w-6 h-6" />
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-sm">{evt.title}</span>
                            {isOverOneDay ? (
                              <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-mono font-bold text-[10px] border border-rose-300 flex items-center space-x-1">
                                <Archive className="w-2.5 h-2.5" />
                                <span>Archived (1+ Day Over)</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-300">
                                Active Program
                              </span>
                            )}
                            {evt.category && evt.category.trim() !== '' && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px] border border-amber-300">
                                {evt.category.trim()}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600">
                            Date: <strong>{evt.date}</strong> ({evt.time}) • Venue: {evt.venue}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            Host: {evt.hostName || 'BUTEX Alumni'}
                          </p>
                        </div>
                      </div>

                      {confirmingEraseId === evt.id ? (
                      <div className="flex items-center space-x-2 shrink-0 bg-rose-50 border border-rose-200 p-2 rounded-xl">
                        <span className="text-xs font-bold text-rose-800">Erase post permanently?</span>
                        <button
                          onClick={() => handleConfirmErase(evt.id, evt.title)}
                          disabled={erasingId === evt.id}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg flex items-center space-x-1 shadow transition-all disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{erasingId === evt.id ? 'Erasing...' : 'Yes, Erase'}</span>
                        </button>
                        <button
                          onClick={handleCancelErase}
                          disabled={erasingId === evt.id}
                          className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => setEditingEvent({ ...evt })}
                          className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 hover:text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 border border-slate-300 shadow-xs transition-all hover:scale-[1.02]"
                          title="Edit this event program"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Edit Event Post</span>
                        </button>
                        <button
                          onClick={() => handleEraseEventPost(evt.id)}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow transition-all hover:scale-[1.02]"
                          title="Erase this event permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Erase Event Post Entirely</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            )}
          </div>

          {/* Edit Event Modal */}
          {editingEvent && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 flex flex-col">
                <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between rounded-t-3xl">
                  <div className="flex items-center space-x-2">
                    <Edit3 className="w-5 h-5 text-amber-400" />
                    <h3 className="text-base font-extrabold">Edit Event Program</h3>
                  </div>
                  <button 
                    onClick={() => setEditingEvent(null)}
                    className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveEditedEvent} className="p-6 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Event Title *</label>
                    <input
                      type="text"
                      required
                      value={editingEvent.title}
                      onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0B192C] focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Host / Organizing Committee</label>
                      <input
                        type="text"
                        value={editingEvent.hostName || ''}
                        onChange={(e) => setEditingEvent({ ...editingEvent, hostName: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0B192C] focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Category / Tag</label>
                      <input
                        type="text"
                        value={editingEvent.category || ''}
                        onChange={(e) => setEditingEvent({ ...editingEvent, category: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0B192C] focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Event Date *</label>
                      <input
                        type="text"
                        required
                        value={editingEvent.date}
                        onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0B192C] focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Event Time</label>
                      <input
                        type="text"
                        value={editingEvent.time}
                        onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0B192C] focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Venue Type</label>
                      <select
                        value={editingEvent.venueType || 'In Person'}
                        onChange={(e) => setEditingEvent({ ...editingEvent, venueType: e.target.value as any })}
                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0B192C] focus:bg-white"
                      >
                        <option value="In Person">In Person</option>
                        <option value="Online">Online Session</option>
                        <option value="Hybrid">Hybrid</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Venue Location / Name</label>
                      <input
                        type="text"
                        value={editingEvent.venue}
                        onChange={(e) => setEditingEvent({ ...editingEvent, venue: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0B192C] focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Online Meeting Link (Google Meet / Zoom)</label>
                    <input
                      type="url"
                      value={editingEvent.meetingLink || ''}
                      onChange={(e) => setEditingEvent({ ...editingEvent, meetingLink: e.target.value })}
                      placeholder="https://meet.google.com/... or https://zoom.us/..."
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0B192C] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Poster / Banner Image URL</label>
                    <input
                      type="text"
                      value={editingEvent.thumbnailUrl || ''}
                      onChange={(e) => setEditingEvent({ ...editingEvent, thumbnailUrl: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0B192C] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Event Description & Program Details</label>
                    <textarea
                      rows={3}
                      value={editingEvent.description || ''}
                      onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0B192C] focus:bg-white resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setEditingEvent(null)}
                      disabled={isUpdatingEvent}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdatingEvent}
                      className="px-5 py-2 bg-[#0B192C] hover:bg-[#1E3A8A] text-white font-bold text-xs rounded-xl shadow transition-all flex items-center space-x-1.5 disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isUpdatingEvent ? 'Saving Changes...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Panel: Event Registrations Workflow */}
      {activeTab === 'registrations' && (
        <div className="space-y-6">
          {/* Google Sheet Sync & CSV Export Bar - Super Admin Quick Access */}
          {role === 'super' && (
            <div className="bg-emerald-950 text-emerald-100 rounded-3xl p-6 border border-emerald-800 shadow-lg space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span>Super Admin Webhook & Google Sheet Integration</span>
                  </div>
                  <h3 className="text-lg font-black text-white">Event Registration Live Sync</h3>
                  <p className="text-xs text-emerald-200/80 max-w-xl">
                    All event attendee records are automatically forwarded to tab <code className="bg-emerald-900 text-amber-300 px-1.5 py-0.5 rounded font-mono">Event Registration Details</code>. Webhooks, Code.gs, and Cache controls are managed in the dedicated Super Admin tab.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <a
                    href="https://docs.google.com/spreadsheets/d/1ZY76tbYUCTS8LA4DOe76cRAorDaTSRqVTsejD_UBspE/edit?resourcekey=&gid=1943182397#gid=1943182397"
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Open Google Sheet</span>
                  </a>
                  <button
                    onClick={() => {
                      setActiveTab('apps-script');
                      if (!appsScriptCode) fetchAppsScriptCode();
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Manage Webhook & Code.gs</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 lg:p-8 shadow-sm space-y-6 overflow-hidden">
            <div className="border-b border-slate-100 pb-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200 uppercase tracking-wider">
                      Event Approval System
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      ({registrations.length} submissions)
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Event Registrations & Approval Queue
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
                    Approving a registration triggers automated email confirmations (with online meeting link if virtual) and confirms VIP access.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <button
                    onClick={fetchRegistrations}
                    disabled={regLoading}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-xs flex items-center space-x-1.5 transition-all disabled:opacity-50 shadow-sm"
                    title="Refresh registrations list"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${regLoading ? 'animate-spin text-amber-600' : 'text-slate-600'}`} />
                    <span>{regLoading ? 'Refreshing...' : 'Refresh Queue'}</span>
                  </button>
                </div>
              </div>

              {/* Responsive Toolbar with Wrapping */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href="https://docs.google.com/spreadsheets/d/1ZY76tbYUCTS8LA4DOe76cRAorDaTSRqVTsejD_UBspE/edit?resourcekey=&gid=1943182397#gid=1943182397"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-sm active:scale-95 whitespace-nowrap"
                  title="Check responses stored in admin Google Sheet"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
                  <span>Google Sheet Responses</span>
                  <ExternalLink className="w-3 h-3 text-emerald-200 shrink-0" />
                </a>
                <a
                  href="https://docs.google.com/forms/d/17JX7qmH_lrqkT0eHE2dhuPSrIjrL2WeRcF24vDNfYJQ/viewform"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-sm active:scale-95 whitespace-nowrap"
                  title="Open official Google Form for event registration"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-200 shrink-0" />
                  <span>Open Google Form</span>
                </a>
                <a
                  href="/api/admin/event-registrations/export-csv"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-sm active:scale-95 whitespace-nowrap"
                  title="Download attendee database as CSV"
                >
                  <Download className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  <span>Download Attendee CSV</span>
                </a>
                <button
                  onClick={() => {
                    setBroadcastAudience('events');
                    setShowBroadcastModal(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-sm active:scale-95 whitespace-nowrap"
                  title="Compose / Broadcast email from butexpgdalumni@gmail.com"
                >
                  <Send className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Send Mail</span>
                  <span className="text-[10px] text-amber-300 font-mono font-normal">
                    (butexpgdalumni@gmail.com)
                  </span>
                </button>
                <button
                  onClick={() => {
                    fetchEmailConfig();
                    setShowEmailConfigModal(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-all shadow-sm active:scale-95 whitespace-nowrap"
                  title="Configure Gmail SMTP / Email Dispatcher Settings"
                >
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span>Email / SMTP Settings</span>
                </button>
              </div>
            </div>

            {/* Approval Notification Banner */}
            {approvedNotice && (
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm flex flex-wrap items-center gap-2">
                        <span>Registration Approved & Official Email Ready!</span>
                        {approvedNotice.emailDispatched ? (
                          <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                            ✓ SMTP Sent to {approvedNotice.recipientEmail}
                          </span>
                        ) : (
                          <span className="bg-amber-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                            Ready via Gmail 1-Click / SMTP
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        VIP Pass & meeting link prepared for <strong className="text-slate-900">{approvedNotice.recipientEmail || 'member email'}</strong> (Attendee: <strong className="text-slate-900">{approvedNotice.studentName}</strong> • {approvedNotice.eventTitle}).
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setApprovedNotice(null)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {approvedNotice.meetingLink && (
                  <div className="bg-white border border-emerald-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 text-xs">
                      <Link className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-slate-700">Online Meeting Link:</span>
                      <a
                        href={approvedNotice.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 underline font-mono font-bold truncate max-w-xs sm:max-w-md"
                      >
                        {approvedNotice.meetingLink}
                      </a>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(approvedNotice.meetingLink || '');
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2000);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center space-x-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                      </button>
                      <a
                        href={approvedNotice.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1 shadow-sm"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Test Join</span>
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {/* 1-Click Gmail Send */}
                  {approvedNotice.gmailComposeUrl && (
                    <a
                      href={approvedNotice.gmailComposeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs inline-flex items-center space-x-1.5 shadow-sm transition-all"
                      title="Open full email pre-filled directly in Gmail Compose for 1-click dispatch"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Open in Gmail (1-Click Send)</span>
                      <ExternalLink className="w-3 h-3 text-red-200" />
                    </a>
                  )}

                  {/* Send via Default Mail App */}
                  {approvedNotice.mailtoUrl && (
                    <a
                      href={approvedNotice.mailtoUrl}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-flex items-center space-x-1.5 shadow-sm transition-all"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Send via Mail App</span>
                    </a>
                  )}

                  {/* Instant Resend via Server SMTP */}
                  <button
                    onClick={() => handleDispatchEmail(approvedNotice.regId)}
                    disabled={sendingEmailId === approvedNotice.regId}
                    className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs inline-flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sendingEmailId === approvedNotice.regId ? 'Dispatching...' : 'Resend via Server SMTP'}</span>
                  </button>

                  {/* Copy Email Body */}
                  <button
                    onClick={() => {
                      if (approvedNotice.emailBody) {
                        navigator.clipboard.writeText(approvedNotice.emailBody);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs inline-flex items-center space-x-1.5 shadow-sm"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedLink ? 'Copied Full Email!' : 'Copy Email Template'}</span>
                  </button>

                  {approvedNotice.whatsappUrl && (
                    <a
                      href={approvedNotice.whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center space-x-1.5 shadow-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Send WhatsApp Pass</span>
                    </a>
                  )}

                  <button
                    onClick={() => {
                      const reg = registrations.find(r => r.id === approvedNotice.regId);
                      if (reg) setSelectedEmailPass(reg);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs inline-flex items-center space-x-1.5 shadow-sm"
                  >
                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                    <span>View Formatted Email Ticket</span>
                  </button>
                </div>
                {emailSendStatus && (
                  <div className={`p-2.5 rounded-xl text-xs font-bold ${emailSendStatus.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {emailSendStatus.message}
                  </div>
                )}
              </div>
            )}

          {deleteRegFeedback && (
            <div className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs mb-3 ${
              deleteRegFeedback.success ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'
            }`}>
              <span>{deleteRegFeedback.text}</span>
              <button onClick={() => setDeleteRegFeedback(null)} className="text-slate-500 hover:text-slate-900 font-bold ml-2">×</button>
            </div>
          )}

          {regLoading ? (
            <p className="text-xs text-slate-500 italic py-4">Loading event registrations...</p>
          ) : registrations.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4">No event registration submissions found yet.</p>
          ) : (
            <div className="overflow-x-auto w-full rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse min-w-[680px]">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500 bg-slate-50">
                    <th className="p-3">Student Name / ID</th>
                    <th className="p-3">Event Title</th>
                    <th className="p-3">Sender No / Account</th>
                    <th className="p-3">Payment / TrxID</th>
                    <th className="p-3">Contact</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {registrations.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">
                        {r.studentName}
                        <span className="block text-[10px] font-mono text-slate-500">{r.studentId}</span>
                        {r.isVerifiedMember ? (
                          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 mt-1 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            <span>Matched Member List ({r.matchedAlumniName || 'Verified'})</span>
                          </span>
                        ) : (
                          <span className="inline-block mt-1 text-[9px] text-slate-400 italic">
                            (Number Not In Member List)
                          </span>
                        )}
                      </td>
                      <td className="p-3 max-w-xs truncate text-slate-700">
                        <div>{r.eventTitle}</div>
                        {r.meetingLink && (
                          <span className="inline-flex items-center space-x-1 text-[9px] text-emerald-700 font-bold mt-0.5">
                            <Link className="w-2.5 h-2.5" />
                            <span>Meeting Link Attached</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-slate-800 font-bold text-amber-900">
                        {r.senderNumber || 'N/A'}
                      </td>
                      <td className="p-3 font-mono text-slate-800">
                        <span className="font-bold">{r.paymentMethod}</span>: {r.transactionId}
                      </td>
                      <td className="p-3 text-slate-600">
                        <div>{r.memberPhone || r.senderNumber || 'N/A'}</div>
                        {(r.memberEmail || (r.emailOrWhatsApp && r.emailOrWhatsApp.includes('@'))) && (
                          <div className="flex items-center space-x-1 text-[10px] text-amber-900 font-mono mt-0.5">
                            <Mail className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                            <span className="truncate max-w-[140px]">{r.memberEmail || r.emailOrWhatsApp}</span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {r.emailNotified && (
                            <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              <span>Email Sent</span>
                            </span>
                          )}
                          {r.googleFormSynced && (
                            <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[9px] font-bold">
                              <CheckCircle2 className="w-2.5 h-2.5 text-blue-600" />
                              <span>Google Form Synced</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          r.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                          r.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        {r.status === 'Approved' ? (
                          <div className="inline-flex items-center space-x-1.5">
                            <button
                              onClick={() => setSelectedEmailPass(r)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[10px] inline-flex items-center space-x-1 shadow"
                              title="View official access pass & email template"
                            >
                              <Mail className="w-3 h-3 text-amber-400" />
                              <span>View Pass</span>
                            </button>
                            <button
                              onClick={() => handleDispatchEmail(r.id)}
                              disabled={sendingEmailId === r.id}
                              className="px-2 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[10px] inline-flex items-center space-x-1 shadow disabled:opacity-50"
                              title="Send or resend email via SMTP"
                            >
                              <Send className="w-2.5 h-2.5" />
                              <span>{sendingEmailId === r.id ? 'Sending...' : 'Send Mail'}</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleUpdateRegStatus(r.id, 'Approved')}
                            disabled={approvingRegId === r.id}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] inline-flex items-center space-x-1 shadow disabled:opacity-50"
                          >
                            <Check className="w-3 h-3" />
                            <span>{approvingRegId === r.id ? 'Approving & Sending...' : 'Approve & Notify Email'}</span>
                          </button>
                        )}
                        {r.status !== 'Rejected' && (
                          <button
                            onClick={() => handleUpdateRegStatus(r.id, 'Rejected')}
                            disabled={approvingRegId === r.id}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] inline-flex items-center space-x-1 shadow disabled:opacity-50"
                          >
                            <X className="w-3 h-3" />
                            <span>Reject</span>
                          </button>
                        )}

                        {/* Delete Registration Option */}
                        {confirmingDeleteRegId === r.id ? (
                          <div className="inline-flex items-center space-x-1 bg-rose-50 border border-rose-300 p-1 rounded-lg">
                            <span className="text-[9px] font-bold text-rose-800">Delete?</span>
                            <button
                              onClick={() => handleDeleteRegistration(r.id, r.studentName)}
                              disabled={deletingRegId === r.id}
                              className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[9px] rounded transition-all disabled:opacity-50"
                            >
                              {deletingRegId === r.id ? '...' : 'Yes'}
                            </button>
                            <button
                              onClick={() => setConfirmingDeleteRegId(null)}
                              className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[9px] rounded transition-all"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmingDeleteRegId(r.id)}
                            className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 hover:text-rose-900 font-bold text-[10px] inline-flex items-center space-x-1 shadow-xs transition-all active:scale-95 ml-1"
                            title="Delete this registration record"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                            <span>Delete</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Tab Panel: New Member Join Requests & Directory Verification */}
      {activeTab === 'member-requests' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  <span>Member Directory Join & Approval System</span>
                </div>
                <h2 className="text-xl font-black text-white">Alumni Join Applications & Google Sheet Queue</h2>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  When you approve a member application, they are immediately added to the live directory, and an official welcome notification is dispatched by email (<strong>"Welcome to BUTEX PGD Alumni Association! You are now part of this PGD Alumni"</strong>) and WhatsApp.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowMemberModal(true)}
                  className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center space-x-1.5 transition-all shadow-md"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Quick Add Member</span>
                </button>
                <a
                  href="/api/admin/members/export-csv"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export to Google Sheet CSV</span>
                </a>
                <button
                  onClick={fetchMemberRequests}
                  className="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
              <div>
                <h3 className="text-lg font-black text-slate-900">Member Applications Queue ({memberRequests.length})</h3>
                <p className="text-xs text-slate-500">Review new PGD graduates submitting verification forms or joining from Google Sheets.</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                  Sender: butexpgdalumni@gmail.com
                </span>
                <button
                  onClick={() => {
                    setBroadcastAudience('members');
                    setShowBroadcastModal(true);
                  }}
                  className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold flex items-center space-x-1"
                >
                  <Mail className="w-3 h-3" />
                  <span>Email All Members</span>
                </button>
              </div>
            </div>

            {/* Approved Member Success & Quick Gmail Dispatch Banner */}
            {approvedMemberNotice && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 text-emerald-950 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h4 className="font-extrabold text-sm text-emerald-900">
                        {approvedMemberNotice.name} Approved & Added to Live Directory!
                      </h4>
                      <p className="text-xs text-emerald-700">
                        Official Welcome Email prepared from <b>butexpgdalumni@gmail.com</b> {approvedMemberNotice.email ? `for ${approvedMemberNotice.email}` : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setApprovedMemberNotice(null)}
                    className="text-emerald-700 hover:text-emerald-950 text-xs font-bold"
                  >
                    Dismiss
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {approvedMemberNotice.gmailComposeUrl && (
                    <a
                      href={approvedMemberNotice.gmailComposeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs inline-flex items-center space-x-1.5 shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open in Gmail (1-Click Send from butexpgdalumni@gmail.com)</span>
                    </a>
                  )}
                  {approvedMemberNotice.memberId && (
                    <button
                      onClick={() => handleResendMemberEmail(approvedMemberNotice.memberId)}
                      disabled={sendingMemberEmailId === approvedMemberNotice.memberId}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{sendingMemberEmailId === approvedMemberNotice.memberId ? 'Sending...' : 'Resend via Server SMTP'}</span>
                    </button>
                  )}
                  {approvedMemberNotice.mailtoUrl && (
                    <a
                      href={approvedMemberNotice.mailtoUrl}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs inline-flex items-center space-x-1"
                    >
                      <Mail className="w-3 h-3" />
                      <span>Mail App</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {memReqLoading ? (
              <p className="text-xs text-slate-500 italic py-4">Loading member requests...</p>
            ) : memberRequests.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">No pending member join applications found.</p>
            ) : (
              <div className="overflow-x-auto w-full rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse min-w-[640px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500 bg-slate-50">
                      <th className="p-3">Full Name / Batch</th>
                      <th className="p-3">Organization & Role</th>
                      <th className="p-3">Email Address</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Approval Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {memberRequests.map(m => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{m.name}</div>
                          <div className="text-[10px] font-mono text-slate-500">{m.rollNo} • {m.batch || 'PGD Alumni'}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-800">{m.company}</div>
                          <div className="text-[10px] text-slate-500">{m.designation}</div>
                        </td>
                        <td className="p-3 font-mono text-slate-700">
                          {m.email ? (
                            <div>
                              <span>{m.email}</span>
                              {m.emailNotified && (
                                <span className="block text-[9px] text-emerald-700 font-bold mt-0.5">
                                  ✓ Welcome Email Dispatched
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">N/A</span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-slate-700">{m.phone || 'N/A'}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            m.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                            m.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {m.status}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                          {m.status !== 'Approved' ? (
                            <button
                              onClick={() => handleUpdateMemberRequestStatus(m.id, 'Approved')}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] inline-flex items-center space-x-1 shadow transition-all hover:scale-105"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Approve & Send Email</span>
                            </button>
                          ) : (
                            <>
                              {m.email && (
                                <button
                                  onClick={() => handleResendMemberEmail(m.id)}
                                  disabled={sendingMemberEmailId === m.id}
                                  className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] inline-flex items-center space-x-1 shadow-sm disabled:opacity-50"
                                  title="Resend welcome email from butexpgdalumni@gmail.com"
                                >
                                  <Send className="w-3 h-3 text-amber-400" />
                                  <span>{sendingMemberEmailId === m.id ? 'Sending...' : 'Resend Email'}</span>
                                </button>
                              )}
                              {m.email && (
                                <a
                                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(m.email)}&su=${encodeURIComponent("Welcome to BUTEX PGD Alumni Association! You are now part of this PGD Alumni")}&body=${encodeURIComponent(`Dear ${m.name},\n\nCongratulations! Your membership for BUTEX PGD Alumni Association has been verified and approved.\n\nName: ${m.name}\nRoll: ${m.rollNo}\nBatch: ${m.batch || 'PGD Alumni'}\nCompany: ${m.company} (${m.designation})\n\nWarm regards,\nExecutive Committee\nBUTEX PGD Alumni Association\nOfficial Email: butexpgdalumni@gmail.com`)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] inline-flex items-center space-x-1 shadow-sm"
                                  title="Compose in Gmail from butexpgdalumni@gmail.com"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>1-Click Gmail</span>
                                </a>
                              )}
                            </>
                          )}
                          {m.status !== 'Rejected' && (
                            <button
                              onClick={() => handleUpdateMemberRequestStatus(m.id, 'Rejected')}
                              className="px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-bold text-[10px] inline-flex items-center space-x-1"
                            >
                              <X className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Panel 2: Directory Controls */}
      {activeTab === 'directory' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6 text-amber-600" />
              <div>
                <h2 className="text-lg font-bold text-slate-900">Alumni Directory Management</h2>
                <p className="text-xs text-slate-600">
                  Manage, verify, and monitor student entries and batch member profiles across all PGD batches.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <a
                href="https://drive.google.com/file/d/1uMOI8R1PHXxq59k8mWVe7dEqOe60sePKmULDWbwrDEg/view?usp=sharing"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow"
                title="Google Drive Official Student ID Information Document"
              >
                <FileText className="w-4 h-4 text-amber-400" />
                <span>STUDENT ID Info</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>

              <button
                onClick={() => setShowMemberModal(true)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Register & Broadcast Member</span>
              </button>

              <button
                onClick={() => {
                  fetch('/api/alumni/sync', { method: 'POST' })
                    .then(r => r.json())
                    .then(data => {
                      if (data.success) {
                        alert(`✓ Successfully synced ${data.count} alumni records from Google Sheet!`);
                        window.location.reload();
                      }
                    });
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Sync Google Sheet</span>
              </button>
            </div>
          </div>

          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs text-emerald-950 font-semibold flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Google Sheet Webhook Active & Connected: Whenever new member joins Google Sheet, WhatsApp group gets notified automatically!</span>
            </div>
            <span className="text-[10px] text-emerald-800 font-mono font-bold bg-emerald-100 px-2 py-1 rounded">Live Sync Ready</span>
          </div>

          {/* Modal for Adding Member */}
          {showMemberModal && (
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 border border-slate-200 shadow-2xl relative">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">Register New Alumni Member</h3>
                      <p className="text-xs text-slate-500">Triggers WhatsApp Group Notification via Whapi.cloud</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowMemberModal(false)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {newMemMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{newMemMsg}</span>
                  </div>
                )}

                <form onSubmit={handleMemberJoinSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Engr. S. M. Farhan"
                        value={newMemName}
                        onChange={(e) => setNewMemName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Roll / SL / Batch No.</label>
                      <input
                        type="text"
                        placeholder="e.g., PGD-2025 / SL-108"
                        value={newMemRoll}
                        onChange={(e) => setNewMemRoll(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Email Address (For Welcome Email)</label>
                      <input
                        type="email"
                        placeholder="e.g., member@alumni.butex.edu.bd"
                        value={newMemEmail}
                        onChange={(e) => setNewMemEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Phone Number</label>
                      <input
                        type="text"
                        placeholder="e.g., 01711223344"
                        value={newMemPhone}
                        onChange={(e) => setNewMemPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Company Name</label>
                      <input
                        type="text"
                        placeholder="e.g., Beximco Industrial Park"
                        value={newMemCompany}
                        onChange={(e) => setNewMemCompany(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Designation</label>
                      <input
                        type="text"
                        placeholder="e.g., Senior Executive - Production"
                        value={newMemDesig}
                        onChange={(e) => setNewMemDesig(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowMemberModal(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={newMemLoading}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>{newMemLoading ? 'Broadcasting...' : 'Register & Dispatch WhatsApp Alert'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Panel 3: Companies (Admin & Coding Admin Partner Companies Manager) */}
      {activeTab === 'companies' && (
        <AdminCompaniesModule
          alumniList={alumniList}
          role={role}
          onSelectCompany={onSelectCompany}
        />
      )}

      {/* Tab Panel: Table Talk Moderation */}
      {activeTab === 'table-talk' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-[#002147]" />
                <span>Table Talk Moderation & Content Controls</span>
              </h2>
              <p className="text-xs text-slate-500">
                Review all active Table Talk discussions, inspect attached media links, and instantly erase offensive or expired posts.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={fetchTableTalkPosts}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl shadow-sm transition-colors"
              >
                Refresh
              </button>
              {tableTalkPosts.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllTableTalk}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                  title="Wipe all Table Talk posts and discussions"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Clear All Discussions</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs text-amber-900 flex items-center justify-between">
            <span>⏱ <strong>14-Day Expiration Policy:</strong> Posts auto-delete after 14 days (336 hours). Admins can also erase posts instantly below.</span>
            <span className="font-mono font-bold text-[10px] text-amber-800">Bo6M44... Token Configured</span>
          </div>

          {ttLoading ? (
            <p className="text-xs text-slate-500 italic py-4">Loading Table Talk posts for moderation...</p>
          ) : tableTalkPosts.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <p className="font-bold">No Table Talk posts in queue.</p>
              <p className="text-[11px] text-slate-400">Posts created by hosts on the Table Talk tab will appear here for admin oversight.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tableTalkPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 transition-all"
                >
                  <div className="space-y-2 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-[#002147] text-[#FFBF00] font-extrabold rounded text-[10px]">
                        {post.id}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">{post.hostName}</span>
                      <span className="text-xs text-slate-500">({post.hostEmail || 'Host'})</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Published: {new Date(post.publishedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-800 font-medium bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                      "{post.discussionTopic}"
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
                      <span>📅 Due: <strong>{post.dueDate} ({post.dueTime})</strong></span>
                      {post.attachedFileLink && (
                        <a
                          href={post.attachedFileLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline font-bold flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Attachment File</span>
                        </a>
                      )}
                      {post.takenPictureLink && (
                        <a
                          href={post.takenPictureLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-purple-600 hover:underline font-bold flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Taken Photo</span>
                        </a>
                      )}
                      <span>⭐ Reviews: <strong>{post.reviews?.length || 0}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setEditingTableTalk({ ...post })}
                      className="w-full md:w-auto px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-xs flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02]"
                      title="Edit Table Talk Discussion"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Edit Post</span>
                    </button>
                    <button
                      onClick={() => handleDeleteTableTalkPost(post.id, post.discussionTopic)}
                      className="w-full md:w-auto px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Post</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Edit Table Talk Modal */}
          {editingTableTalk && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 flex flex-col">
                <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between rounded-t-3xl">
                  <div className="flex items-center space-x-2">
                    <Edit3 className="w-5 h-5 text-amber-400" />
                    <h3 className="text-base font-extrabold">Edit Table Talk Discussion</h3>
                  </div>
                  <button 
                    onClick={() => setEditingTableTalk(null)}
                    className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveEditedTableTalk} className="p-6 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Discussion Topic / Question *</label>
                    <textarea
                      required
                      rows={4}
                      value={editingTableTalk.discussionTopic}
                      onChange={(e) => setEditingTableTalk({ ...editingTableTalk, discussionTopic: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0B192C] focus:bg-white resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Due Date</label>
                      <input
                        type="text"
                        value={editingTableTalk.dueDate || ''}
                        onChange={(e) => setEditingTableTalk({ ...editingTableTalk, dueDate: e.target.value })}
                        placeholder="e.g. Oct 25, 2026 or YYYY-MM-DD"
                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0B192C] focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Due Time</label>
                      <input
                        type="text"
                        value={editingTableTalk.dueTime || ''}
                        onChange={(e) => setEditingTableTalk({ ...editingTableTalk, dueTime: e.target.value })}
                        placeholder="e.g. 05:00 PM"
                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0B192C] focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Host Name</label>
                      <input
                        type="text"
                        value={editingTableTalk.hostName || ''}
                        onChange={(e) => setEditingTableTalk({ ...editingTableTalk, hostName: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0B192C] focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Host Student ID / Roll</label>
                      <input
                        type="text"
                        value={editingTableTalk.hostRoll || ''}
                        onChange={(e) => setEditingTableTalk({ ...editingTableTalk, hostRoll: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0B192C] focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Host Email</label>
                      <input
                        type="email"
                        value={editingTableTalk.hostEmail || ''}
                        onChange={(e) => setEditingTableTalk({ ...editingTableTalk, hostEmail: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0B192C] focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Attached Document / File Link (Google Drive)</label>
                    <input
                      type="url"
                      value={editingTableTalk.attachedFileLink || ''}
                      onChange={(e) => setEditingTableTalk({ ...editingTableTalk, attachedFileLink: e.target.value })}
                      placeholder="https://drive.google.com/..."
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0B192C] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Attached Photo / Picture Link</label>
                    <input
                      type="url"
                      value={editingTableTalk.takenPictureLink || ''}
                      onChange={(e) => setEditingTableTalk({ ...editingTableTalk, takenPictureLink: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0B192C] focus:bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setEditingTableTalk(null)}
                      disabled={isUpdatingTableTalk}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdatingTableTalk}
                      className="px-5 py-2 bg-[#0B192C] hover:bg-[#1E3A8A] text-white font-bold text-xs rounded-xl shadow transition-all flex items-center space-x-1.5 disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isUpdatingTableTalk ? 'Saving Changes...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Panel 7: Whapi.cloud WhatsApp Notification Settings */}
      {activeTab === 'whapi-config' && role === 'super' && (
        <WhapiSettingsModule />
      )}

      {/* Tab Panel 8: Google Sheet Live Sync, Code.gs & Cache Purge (Super Admin Only) */}
      {activeTab === 'apps-script' && role === 'super' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>Super Admin Enterprise Tools</span>
                </div>
                <h2 className="text-xl font-black text-white">Google Sheet Sync, Code.gs & Cache Controls</h2>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Manage live Google Apps Script webhooks, copy the production <code className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded">Code.gs</code> backend script, and purge stored browser & memory cache to immediately sync fresh data.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <a
                  href="https://docs.google.com/spreadsheets/d/1ZY76tbYUCTS8LA4DOe76cRAorDaTSRqVTsejD_UBspE/edit?resourcekey=&gid=1943182397#gid=1943182397"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Master Google Sheet</span>
                </a>
                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLScT82KiXdAQg-Xlgr7xXfnbcoiAakTNm58FTt233tP_9BMEcw/viewform?usp=publish-editor"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Master Google Form</span>
                </a>
              </div>
            </div>
          </div>

          {/* Feature 1: Purge Stored Cache Memory */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-amber-600" />
                  <span>Purge Stored Cache Memory</span>
                </h3>
                <p className="text-xs text-slate-500 max-w-xl">
                  If modifications in Google Sheets or Table Talk aren't showing immediately, purge all browser storage and in-memory caches. This forces immediate direct queries to the backend.
                </p>
              </div>
              <button
                onClick={handlePurgeCache}
                disabled={cachePurging}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center space-x-2 shadow-md transition-all shrink-0 disabled:opacity-50"
              >
                <RotateCcw className={`w-4 h-4 ${cachePurging ? 'animate-spin' : ''}`} />
                <span>{cachePurging ? 'Purging Memory Cache...' : 'Purge Stored Cache Memory'}</span>
              </button>
            </div>

            {cachePurgeMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{cachePurgeMsg}</span>
              </div>
            )}
          </div>

          {/* Feature 2: Webhook Endpoint Configuration */}
          <div className="bg-emerald-950 text-emerald-100 rounded-3xl p-6 sm:p-8 border border-emerald-800 shadow-xl space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Link className="w-5 h-5 text-emerald-400" />
                <span>Live Google Apps Script Webhook URL</span>
              </h3>
              <p className="text-xs text-emerald-200/80 max-w-2xl">
                When you deploy the script below as a Web App, paste the generated <code className="bg-emerald-900 text-emerald-300 px-1 py-0.5 rounded">https://script.google.com/macros/s/.../exec</code> URL here. All Event Announcements, Registrations, Automated Approval Emails (with Meeting Link), and Table Talk Posts will stream to your Google Sheet.
              </p>
            </div>

            <form onSubmit={handleSaveWebhook} className="bg-emerald-900/60 p-4 rounded-2xl border border-emerald-700/60 space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="url"
                  value={sheetWebhookUrl}
                  onChange={(e) => setSheetWebhookUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
                  className="w-full bg-slate-950 border border-emerald-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-emerald-600 focus:outline-none focus:border-emerald-400 font-mono"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center space-x-1.5 shrink-0 transition-all shadow"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Webhook</span>
                </button>
              </div>
              {sheetStatusMsg && (
                <p className="text-xs font-bold text-amber-300 pt-1">{sheetStatusMsg}</p>
              )}
            </form>
          </div>

          {/* Feature 3: Complete Google Apps Script (Code.gs) Viewer & Copy Tool */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <span>Production Google Apps Script (<code className="text-emerald-700">Code.gs</code>)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Handles Event_Programs, Event Registration Details, Table_Talk, and sends automated attendee approval emails with meeting links using <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">MailApp</code>.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    if (!appsScriptCode) {
                      fetchAppsScriptCode();
                    } else {
                      navigator.clipboard.writeText(appsScriptCode);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 3000);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCode ? '✓ Copied to Clipboard!' : 'Copy Code.gs'}</span>
                </button>
                <a
                  href="/api/apps-script-code"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center space-x-1.5 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Raw API View</span>
                </a>
              </div>
            </div>

            {/* Quick 3-Step Deployment Guide */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-xs text-amber-950 space-y-1.5">
              <p className="font-extrabold text-amber-900">🚀 Easy 3-Step Setup Instructions:</p>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-900">
                <li>Open your <a href="https://docs.google.com/spreadsheets/d/1ZY76tbYUCTS8LA4DOe76cRAorDaTSRqVTsejD_UBspE/edit" target="_blank" rel="noreferrer" className="underline font-bold text-amber-800">Master Google Sheet</a>, then click <strong>Extensions &gt; Apps Script</strong>.</li>
                <li>Delete any placeholder code in <code className="bg-amber-200/80 px-1 py-0.5 rounded font-mono">Code.gs</code>, copy and paste the complete script below, and click <strong>Save (💾)</strong>.</li>
                <li>Click <strong>Deploy &gt; New deployment &gt; Select type (⚙️ Web app)</strong>:
                  <ul className="list-disc list-inside pl-4 mt-0.5 font-mono text-[10px] text-amber-800">
                    <li>Execute as: <strong>Me</strong></li>
                    <li>Who has access: <strong>Anyone</strong></li>
                  </ul>
                  Click <strong>Deploy</strong>, grant permissions, and paste the Web App URL into the Webhook field above!
                </li>
              </ol>
            </div>

            {/* Code Box */}
            <div className="relative">
              {loadingCode ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-900 rounded-2xl">
                  Loading latest production Code.gs...
                </div>
              ) : (
                <pre className="bg-slate-950 text-emerald-300 p-4 rounded-2xl text-xs font-mono overflow-x-auto max-h-[500px] overflow-y-auto border border-slate-800 leading-relaxed select-all">
                  {appsScriptCode || `// Click "Copy Code.gs" above or visit /api/apps-script-code to view the script.
// It automatically configures tabs: "Event_Programs", "Event Registration Details", and "Table_Talk"`}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Selected Email Pass & Meeting Link Modal */}
      {selectedEmailPass && (
        <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-auto flex flex-col">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Official Event Registration & Access Pass</h3>
              </div>
              <button
                onClick={() => setSelectedEmailPass(null)}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400">
                  <span>Attendee & Ticket Details</span>
                  <span className="text-emerald-700 font-extrabold bg-emerald-100 px-2 py-0.5 rounded-full">Approved & Confirmed</span>
                </div>
                <div className="text-base font-black text-slate-900">{selectedEmailPass.studentName}</div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-slate-700">
                  <div><span className="text-slate-400 font-mono">Roll / ID:</span> <strong>{selectedEmailPass.studentId}</strong></div>
                  <div><span className="text-slate-400 font-mono">Reg ID:</span> <strong>{selectedEmailPass.id}</strong></div>
                  <div className="col-span-2"><span className="text-slate-400 font-mono">Email:</span> <strong className="text-amber-900">{selectedEmailPass.memberEmail || selectedEmailPass.emailOrWhatsApp}</strong></div>
                  <div><span className="text-slate-400 font-mono">Phone:</span> <strong>{selectedEmailPass.memberPhone || selectedEmailPass.senderNumber || 'N/A'}</strong></div>
                  <div><span className="text-slate-400 font-mono">TrxID:</span> <strong className="font-mono">{selectedEmailPass.paymentGateway || selectedEmailPass.paymentMethod}: {selectedEmailPass.transactionId}</strong></div>
                </div>
              </div>

              {selectedEmailPass.meetingLink && (
                <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
                    <Link className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Designated Online Meeting Link</span>
                  </div>
                  <a
                    href={selectedEmailPass.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="block font-mono text-amber-950 font-bold underline truncate bg-white/80 p-2.5 rounded-xl border border-amber-200"
                  >
                    {selectedEmailPass.meetingLink}
                  </a>
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedEmailPass.meetingLink || '');
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center space-x-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedLink ? 'Copied Link!' : 'Copy Meeting Link'}</span>
                    </button>
                    <a
                      href={selectedEmailPass.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Session</span>
                    </a>
                  </div>
                </div>
              )}

              <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Confirmation Email Content Dispatched</div>
                  {selectedEmailPass.emailNotified && (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Email Notified</span>
                    </span>
                  )}
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl font-sans text-slate-800 whitespace-pre-wrap leading-relaxed border border-slate-100 text-xs select-all">
{`Dear ${selectedEmailPass.studentName},

Congratulations! Your registration for "${selectedEmailPass.eventTitle}" has been officially APPROVED & CONFIRMED by the BUTEX PGD Alumni Executive Committee.

EVENT DETAILS:
- Event: ${selectedEmailPass.eventTitle}

${selectedEmailPass.meetingLink ? `🔗 DESIGNATED ONLINE MEETING LINK:\n${selectedEmailPass.meetingLink}\n(Click the link above to join the live session)\n` : ''}- Attendee: ${selectedEmailPass.studentName}
- Roll / ID: ${selectedEmailPass.studentId}
- Registration ID: ${selectedEmailPass.id}
- Payment: ${selectedEmailPass.paymentGateway || selectedEmailPass.paymentMethod || 'bKash'}
- TrxID / Ref: ${selectedEmailPass.transactionId}
- Status: Confirmed & VIP Verified

Please keep this email confirmation handy at the entrance or when connecting online.

Warm regards,
BUTEX PGD Alumni Association
Contact: butexpgdalumni@gmail.com`}
                </div>

                {/* Direct Action Dispatch Row */}
                {(() => {
                  const toEmail = selectedEmailPass.memberEmail || (selectedEmailPass.emailOrWhatsApp.includes('@') ? selectedEmailPass.emailOrWhatsApp : '');
                  const subject = `Registration Approved: ${selectedEmailPass.eventTitle} — BUTEX PGD Alumni`;
                  const body = `Dear ${selectedEmailPass.studentName},\n\nCongratulations! Your registration for "${selectedEmailPass.eventTitle}" has been officially APPROVED & CONFIRMED by the BUTEX PGD Alumni Executive Committee.\n\nEVENT DETAILS:\n- Event: ${selectedEmailPass.eventTitle}\n\n${selectedEmailPass.meetingLink ? `🔗 DESIGNATED ONLINE MEETING LINK:\n${selectedEmailPass.meetingLink}\n(Click the link above to join the live session)\n` : ''}- Attendee: ${selectedEmailPass.studentName}\n- Roll / ID: ${selectedEmailPass.studentId}\n- Registration ID: ${selectedEmailPass.id}\n- Payment: ${selectedEmailPass.paymentGateway || selectedEmailPass.paymentMethod || 'bKash'}\n- TrxID / Ref: ${selectedEmailPass.transactionId}\n- Status: Confirmed & VIP Verified\n\nPlease keep this email confirmation handy at the entrance or when connecting online.\n\nWarm regards,\nBUTEX PGD Alumni Association\nContact: butexpgdalumni@gmail.com`;
                  const gmailUrl = toEmail ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(toEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` : '';
                  const mailto = toEmail ? `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` : '';

                  return (
                    <div className="space-y-2 pt-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {gmailUrl && (
                          <a
                            href={gmailUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs inline-flex items-center space-x-1.5 shadow-sm transition-all"
                            title="Open in Gmail Compose pre-filled"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>Open in Gmail (1-Click Send)</span>
                            <ExternalLink className="w-3 h-3 text-red-200" />
                          </a>
                        )}

                        <button
                          onClick={() => handleDispatchEmail(selectedEmailPass.id)}
                          disabled={sendingEmailId === selectedEmailPass.id}
                          className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs inline-flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{sendingEmailId === selectedEmailPass.id ? 'Dispatching via SMTP...' : 'Dispatch via Server SMTP'}</span>
                        </button>

                        {mailto && (
                          <a
                            href={mailto}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-flex items-center space-x-1.5 shadow-sm"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>Mail App</span>
                          </a>
                        )}

                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(body);
                            setCopiedLink(true);
                            setTimeout(() => setCopiedLink(false), 2000);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs inline-flex items-center space-x-1.5"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedLink ? 'Copied Full Body!' : 'Copy Entire Email Text'}</span>
                        </button>
                      </div>

                      {emailSendStatus && (
                        <div className={`p-2.5 rounded-xl text-xs font-bold ${emailSendStatus.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {emailSendStatus.message}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => {
                    const fullText = `Event: ${selectedEmailPass.eventTitle}\nAttendee: ${selectedEmailPass.studentName} (${selectedEmailPass.studentId})\nMeeting Link: ${selectedEmailPass.meetingLink || 'N/A'}\nTrxID: ${selectedEmailPass.transactionId}`;
                    navigator.clipboard.writeText(fullText);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center space-x-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'Copied Ticket Info!' : 'Copy Ticket Info'}</span>
                </button>
                <button
                  onClick={() => setSelectedEmailPass(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                >
                  Close Pass
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email / SMTP Configuration Modal */}
      {showEmailConfigModal && (
        <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-auto flex flex-col">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Gmail SMTP & Email Dispatcher Settings</h3>
                  <p className="text-[11px] text-slate-400">Automated event approvals from butexpgdalumni@gmail.com</p>
                </div>
              </div>
              <button
                onClick={() => setShowEmailConfigModal(false)}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs overflow-y-auto max-h-[80vh]">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 space-y-1.5">
                <div className="font-bold text-xs flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>How to enable instant email sending from butexpgdalumni@gmail.com:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-800 leading-relaxed">
                  <li>Go to your Google Account (<strong>butexpgdalumni@gmail.com</strong>) &gt; <strong>Security</strong>.</li>
                  <li>Ensure <strong>2-Step Verification</strong> is enabled.</li>
                  <li>Search for <strong>"App passwords"</strong> (or visit <em>myaccount.google.com/apppasswords</em>).</li>
                  <li>Create a new App password named <strong>"BUTEX Portal"</strong>.</li>
                  <li>Copy the 16-character code, paste below into <strong>SMTP Password</strong>, and click <strong>Save Settings</strong>.</li>
                </ol>
              </div>

              <form onSubmit={saveEmailConfig} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">SMTP Server</label>
                    <input
                      type="text"
                      value={emailConfigData.smtpHost}
                      onChange={e => setEmailConfigData({ ...emailConfigData, smtpHost: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-amber-400 outline-none"
                      placeholder="smtp.gmail.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">SMTP Port</label>
                    <input
                      type="number"
                      value={emailConfigData.smtpPort}
                      onChange={e => setEmailConfigData({ ...emailConfigData, smtpPort: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-amber-400 outline-none"
                      placeholder="465"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                      <span>Sender Account (Locked)</span>
                      <span className="text-[10px] text-emerald-600 font-extrabold flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified Sender
                      </span>
                    </label>
                    <div className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 font-mono text-xs text-slate-900 font-bold flex items-center justify-between">
                      <span>butexpgdalumni@gmail.com</span>
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">Official</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">All outgoing mail is strictly sent from this Gmail account.</p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                      <span>Gmail 16-character App Password</span>
                      {emailConfigData.hasPassword && (
                        <span className="text-emerald-600 font-bold text-[10px]">(Active ✓)</span>
                      )}
                    </label>
                    <input
                      type="password"
                      value={emailConfigData.smtpPass}
                      onChange={e => setEmailConfigData({ ...emailConfigData, smtpPass: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-amber-400 outline-none"
                      placeholder={emailConfigData.hasPassword ? "•••••••••••••••• (Leave blank to keep)" : "Enter 16-char App Password"}
                    />
                    <a
                      href="https://myaccount.google.com/apppasswords"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-amber-700 hover:text-amber-900 font-bold underline inline-flex items-center space-x-1 mt-1"
                    >
                      <span>Generate Google App Password for butexpgdalumni@gmail.com</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Display Sender Name</label>
                  <input
                    type="text"
                    value={emailConfigData.senderName}
                    onChange={e => setEmailConfigData({ ...emailConfigData, senderName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-400 outline-none"
                    placeholder="BUTEX PGD Alumni Association"
                  />
                </div>

                {emailConfigMsg && (
                  <div className={`p-3 rounded-xl text-xs font-bold ${emailConfigMsg.includes('✓') ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {emailConfigMsg}
                  </div>
                )}

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEmailConfigModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={emailConfigLoading}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{emailConfigLoading ? 'Saving...' : 'Save Settings'}</span>
                  </button>
                </div>
              </form>

              {/* Test Email Section */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Test SMTP Connection</h4>
                  <span className="text-[10px] text-slate-500">From: butexpgdalumni@gmail.com</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={testEmailRecipient}
                    onChange={e => setTestEmailRecipient(e.target.value)}
                    placeholder="recipient@example.com"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-amber-400 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleTestEmail}
                    disabled={testingEmail || !testEmailRecipient}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shrink-0 disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    <Send className="w-3 h-3" />
                    <span>{testingEmail ? 'Sending...' : 'Send Test'}</span>
                  </button>
                </div>
                {testEmailMsg && (
                  <div className={`p-2.5 rounded-xl text-xs font-bold ${testEmailMsg.includes('✓') ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'} space-y-1`}>
                    <div>{testEmailMsg}</div>
                    {testEmailGmailUrl && (
                      <div>
                        <a
                          href={testEmailGmailUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 underline text-emerald-950 hover:text-emerald-800 font-extrabold text-[11px]"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Open & Send via 1-Click Gmail (butexpgdalumni@gmail.com)</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast / Custom Email Composer Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-[125] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-auto flex flex-col">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Compose Email Dispatcher</h3>
                  <p className="text-[11px] text-amber-400 font-mono">From: butexpgdalumni@gmail.com</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowBroadcastModal(false);
                  setBroadcastStatus(null);
                }}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBroadcastSend} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Official Sender</div>
                  <div className="font-bold text-slate-900 font-mono">butexpgdalumni@gmail.com</div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                  Enforced Sender ✓
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Select Audience / Recipient</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBroadcastAudience('single')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs border text-center transition-all ${
                      broadcastAudience === 'single'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Single Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setBroadcastAudience('events')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs border text-center transition-all ${
                      broadcastAudience === 'events'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Event Attendees ({registrations.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBroadcastAudience('members')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs border text-center transition-all ${
                      broadcastAudience === 'members'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    All Members ({memberRequests.length})
                  </button>
                </div>
              </div>

              {broadcastAudience === 'single' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Recipient Email Address</label>
                  <input
                    type="email"
                    value={broadcastSingleEmail}
                    onChange={e => setBroadcastSingleEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-amber-400 outline-none"
                    required={broadcastAudience === 'single'}
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Email Subject</label>
                <input
                  type="text"
                  value={broadcastSubject}
                  onChange={e => setBroadcastSubject(e.target.value)}
                  placeholder="Official Notice: BUTEX PGD Alumni Association"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs focus:ring-2 focus:ring-amber-400 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Message Body</label>
                <textarea
                  rows={6}
                  value={broadcastMessage}
                  onChange={e => setBroadcastMessage(e.target.value)}
                  placeholder="Dear Alumni,&#10;&#10;Write your official announcement or message here...&#10;&#10;Warm regards,&#10;BUTEX PGD Alumni Association"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-400 outline-none leading-relaxed"
                  required
                />
              </div>

              {broadcastStatus && (
                <div className={`p-3 rounded-xl text-xs font-bold space-y-2 ${broadcastStatus.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  <div>{broadcastStatus.message}</div>
                  {broadcastStatus.gmailUrl && (
                    <div>
                      <a
                        href={broadcastStatus.gmailUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 underline text-emerald-950 font-extrabold"
                      >
                        <span>Open pre-filled in Gmail (from butexpgdalumni@gmail.com)</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(broadcastSingleEmail)}&su=${encodeURIComponent(broadcastSubject)}&body=${encodeURIComponent(broadcastMessage)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs inline-flex items-center space-x-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>1-Click Gmail</span>
                </a>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBroadcastModal(false);
                      setBroadcastStatus(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={broadcastLoading}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{broadcastLoading ? 'Sending...' : 'Send from butexpgdalumni@gmail.com'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
