import React, { useState } from 'react';
import { QrCode, Search, CheckCircle2, ShieldCheck, Download, AlertCircle, Sparkles, User, Building2, GraduationCap } from 'lucide-react';
import { AlumniRecord } from '../types';
import { AlumniAvatar } from './AlumniAvatar';
import { DigitalIdCardModal } from './DigitalIdCardModal';

interface DigitalIdModuleProps {
  alumniList: AlumniRecord[];
}

export const DigitalIdModule: React.FC<DigitalIdModuleProps> = ({ alumniList }) => {
  const [searchRoll, setSearchRoll] = useState('3600001740');
  const [selectedAlumni, setSelectedAlumni] = useState<AlumniRecord | null>(
    alumniList.find(a => a.rollNo.includes('3600001740')) || alumniList[0] || null
  );
  const [verificationResult, setVerificationResult] = useState<{ verified: boolean; message: string } | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleVerifySearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchRoll.trim()) return;

    const term = searchRoll.toLowerCase().trim();
    const found = alumniList.find(a => 
      a.rollNo.toLowerCase().includes(term) || 
      a.id.toLowerCase() === term ||
      a.name.toLowerCase().includes(term)
    );

    if (found) {
      setSelectedAlumni(found);
      setVerificationResult({ verified: true, message: `Verified Active PGD Member: ${found.name}` });
    } else {
      setSelectedAlumni(null);
      setVerificationResult({ verified: false, message: "No alumni found matching this SL / Roll Number." });
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-12">
      
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-3 border border-slate-800 shadow-xl text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start space-x-2 text-xs font-semibold text-amber-400">
          <Sparkles className="w-4 h-4" />
          <span>Official Membership Credential</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold">Digital Alumni ID Card & QR Verification</h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
          Generate your official BUTEX PGD Alumni ID Card. Employers and event managers can scan the QR code to verify member authenticity.
        </p>
      </div>

      {/* Lookup Control */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
          <Search className="w-4 h-4 text-amber-600" />
          <span>Search & Verify PGD Roll / SL Number</span>
        </h3>

        <form onSubmit={handleVerifySearch} className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={searchRoll}
            onChange={(e) => setSearchRoll(e.target.value)}
            placeholder="Enter Roll / SL NO (e.g. 3600001740, 3600001249, PGD2025-4-197)..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 font-mono"
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-amber-400 font-bold text-xs shrink-0 transition-colors"
          >
            Verify Member
          </button>
        </form>

        {verificationResult && (
          <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center space-x-2 ${
            verificationResult.verified ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {verificationResult.verified ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            <span>{verificationResult.message}</span>
          </div>
        )}
      </div>

      {/* Interactive Digital ID Card Preview */}
      {selectedAlumni ? (
        <div className="space-y-4">
          <div className="text-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Digital Membership Card Preview
            </span>
          </div>

          <div className="max-w-md mx-auto bg-slate-950 text-white rounded-3xl p-6 border-2 border-amber-500/40 shadow-2xl space-y-6 relative overflow-hidden">
            
            {/* Card Background Branding Glow */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/20 rounded-full blur-2xl pointer-events-none"></div>

            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-bold text-slate-950 text-base shadow-md">
                  PGD
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white tracking-tight">BUTEX PGD ALUMNI</h4>
                  <p className="text-[10px] text-amber-400 font-medium">Bangladesh Textile University</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                ✓ VERIFIED
              </span>
            </div>

            {/* Photo & Member Core Info */}
            <div className="flex items-center space-x-4">
              <AlumniAvatar 
                photoUrl={selectedAlumni.photo || selectedAlumni.photoUrl} 
                name={selectedAlumni.name} 
                sizeClass="w-20 h-20 min-w-[80px] min-h-[80px] rounded-2xl border-2 border-amber-400 shadow-lg" 
                textClass="text-2xl font-bold"
              />

              <div className="min-w-0 flex-1 space-y-1">
                <h3 className="font-extrabold text-base text-white truncate">{selectedAlumni.name}</h3>
                <p className="text-xs text-amber-400 font-semibold truncate">{selectedAlumni.designation || 'N/A'}</p>
                <p className="text-xs text-slate-300 truncate">{selectedAlumni.company || 'N/A'}</p>
                <p className="text-[11px] font-mono text-slate-400 mt-1">SL: {selectedAlumni.rollNo || 'N/A'}</p>
              </div>
            </div>

            {/* Card Details Grid */}
            <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/90 p-3 rounded-2xl border border-slate-800/80">
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Batch</span>
                <span className="font-medium text-slate-200">{selectedAlumni.batch || 'PGD Alumni'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Member Type</span>
                <span className="font-medium text-amber-300">Lifetime PGD Alumni</span>
              </div>
              <div className="col-span-2 pt-1 border-t border-slate-800">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">University</span>
                <span className="font-medium text-slate-200 truncate block">{selectedAlumni.university || 'N/A'}</span>
              </div>
            </div>

            {/* QR Code & Verification URL */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block">Scan to verify credential:</span>
                <span className="text-[9px] font-mono text-amber-400/80 block">
                  butex.alumni/verify/{selectedAlumni.rollNo}
                </span>
              </div>

              {/* QR Code Graphic Box */}
              <div className="w-16 h-16 bg-white p-1.5 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://butex-pgd-alumni.web.app/verify/${encodeURIComponent(selectedAlumni.rollNo)}`} 
                  alt="QR Verification"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

          </div>

          <div className="flex justify-center pt-2">
            <button 
              onClick={() => setShowModal(true)}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center space-x-2 shadow-lg transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download & Export Digital ID Card</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-100 p-8 rounded-3xl text-center text-slate-500 text-xs">
          Enter a valid PGD SL NO or Roll Number above to generate card preview.
        </div>
      )}

      {showModal && selectedAlumni && (
        <DigitalIdCardModal
          alumni={selectedAlumni}
          onClose={() => setShowModal(false)}
        />
      )}

    </div>
  );
};
