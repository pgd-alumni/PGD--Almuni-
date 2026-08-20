import React, { useState } from 'react';
import butexLogo from '../assets/butex-logo.png';
import { Mail, MessageCircle, Globe, Copy, Check, ExternalLink, Youtube, Facebook, Linkedin } from 'lucide-react';

interface FooterProps {
  setActiveTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  const [copied, setCopied] = useState(false);
  const registrationFormUrl = "https://docs.google.com/forms/d/e/1FAIpQLSeiTarRmhu7miZju3VLlCfDNtBysOzqlzd00T8vfHxaeF9Kfg/viewform?usp=header";

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(registrationFormUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800">
      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Col 1: About */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-0.5 shadow-md border border-amber-400 shrink-0">
                <img 
                  src={butexLogo} 
                  alt="BUTEX Logo" 
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <div>
                <span className="font-bold text-lg text-white block">BUTEX PGD Alumni</span>
                <span className="text-xs text-amber-400 font-medium">Bangladesh Textile University</span>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              The central network connecting Post Graduate Diploma in Textile & Garments Management alumni across global RMG brands, manufacturing giants, and buying houses.
            </p>
            <div className="pt-2 flex items-center space-x-2.5 flex-wrap gap-y-2">
              <a 
                href="https://www.youtube.com/@BUTEXPGDAlumni" 
                target="_blank" 
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-rose-600/20 text-rose-500 border border-rose-500/30 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-xs"
                title="YouTube Channel"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a 
                href="https://www.facebook.com/groups/butexpgdalumni" 
                target="_blank" 
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-xs"
                title="Facebook Community Group"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a 
                href="https://www.linkedin.com/company/butex-pgd-alumni" 
                target="_blank" 
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-sky-600/20 text-sky-400 border border-sky-500/30 flex items-center justify-center hover:bg-sky-600 hover:text-white transition-all shadow-xs"
                title="LinkedIn Network Page"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a 
                href="https://wa.me/?text=Hello%20BUTEX%20PGD%20Alumni%20Network" 
                target="_blank" 
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-xs"
                title="WhatsApp Group"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a 
                href="mailto:butexpgdalumni@gmail.com" 
                className="w-9 h-9 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center hover:bg-amber-500 hover:text-slate-950 transition-all shadow-xs"
                title="Email Support"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button 
                  onClick={() => handleTabChange('directory')} 
                  className="hover:text-amber-400 text-left transition-colors focus:outline-none focus:text-amber-400"
                >
                  Alumni Directory
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleTabChange('jobs')} 
                  className="hover:text-amber-400 text-left transition-colors focus:outline-none focus:text-amber-400"
                >
                  Job Portal & Vacancies
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleTabChange('post-job')} 
                  className="hover:text-amber-400 text-left transition-colors focus:outline-none focus:text-amber-400"
                >
                  Post a Job Opening
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleTabChange('mentorship')} 
                  className="hover:text-amber-400 text-left transition-colors focus:outline-none focus:text-amber-400"
                >
                  Mentor-Mentee Matching
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleTabChange('companies')} 
                  className="hover:text-amber-400 text-left transition-colors focus:outline-none focus:text-amber-400"
                >
                  Partner Companies
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Services & Tools */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
              Services & Tools
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button 
                  onClick={() => handleTabChange('id-card')} 
                  className="hover:text-amber-400 text-left transition-colors focus:outline-none focus:text-amber-400"
                >
                  Digital Alumni ID Card
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleTabChange('events')} 
                  className="hover:text-amber-400 text-left transition-colors focus:outline-none focus:text-amber-400"
                >
                  Events & Factory Visits
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleTabChange('admin')} 
                  className="hover:text-amber-400 text-left transition-colors focus:outline-none focus:text-amber-400"
                >
                  Admin Dashboard & Moderation
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Backend Info */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
              Database & Support
            </h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-start space-x-2">
                <Globe className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Tejgaon, Dhaka 1208, Bangladesh</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <a href="mailto:butexpgdalumni@gmail.com" className="text-amber-300 font-mono hover:underline">
                  butexpgdalumni@gmail.com
                </a>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <a 
                    href={registrationFormUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 hover:underline truncate"
                  >
                    <span>New Member Registration</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>

                  <button
                    onClick={handleCopyLink}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center space-x-1 transition-all shrink-0 ${
                      copied 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                        : 'bg-slate-800 text-amber-300 hover:bg-slate-700 border border-slate-700'
                    }`}
                    title="Copy Form URL to Clipboard"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-amber-400" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
                <span className="hidden text-[10px] text-slate-400 leading-tight">
                  Data synchronized in real-time with Google Sheet ID <code className="text-amber-300 font-mono">1uMOI8...</code>
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} BUTEX PGD Alumni Group. Designed & Developed Almuni Team.</p>
          <div>
            <span>All Rights are Reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};