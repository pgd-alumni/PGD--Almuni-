import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, Sparkles, CreditCard, Send, AlertCircle, ExternalLink, FileSpreadsheet } from 'lucide-react';
import { EventItem } from '../types';
import { ClassReviewSection } from './ClassReviewSection';

interface EventRegistrationModalProps {
  event: EventItem | null;
  events?: EventItem[];
  onClose: () => void;
  onSubmitted: () => void;
}

export const EventRegistrationModal: React.FC<EventRegistrationModalProps> = ({
  event,
  events = [],
  onClose,
  onSubmitted
}) => {
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [selectedEventTitle, setSelectedEventTitle] = useState(event?.title || (events[0]?.title || ''));
  const [memberPhone, setMemberPhone] = useState('');
  const [paymentGateway, setPaymentGateway] = useState<'bKash' | 'Nagad' | 'Rocket' | 'Bank Transfer'>('bKash');
  const [paymentRefNo, setPaymentRefNo] = useState('');
  const [paymentSubmissionDate, setPaymentSubmissionDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLScT82KiXdAQg-Xlgr7xXfnbcoiAakTNm58FTt233tP_9BMEcw/viewform?usp=publish-editor";
  const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/1ZY76tbYUCTS8LA4DOe76cRAorDaTSRqVTsejD_UBspE/edit?resourcekey=&gid=1943182397#gid=1943182397";

  if (!event && events.length === 0) return null;
  const activeEvent = event || events[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentId.trim() || !selectedEventTitle.trim() || !memberPhone.trim() || !paymentRefNo.trim() || !paymentSubmissionDate.trim()) {
      setError("Please fill in all 6 registration fields before submitting for admin approval.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/events/${activeEvent.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventTitle: selectedEventTitle,
          studentName: studentName.trim(),
          studentId: studentId.trim(),
          memberPhone: memberPhone.trim(),
          emailOrWhatsApp: memberPhone.trim(),
          paymentGateway,
          paymentMethod: paymentGateway,
          paymentRefNo: paymentRefNo.trim(),
          transactionId: paymentRefNo.trim(),
          paymentSubmissionDate,
          tabName: "event history"
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSubmitted();
          onClose();
        }, 2500);
      } else {
        setError(data.message || "Submission failed. Please try again.");
      }
    } catch (err) {
      setError("Error submitting registration to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[92vh] sm:max-h-[88vh] border border-slate-200 shadow-2xl flex flex-col my-auto relative overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 sm:right-4 sm:top-4 text-slate-400 hover:text-white p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 transition-colors"
            aria-label="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 text-[11px] sm:text-xs font-bold text-amber-400 mb-1 pr-8">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Event Registration & Streaming Sheet Sync</span>
          </div>
          <h3 className="text-base sm:text-xl font-extrabold text-white leading-tight pr-6">{activeEvent.title}</h3>
          <p className="text-[11px] sm:text-xs text-slate-300 mt-1">
            Host: <strong className="text-amber-300">{activeEvent.hostName || 'BUTEX Alumni'}</strong> • Venue: <strong>{activeEvent.venue}</strong> • Date: <strong>{activeEvent.date}</strong>
          </p>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 scrollbar-thin">

          {/* Quick Integration Banner with Google Form & Sheet links */}
          <div className="bg-slate-900 text-slate-100 p-3 sm:p-3.5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-amber-400 font-bold">
              <span>Google Form & Sheet Integration Options:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <a 
                href={GOOGLE_FORM_URL}
                target="_blank"
                rel="noreferrer"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-2 rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-sm active:scale-95"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span>Open Google Form</span>
              </a>
              <a 
                href={GOOGLE_SHEET_URL}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-sm active:scale-95"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                <span>View Google Sheet</span>
              </a>
            </div>
          </div>

          {success ? (
            <div className="py-4 sm:py-6 text-center space-y-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-1 bg-amber-100 text-amber-900 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full mb-1">
                  <span>Submitted For Admin Approval</span>
                </div>
                <h4 className="text-base sm:text-lg font-black text-slate-900">Registration Joining Request Sent!</h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto px-2">
                  Your joining request has been submitted to the Admin Panel. Data is automatically connected with Master Google Sheet in tab: <strong className="text-emerald-700 font-mono font-bold">event history</strong>.
                </p>
              </div>

              {/* Registration Record Summary Card */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 text-left text-xs space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-amber-900 uppercase tracking-wider">
                  <span>Member Registration Receipt</span>
                  <span className="text-amber-700 font-bold">Pending Approval</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Student Name & ID:</span>
                    <strong className="font-bold text-slate-900">{studentName} ({studentId})</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Phone Number:</span>
                    <strong className="font-bold text-slate-900">{memberPhone}</strong>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-slate-500 block">Event Title:</span>
                    <strong className="font-bold text-amber-900">{selectedEventTitle}</strong>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-slate-500 block">Payment Ref & Gateway:</span>
                    <strong className="font-mono font-bold text-slate-900">{paymentGateway}: {paymentRefNo}</strong>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <a 
                  href={GOOGLE_FORM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center justify-center space-x-1.5 text-xs transition-all shadow-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Google Form</span>
                </a>
                <a 
                  href={GOOGLE_SHEET_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl flex items-center justify-center space-x-1.5 text-xs transition-all shadow-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Google Sheet (tab: event history)</span>
                </a>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-3 rounded-xl text-xs transition-all"
                >
                  Close Window
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl flex items-center space-x-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 font-medium">
                📊 Data automatically connects to Master Google Sheet under tab: <strong className="font-mono text-emerald-950 font-bold">event history</strong>
              </div>

              {/* 1st Input Field: Student Name */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-700 mb-1">
                  Student Name *
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-amber-500 font-semibold text-xs"
                />
              </div>

              {/* 2nd Input Field: Student ID */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-700 mb-1">
                 Student ID *
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. PGD-3600001784"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-amber-500 font-mono text-xs"
                />
              </div>

              {/* 3rd Input Field: Event Title (Dropdown List) */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-700 mb-1">
                  Event Title (Select Event Program) *
                </label>
                <select
                  value={selectedEventTitle}
                  onChange={(e) => setSelectedEventTitle(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-amber-500 font-bold text-xs"
                >
                  {events.length > 0 ? (
                    events.map((evt) => (
                      <option key={evt.id} value={evt.title}>
                        {evt.title} ({evt.date})
                      </option>
                    ))
                  ) : (
                    <option value={activeEvent.title}>{activeEvent.title}</option>
                  )}
                </select>
              </div>

              {/* 4th Input Field: Member Phone Number */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-700 mb-1">
                  Member Phone Number *
                </label>
                <input
                  type="tel"
                  value={memberPhone}
                  onChange={(e) => setMemberPhone(e.target.value)}
                  placeholder="e.g. 01700000000 (WhatsApp enabled)"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-amber-500 font-medium text-xs"
                />
              </div>

              {/* 5th Input Field: Payment Reference Number & Gateway */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 sm:p-3.5 space-y-2.5">
                <label className="block text-[10px] uppercase font-bold text-amber-950">
                  Payment Reference Number and Gateway *
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(['bKash', 'Nagad', 'Rocket', 'Bank Transfer'] as const).map(gw => (
                    <button
                      type="button"
                      key={gw}
                      onClick={() => setPaymentGateway(gw)}
                      className={`py-2 px-1 rounded-xl text-[10px] sm:text-[11px] font-bold border transition-all truncate ${
                        paymentGateway === gw
                          ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {gw}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={paymentRefNo}
                  onChange={(e) => setPaymentRefNo(e.target.value)}
                  placeholder={`Enter ${paymentGateway} Transaction ID / Ref No`}
                  required
                  className="w-full bg-white border border-amber-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* 6th Input Field: Payment Submission Date */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-700 mb-1">
                  Payment Submission Date *
                </label>
                <input
                  type="date"
                  value={paymentSubmissionDate}
                  onChange={(e) => setPaymentSubmissionDate(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-amber-500 font-medium text-xs"
                />
              </div>

              {/* Action Button: "Submission for admin approval" */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50 transition-all"
                >
                  <Send className="w-4 h-4 shrink-0" />
                  <span>{loading ? 'Submitting...' : 'Submission for admin approval'}</span>
                </button>
              </div>

              {/* Class Review & Comments Section connected with event post */}
              <div className="pt-4 border-t border-slate-200">
                <ClassReviewSection event={activeEvent} />
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};
