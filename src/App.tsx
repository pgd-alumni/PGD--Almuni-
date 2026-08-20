import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomeModule } from './components/HomeModule';
import { AlumniDirectoryModule } from './components/AlumniDirectoryModule';
import { JobPortalModule } from './components/JobPortalModule';
import { PostJobModule } from './components/PostJobModule';
import { MentorshipModule } from './components/MentorshipModule';
import { CompanyDirectoryModule } from './components/CompanyDirectoryModule';
import { EventsModule } from './components/EventsModule';
import { DigitalIdModule } from './components/DigitalIdModule';
import { AdminDashboardModule } from './components/AdminDashboardModule';
import { DocumentationGuideModule } from './components/DocumentationGuideModule';
import { TableTalkModule } from './components/TableTalkModule';
import { AuthOverlay } from './components/AuthOverlay';
import { EventRegistrationModal } from './components/EventRegistrationModal';
import { EventProgramSidebar } from './components/EventProgramSidebar';
import { AlumniActionHub } from './components/AlumniActionHub';
import { AlumniRecord, JobPost, EventItem, StatsData, UserProfile } from './types';
import { 
  fetchAlumniDirectFromSheet, 
  getInitialJobs, 
  getInitialEvents, 
  computeLiveStats 
} from './utils/dataEngine';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('pgd_alumni_current_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load current user:', e);
    }
    return null;
  });
  const [activeTab, setActiveTab] = useState<string>('home');
  const [alumniList, setAlumniList] = useState<AlumniRecord[]>([]);
  const [jobList, setJobList] = useState<JobPost[]>([]);
  const [adminJobs, setAdminJobs] = useState<JobPost[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [registeringEvent, setRegisteringEvent] = useState<EventItem | null>(null);
  const [stats, setStats] = useState<StatsData>({
    totalAlumni: 2485,
    totalBatches: 12,
    partnerCompanies: 310,
    countriesRepresented: 14,
    hiringManagers: 325,
    mentors: 185,
    activeJobPosts: 95,
    criticalJobSeekers: 12,
    femaleRatio: '28%',
    upcomingEvents: 3
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Helper to safely sanitize raw alumni records coming from Google Sheets / API
  const sanitizeAlumniData = (data: any[]): AlumniRecord[] => {
    return data.map((item, index) => {
      let parsedSkills: string[] = [];
      if (Array.isArray(item.skills)) {
        parsedSkills = item.skills;
      } else if (typeof item.skills === 'string') {
        parsedSkills = item.skills
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean);
      }

      return {
        ...item,
        id: item.id || `alumni-${index}-${Date.now()}`,
        name: item.name || 'Anonymous Alumni',
        company: item.company || 'N/A',
        designation: item.designation || 'Professional',
        skills: parsedSkills,
        jobStatus: item.jobStatus || 'Stable',
        photoUrl: item.photoUrl || '',
        rollNo: item.rollNo || item.slNo || `SL-${index + 1}`
      };
    });
  };

  // Concurrent Data Loading with Direct Sheet Fallback Engine
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(null);

      let currentAlumni: AlumniRecord[] = [];
      let currentJobs: JobPost[] = [];
      let currentAdminJobs: JobPost[] = [];
      let currentEvents: EventItem[] = [];

      try {
        const [alumniRes, jobsRes, adminJobsRes, eventsRes, statsRes] = await Promise.allSettled([
          fetch('/api/alumni'),
          fetch('/api/jobs'),
          fetch('/api/admin/jobs'),
          fetch('/api/events'),
          fetch('/api/stats')
        ]);

        // Handle Alumni Response
        if (alumniRes.status === 'fulfilled' && alumniRes.value.ok) {
          try {
            const json = await alumniRes.value.json();
            if (json.data && Array.isArray(json.data) && json.data.length > 0) {
              currentAlumni = sanitizeAlumniData(json.data);
            }
          } catch (e) {}
        }

        // Handle Job Listings
        if (jobsRes.status === 'fulfilled' && jobsRes.value.ok) {
          try {
            const json = await jobsRes.value.json();
            if (json.data && Array.isArray(json.data) && json.data.length > 0) {
              currentJobs = json.data;
            }
          } catch (e) {}
        }

        // Handle Admin Job Submissions
        if (adminJobsRes.status === 'fulfilled' && adminJobsRes.value.ok) {
          try {
            const json = await adminJobsRes.value.json();
            if (json.data && Array.isArray(json.data)) {
              currentAdminJobs = json.data;
            }
          } catch (e) {}
        }

        // Handle Events
        if (eventsRes.status === 'fulfilled' && eventsRes.value.ok) {
          try {
            const json = await eventsRes.value.json();
            if (json.data && Array.isArray(json.data) && json.data.length > 0) {
              currentEvents = json.data;
            }
          } catch (e) {}
        }

        // Handle Portal Stats
        if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
          try {
            const json = await statsRes.value.json();
            if (json.stats) {
              setStats(json.stats);
            }
          } catch (e) {}
        }
      } catch (err) {
        console.warn("API endpoints not reachable, falling back to direct sheet sync:", err);
      }

      // 1. Direct Fallback for Alumni if API failed or returned empty (e.g. Vercel static deployment)
      if (currentAlumni.length === 0) {
        currentAlumni = await fetchAlumniDirectFromSheet();
      }
      setAlumniList(currentAlumni);

      // 2. Direct Fallback for Jobs
      if (currentJobs.length === 0) {
        currentJobs = getInitialJobs();
      }
      setJobList(currentJobs);
      setAdminJobs(currentAdminJobs.length > 0 ? currentAdminJobs : currentJobs);

      // 3. Direct Fallback for Events
      if (currentEvents.length === 0) {
        currentEvents = getInitialEvents();
      }
      setEvents(currentEvents);

      // 4. Compute Dynamic Real-Time Stats
      setStats(prevStats => {
        const computed = computeLiveStats(currentAlumni, currentJobs, currentEvents);
        return {
          ...computed,
          ...prevStats,
          totalAlumni: Math.max(currentAlumni.length, computed.totalAlumni)
        };
      });

    } catch (err) {
      console.error("Error loading portal data:", err);
      setFetchError("Failed to synchronize with live database. Displays cached records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateJobStatus = async (id: string, status: 'approved' | 'rejected' | 'pending') => {
    try {
      const res = await fetch(`/api/admin/jobs/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        loadData();
      } else {
        alert("Failed to update job status. Please try again.");
      }
    } catch (err) {
      console.error("Error updating job status:", err);
    }
  };

  const handleDeleteJob = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete job posting: "${title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/jobs/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("✓ Job posting deleted successfully.");
        loadData();
      } else {
        alert(`❌ Failed to delete job: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Error deleting job:", err);
    }
  };

  const handleRegisterEvent = async (id: string) => {
    try {
      const res = await fetch(`/api/events/${id}/register`, { method: 'POST' });
      if (res.ok) {
        loadData();
      } else {
        alert("Registration failed. Event may be full.");
      }
    } catch (err) {
      console.error("Error registering event:", err);
    }
  };

  const pendingJobsCount = adminJobs.filter(j => j.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-slate-950 relative">
      
      {/* Real-time OTP / Password Auth Overlay */}
      <AuthOverlay
        isAuthenticated={isAuthenticated}
        alumniList={alumniList}
        onAuthenticated={(user) => {
          setIsAuthenticated(true);
          if (user) {
            setCurrentUser(user);
            try {
              localStorage.setItem('pgd_alumni_current_user', JSON.stringify(user));
            } catch (e) {}
          }
        }}
      />

      {/* Main Page Container with Blur when NOT Authenticated */}
      <div className={`flex-1 flex flex-col transition-all duration-500 ${!isAuthenticated ? 'filter blur-md pointer-events-none select-none' : ''}`}>
        
        {/* Global Navbar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingJobsCount={pendingJobsCount}
          totalAlumniCount={alumniList.length}
          isAuthenticated={isAuthenticated}
          onLockToggle={() => setIsAuthenticated(!isAuthenticated)}
        />

        {/* Optional Global API Warning Notification */}
        {fetchError && (
          <div className="bg-amber-500 text-slate-950 text-xs font-bold text-center py-2 px-4 shadow-inner">
            ⚠️ {fetchError}
          </div>
        )}

        {/* Main Container - Modern Full-Width 1600px Responsive Container Layout */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 pt-6 pb-12">
          {loading && alumniList.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm font-bold text-slate-700">Connecting to Live Google Sheet Database...</p>
            </div>
          ) : (
            <>
              {activeTab === 'home' && (
                <div className="space-y-8">
                  <HomeModule
                    stats={stats}
                    alumniList={alumniList}
                    jobList={jobList}
                    events={events}
                    onRegisterEvent={(evt) => setRegisteringEvent(evt)}
                    setActiveTab={setActiveTab}
                    onSearchQuery={setSearchQuery}
                  />

                  {/* Full 12-Column Alumni Action Hub over Footer */}
                  <AlumniActionHub setActiveTab={setActiveTab} />
                </div>
              )}

              {activeTab === 'directory' && (
                <AlumniDirectoryModule
                  alumniList={alumniList}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  onRefreshData={loadData}
                />
              )}

              {activeTab === 'jobs' && (
                <JobPortalModule
                  jobList={jobList}
                  setActiveTab={setActiveTab}
                />
              )}

              {activeTab === 'post-job' && (
                <PostJobModule
                  onJobSubmitted={loadData}
                  setActiveTab={setActiveTab}
                />
              )}

              {activeTab === 'mentorship' && (
                <MentorshipModule />
              )}

              {activeTab === 'companies' && (
                <CompanyDirectoryModule
                  alumniList={alumniList}
                  onSelectCompany={(company) => {
                    setSearchQuery(company);
                    setActiveTab('directory');
                  }}
                  setActiveTab={setActiveTab}
                />
              )}

              {activeTab === 'events' && (
                <EventsModule
                  events={events}
                  onRegisterEvent={(evt) => setRegisteringEvent(evt)}
                />
              )}

              {activeTab === 'id-card' && (
                <DigitalIdModule alumniList={alumniList} />
              )}

              {activeTab === 'table-talk' && (
                <TableTalkModule
                  isAuthenticated={isAuthenticated}
                  onOpenAuth={() => setIsAuthenticated(true)}
                  currentUser={currentUser}
                  alumniList={alumniList}
                  onUpdateCurrentUser={(user) => {
                    setCurrentUser(user);
                    try {
                      localStorage.setItem('pgd_alumni_current_user', JSON.stringify(user));
                    } catch (e) {}
                  }}
                />
              )}

              {activeTab === 'admin' && (
                <AdminDashboardModule
                  adminJobs={adminJobs}
                  onUpdateJobStatus={handleUpdateJobStatus}
                  onDeleteJob={handleDeleteJob}
                  events={events}
                  onRefreshEvents={loadData}
                />
              )}

              {activeTab === 'docs' && (
                <DocumentationGuideModule />
              )}
            </>
          )}
        </main>

        {/* Global Footer */}
        <Footer setActiveTab={setActiveTab} />

      </div>

      {/* Global Event Registration Modal */}
      {registeringEvent && (
        <EventRegistrationModal
          event={registeringEvent}
          events={events}
          onClose={() => setRegisteringEvent(null)}
          onSubmitted={loadData}
        />
      )}

    </div>
  );
}