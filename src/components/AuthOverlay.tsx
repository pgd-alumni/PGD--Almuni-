import React, { useState } from 'react';
import { ShieldCheck, Lock, Phone, Key, Sparkles, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react';
import { UserProfile } from '../types';

interface AuthOverlayProps {
  isAuthenticated: boolean;
  onAuthenticated: (user?: UserProfile) => void;
}

export const AuthOverlay: React.FC<AuthOverlayProps> = ({
  isAuthenticated,
  onAuthenticated
}) => {
  const [contact, setContact] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [passcode, setPasscode] = useState('');
  const [authMode, setAuthMode] = useState<'otp' | 'passcode'>('otp');
  const [sentOtp, setSentOtp] = useState<string | null>(null);
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [matchedProfile, setMatchedProfile] = useState<UserProfile | null>(null);

  if (isAuthenticated) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.trim()) {
      setError("Please enter your Phone Number or Email linked to Master Sheet");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: contact.trim() })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSentOtp(data.otp);
        setWhatsappLink(data.whatsappLink);
        const namePart = data.memberName ? `for ${data.memberName}` : '';
        setSuccessMsg(`Verified Alumni ${namePart}! OTP Code: ${data.otp}`);
        
        if (data.memberName) {
          setMatchedProfile({
            name: data.memberName,
            rollNo: data.memberRoll || 'PGD-ALUMNI',
            email: data.memberEmail || contact.trim(),
            company: data.memberCompany || '',
            designation: data.memberDesignation || '',
            isMaster: false
          });
        }
      } else {
        setSentOtp(null);
        setError(data.message || "Invalid Phone Number or Email! Contact is not registered in Master Sheet.");
      }
    } catch (err) {
      setError("Network error sending OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setError("Please enter the 6-digit OTP code");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: contact.trim(), code: otpCode.trim() })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onAuthenticated(matchedProfile || {
          name: contact.includes('@') ? contact.split('@')[0] : `Alumni (${contact})`,
          rollNo: 'PGD-MEMBER',
          email: contact.includes('@') ? contact : undefined,
          phone: !contact.includes('@') ? contact : undefined
        });
      } else {
        setError(data.message || "Invalid OTP code!");
      }
    } catch (err) {
      setError("Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePasscodeUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = passcode.trim().toLowerCase();
    if (normalized === 'butex2026' || normalized === 'admin' || normalized === '123456') {
      onAuthenticated({
        name: 'Master Admin',
        rollNo: 'PGD-ADMIN',
        email: 'admin@butex.edu.bd',
        isMaster: true
      });
    } else {
      setError("Invalid Passcode! Please enter the valid Master Passcode.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 text-white shadow-2xl relative space-y-6">
        
        {/* Header Icon */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
            <Lock className="w-8 h-8" />
          </div>
          <div className="flex items-center justify-center space-x-1.5 text-xs font-bold text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Master Data Access Protection</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">BUTEX PGD Alumni Association</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Main view is protected. Authenticate via real-time OTP linked with Google Master Sheet or Master Passcode to unlock full directory and events.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => { setAuthMode('otp'); setError(null); setSuccessMsg(null); }}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              authMode === 'otp'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp / Email OTP</span>
          </button>

          <button
            type="button"
            onClick={() => { setAuthMode('passcode'); setError(null); setSuccessMsg(null); }}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              authMode === 'passcode'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Master Passcode</span>
          </button>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-3.5 py-2.5 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-3.5 py-2.5 rounded-xl text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form 1: Master Passcode Mode */}
        {authMode === 'passcode' && (
          <form onSubmit={handlePasscodeUnlock} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Enter Master Password / Passcode
              </label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter Master Passcode"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition-all"
            >
              Unlock Main Portal Access
            </button>
          </form>
        )}

        {/* Form 2: OTP Verification Mode */}
        {authMode === 'otp' && (
          <div className="space-y-4">
            {!sentOtp ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Phone Number or Email (Linked in Master Sheet)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="e.g. 01700000000 or email@domain.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                >
                  {loading ? 'Sending OTP...' : 'Send Real-Time OTP Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Enter 6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter 6-digit code (e.g. 123456)"
                    maxLength={6}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-center text-lg font-mono text-amber-400 placeholder-slate-600 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {whatsappLink && (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-center text-xs font-bold text-emerald-400 hover:underline"
                  >
                    📲 Open WhatsApp to Receive Code
                  </a>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setSentOtp(null); setOtpCode(''); }}
                    className="w-1/3 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Verify OTP & Unlock'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
