import React from 'react';
import { 
  Zap, 
  UserCheck, 
  QrCode, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles,
  Database,
  Briefcase,
  GraduationCap
} from 'lucide-react';

interface AlumniActionHubProps {
  setActiveTab: (tab: string) => void;
}

export const AlumniActionHub: React.FC<AlumniActionHubProps> = ({ setActiveTab }) => {
  return (
    <section className="w-full bg-gradient-to-br from-[#002147] via-[#002e63] to-[#001733] rounded-3xl p-6 sm:p-8 lg:p-10 border border-amber-500/20 shadow-2xl relative overflow-hidden text-white my-8">
      {/* Background Decorative Lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#FFBF00]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#FFBF00]/20 border border-[#FFBF00]/40 text-[#FFBF00] text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Alumni Executive Tools & Services</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-3">
              <span>Alumni Action Hub</span>
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Quick access to job vacancy postings, executive mentorship matching, digital alumni credentials, and admin moderation tools.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs text-amber-400 font-mono bg-white/5 border border-white/10 px-3.5 py-2 rounded-2xl shrink-0 self-start md:self-auto">
            <Database className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Master Sheet Sync Active</span>
          </div>
        </div>

        {/* 4-Column Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          {/* Tile 1: Post a Job Opening */}
          <div 
            onClick={() => setActiveTab('post-job')}
            className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#FFBF00] rounded-2xl p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between space-y-4 hover:shadow-xl hover:shadow-[#FFBF00]/10 hover:-translate-y-1 relative"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFBF00] to-amber-600 text-[#002147] flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                <Briefcase className="w-6 h-6 font-bold" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white group-hover:text-[#FFBF00] transition-colors">
                  Post a Job Opening
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed mt-1">
                  Share garment, textile, QA, or merchandising vacancies with verified alumni.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-extrabold text-[#FFBF00] pt-2 border-t border-white/10">
              <span>Submit Vacancy</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Tile 2: Request Mentorship */}
          <div 
            onClick={() => setActiveTab('mentorship')}
            className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-400 rounded-2xl p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between space-y-4 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 relative"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-6 h-6 font-bold" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white group-hover:text-blue-300 transition-colors">
                  Request Mentorship
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed mt-1">
                  Connect 1-on-1 with senior PGD GMs, Factory Heads, and Buying Directors.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-extrabold text-blue-300 pt-2 border-t border-white/10">
              <span>Find Mentor</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Tile 3: Digital Alumni ID */}
          <div 
            onClick={() => setActiveTab('id-card')}
            className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-400 rounded-2xl p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between space-y-4 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 relative"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                <QrCode className="w-6 h-6 font-bold" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white group-hover:text-emerald-300 transition-colors">
                  Digital Alumni ID
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed mt-1">
                  Generate and verify your official digital PGD ID card with QR code.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-extrabold text-emerald-300 pt-2 border-t border-white/10">
              <span>Generate ID</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Tile 4: Admin Management */}
          <div 
            onClick={() => setActiveTab('admin')}
            className="group bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400 rounded-2xl p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between space-y-4 hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1 relative"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6 font-bold" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-amber-400 group-hover:text-amber-300 transition-colors">
                    Admin Management
                  </h3>
                  <span className="text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">
                    Admin
                  </span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed mt-1">
                  Review job posts, approve event registrations & sync Google Sheets.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-extrabold text-amber-400 pt-2 border-t border-white/10">
              <span>Review Job Posts & Sheet Sync →</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
