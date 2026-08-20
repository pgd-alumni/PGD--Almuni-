import React, { useState } from 'react';
import { Send, CheckCircle2, Sparkles } from 'lucide-react';

interface PostJobModuleProps {
  onJobSubmitted: () => void;
  setActiveTab: (tab: string) => void;
}

const INITIAL_FORM_STATE = {
  title: '',
  company: '',
  source: 'Member Submission',
  originalUrl: '',
  location: '',
  category: 'Merchandising',
  requiredSkills: '',
  experienceRequired: '',
  salaryRange: '',
  deadline: '',
  jobDescription: '',
  posterName: '',
  posterEmail: '',
  posterAlumniId: '',
  consent: false
};

export const PostJobModule: React.FC<PostJobModuleProps> = ({
  onJobSubmitted,
  setActiveTab
}) => {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [loading, setLoading] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.company || !formData.consent) {
      alert("Please fill in all required fields and accept the consent checkbox.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          requiredSkills: formData.requiredSkills
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
        })
      });

      const res = await response.json();
      if (res.success) {
        setSubmittedMessage(res.message || "Job post submitted for moderation.");
        onJobSubmitted();
      } else {
        alert(res.message || "Failed to submit job opening.");
      }
    } catch (err) {
      alert("Error submitting job post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setSubmittedMessage(null);
    setFormData(INITIAL_FORM_STATE);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-12">
      
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-3 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-2 text-xs font-semibold text-amber-400">
          <Sparkles className="w-4 h-4" />
          <span>Alumni Job Referral & Submission Workflow</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Post a Job Opening</h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Submit job opportunities for BUTEX PGD alumni. Submitted posts undergo quick admin review before appearing publicly on the Job Portal and WhatsApp Community.
        </p>
      </div>

      {submittedMessage ? (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-extrabold text-emerald-950">Job Post Submitted Successfully!</h2>
          <p className="text-sm text-emerald-800 max-w-lg mx-auto">
            {submittedMessage}
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setActiveTab('jobs')}
              className="px-6 py-3 rounded-xl bg-slate-900 text-amber-400 text-xs font-bold hover:bg-slate-800 transition-colors shadow-md"
            >
              Go to Job Portal
            </button>
            <button
              onClick={handleResetForm}
              className="px-6 py-3 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition-colors shadow-md"
            >
              Post Another Job
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-lg space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Job Title */}
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Job Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Senior Executive - Merchandising"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Company Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g. Apex Holdings Ltd / Decathlon"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Job Source */}
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Job Source
              </label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              >
                <option value="Member Submission">Member / Alumni Referral</option>
                <option value="LinkedIn">LinkedIn Job</option>
                <option value="BDJobs">BDJobs Listing</option>
                <option value="NextJobs">NextJobs Listing</option>
                <option value="Company Website">Company Career Portal</option>
                <option value="WhatsApp Group">WhatsApp Group Share</option>
              </select>
            </div>

            {/* Original Job URL */}
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Original Job URL / Link <span className="text-slate-400 font-normal normal-case">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.originalUrl}
                onChange={(e) => setFormData({ ...formData, originalUrl: e.target.value })}
                placeholder="e.g. https://www.bdjobs.com/... or leave blank for direct referral"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Gazipur / Savar / Uttara, Dhaka"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Job Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              >
                <option value="Merchandising">Merchandising</option>
                <option value="Production">Production & Knitting</option>
                <option value="QA">Quality Assurance (QA)</option>
                <option value="IE">Industrial Engineering (IE)</option>
                <option value="Supply Chain">Supply Chain & Procurement</option>
                <option value="HR">HR & Admin</option>
                <option value="General">General / Other</option>
              </select>
            </div>

            {/* Experience Required */}
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Experience Required
              </label>
              <input
                type="text"
                value={formData.experienceRequired}
                onChange={(e) => setFormData({ ...formData, experienceRequired: e.target.value })}
                placeholder="e.g. 3-5 Years"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Salary Range */}
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Salary Range
              </label>
              <input
                type="text"
                value={formData.salaryRange}
                onChange={(e) => setFormData({ ...formData, salaryRange: e.target.value })}
                placeholder="e.g. BDT 60,000 - 80,000 / Negotiable"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Deadline */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Application Deadline
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Required Skills */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Required Skills (Comma Separated)
              </label>
              <input
                type="text"
                value={formData.requiredSkills}
                onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })}
                placeholder="e.g. Costing, Buyer Liaison, Garment Testing, AQL 2.5"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Job Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Job Description & Key Responsibilities
              </label>
              <textarea
                rows={4}
                value={formData.jobDescription}
                onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                placeholder="Provide details about key job duties, factory environment, or buyer requirements..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Poster Info */}
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Your Name (Poster) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.posterName}
                onChange={(e) => setFormData({ ...formData, posterName: e.target.value })}
                placeholder="e.g. Md. Shakibur Rahman"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Your Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.posterEmail}
                onChange={(e) => setFormData({ ...formData, posterEmail: e.target.value })}
                placeholder="e.g. sakib@example.com"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Consent */}
            <div className="sm:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-start space-x-3">
              <input
                type="checkbox"
                id="consent"
                checked={formData.consent}
                onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                className="mt-1 w-4 h-4 text-amber-600 focus:ring-amber-500 border-slate-300 rounded"
              />
              <label htmlFor="consent" className="text-xs text-slate-700 leading-relaxed cursor-pointer select-none">
                I confirm that I am authorized to share this job posting with BUTEX PGD Alumni Group members, and the details provided are accurate and non-discriminatory.
              </label>
            </div>

          </div>

          <div className="pt-4 flex items-center justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm flex items-center space-x-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all hover:scale-[1.02]"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Submitting Job...' : 'Submit for Admin Approval'}</span>
            </button>
          </div>

        </form>
      )}

    </div>
  );
};