import React, { useState, useEffect } from 'react';
import { 
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
  AlertTriangle
} from 'lucide-react';
import { JobPost, EventItem, EventRegistration, TableTalkPost } from '../types';
import { WhapiSettingsModule } from './WhapiSettingsModule';

interface AdminDashboardModuleProps {
  adminJobs: JobPost[];
  onUpdateJobStatus: (id: string, status: 'approved' | 'rejected' | 'pending') => void;
  onDeleteJob?: (id: string, title: string) => void;
  events?: EventItem[];
  onRefreshEvents?: () => void;
}

type AdminTab = 'jobs' | 'events' | 'registrations' | 'directory' | 'companies' | 'table-talk' | 'whapi-config';
type AdminRole = 'super' | 'admin' | null;

export const AdminDashboardModule: React.FC<AdminDashboardModuleProps> = ({
  adminJobs,
  onUpdateJobStatus,
  onDeleteJob,
  events = [],
  onRefreshEvents
}) => {
  const [role, setRole] = useState<AdminRole>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('jobs');

  // Guard: Automatically redirect non-super admins away from super-admin-only tabs
  useEffect(() => {
    if (role === 'admin' && (activeTab === 'companies' || activeTab === 'whapi-config')) {
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
        alert("✓ Table Talk discussion deleted successfully!");
        fetchTableTalkPosts();
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
  const [evtThumbnail, setEvtThumbnail] = useState('');
  const [evtCategory, setEvtCategory] = useState('Reunion');
  const [evtSuccess, setEvtSuccess] = useState<string | null>(null);

  // Registrations state
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [regLoading, setRegLoading] = useState(false);
  const [sheetWebhookUrl, setSheetWebhookUrl] = useState('');
  const [sheetStatusMsg, setSheetStatusMsg] = useState<string | null>(null);

  // New Member Modal State
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [newMemName, setNewMemName] = useState('');
  const [newMemRoll, setNewMemRoll] = useState('');
  const [newMemCompany, setNewMemCompany] = useState('');
  const [newMemDesig, setNewMemDesig] = useState('');
  const [newMemPhone, setNewMemPhone] = useState('');
  const [newMemLoading, setNewMemLoading] = useState(false);
  const [newMemMsg, setNewMemMsg] = useState<string | null>(null);

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
          rollNo: newMemRoll || "PGD Alumni",
          company: newMemCompany,
          designation: newMemDesig,
          phone: newMemPhone
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNewMemMsg("✓ New Member registered & WhatsApp Notification Dispatched!");
        setNewMemName('');
        setNewMemRoll('');
        setNewMemCompany('');
        setNewMemDesig('');
        setNewMemPhone('');
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
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRegistrations(data.data || []);
        }
      })
      .finally(() => setRegLoading(false));

    fetch('/api/admin/event-sheet-config')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.webhookUrl) {
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
    if (activeTab === 'table-talk') {
      fetchTableTalkPosts();
    }
  }, [activeTab]);

  // Local Events state for instant optimistic updates
  const [localEvents, setLocalEvents] = useState<EventItem[]>(events);

  useEffect(() => {
    setLocalEvents(events);
  }, [events]);

  const handleEraseEventPost = async (eventId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to erase the event post '${title}' entirely?`)) return;
    
    // Optimistic removal for instant admin responsiveness
    setLocalEvents(prev => prev.filter(e => e.id !== eventId && e.title !== title));

    try {
      const res = await fetch(`/api/admin/events/${encodeURIComponent(eventId)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        alert(`✓ Event post '${title}' erased successfully.`);
        if (onRefreshEvents) onRefreshEvents();
      } else {
        alert(`❌ Could not erase event post: ${data.message || 'Unknown error'}`);
        // Rollback on failure
        setLocalEvents(events);
      }
    } catch (err) {
      console.error("Failed to erase event post:", err);
      alert("❌ Error: Network request failed when attempting to erase event post.");
      setLocalEvents(events);
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
          thumbnailUrl: evtThumbnail || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
          category: evtCategory
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEvtSuccess("✓ Event Program Advertisement Published Successfully! WhatsApp Notification Dispatched & Media Backed Up to Google Drive.");
        setEvtTitle('');
        setEvtHost('');
        setEvtDetails('');
        setEvtDate('');
        setEvtTime('');
        setEvtVenueName('');
        setEvtThumbnail('');
        
        if (data.event) {
          setLocalEvents(prev => [data.event, ...prev]);
        }

        if (onRefreshEvents) {
          onRefreshEvents();
        }

        setTimeout(() => setEvtSuccess(null), 5000);
      } else {
        alert(`❌ Failed to publish event: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert(`❌ Error publishing event: ${(err as Error).message}`);
    }
  };

  const handleUpdateRegStatus = async (regId: string, status: 'Approved' | 'Rejected') => {
    try {
      const res = await fetch(`/api/admin/event-registrations/${regId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        fetchRegistrations();
        if (data.whapiDispatched) {
          alert(`✓ Registration ${status}! Automated WhatsApp message dispatched directly to member via Whapi.cloud API.`);
        } else if (data.whatsappUrl) {
          window.open(data.whatsappUrl, '_blank');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = passcode.trim().toLowerCase();

    // Super Admin / Coding Admin Passcodes
    if (['superadmin', 'codingadmin', 'super2026', 'master2026', 'super', 'coding'].includes(normalized)) {
      setRole('super');
      setUnlocked(true);
      setPasscodeError(null);
      setPasscode('');
      return;
    }

    // Standard Admin Passcodes
    if (['admin', 'butex2026', '1234', 'moderator'].includes(normalized)) {
      setRole('admin');
      setUnlocked(true);
      setPasscodeError(null);
      setPasscode('');
      return;
    }

    setPasscodeError("Invalid passcode! Enter 'codingadmin' for Coding Admin or 'butex2026' for Standard Admin.");
  };

  const handleElevateToSuper = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = superPasscodeAttempt.trim().toLowerCase();
    if (['superadmin', 'codingadmin', 'super2026', 'master2026', 'super', 'coding'].includes(normalized)) {
      setRole('super');
      setElevateModalOpen(false);
      setSuperPasscodeAttempt('');
      setElevateError(null);
      alert("👑 Role Elevated: You now have full Coding Admin privileges!");
    } else {
      setElevateError("Incorrect Coding Admin Passcode! (Passcode: codingadmin)");
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
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setPasscode('codingadmin')}
                className="text-[10px] font-mono bg-amber-200 hover:bg-amber-300 text-amber-950 px-2 py-0.5 rounded font-bold"
              >
                Passcode: codingadmin
              </button>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-black text-slate-900">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Standard Admin Role</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Operational control: <strong>Create/delete job & event posts</strong>, review event joining requests & member registrations.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setPasscode('butex2026')}
                className="text-[10px] font-mono bg-slate-200 hover:bg-slate-300 text-slate-900 px-2 py-0.5 rounded font-bold"
              >
                Passcode: butex2026
              </button>
            </div>
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
              placeholder="Enter passcode (e.g. codingadmin or butex2026)"
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

        <p className="text-[11px] text-slate-400 italic">
          Try <code className="bg-slate-100 px-1.5 py-0.5 rounded text-amber-800 font-bold">codingadmin</code> for Coding Admin or <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-800 font-bold">butex2026</code> for Standard Admin.
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

        <div className="flex items-center space-x-2 shrink-0">
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
                placeholder="Enter Coding Admin Passcode (e.g. codingadmin)"
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

        {role === 'super' && (
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
        )}

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
          <span>All Member Event Joining Request</span>
          {registrations.filter(r => r.status === 'Pending').length > 0 && (
            <span className="bg-amber-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ml-1">
              {registrations.filter(r => r.status === 'Pending').length}
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
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setEvtThumbnail(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full sm:w-auto text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 font-bold uppercase">or Direct / Drive URL:</span>
                <input
                  type="text"
                  value={evtThumbnail}
                  onChange={(e) => setEvtThumbnail(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="flex-1 w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>
              
              <div className="flex items-center justify-between text-[11px] text-emerald-700 font-semibold pt-1">
                <span>📁 Uploaded poster media automatically backed up into Google Drive folder: <code className="bg-emerald-100 px-1.5 py-0.5 rounded font-mono font-bold">Google_Drive/Event_Class_Posters</code></span>
                {evtThumbnail && <span className="text-xs font-bold text-amber-700">✓ Poster Loaded</span>}
              </div>

              {evtThumbnail && (
                <div className="flex items-center space-x-3 mt-2">
                  <div className="w-20 aspect-[5/7] rounded-xl overflow-hidden border-2 border-amber-500 shadow-md">
                    <img src={evtThumbnail} alt="Class Poster Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-xs text-slate-600">
                    <strong className="block text-slate-900 font-bold">5:7 Portrait Live Preview</strong>
                    <span className="text-[11px] text-emerald-600 font-semibold">✓ Ready for front page sidebar carousel</span>
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
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">
                Published Event Posts ({localEvents.length})
              </h3>
              <span className="text-xs text-slate-500">
                Auto-erases 3 days after start date or Admin can erase anytime
              </span>
            </div>

            {localEvents.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No event posts published currently.</p>
            ) : (
              <div className="space-y-3">
                {localEvents.map((evt) => (
                  <div key={evt.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-slate-900 text-sm">{evt.title}</span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px]">
                          {evt.category || 'Event'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Date: <strong>{evt.date}</strong> ({evt.time}) • Venue: {evt.venue}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Host: {evt.hostName || 'BUTEX Alumni'}
                      </p>
                    </div>

                    <button
                      onClick={() => handleEraseEventPost(evt.id, evt.title)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1 shadow transition-all shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Erase Event Post Entirely</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Panel: Event Registrations Workflow */}
      {activeTab === 'registrations' && (
        <div className="space-y-6">
          {/* Google Sheet Sync & CSV Export Bar - Super Admin Only */}
          {role === 'super' && (
            <div className="bg-emerald-950 text-emerald-100 rounded-3xl p-6 border border-emerald-800 shadow-lg space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Google Sheet Integration & Live Sync (Super Admin)</span>
                  </div>
                  <h3 className="text-lg font-black text-white">Event Registration Data Sync & Export</h3>
                  <p className="text-xs text-emerald-200/80 max-w-xl">
                    Export all event registrations directly to Google Sheets CSV or configure a Google Apps Script Webhook URL to stream new registrations into your dedicated Google Sheet automatically.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <a
                    href="https://docs.google.com/forms/d/e/1FAIpQLScT82KiXdAQg-Xlgr7xXfnbcoiAakTNm58FTt233tP_9BMEcw/viewform?usp=publish-editor"
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Google Form</span>
                  </a>
                  <a
                    href="https://docs.google.com/spreadsheets/d/1ZY76tbYUCTS8LA4DOe76cRAorDaTSRqVTsejD_UBspE/edit?resourcekey=&gid=1943182397#gid=1943182397"
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Open Google Sheet</span>
                  </a>
                  <a
                    href="/api/admin/event-registrations/export-csv"
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center space-x-1.5 transition-all shadow-md"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV</span>
                  </a>
                </div>
              </div>

              {/* Webhook Configuration Form */}
              <form onSubmit={handleSaveWebhook} className="bg-emerald-900/60 p-4 rounded-2xl border border-emerald-700/60 space-y-3">
                <label className="block text-[11px] font-bold text-emerald-300">
                  Google Sheet Webhook URL (Google Apps Script / Form Endpoint)
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="url"
                    value={sheetWebhookUrl}
                    onChange={(e) => setSheetWebhookUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
                    className="w-full bg-slate-950 border border-emerald-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-emerald-600 focus:outline-none focus:border-emerald-400 font-mono"
                  />
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5 shrink-0 transition-all"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save URL</span>
                  </button>
                </div>
                {sheetStatusMsg && (
                  <p className="text-xs font-bold text-amber-300 pt-1">{sheetStatusMsg}</p>
                )}

                {/* Step-by-step Google Apps Script Code snippet */}
                <div className="bg-slate-950/90 p-3.5 rounded-xl border border-emerald-800/80 space-y-2 text-[11px]">
                  <div className="text-amber-400 font-bold flex items-center justify-between">
                    <span>How to enable instant 1-second background streaming into Google Sheet:</span>
                    <span className="text-[10px] text-slate-400 font-normal">Extensions &gt; Apps Script</span>
                  </div>
                  <p className="text-slate-300 text-[10px]">
                    1. Open your <a href="https://docs.google.com/spreadsheets/d/1ZY76tbYUCTS8LA4DOe76cRAorDaTSRqVTsejD_UBspE/edit" target="_blank" rel="noreferrer" className="text-amber-400 underline font-bold">Google Sheet</a> &gt; Click <strong>Extensions &gt; Apps Script</strong>.<br/>
                    2. Paste the 10-line script below &gt; Click <strong>Deploy &gt; New deployment &gt; Web app</strong> (Execute as: <strong>Me</strong>, Who has access: <strong>Anyone</strong>).<br/>
                    3. Copy the resulting Web App URL and paste it into the Webhook input above!
                  </p>
                  <pre className="bg-slate-900 text-emerald-300 p-2.5 rounded-lg text-[10px] font-mono overflow-x-auto border border-emerald-900/80">
{`function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    new Date(),
    data.eventTitle || "Event",
    data.studentName || "",
    data.studentId || "",
    data.emailOrWhatsApp || "",
    data.paymentMethod || "",
    data.senderNumber || "",
    data.transactionId || "",
    data.status || "Approved"
  ]);
  return ContentService.createTextOutput("Success");
}`}
                  </pre>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">Event Registrations & Approval Queue</h2>
                <p className="text-xs text-slate-500">
                  Approving a registration triggers automated WhatsApp & Email confirmations and updates event seat counts.
                </p>
              </div>
              <button
                onClick={fetchRegistrations}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
              >
                Refresh Queue
              </button>
            </div>

          {regLoading ? (
            <p className="text-xs text-slate-500 italic py-4">Loading event registrations...</p>
          ) : registrations.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4">No event registration submissions found yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
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
                      <td className="p-3 max-w-xs truncate text-slate-700">{r.eventTitle}</td>
                      <td className="p-3 font-mono text-slate-800 font-bold text-amber-900">
                        {r.senderNumber || 'N/A'}
                      </td>
                      <td className="p-3 font-mono text-slate-800">
                        <span className="font-bold">{r.paymentMethod}</span>: {r.transactionId}
                      </td>
                      <td className="p-3 text-slate-600">{r.emailOrWhatsApp}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          r.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                          r.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        {r.status !== 'Approved' && (
                          <button
                            onClick={() => handleUpdateRegStatus(r.id, 'Approved')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] inline-flex items-center space-x-1 shadow"
                          >
                            <Check className="w-3 h-3" />
                            <span>Approve & Notify</span>
                          </button>
                        )}
                        {r.status !== 'Rejected' && (
                          <button
                            onClick={() => handleUpdateRegStatus(r.id, 'Rejected')}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] inline-flex items-center space-x-1 shadow"
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

            <div className="flex items-center space-x-3 shrink-0">
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

                  <div className="grid grid-cols-2 gap-3">
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

      {/* Tab Panel 3: Companies */}
      {activeTab === 'companies' && role === 'super' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-4">
          <div className="flex items-center space-x-3">
            <Building2 className="w-6 h-6 text-amber-600" />
            <h2 className="text-lg font-bold text-slate-900">Partner & Employer Companies (227+)</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Review and organize corporate partners, buying houses, and garment manufacturing affiliations associated with BUTEX alumni.
          </p>
          <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200 text-xs text-amber-900 font-medium">
            💡 Corporate partner records are auto-indexed directly from verified alumni employment profiles.
          </div>
        </div>
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
            <button
              onClick={fetchTableTalkPosts}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl shadow-sm transition-colors shrink-0"
            >
              Refresh Table Talk Posts
            </button>
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

                  <div className="shrink-0">
                    <button
                      onClick={() => handleDeleteTableTalkPost(post.id, post.discussionTopic)}
                      className="w-full md:w-auto px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-1.5 transition-all"
                    >
                      <X className="w-4 h-4" />
                      <span>Delete Post</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Panel 7: Whapi.cloud WhatsApp Notification Settings */}
      {activeTab === 'whapi-config' && role === 'super' && (
        <WhapiSettingsModule />
      )}

    </div>
  );
};
