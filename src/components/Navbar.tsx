import React, { useState } from 'react';
import butexLogo from '../assets/butex-logo.png';
import { 
  Sparkles, 
  GraduationCap, 
  Users, 
  Briefcase, 
  Building2, 
  Calendar, 
  ShieldCheck,
  MoreVertical,
  FileText,
  Lock,
  Unlock,
  LogOut,
  ExternalLink,
  Menu,
  X,
  PlusCircle,
  UserCheck,
  QrCode,
  MessageCircle
} from 'lucide-react';

interface NavbarProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  activeModule?: string;
  onNavigate?: (module: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  alumniCount?: number;
  totalAlumniCount?: number;
  pendingJobsCount?: number;
  isAuthenticated?: boolean;
  onLockToggle?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activeModule,
  onNavigate,
  alumniCount = 260,
  totalAlumniCount,
  pendingJobsCount = 0,
  isAuthenticated = true,
  onLockToggle
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const currentTab = activeTab || activeModule || 'home';
  const displayAlumniCount = totalAlumniCount ?? alumniCount ?? 260;

  const handleNav = (tab: string) => {
    if (setActiveTab) setActiveTab(tab);
    if (onNavigate) onNavigate(tab);
    setIsMobileMenuOpen(false);
    setShowDropdown(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: GraduationCap },
    { id: 'directory', label: 'Directory', icon: Users, badge: displayAlumniCount },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'companies', label: 'Companies', icon: Building2 },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'table-talk', label: 'Table Talk', icon: MessageCircle },
  ];

  const drawerItems = [
    { id: 'home', label: 'Home Feed', icon: GraduationCap },
    { id: 'directory', label: 'Alumni Directory', icon: Users, badge: displayAlumniCount },
    { id: 'jobs', label: 'Job Portal & Vacancies', icon: Briefcase },
    { id: 'post-job', label: 'Post a Job Opening', icon: PlusCircle, highlight: true },
    { id: 'companies', label: 'Partner Companies', icon: Building2 },
    { id: 'events', label: 'Events & Factory Visits', icon: Calendar },
    { id: 'table-talk', label: 'Table Talk Forum', icon: MessageCircle },
    { id: 'mentorship', label: 'Mentorship Program', icon: UserCheck },
    { id: 'id-card', label: 'Digital Alumni ID', icon: QrCode },
    { id: 'admin', label: 'Admin Dashboard', icon: ShieldCheck, badge: pendingJobsCount > 0 ? pendingJobsCount : null },
  ];

  return (
    <header className="sticky top-0 z-50 w-full select-none shadow-md">
      {/* Top Banner */}
      <div className="bg-[#FFBF00] text-[#002147] border-b border-amber-500/20">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 py-1 text-[10px] sm:text-xs font-bold flex items-center justify-between">
          <div className="flex items-center space-x-1.5 truncate">
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#002147]" />
            <span className="truncate">BUTEX PGD Alumni Portal & Job Exchange — Live Database</span>
          </div>
          <a 
            href="https://wa.me/?text=Hello%20BUTEX%20PGD%20Alumni%20Network"
            target="_blank"
            rel="noreferrer"
            className="font-bold text-[10px] sm:text-xs text-[#002147] hover:underline cursor-pointer shrink-0 ml-2 flex items-center space-x-1"
          >
            <MessageCircle className="w-3 h-3 sm:hidden" />
            <span>WhatsApp Community →</span>
          </a>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className="bg-[#002147] text-white border-b border-white/10 relative">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 py-2.5 flex items-center justify-between">
          
          {/* Logo & Title */}
        <div 
          className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer group" 
          onClick={() => handleNav('home')}
        >
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white flex items-center justify-center p-0.5 shadow-md border-2 border-[#FFBF00] shrink-0 group-hover:scale-105 transition-transform">
            <img 
              src={butexLogo} 
              alt="BUTEX Logo" 
              className="w-full h-full object-contain rounded-full"
            />
          </div>

          <div className="flex flex-col">
            <h1 className="text-sm sm:text-[17px] font-black tracking-wide text-white leading-none">
              BUTEX PGD ALUMNI
            </h1>
            <p className="text-[8px] sm:text-[9px] font-bold text-[#FFBF00] tracking-wider mt-1 uppercase">
              Excellence in Textiles & Management
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center space-x-2 text-[13px] font-bold">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            if (isActive) {
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className="bg-[#FFBF00] text-[#002147] font-black px-3.5 py-1.5 rounded-full flex items-center space-x-1.5 shadow-md hover:brightness-110 transition-all shrink-0"
                >
                  <Icon className="w-4 h-4 text-[#002147]" />
                  <span>{item.label}</span>
                  {item.badge !== null && item.badge !== undefined && (
                    <span className="bg-[#002147] text-[#FFBF00] text-[10px] font-extrabold px-2 py-0.5 rounded-full ml-0.5">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition-all shrink-0 text-slate-200 hover:text-white hover:bg-white/10 font-bold"
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.badge !== null && item.badge !== undefined && (
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ml-0.5 ${
                    item.id === 'admin' ? 'bg-rose-500 text-white' : 'bg-white/15 text-[#FFBF00]'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Security Lock / Logout Toggle Button */}
          {onLockToggle && (
            <button
              onClick={onLockToggle}
              className={`p-1.5 px-2.5 rounded-xl transition-all flex items-center space-x-1 ${
                isAuthenticated ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}
              title={isAuthenticated ? 'Logout' : 'Portal Locked'}
            >
              {isAuthenticated ? <LogOut className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-rose-400" />}
              <span className="text-[10px] font-bold">{isAuthenticated ? 'Logout' : 'Locked'}</span>
            </button>
          )}

          {/* Three-Dot Dropdown Menu (⋮) */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-1.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all shrink-0 relative"
              title="More Options"
            >
              <MoreVertical className="w-4 h-4 text-[#FFBF00]" />
              {pendingJobsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
              )}
            </button>

            {showDropdown && (
              <div 
                className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 text-xs text-white space-y-1"
                onMouseLeave={() => setShowDropdown(false)}
              >
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                  Quick Utilities
                </div>

                <a
                  href="https://drive.google.com/file/d/1uMOI8R1PHXxq59k8mWVe7dEqOe60sePKmULDWbwrDEg/view?usp=sharing"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center space-x-2.5 px-3 py-2 rounded-xl hover:bg-slate-800 text-amber-400 font-bold transition-colors"
                >
                  <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="flex flex-col">
                    <span>STUDENT ID Info</span>
                    <span className="text-[9px] text-slate-400 font-normal">Google Drive Official PDF</span>
                  </div>
                  <ExternalLink className="w-3 h-3 ml-auto text-slate-500" />
                </a>

                <button
                  onClick={() => {
                    handleNav('admin');
                    setShowDropdown(false);
                  }}
                  className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-xl transition-colors ${
                    currentTab === 'admin'
                      ? 'bg-[#FFBF00] text-[#002147] font-bold shadow-md'
                      : 'hover:bg-slate-800 text-slate-200 font-medium'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <ShieldCheck className={`w-4 h-4 shrink-0 ${currentTab === 'admin' ? 'text-[#002147]' : 'text-amber-400'}`} />
                    <span>Admin Panel</span>
                  </div>
                  {pendingJobsCount > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      {pendingJobsCount}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Mobile / Tablet Controls (Visible on < lg screens) */}
        <div className="flex lg:hidden items-center space-x-2">
          
          {/* Security Lock Toggle Button on Mobile */}
          {onLockToggle && (
            <button
              onClick={onLockToggle}
              className={`p-1.5 px-2 rounded-xl transition-all flex items-center space-x-1 ${
                isAuthenticated ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}
              title={isAuthenticated ? 'Logout' : 'Portal Locked'}
            >
              {isAuthenticated ? <LogOut className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-rose-400" />}
              <span className="text-[10px] font-bold sm:inline">{isAuthenticated ? 'Logout' : 'Locked'}</span>
            </button>
          )}

          {/* Mobile Hamburger Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all relative"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-[#FFBF00]" />
            ) : (
              <Menu className="w-5 h-5 text-[#FFBF00]" />
            )}
            {pendingJobsCount > 0 && !isMobileMenuOpen && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
            )}
          </button>

        </div>

        </div>
      </nav>

      {/* Responsive Mobile Drawer Overlay & Panel */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col bg-slate-950/80 backdrop-blur-md transition-all">
          <div className="bg-[#001733] border-b-2 border-[#FFBF00] shadow-2xl p-4 space-y-4 max-h-[85vh] overflow-y-auto">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-[#FFBF00] animate-pulse" />
                <span className="text-xs font-black uppercase text-[#FFBF00] tracking-wider">
                  Navigation & Tools
                </span>
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav Links Stack */}
            <div className="grid grid-cols-1 gap-1.5">
              {drawerItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-extrabold transition-all text-left ${
                      isActive
                        ? 'bg-[#FFBF00] text-[#002147] shadow-lg shadow-amber-500/20'
                        : item.highlight
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
                        : 'bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#002147]' : item.highlight ? 'text-amber-400' : 'text-slate-300'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== null && item.badge !== undefined && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-[#002147] text-[#FFBF00]' : 'bg-rose-500 text-white'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick External Links */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <a
                href="https://drive.google.com/file/d/1uMOI8R1PHXxq59k8mWVe7dEqOe60sePKmULDWbwrDEg/view?usp=sharing"
                target="_blank"
                rel="noreferrer"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-amber-400 text-xs font-bold"
              >
                <div className="flex items-center space-x-2.5">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Student ID Official PDF</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>

              <a
                href="https://wa.me/?text=Hello%20BUTEX%20PGD%20Alumni%20Network"
                target="_blank"
                rel="noreferrer"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold"
              >
                <div className="flex items-center space-x-2.5">
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>WhatsApp Alumni Group</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>

            {/* Bottom Security Toggle */}
            {onLockToggle && (
              <div className="pt-2 border-t border-white/10">
                <button
                  onClick={() => {
                    onLockToggle();
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    isAuthenticated
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {isAuthenticated ? <LogOut className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-rose-400" />}
                    <span>Portal Status: {isAuthenticated ? 'Authenticated' : 'Locked'}</span>
                  </div>
                  <span className="text-[10px] underline">{isAuthenticated ? 'Logout' : 'Click to Unlock'}</span>
                </button>
              </div>
            )}

          </div>
          
          {/* Tap backdrop to close */}
          <div 
            className="flex-1 cursor-pointer"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        </div>
      )}

    </header>
  );
};


