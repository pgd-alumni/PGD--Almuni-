import React, { useState } from 'react';
import { X, ShieldCheck, Phone, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AlumniRecord } from '../types';

interface DownloadVerificationModalProps {
  alumni: AlumniRecord | null;
  downloadType: 'photo' | 'cv';
  onClose: () => void;
  onVerified: () => void;
}

export const DownloadVerificationModal: React.FC<DownloadVerificationModalProps> = ({
  alumni,
  downloadType,
  onClose,
  onVerified
}) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!alumni) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError("Please enter phone number to verify against Master Sheet.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/auth/verify-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          alumniId: alumni.id
        })
      });

      const data = await res.json();
      if (res.ok && data.verified) {
        onVerified();
        onClose();
      } else {
        setError(data.message || "Phone number not matched in Master Google Sheet record!");
      }
    } catch (err) {
      setError("Verification failed due to network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden relative p-6 space-y-4">
        
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-800 p-1 rounded-full bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 pt-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-slate-900">Phone Verification Required</h3>
          <p className="text-xs text-slate-600">
            To download <strong>{downloadType === 'photo' ? 'Full Quality Photo' : 'CV / Resume'}</strong> for <strong>{alumni.name}</strong>, please verify your phone number against the Master Google Sheet.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl flex items-center space-x-2 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4 text-xs">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
              Your Phone Number (Linked in Master Sheet) *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 01700000000"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{loading ? 'Verifying...' : 'Verify Phone & Proceed to Download'}</span>
          </button>
        </form>

        <p className="text-[10px] text-slate-400 text-center italic">
          Master Sheet Security Guard • Test phone: <code className="text-amber-800 font-bold bg-slate-100 px-1 py-0.5 rounded">01700000000</code>
        </p>

      </div>
    </div>
  );
};
