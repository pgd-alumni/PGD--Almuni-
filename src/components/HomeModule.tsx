import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  QrCode, 
  Sparkles,
  Zap,
  UserCheck,
  X,
  Users,
  GraduationCap,
  Building2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  FileText,
  Phone,
  Mail,
  Filter
} from 'lucide-react';
import { AlumniRecord, JobPost, StatsData, EventItem, formatGoogleDriveUrl } from '../types';
import { AlumniAvatar } from './AlumniAvatar';
import { AlumniBadges } from './AlumniBadges';
import { EventProgramSidebar } from './EventProgramSidebar';

interface HomeModuleProps {
  stats: StatsData;
  alumniList: AlumniRecord[];
  jobList: JobPost[];
  events: EventItem[];
  onRegisterEvent: (evt: EventItem) => void;
  setActiveTab: (tab: string) => void;
  onSearchQuery: (query: string) => void;
}

export const HomeModule: React.FC<HomeModuleProps> = ({
  stats,
  alumniList = [],
  jobList = [],
  events = [],
  onRegisterEvent,
  setActiveTab,
  onSearchQuery,
}) => {
  const [searchKey, setSearchKey] = useState('');
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  
  // Interactive Stat Modal State
  const [activeStatModal, setActiveStatModal] = useState<'registered' | 'batches' | 'partner_gms' | 'critical' | null>(null);
  const [modalSearchQuery, setModalSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKey.trim()) {
      onSearchQuery(searchKey.trim());
      setActiveTab('directory');
    }
  };

  // Safe filter with optional chaining to prevent undefined crashes
  const criticalJobSeekers = alumniList.filter(a => {
    const status = a.jobStatus?.toLowerCase() || '';
    return status.includes('critical') || status.includes('immediately');
  });

  // Calculate batch breakdown
  const batchBreakdown = useMemo(() => {
    const batches = [
      {
        id: 'PGD Batch 4 (2024-25)',
        name: 'PGD Batch 4',
        session: '2024-2025',
        queryKey: 'Batch 4',
        description: 'Current & Recent PGD Graduates',
        coordinator: 'Engr. Md. Rakibul Islam',
        color: 'border-blue-500 bg-blue-50/50 text-blue-900',
        badgeColor: 'bg-blue-600 text-white'
      },
      {
        id: 'PGD Batch 3 (2022-23)',
        name: 'PGD Batch 3',
        session: '2022-2023',
        queryKey: 'Batch 3',
        description: 'Senior Textile & Garment Professionals',
        coordinator: 'Engr. Tanvir Ahmed',
        color: 'border-emerald-500 bg-emerald-50/50 text-emerald-900',
        badgeColor: 'bg-emerald-600 text-white'
      },
      {
        id: 'PGD Batch 2 (2018-19)',
        name: 'PGD Batch 2',
        session: '2018-2019',
        queryKey: 'Batch 2',
        description: 'Executive & Department Heads',
        coordinator: 'Engr. Faisal Mahmud',
        color: 'border-purple-500 bg-purple-50/50 text-purple-900',
        badgeColor: 'bg-purple-600 text-white'
      },
      {
        id: 'PGD Batch 1 (2016-17)',
        name: 'PGD Batch 1',
        session: '2016-2017',
        queryKey: 'Batch 1',
        description: 'Founding PGD Batch - Industry Leaders',
        coordinator: 'Dr. Kamruzzaman',
        color: 'border-amber-500 bg-amber-50/50 text-amber-900',
        badgeColor: 'bg-amber-600 text-white'
      }
    ];

    return batches.map(b => {
      const count = alumniList.filter(a => {
        const batchStr = a.batch?.toLowerCase() || '';
        const rollStr = a.rollNo?.toLowerCase() || '';
        const qKey = b.queryKey.toLowerCase();
        return batchStr.includes(qKey) || rollStr.includes(qKey) || rollStr.includes(`pgd-${b.queryKey.split(' ')[1]}`);
      }).length;

      return { ...b, count };
    });
  }, [alumniList]);

  // Group partner companies
  const partnerCompaniesList = useMemo(() => {
    const map: Record<string, { company: string; count: number; leaders: AlumniRecord[] }> = {};
    alumniList.forEach(a => {
      if (a.company && a.company.trim() && a.company !== 'N/A') {
        const c = a.company.trim();
        if (!map[c]) {
          map[c] = { company: c, count: 0, leaders: [] };
        }
        map[c].count += 1;
        const desig = a.designation?.toLowerCase() || '';
        if (
          desig.includes('gm') || 
          desig.includes('general manager') || 
          desig.includes('director') || 
          desig.includes('head') || 
          desig.includes('manager') || 
          desig.includes('lead')
        ) {
          map[c].leaders.push(a);
        }
      }
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [alumniList]);

  // Sort alumni by Google Sheet Column A (timestamp) - newest joiners first
  const sortedByTimestamp = [...alumniList].sort((a, b) => {
    const parseTime = (ts?: string) => {
      if (!ts || !ts.trim()) return 0;
      const parsed = new Date(ts).getTime();
      return isNaN(parsed) ? 0 : parsed;
    };

    const timeA = parseTime(a.timestamp);
    const timeB = parseTime(b.timestamp);

    if (timeA !== timeB && timeA > 0 && timeB > 0) {
      return timeB - timeA; // Descending (newest first)
    }

    if (a.timestamp && b.timestamp && a.timestamp !== b.timestamp) {
      return b.timestamp.localeCompare(a.timestamp);
    }

    return 0;
  });

  // Fallback to reversing original array if no timestamps exist (since Sheets append rows to the bottom)
  const spotlightAlumni = sortedByTimestamp.some(a => a.timestamp && a.timestamp.trim() !== '')
    ? sortedByTimestamp
    : [...alumniList].reverse();

  return (
    <div className="space-y-6 h-full flex flex-col justify-between">
      
      {/* Primary Bento Grid Header & Quick Search */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Bento Card 1: Main Welcome Hero (8-col) */}
        <div className="md:col-span-8 bg-[#002147] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden flex flex-col justify-between border border-white/10 shadow-xl min-h-[260px]">
          {/* Subtle Ambient Gold Blur */}
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-[#FFBF00] rounded-full opacity-10 blur-3xl pointer-events-none"></div>

          <div className="relative z-10 space-y-3 max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#FFBF00]/20 border border-[#FFBF00]/40 text-[#FFBF00] text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Official BUTEX PGD Alumni Portal & Job Board</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-white italic tracking-tight">
              Connecting BUTEX PGD Textile Leaders Globally
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Empowering Post Graduate Diploma alumni across Apparel Manufacturing, Merchandising, Quality Assurance, Industrial Engineering, and Global Brand Operations.
            </p>

            <form onSubmit={handleSearchSubmit} className="pt-1 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchKey}
                  onChange={(e) => setSearchKey(e.target.value)}
                  placeholder="Search alumni by name, company, roll no..."
                  className="w-full bg-white/10 border border-white/20 rounded-full pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:bg-white/20 transition-all"
                />
              </div>
              <button
                type="submit"
                className="bg-[#FFBF00] text-[#002147] px-5 py-2 rounded-full font-bold text-xs hover:brightness-110 transition-all shrink-0 flex items-center justify-center space-x-1.5 shadow-md"
              >
                <span>Search</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Bento Card 2: Stats Metric Container (4-col) */}
        <div className="md:col-span-4 bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Alumni Key Metrics</h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>Click stat to view</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 my-auto">
            {/* Stat 1: Registered Alumni */}
            <div 
              onClick={() => {
                setActiveStatModal('registered');
                setModalSearchQuery('');
              }}
              className="p-3 bg-slate-50/80 hover:bg-slate-100/90 rounded-2xl border border-slate-200/70 hover:border-[#FFBF00] transition-all cursor-pointer group shadow-2xs relative overflow-hidden active:scale-95 space-y-0.5"
              title="Click to view all registered alumni"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl sm:text-3xl font-black text-[#002147] group-hover:text-[#FFBF00] transition-colors block">
                  {stats.totalAlumni}
                </span>
                <Users className="w-4 h-4 text-slate-400 group-hover:text-[#002147] transition-colors" />
              </div>
              <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider block group-hover:text-[#002147]">
                Registered Alumni
              </span>
              <div className="pt-1 flex items-center text-[9px] font-bold text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>View directory</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>

            {/* Stat 2: PGD Batches */}
            <div 
              onClick={() => {
                setActiveStatModal('batches');
                setModalSearchQuery('');
              }}
              className="p-3 bg-slate-50/80 hover:bg-slate-100/90 rounded-2xl border border-slate-200/70 hover:border-[#FFBF00] transition-all cursor-pointer group shadow-2xs relative overflow-hidden active:scale-95 space-y-0.5"
              title="Click to view PGD batches breakdown"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl sm:text-3xl font-black text-[#002147] group-hover:text-[#FFBF00] transition-colors block">
                  {stats.totalBatches}
                </span>
                <GraduationCap className="w-4 h-4 text-slate-400 group-hover:text-[#002147] transition-colors" />
              </div>
              <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider block group-hover:text-[#002147]">
                PGD Batches
              </span>
              <div className="pt-1 flex items-center text-[9px] font-bold text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>View 4 batches</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>

            {/* Stat 3: Partner GMs */}
            <div 
              onClick={() => {
                setActiveStatModal('partner_gms');
                setModalSearchQuery('');
              }}
              className="p-3 bg-slate-50/80 hover:bg-slate-100/90 rounded-2xl border border-slate-200/70 hover:border-[#FFBF00] transition-all cursor-pointer group shadow-2xs relative overflow-hidden active:scale-95 space-y-0.5"
              title="Click to view partner companies & GMs"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl sm:text-3xl font-black text-[#002147] group-hover:text-[#FFBF00] transition-colors block">
                  {stats.partnerCompanies}+
                </span>
                <Building2 className="w-4 h-4 text-slate-400 group-hover:text-[#002147] transition-colors" />
              </div>
              <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider block group-hover:text-[#002147]">
                Partner GMs
              </span>
              <div className="pt-1 flex items-center text-[9px] font-bold text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>View partners</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>

            {/* Stat 4: Critical Stage */}
            <div 
              onClick={() => {
                setActiveStatModal('critical');
                setModalSearchQuery('');
              }}
              className="p-3 bg-rose-50/70 hover:bg-rose-100/90 rounded-2xl border border-rose-200/80 hover:border-rose-400 transition-all cursor-pointer group shadow-2xs relative overflow-hidden active:scale-95 space-y-0.5"
              title="Click to view critical job seekers"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl sm:text-3xl font-black text-rose-600 group-hover:text-rose-700 transition-colors block">
                  {criticalJobSeekers.length || stats.criticalJobSeekers}
                </span>
                <AlertTriangle className="w-4 h-4 text-rose-500 group-hover:text-rose-700 transition-colors" />
              </div>
              <span className="text-[10px] uppercase font-extrabold text-rose-600 tracking-wider block group-hover:text-rose-800">
                Critical Stage
              </span>
              <div className="pt-1 flex items-center text-[9px] font-bold text-rose-700 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>View job seekers</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              onSearchQuery('');
              setActiveTab('directory');
            }}
            className="w-full mt-4 py-2.5 rounded-2xl bg-[#002147] text-white text-xs font-bold hover:bg-[#003166] transition-colors flex items-center justify-center space-x-2 shadow-xs"
          >
            <span>Explore Complete Directory</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#FFBF00]" />
          </button>
        </div>

      </div>

      {/* Bottom Row: 3 Equal Columns - Alumni Spotlight (4-col), Latest Job Vacancies (4-col), Event Advertisements (4-col) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Column 1: Featured Spotlight (4-col) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between space-y-3 h-full">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Alumni Spotlight</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Just Joined</span>
              </span>
            </div>

            <div className="space-y-2.5">
              {spotlightAlumni.slice(0, 8).map((alumni) => {
                return (
                  <div key={alumni.id} className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between hover:border-[#FFBF00] transition-colors group">
                    <div className="flex items-center space-x-3 min-w-0">
                      <AlumniAvatar 
                        photoUrl={alumni.photo || alumni.photoUrl} 
                        name={alumni.name || ''} 
                        sizeClass="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full border-2 border-white ring-1 ring-slate-200 shadow-sm" 
                        textClass="text-xs font-black"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <h4 className="font-bold text-xs text-slate-900 truncate group-hover:text-[#002147] transition-colors">{alumni.name}</h4>
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Recent Joiner" />
                        </div>
                        <p className="text-[10px] text-[#002147] font-semibold truncate">{alumni.designation || 'Alumni Member'}</p>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-500 truncate">
                          <span className="truncate">{alumni.company || 'Textile Sector'}</span>
                          {alumni.timestamp && (
                            <span className="text-[9px] text-amber-700 font-medium bg-amber-50 px-1.5 py-0.2 rounded shrink-0 border border-amber-200/60">
                              {alumni.timestamp.split(' ')[0] || alumni.timestamp}
                            </span>
                          )}
                        </div>
                        {alumni.badges && alumni.badges.length > 0 && (
                          <div className="pt-0.5">
                            <AlumniBadges badges={alumni.badges} size="sm" maxDisplay={2} />
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onSearchQuery(alumni.name);
                        setActiveTab('directory');
                      }}
                      className="p-1.5 rounded-xl bg-slate-200 text-slate-800 hover:bg-[#FFBF00] hover:text-[#002147] transition-colors shrink-0"
                      title="View Profile"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('directory')}
            className="w-full py-2.5 border-2 border-dashed border-slate-200 text-slate-600 rounded-2xl text-xs font-bold uppercase tracking-tight hover:bg-slate-50 transition-colors mt-2"
          >
            + View All {alumniList.length} Directory Records
          </button>
        </div>

        {/* Column 2: Recent Job Postings (4-col) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between space-y-3 h-full">
          <div>
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Latest Job Vacancies</h3>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full uppercase">
                {jobList.length} Active
              </span>
            </div>

            <div className="space-y-2.5">
              {jobList.slice(0, 6).map((job) => (
                <div key={job.id} className="group p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-[#FFBF00] transition-all flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      {job.category || 'Garments'}
                    </span>
                    <h4 className="font-bold text-xs text-slate-900 mt-1 truncate">{job.title}</h4>
                    <p className="text-[11px] text-slate-600 font-medium truncate">{job.company}</p>
                  </div>
                  <a
                    href={job.originalUrl && job.originalUrl.trim() ? (job.originalUrl.startsWith('http') ? job.originalUrl : `https://${job.originalUrl}`) : `https://wa.me/?text=${encodeURIComponent(`Hello, I am interested in applying for the "${job.title}" role at ${job.company}.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-[#002147] text-white px-2.5 py-1.5 rounded-xl text-[10px] font-bold hover:bg-[#003166] transition-colors shrink-0"
                  >
                    Apply
                  </a>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('jobs')}
            className="w-full py-2.5 rounded-2xl bg-slate-100 text-[#002147] text-xs font-bold hover:bg-[#FFBF00] transition-colors flex items-center justify-center space-x-1 mt-2"
          >
            <span>Browse All Openings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Column 3: Event Advertisements (4-col) */}
        <div className="lg:col-span-4 h-full">
          <EventProgramSidebar
            events={events}
            onOpenRegisterModal={onRegisterEvent}
            onGoToEventDetails={() => setActiveTab('events')}
          />
        </div>

      </div>

      {/* Stat Metric Result Modal Popup */}
      {activeStatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-[#002147] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-[#FFBF00]">
                  {activeStatModal === 'registered' && <Users className="w-5 h-5" />}
                  {activeStatModal === 'batches' && <GraduationCap className="w-5 h-5" />}
                  {activeStatModal === 'partner_gms' && <Building2 className="w-5 h-5" />}
                  {activeStatModal === 'critical' && <AlertTriangle className="w-5 h-5 text-rose-400" />}
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg leading-tight">
                    {activeStatModal === 'registered' && `Registered Alumni (${alumniList.length})`}
                    {activeStatModal === 'batches' && `PGD Batches Overview (${batchBreakdown.length} Batches)`}
                    {activeStatModal === 'partner_gms' && `Partner Companies & GMs (${partnerCompaniesList.length}+ Organizations)`}
                    {activeStatModal === 'critical' && `Critical Stage Job Seekers (${criticalJobSeekers.length})`}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {activeStatModal === 'registered' && "Complete list of registered BUTEX PGD alumni members"}
                    {activeStatModal === 'batches' && "Distribution of alumni across Post Graduate Diploma batches"}
                    {activeStatModal === 'partner_gms' && "Leading garment & textile companies with alumni in management"}
                    {activeStatModal === 'critical' && "Alumni seeking employment or immediate position change"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveStatModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Search Bar for Registered, Partner GMs, and Critical */}
            {(activeStatModal === 'registered' || activeStatModal === 'partner_gms' || activeStatModal === 'critical') && (
              <div className="p-3 bg-slate-50 border-b border-slate-200 shrink-0">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={modalSearchQuery}
                    onChange={(e) => setModalSearchQuery(e.target.value)}
                    placeholder={
                      activeStatModal === 'partner_gms'
                        ? "Search partner companies or designations..."
                        : "Filter by name, roll no, designation, or company..."
                    }
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002147] shadow-2xs"
                  />
                  {modalSearchQuery && (
                    <button
                      onClick={() => setModalSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Modal Body Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              
              {/* Modal Content 1: Registered Alumni */}
              {activeStatModal === 'registered' && (() => {
                const filtered = alumniList.filter(a => {
                  if (!modalSearchQuery.trim()) return true;
                  const q = modalSearchQuery.toLowerCase();
                  return (
                    a.name?.toLowerCase().includes(q) ||
                    a.company?.toLowerCase().includes(q) ||
                    a.rollNo?.toLowerCase().includes(q) ||
                    a.designation?.toLowerCase().includes(q)
                  );
                });

                return (
                  <div className="space-y-2.5">
                    {filtered.length === 0 ? (
                      <p className="text-center py-8 text-xs text-slate-500 font-medium">No alumni records found matching "{modalSearchQuery}".</p>
                    ) : (
                      filtered.slice(0, 30).map((alumni) => (
                        <div key={alumni.id} className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 transition-colors">
                          <div className="flex items-center space-x-3 min-w-0">
                            <AlumniAvatar 
                              photoUrl={alumni.photo || alumni.photoUrl} 
                              name={alumni.name || ''} 
                              sizeClass="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full border border-slate-200 shadow-2xs" 
                              textClass="text-xs font-black"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-bold text-xs text-slate-900 truncate">{alumni.name}</h4>
                                {alumni.rollNo && (
                                  <span className="text-[10px] font-mono text-slate-500 bg-slate-200/80 px-1.5 py-0.2 rounded shrink-0">
                                    {alumni.rollNo}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] font-semibold text-[#002147] truncate">{alumni.designation || 'Alumni Member'}</p>
                              <p className="text-[10px] text-slate-500 truncate">{alumni.company || 'Textile Sector'}</p>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              onSearchQuery(alumni.name);
                              setActiveTab('directory');
                              setActiveStatModal(null);
                            }}
                            className="px-3 py-1.5 bg-[#002147] hover:bg-[#003166] text-white font-bold rounded-xl text-[10px] shrink-0 transition-colors flex items-center space-x-1"
                          >
                            <span>Profile</span>
                            <ArrowRight className="w-3 h-3 text-[#FFBF00]" />
                          </button>
                        </div>
                      ))
                    )}
                    {filtered.length > 30 && (
                      <p className="text-center text-[11px] font-bold text-slate-500 pt-2">
                        + {filtered.length - 30} more members in directory
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Modal Content 2: PGD Batches */}
              {activeStatModal === 'batches' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {batchBreakdown.map((batch) => (
                    <div 
                      key={batch.id} 
                      className={`p-4 rounded-2xl border-2 ${batch.color} flex flex-col justify-between space-y-3 transition-all hover:shadow-md`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${batch.badgeColor}`}>
                            Session: {batch.session}
                          </span>
                          <span className="text-xs font-extrabold bg-white/80 px-2 py-0.5 rounded-full text-slate-800 border border-slate-200">
                            {batch.count} Members
                          </span>
                        </div>
                        <h4 className="text-base font-extrabold mt-2">{batch.name}</h4>
                        <p className="text-xs opacity-80 mt-0.5">{batch.description}</p>
                        <p className="text-[10px] font-medium opacity-70 mt-2">Coordinator: {batch.coordinator}</p>
                      </div>

                      <button
                        onClick={() => {
                          onSearchQuery(batch.queryKey);
                          setActiveTab('directory');
                          setActiveStatModal(null);
                        }}
                        className="w-full py-2 bg-[#002147] hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1 shadow-xs transition-colors"
                      >
                        <span>Filter {batch.name}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#FFBF00]" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Modal Content 3: Partner GMs */}
              {activeStatModal === 'partner_gms' && (() => {
                const filtered = partnerCompaniesList.filter(p => {
                  if (!modalSearchQuery.trim()) return true;
                  const q = modalSearchQuery.toLowerCase();
                  return p.company.toLowerCase().includes(q);
                });

                return (
                  <div className="space-y-2.5">
                    {filtered.length === 0 ? (
                      <p className="text-center py-8 text-xs text-slate-500 font-medium">No partner companies matching "{modalSearchQuery}".</p>
                    ) : (
                      filtered.slice(0, 25).map((partner, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 hover:bg-slate-100/90 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 transition-colors">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <Building2 className="w-4 h-4 text-[#002147] shrink-0" />
                              <h4 className="font-bold text-xs text-slate-900 truncate">{partner.company}</h4>
                              <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full shrink-0">
                                {partner.count} Alumni
                              </span>
                            </div>
                            {partner.leaders.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {partner.leaders.slice(0, 3).map((l, lIdx) => (
                                  <span key={lIdx} className="text-[9px] bg-white border border-slate-200 text-slate-700 px-1.5 py-0.2 rounded-md truncate max-w-[180px]">
                                    {l.name} ({l.designation})
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => {
                              onSearchQuery(partner.company);
                              setActiveTab('directory');
                              setActiveStatModal(null);
                            }}
                            className="px-3 py-1.5 bg-[#002147] hover:bg-[#003166] text-white font-bold rounded-xl text-[10px] shrink-0 transition-colors flex items-center space-x-1"
                          >
                            <span>View</span>
                            <ArrowRight className="w-3 h-3 text-[#FFBF00]" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                );
              })()}

              {/* Modal Content 4: Critical Stage Job Seekers */}
              {activeStatModal === 'critical' && (() => {
                const filtered = criticalJobSeekers.filter(a => {
                  if (!modalSearchQuery.trim()) return true;
                  const q = modalSearchQuery.toLowerCase();
                  return (
                    a.name?.toLowerCase().includes(q) ||
                    a.rollNo?.toLowerCase().includes(q) ||
                    a.designation?.toLowerCase().includes(q) ||
                    a.company?.toLowerCase().includes(q)
                  );
                });

                return (
                  <div className="space-y-3">
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs text-rose-800 font-medium">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>These alumni members are immediately available for recruitment in Garments, Merchandising, IE, QA & Textile Operations.</span>
                    </div>

                    {filtered.length === 0 ? (
                      <p className="text-center py-8 text-xs text-slate-500 font-medium">No critical job seekers matching "{modalSearchQuery}".</p>
                    ) : (
                      filtered.map((alumni) => (
                        <div key={alumni.id} className="p-3.5 bg-rose-50/40 hover:bg-rose-50/80 rounded-2xl border border-rose-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
                          <div className="flex items-start space-x-3 min-w-0">
                            <AlumniAvatar 
                              photoUrl={alumni.photo || alumni.photoUrl} 
                              name={alumni.name || ''} 
                              sizeClass="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full border border-rose-200 shadow-2xs" 
                              textClass="text-xs font-black"
                            />
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center space-x-2 flex-wrap gap-1">
                                <h4 className="font-extrabold text-xs text-slate-900">{alumni.name}</h4>
                                {alumni.rollNo && (
                                  <span className="text-[10px] font-mono text-slate-600 bg-slate-200 px-1.5 py-0.2 rounded">
                                    {alumni.rollNo}
                                  </span>
                                )}
                                <span className="text-[9px] font-extrabold uppercase tracking-wide text-rose-700 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full">
                                  CRITICAL STAGE
                                </span>
                              </div>
                              <p className="text-[11px] font-bold text-[#002147]">{alumni.designation || 'Textile Professional'}</p>
                              <p className="text-[10px] text-slate-600">{alumni.company || 'Seeking New Role'}</p>
                              
                              <div className="pt-1 flex items-center gap-3 text-[10px] text-slate-500 flex-wrap">
                                {alumni.phone && !alumni.hideContact && (
                                  <span className="flex items-center gap-1 font-mono">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    <span>{alumni.phone}</span>
                                  </span>
                                )}
                                {alumni.email && !alumni.hideContact && (
                                  <span className="flex items-center gap-1 font-mono">
                                    <Mail className="w-3 h-3 text-slate-400" />
                                    <span>{alumni.email}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            {alumni.resumeUrl && (
                              <a
                                href={alumni.resumeUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-[10px] transition-colors flex items-center space-x-1 shadow-2xs"
                              >
                                <FileText className="w-3 h-3" />
                                <span>CV</span>
                              </a>
                            )}
                            <button
                              onClick={() => {
                                onSearchQuery(alumni.name);
                                setActiveTab('directory');
                                setActiveStatModal(null);
                              }}
                              className="px-3 py-1.5 bg-[#002147] hover:bg-[#003166] text-white font-bold rounded-xl text-[10px] transition-colors flex items-center space-x-1 shadow-2xs"
                            >
                              <span>View Profile</span>
                              <ArrowRight className="w-3 h-3 text-[#FFBF00]" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                );
              })()}

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                BUTEX PGD Alumni Official Database
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveStatModal(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Close
                </button>

                <button
                  onClick={() => {
                    if (activeStatModal === 'partner_gms') {
                      setActiveTab('companies');
                    } else if (activeStatModal === 'critical') {
                      onSearchQuery('critical');
                      setActiveTab('directory');
                    } else if (activeStatModal === 'batches') {
                      onSearchQuery('Batch');
                      setActiveTab('directory');
                    } else {
                      onSearchQuery('');
                      setActiveTab('directory');
                    }
                    setActiveStatModal(null);
                  }}
                  className="px-4 py-2 bg-[#002147] hover:bg-[#003166] text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-colors"
                >
                  <span>
                    {activeStatModal === 'partner_gms' ? 'Explore Company Directory' : 'Open in Full Directory'}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#FFBF00]" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};