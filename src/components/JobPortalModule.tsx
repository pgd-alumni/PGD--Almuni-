import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  ExternalLink, 
  Search, 
  PlusCircle, 
  Building2, 
  Sparkles,
  RefreshCw,
  DollarSign
} from 'lucide-react';
import { JobPost } from '../types';

interface JobPortalModuleProps {
  jobList: JobPost[];
  setActiveTab: (tab: string) => void;
}

export const JobPortalModule: React.FC<JobPortalModuleProps> = ({
  jobList,
  setActiveTab
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSource, setSelectedSource] = useState('ALL');

  const categories = ['ALL', 'Production', 'Merchandising', 'QA', 'IE', 'Supply Chain', 'HR', 'General'];
  const sources = ['ALL', 'Member Posted', 'LinkedIn', 'BDJobs', 'NextJobs', 'Company Website', 'WhatsApp Group'];

  const filteredJobs = useMemo(() => {
    return jobList.filter(job => {
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchTitle = job.title?.toLowerCase().includes(query);
        const matchCompany = job.company?.toLowerCase().includes(query);
        const matchLoc = job.location?.toLowerCase().includes(query);
        const matchSkill = job.requiredSkills?.some(s => s.toLowerCase().includes(query));
        if (!matchTitle && !matchCompany && !matchLoc && !matchSkill) return false;
      }

      if (selectedCategory !== 'ALL' && job.category !== selectedCategory) return false;
      if (selectedSource !== 'ALL' && job.source !== selectedSource) return false;

      return true;
    });
  }, [jobList, searchTerm, selectedCategory, selectedSource]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('ALL');
    setSelectedSource('ALL');
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Job Portal Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 space-y-6 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2 text-xs font-semibold text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span>Moderated Garment & Textile Job Board</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              BUTEX PGD Job Portal & Career Exchange
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Verified openings from top apparel factories, buying offices, and global textile brands. Refreshing automatically every 6 hours.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('post-job')}
            className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 shrink-0 transition-all hover:scale-105"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Post a Job Opening</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by Job Title, Skill, Company..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400 transition-colors"
            >
              <option value="ALL">All Categories</option>
              {categories.filter(c => c !== 'ALL').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400 transition-colors"
            >
              <option value="ALL">All Sources (BDJobs, LinkedIn, WhatsApp)</option>
              {sources.filter(s => s !== 'ALL').map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-400 pt-1 gap-2">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Auto-refresh active (Every 6 hours) • Expired jobs auto-hidden</span>
          </div>
          <span>Showing {filteredJobs.length} active jobs</span>
        </div>
      </div>

      {/* Empty State */}
      {filteredJobs.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Job Openings Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            We couldn't find any vacancies matching your search parameters. Try clearing filters or searching for broader terms.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl bg-slate-900 text-amber-400 text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-amber-400 transition-all flex flex-col justify-between space-y-4 relative"
          >
            <div className="space-y-3">
              {/* Top row */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 uppercase tracking-wider">
                    {job.category || 'General'}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1 leading-snug">{job.title}</h3>
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{job.company}</span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-600 block">
                    {job.source || 'Direct'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 block">ID: {job.id}</span>
                </div>
              </div>

              {/* Description preview */}
              {job.jobDescription && (
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {job.jobDescription}
                </p>
              )}

              {/* Meta information */}
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                <div className="flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{job.location || 'Bangladesh'}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Exp: {job.experienceRequired || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Posted: {job.postedDate || 'Recent'}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="font-semibold text-amber-800">Deadline: {job.deadline || 'Open'}</span>
                </div>
              </div>

              {job.salaryRange && (
                <div className="flex items-center space-x-1.5 text-xs text-emerald-700 font-medium bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                  <DollarSign className="w-3.5 h-3.5 shrink-0" />
                  <span>Salary: {job.salaryRange}</span>
                </div>
              )}

              {/* Skills */}
              {job.requiredSkills && job.requiredSkills.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {job.requiredSkills.map((skill, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="text-[11px] text-slate-500 truncate">
                Posted by <strong className="text-slate-800">{job.posterName || 'Alumni Member'}</strong>
              </div>

              {job.originalUrl && job.originalUrl.trim() ? (
                <a
                  href={job.originalUrl.startsWith('http') ? job.originalUrl : `https://${job.originalUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-amber-400 text-xs font-bold transition-all shadow-md flex items-center space-x-2 shrink-0"
                >
                  <span>Apply on {(job.source || 'Direct').split(' ')[0]}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Hello, I am interested in applying for the "${job.title}" role at ${job.company} shared on BUTEX PGD Alumni Portal.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-md flex items-center space-x-2 shrink-0"
                >
                  <span>Direct Alumni Referral</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};