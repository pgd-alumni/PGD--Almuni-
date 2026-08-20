import React, { useState } from 'react';
import { UserCheck, MessageSquare, Award, CheckCircle2, Search, Mail, Send, Sparkles } from 'lucide-react';
import { MentorProfile } from '../types';
import { AlumniBadges } from './AlumniBadges';

export const MentorshipModule: React.FC = () => {
  const [mentors] = useState<MentorProfile[]>([
    {
      id: "MTR-01",
      name: "Md. Nazmul Huda",
      designation: "General Manager",
      company: "Epic Group",
      specialization: "Apparel Operations & Multi-Buyer Leadership",
      experience: "13+ Years",
      availableFor: ["Career Advice", "Factory Management", "GM Transition"],
      email: "sohel0751@gmail.com",
    },
    {
      id: "MTR-02",
      name: "MD Fakhrul Islam",
      designation: "Sr. Manager",
      company: "BHT Industries Ltd.",
      specialization: "Dyeing, Finishing & Sustainable Processing",
      experience: "15+ Years",
      availableFor: ["Technical Dyeing", "Process Engineering", "Leadership"],
      email: "fakhrul2010@gmail.com",
    },
    {
      id: "MTR-03",
      name: "Alay Chakma",
      designation: "Manager - Finishing Operations",
      company: "American & Efird (Bangladesh) Ltd.",
      specialization: "Thread & Finishing Operations",
      experience: "13+ Years",
      availableFor: ["Industrial Operations", "Thread Technology", "Lean Six Sigma"],
      email: "2alaychakma@gmail.com",
    },
    {
      id: "MTR-04",
      name: "Towhedul Islam",
      designation: "IE & Lean Instructor",
      company: "BKMEA",
      specialization: "Industrial Engineering, Line Balancing & SMV",
      experience: "7+ Years",
      availableFor: ["IE SMV Calculation", "Line Balancing", "BKMEA Certification"],
      email: "towhedulislam3535@gmail.com",
    }
  ]);

  const [requestModal, setRequestModal] = useState<MentorProfile | null>(null);
  const [requestSuccess, setRequestSuccess] = useState(false);

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRequestSuccess(true);
    setTimeout(() => {
      setRequestSuccess(false);
      setRequestModal(null);
    }, 2500);
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-3 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-2 text-xs font-semibold text-amber-400">
          <Sparkles className="w-4 h-4" />
          <span>Alumni Guidance & Professional Development</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold">Mentor-Mentee Network</h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Connect directly with experienced BUTEX PGD alumni leaders for 1-on-1 mentorship, career navigation, and technical guidance in RMG operations.
        </p>
      </div>

      {/* Mentors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mentors.map((mentor) => (
          <div key={mentor.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xl shrink-0 shadow-md">
                  {mentor.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{mentor.name}</h3>
                  <p className="text-xs font-semibold text-amber-700">{mentor.designation}</p>
                  <p className="text-xs text-slate-600 mb-1.5">{mentor.company} ({mentor.experience})</p>
                  <AlumniBadges badges={mentor.badges || []} size="sm" />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Specialization</span>
                <p className="text-xs font-medium text-slate-800">{mentor.specialization}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Available For</span>
                <div className="flex flex-wrap gap-1.5">
                  {mentor.availableFor.map((topic, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-medium">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active Mentor
              </span>
              <button
                onClick={() => setRequestModal(mentor)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-amber-400 text-xs font-bold transition-all"
              >
                Request Mentorship
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Request Modal */}
      {requestModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <h3 className="text-lg font-bold text-slate-900">
              Request Mentorship from {requestModal.name}
            </h3>
            <p className="text-xs text-slate-600">
              Your request will be sent to {requestModal.name} ({requestModal.designation} at {requestModal.company}).
            </p>

            {requestSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center text-xs text-emerald-800 font-bold">
                ✓ Mentorship Request Sent! The mentor will contact you via email.
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name</label>
                  <input type="text" required placeholder="Your Name" className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Roll / SL No</label>
                  <input type="text" required placeholder="PGD Roll Number" className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Brief Description of Goals</label>
                  <textarea rows={3} required placeholder="What career area would you like guidance on?" className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs" />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setRequestModal(null)} className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold">Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400">Send Request</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
