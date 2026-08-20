import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Mail, 
  Phone, 
  FileText, 
  EyeOff, 
  CheckCircle2, 
  X, 
  ShieldAlert,
  Sparkles,
  LayoutGrid,
  List,
  QrCode,
  Download,
  RefreshCw
} from 'lucide-react';
import { AlumniRecord, formatGoogleDriveUrl } from '../types';
import { AlumniAvatar } from './AlumniAvatar';
import { DownloadVerificationModal } from './DownloadVerificationModal';
import { AlumniBadges } from './AlumniBadges';
import { DigitalIdCardModal } from './DigitalIdCardModal';

interface AlumniDirectoryModuleProps {
  alumniList: AlumniRecord[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onRefreshData?: () => void;
}

export const AlumniDirectoryModule: React.FC<AlumniDirectoryModuleProps> = ({
  alumniList = [],
  searchQuery,
  setSearchQuery,
  onRefreshData
}) => {
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const handleSyncSheet = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch('/api/alumni/sync', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setSyncMsg(`✓ Synced ${json.count} records from Google Sheet!`);
        if (onRefreshData) onRefreshData();
      } else {
        setSyncMsg("Sync failed. Using cached data.");
      }
    } catch (err) {
      console.error(err);
      setSyncMsg("Error connecting to server.");
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(null), 4000);
    }
  };
  const [selectedCompany, setSelectedCompany] = useState<string>('ALL');
  const [selectedSkill, setSelectedSkill] = useState<string>('ALL');
  const [selectedJobStage, setSelectedJobStage] = useState<string>('ALL');
  const [selectedBatch, setSelectedBatch] = useState<string>('ALL');
  const [selectedBadge, setSelectedBadge] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [activeModalAlumni, setActiveModalAlumni] = useState<AlumniRecord | null>(null);
  const [showQrAlumni, setShowQrAlumni] = useState<AlumniRecord | null>(null);
  const [verifyDownloadAlumni, setVerifyDownloadAlumni] = useState<AlumniRecord | null>(null);
  const [downloadType, setDownloadType] = useState<'photo' | 'cv'>('cv');
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const companies = useMemo(() => {
    const list = Array.from(
      new Set(alumniList.map(a => a?.company).filter((c): c is string => typeof c === 'string' && c.trim().length > 1))
    ).sort();
    return ['ALL', ...list];
  }, [alumniList]);

  const skillOptions = [
    'ALL',
    'Merchandising',
    'IE',
    'QA',
    'Production',
    'Supply Chain',
    'HR',
    'Sustainability',
    'Fashion Designing',
    'Social Compliance'
  ];

  const batchOptions = ['ALL', 'PGD Batch 4 (2024-25)', 'PGD Batch 3 (2022-23)', 'PGD Batch 2 (2018-19)'];
  const badgeOptions = ['ALL', 'Top Mentor', 'Gold Member', 'Batch Representative', 'Key Recruiter'];

  const filteredAlumni = useMemo(() => {
    return alumniList.filter(a => {
      if (!a) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = a.name?.toLowerCase().includes(query) ?? false;
        const matchesRoll = a.rollNo?.toLowerCase().includes(query) ?? false;
        const matchesCompany = a.company?.toLowerCase().includes(query) ?? false;
        const matchesDesig = a.designation?.toLowerCase().includes(query) ?? false;
        const matchesUni = a.university?.toLowerCase().includes(query) ?? false;
        const matchesSkill = a.skills?.some(s => s?.toLowerCase().includes(query)) ?? false;
        const matchesBadge = a.badges?.some(b => b?.toLowerCase().includes(query)) ?? false;
        const matchesJobStatus = a.jobStatus?.toLowerCase().includes(query) ?? false;
        const matchesBatch = a.batch?.toLowerCase().includes(query) ?? false;
        
        if (!matchesName && !matchesRoll && !matchesCompany && !matchesDesig && !matchesUni && !matchesSkill && !matchesBadge && !matchesJobStatus && !matchesBatch) {
          return false;
        }
      }

      if (selectedCompany !== 'ALL' && a.company !== selectedCompany) return false;
      if (selectedSkill !== 'ALL' && !(a.skills?.includes(selectedSkill))) return false;

      if (selectedJobStage !== 'ALL') {
        const status = a.jobStatus?.toLowerCase() || '';
        if (selectedJobStage === 'Critical' && !status.includes('critical')) return false;
        if (selectedJobStage === 'Moderate' && !status.includes('moderate')) return false;
        if (selectedJobStage === 'Permanent' && !status.includes('permanent')) return false;
      }

      if (selectedBatch !== 'ALL' && a.batch !== selectedBatch) return false;

      if (selectedBadge !== 'ALL') {
        if (!a.badges || !a.badges.some(b => b.toLowerCase().includes(selectedBadge.toLowerCase()))) {
          return false;
        }
      }

      return true;
    });
  }, [alumniList, searchQuery, selectedCompany, selectedSkill, selectedJobStage, selectedBatch, selectedBadge]);

  const handleImageError = (id: string) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-4 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-amber-400 mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Verified Alumni Database</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              BUTEX PGD Alumni Directory
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Search and connect with {alumniList.length} Post Graduate Diploma textile professionals across top garment industries.
            </p>
          </div>

          {/* View Mode Toggle & Sync Google Sheet Button */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleSyncSheet}
              disabled={syncing}
              className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md disabled:opacity-50"
              title="Re-fetch latest responses from Google Sheet"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing...' : 'Sync Google Sheet'}</span>
            </button>

            <button
              onClick={() => setViewMode('grid')}
              className={`hidden sm:flex p-2.5 rounded-xl border text-xs font-semibold items-center space-x-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-slate-700 text-amber-300 border-amber-400 font-bold'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Grid View</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`hidden sm:flex p-2.5 rounded-xl border text-xs font-semibold items-center space-x-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-slate-700 text-amber-300 border-amber-400 font-bold'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Table View</span>
            </button>
          </div>
        </div>

        {syncMsg && (
          <div className="bg-amber-500/20 border border-amber-400/50 text-amber-300 px-4 py-2 rounded-xl text-xs font-bold animate-fade-in">
            {syncMsg}
          </div>
        )}

        {/* Search & Filters Controls */}
        <div className="pt-2 space-y-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Name, Roll No / SL No, Designation, Company, University, Skill..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-11 pr-10 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Company</label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-amber-400 truncate"
              >
                <option value="ALL">All Companies ({Math.max(0, companies.length - 1)})</option>
                {companies.filter(c => c !== 'ALL').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Functional Skill</label>
              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-amber-400"
              >
                {skillOptions.map(s => (
                  <option key={s} value={s}>{s === 'ALL' ? 'All Skills' : s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Job Stage Status</label>
              <select
                value={selectedJobStage}
                onChange={(e) => setSelectedJobStage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-amber-400"
              >
                <option value="ALL">All Job Statuses</option>
                <option value="Critical">Critical Stage (Seeking Job Now)</option>
                <option value="Moderate">Moderate Stage (Looking for Better)</option>
                <option value="Permanent">Permanent Stage (Stable)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">PGD Batch</label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-amber-400"
              >
                {batchOptions.map(b => (
                  <option key={b} value={b}>{b === 'ALL' ? 'All Batches' : b}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] text-amber-400 uppercase font-bold mb-1">Achievement Badge</label>
              <select
                value={selectedBadge}
                onChange={(e) => setSelectedBadge(e.target.value)}
                className="w-full bg-slate-950 border border-amber-500/60 rounded-lg px-2.5 py-2 text-amber-300 font-semibold focus:outline-none focus:border-amber-400"
              >
                {badgeOptions.map(b => (
                  <option key={b} value={b}>{b === 'ALL' ? '🏅 All Badges' : b}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Counter */}
      <div className="flex items-center justify-between text-xs text-slate-600 px-1">
        <span>Showing <strong className="text-slate-900 font-bold">{filteredAlumni.length}</strong> of {alumniList.length} alumni records</span>
        {(selectedCompany !== 'ALL' || selectedSkill !== 'ALL' || selectedJobStage !== 'ALL' || selectedBatch !== 'ALL' || selectedBadge !== 'ALL' || searchQuery) && (
          <button
            onClick={() => {
              setSelectedCompany('ALL');
              setSelectedSkill('ALL');
              setSelectedJobStage('ALL');
              setSelectedBatch('ALL');
              setSelectedBadge('ALL');
              setSearchQuery('');
            }}
            className="text-amber-700 hover:underline font-semibold"
          >
            Reset All Filters
          </button>
        )}
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAlumni.map((alumni) => {
            const isCritical = alumni.jobStatus?.toLowerCase().includes('critical') ?? false;
            const photo = alumni.photo || alumni.photoUrl;
            
            return (
              <div
                key={alumni.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-amber-400 transition-all p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Profile Header */}
                  <div className="flex items-start space-x-3.5">
                    {/* Fixed Avatar Container */}
                    <AlumniAvatar 
                      photoUrl={alumni.photo || alumni.photoUrl} 
                      name={alumni.name || ''} 
                      sizeClass="w-16 h-16 min-w-[64px] min-h-[64px] rounded-2xl" 
                      textClass="text-xl font-black"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1">
                        <h3 className="font-bold text-slate-900 text-base truncate">{alumni.name}</h3>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" title="Verified Alumni" />
                      </div>
                      <p className="text-xs font-semibold text-amber-700 truncate">{alumni.designation || 'N/A'}</p>
                      <p className="text-xs text-slate-600 font-medium truncate">{alumni.company || 'N/A'}</p>
                      
                      {/* Badges */}
                      {alumni.badges && alumni.badges.length > 0 && (
                        <div className="pt-1.5">
                          <AlumniBadges badges={alumni.badges} size="sm" maxDisplay={3} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span 
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border inline-flex items-center space-x-1 ${
                        isCritical
                          ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm'
                          : alumni.jobStatus?.toLowerCase().includes('moderate') || alumni.jobStatus?.toLowerCase().includes('open') || alumni.jobStatus?.toLowerCase().includes('seeking') || alumni.jobStatus?.toLowerCase().includes('looking')
                            ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-sm'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
                      }`}
                      title={alumni.jobStatus || 'Current Job Status'}
                    >
                      <span>{isCritical ? '⚡' : alumni.jobStatus?.toLowerCase().includes('moderate') ? '💼' : '✓'}</span>
                      <span className="truncate max-w-[200px]">
                        {alumni.jobStatus ? alumni.jobStatus.split('(')[0].trim() : 'Permanent Stage (Stable)'}
                      </span>
                    </span>
                    <span className="text-[11px] font-mono font-medium text-slate-500 shrink-0">
                      SL: {alumni.rollNo || 'N/A'}
                    </span>
                  </div>

                  {/* Meta Details */}
                  <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex items-center space-x-2">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Experience: <strong className="text-slate-800">{alumni.experience || 'N/A'}</strong></span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{alumni.university || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{alumni.address || alumni.city || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {alumni.skills?.map((skill, i) => (
                      <span key={`${alumni.id}-skill-${i}`} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1">
                  <button
                    onClick={() => setShowQrAlumni(alumni)}
                    className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-amber-100 hover:text-amber-900 text-[11px] font-bold flex items-center space-x-1"
                    title="Show Phone Number QR Code"
                  >
                    <QrCode className="w-3.5 h-3.5 text-amber-600" />
                    <span className="hidden sm:inline">QR</span>
                  </button>

                  {alumni.resumeUrl ? (
                    <button
                      onClick={() => {
                        setVerifyDownloadAlumni(alumni);
                        setDownloadType('cv');
                      }}
                      className="text-xs text-amber-700 font-bold hover:underline flex items-center space-x-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Download CV</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const text = encodeURIComponent(`Hello Admin, I would like to request the CV/Resume for BUTEX PGD Alumni member: ${alumni.name} (SL: ${alumni.rollNo}).`);
                        window.open(`https://wa.me/8801700000000?text=${text}`, '_blank');
                      }}
                      className="text-xs text-slate-500 font-semibold hover:text-amber-700 flex items-center space-x-1"
                      title="Request CV from Admin via WhatsApp"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>Request CV</span>
                    </button>
                  )}

                  <button
                    onClick={() => setActiveModalAlumni(alumni)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-amber-400 text-xs font-bold transition-colors"
                  >
                    Profile
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-slate-200 border-b border-slate-800">
                  <th className="p-3.5 font-bold">SL / Roll</th>
                  <th className="p-3.5 font-bold">Name & Photo</th>
                  <th className="p-3.5 font-bold">Designation & Company</th>
                  <th className="p-3.5 font-bold">Experience</th>
                  <th className="p-3.5 font-bold">University</th>
                  <th className="p-3.5 font-bold">Job Status</th>
                  <th className="p-3.5 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredAlumni.map((alumni) => {
                  const photo = alumni.photo || alumni.photoUrl;
                  return (
                    <tr key={alumni.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-mono text-slate-500 font-semibold">{alumni.rollNo || 'N/A'}</td>
                      <td className="p-3.5">
                        <div className="flex items-center space-x-2.5">
                          <AlumniAvatar 
                            photoUrl={alumni.photo || alumni.photoUrl} 
                            name={alumni.name || ''} 
                            sizeClass="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full" 
                            textClass="text-sm font-bold"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">{alumni.name}</span>
                            <span className="text-[10px] text-slate-400 block mb-0.5">{alumni.batch}</span>
                            {alumni.badges && alumni.badges.length > 0 && (
                              <AlumniBadges badges={alumni.badges} size="sm" maxDisplay={2} />
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-semibold text-slate-900 block">{alumni.designation || 'N/A'}</span>
                        <span className="text-slate-500">{alumni.company || 'N/A'}</span>
                      </td>
                      <td className="p-3.5 font-medium text-slate-800">{alumni.experience || 'N/A'}</td>
                      <td className="p-3.5 max-w-[160px] truncate text-slate-600">{alumni.university || 'N/A'}</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border inline-block ${
                          alumni.jobStatus?.toLowerCase().includes('critical') || alumni.jobStatus?.toLowerCase().includes('seeking')
                            ? 'bg-rose-100 text-rose-800 border-rose-200'
                            : alumni.jobStatus?.toLowerCase().includes('moderate') || alumni.jobStatus?.toLowerCase().includes('open') || alumni.jobStatus?.toLowerCase().includes('looking')
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`} title={alumni.jobStatus}>
                          {alumni.jobStatus ? alumni.jobStatus.split('(')[0].trim() : 'Permanent Stage (Stable)'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setActiveModalAlumni(alumni)}
                          className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 text-[11px]"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Profile */}
      {activeModalAlumni && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 relative">
            <div className="bg-slate-900 text-white p-6 relative">
              <button
                onClick={() => setActiveModalAlumni(null)}
                className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-5">
                <AlumniAvatar 
                  photoUrl={activeModalAlumni.photo || activeModalAlumni.photoUrl} 
                  name={activeModalAlumni.name || ''} 
                  sizeClass="w-24 h-24 min-w-[96px] min-h-[96px] rounded-2xl border-4 border-slate-800" 
                  textClass="text-2xl font-black"
                />
                <div className="text-center sm:text-left space-y-1">
                  <div className="flex items-center justify-center sm:justify-start space-x-2">
                    <h3 className="text-xl font-extrabold text-white">{activeModalAlumni.name}</h3>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  </div>
                  <p className="text-sm text-amber-400 font-semibold">{activeModalAlumni.designation || 'N/A'}</p>
                  <p className="text-xs text-slate-300 font-medium">{activeModalAlumni.company || 'N/A'}</p>
                  
                  {activeModalAlumni.badges && activeModalAlumni.badges.length > 0 && (
                    <div className="pt-1 flex justify-center sm:justify-start">
                      <AlumniBadges badges={activeModalAlumni.badges} size="lg" />
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <div className="inline-block px-2.5 py-1 rounded-full bg-slate-800 text-[10px] text-amber-300 font-mono border border-slate-700">
                      SL NO / ROLL: {activeModalAlumni.rollNo || 'N/A'}
                    </div>

                    <button
                      onClick={() => setShowQrAlumni(activeModalAlumni)}
                      className="px-3 py-1 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Digital ID Card</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3 text-xs text-amber-900">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-amber-900">Privacy & Data Governance Policy</span>
                  <span>Contact numbers and email addresses are protected by member privacy preferences. Authorized alumni recruiters can request direct introduction.</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 uppercase font-bold text-[10px] block">University / Education</span>
                  <span className="font-semibold text-slate-800 mt-1 block">{activeModalAlumni.university || 'N/A'}</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 uppercase font-bold text-[10px] block">Total Experience</span>
                  <span className="font-semibold text-slate-800 mt-1 block">{activeModalAlumni.experience || 'N/A'}</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 uppercase font-bold text-[10px] block">Present Address</span>
                  <span className="font-semibold text-slate-800 mt-1 block">{activeModalAlumni.address || activeModalAlumni.city || 'N/A'}</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 uppercase font-bold text-[10px] block">Job Availability Stage</span>
                  <span className="font-semibold text-slate-800 mt-1 block">{activeModalAlumni.jobStatus || 'N/A'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Functional Competencies</h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeModalAlumni.skills?.map((sk, i) => (
                    <span key={`${activeModalAlumni.id}-modal-skill-${i}`} className="px-3 py-1 rounded-lg bg-amber-100 text-amber-900 text-xs font-semibold">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-2 text-xs">
                  {activeModalAlumni.hideContact ? (
                    <span className="text-slate-400 italic flex items-center gap-1">
                      <EyeOff className="w-4 h-4" /> Contact details hidden by member
                    </span>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-slate-700 font-semibold">
                        <Mail className="w-4 h-4 text-amber-600" />
                        <span>{activeModalAlumni.email || 'Email available via Admin'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-700 font-semibold">
                        <Phone className="w-4 h-4 text-amber-600" />
                        <span>{activeModalAlumni.phone || 'Phone hidden'}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(activeModalAlumni.photo || activeModalAlumni.photoUrl) && (
                    <button
                      onClick={() => {
                        setVerifyDownloadAlumni(activeModalAlumni);
                        setDownloadType('photo');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center space-x-1.5 shadow"
                    >
                      <Download className="w-4 h-4 text-amber-400" />
                      <span>Download Photo</span>
                    </button>
                  )}

                  {activeModalAlumni.resumeUrl ? (
                    <button
                      onClick={() => {
                        setVerifyDownloadAlumni(activeModalAlumni);
                        setDownloadType('cv');
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-2 shadow-md"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Download CV</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const text = encodeURIComponent(`Hello Admin, I would like to request the CV/Resume for BUTEX PGD Alumni member: ${activeModalAlumni.name} (SL: ${activeModalAlumni.rollNo}).`);
                        window.open(`https://wa.me/8801700000000?text=${text}`, '_blank');
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center space-x-2"
                    >
                      <FileText className="w-4 h-4 text-slate-600" />
                      <span>Request CV</span>
                    </button>
                  )}
                </div>
              </div>

            </div>

            <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActiveModalAlumni(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Digital ID Card Popup Modal */}
      {showQrAlumni && (
        <DigitalIdCardModal
          alumni={showQrAlumni}
          onClose={() => setShowQrAlumni(null)}
        />
      )}

      {/* Download Verification Modal */}
      {verifyDownloadAlumni && (
        <DownloadVerificationModal
          alumni={verifyDownloadAlumni}
          downloadType={downloadType}
          onClose={() => setVerifyDownloadAlumni(null)}
          onVerified={() => {
            const targetUrl = downloadType === 'photo'
              ? (verifyDownloadAlumni.photo || verifyDownloadAlumni.photoUrl)
              : verifyDownloadAlumni.resumeUrl;
            
            if (targetUrl) {
              window.open(targetUrl, '_blank');
            } else {
              alert("Requested file URL is empty.");
            }
          }}
        />
      )}

    </div>
  );
};