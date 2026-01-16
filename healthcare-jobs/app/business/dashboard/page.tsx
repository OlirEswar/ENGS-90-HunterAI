'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Job {
  job_id: string;
  job_name: string;
  company_name: string;
  city: string;
  state: string;
  hourly_wage_minimum: number;
  hourly_wage_maximum: number;
  job_description: string;
  job_requirements: string[];
  created_at: string;
  match_count?: number;
}

interface MatchedCandidate {
  match_id: string;
  user_id: string;
  questionnaire_sent: boolean;
  candidate: {
    user_id: string;
    name: string;
    email: string;
    resume: string | null;
  };
}

interface BusinessProfile {
  business_id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
}

function ProfileTab({
  businessProfile,
  setBusinessProfile
}: {
  businessProfile: BusinessProfile | null;
  setBusinessProfile: (profile: BusinessProfile) => void;
}) {
  const [formData, setFormData] = useState({
    companyName: '',
    contactFirstName: '',
    contactLastName: '',
    email: '',
    phone: ''
  });
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error'; text: string} | null>(null);

  useEffect(() => {
    if (businessProfile) {
      const nameParts = businessProfile.contact_name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      setFormData({
        companyName: businessProfile.company_name,
        contactFirstName: firstName,
        contactLastName: lastName,
        email: businessProfile.email,
        phone: businessProfile.phone || ''
      });
    }
  }, [businessProfile]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessProfile) return;

    setUpdating(true);
    setMessage(null);

    try {
      const contactName = `${formData.contactFirstName} ${formData.contactLastName}`.trim();

      const { error: updateError } = await supabase
        .from('u_businesses')
        .update({
          company_name: formData.companyName,
          contact_name: contactName,
          email: formData.email,
          phone: formData.phone || null
        })
        .eq('business_id', businessProfile.business_id);

      if (updateError) {
        throw new Error('Failed to update profile');
      }

      setBusinessProfile({
        ...businessProfile,
        company_name: formData.companyName,
        contact_name: contactName,
        email: formData.email,
        phone: formData.phone || null
      });

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Business Profile</h2>
        <p className="text-slate-600">Update your company information</p>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-8">
        <form onSubmit={handleUpdate} className="space-y-6">
          {message && (
            <div className={`p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 mb-2">
              Company Name
            </label>
            <input
              type="text"
              id="companyName"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="contactFirstName" className="block text-sm font-medium text-slate-700 mb-2">
                Contact First Name
              </label>
              <input
                type="text"
                id="contactFirstName"
                value={formData.contactFirstName}
                onChange={(e) => setFormData({ ...formData, contactFirstName: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
                required
              />
            </div>

            <div>
              <label htmlFor="contactLastName" className="block text-sm font-medium text-slate-700 mb-2">
                Contact Last Name
              </label>
              <input
                type="text"
                id="contactLastName"
                value={formData.contactLastName}
                onChange={(e) => setFormData({ ...formData, contactLastName: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
              Business Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
              placeholder="(555) 123-4567"
            />
          </div>

          <button
            type="submit"
            disabled={updating}
            className="w-full bg-gradient-to-r from-sky-500 to-teal-500 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {updating ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}

function CreateJobModal({
  isOpen,
  onClose,
  businessProfile,
  onJobCreated
}: {
  isOpen: boolean;
  onClose: () => void;
  businessProfile: BusinessProfile | null;
  onJobCreated: () => void;
}) {
  const [formData, setFormData] = useState({
    jobName: '',
    city: '',
    state: '',
    hourlyWageMinimum: '',
    hourlyWageMaximum: '',
    jobDescription: '',
    jobRequirements: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessProfile) return;

    setLoading(true);
    setError('');

    try {
      // Parse requirements from textarea (one per line)
      const requirements = formData.jobRequirements
        .split('\n')
        .map(req => req.trim())
        .filter(req => req.length > 0);

      const { error: insertError } = await supabase
        .from('jobs')
        .insert({
          job_name: formData.jobName,
          company_name: businessProfile.company_name,
          city: formData.city,
          state: formData.state,
          hourly_wage_minimum: parseFloat(formData.hourlyWageMinimum),
          hourly_wage_maximum: parseFloat(formData.hourlyWageMaximum),
          job_description: formData.jobDescription,
          job_requirements: requirements,
          business_id: businessProfile.business_id
        });

      if (insertError) {
        throw insertError;
      }

      // Reset form and close modal
      setFormData({
        jobName: '',
        city: '',
        state: '',
        hourlyWageMinimum: '',
        hourlyWageMaximum: '',
        jobDescription: '',
        jobRequirements: ''
      });
      onJobCreated();
      onClose();
    } catch (err) {
      console.error('Error creating job:', err);
      setError('Failed to create job posting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Create New Job Posting</h2>
            <p className="text-slate-600">Fill in the details for your new position</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="h-6 w-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="jobName" className="block text-sm font-medium text-slate-700 mb-2">
              Job Title
            </label>
            <input
              type="text"
              id="jobName"
              value={formData.jobName}
              onChange={(e) => setFormData({ ...formData, jobName: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
              placeholder="e.g., Registered Nurse - ICU"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-2">
                City
              </label>
              <input
                type="text"
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
                placeholder="e.g., Boston"
                required
              />
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-slate-700 mb-2">
                State
              </label>
              <input
                type="text"
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
                placeholder="e.g., MA"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="hourlyWageMinimum" className="block text-sm font-medium text-slate-700 mb-2">
                Minimum Hourly Wage ($)
              </label>
              <input
                type="number"
                id="hourlyWageMinimum"
                value={formData.hourlyWageMinimum}
                onChange={(e) => setFormData({ ...formData, hourlyWageMinimum: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
                placeholder="e.g., 35"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label htmlFor="hourlyWageMaximum" className="block text-sm font-medium text-slate-700 mb-2">
                Maximum Hourly Wage ($)
              </label>
              <input
                type="number"
                id="hourlyWageMaximum"
                value={formData.hourlyWageMaximum}
                onChange={(e) => setFormData({ ...formData, hourlyWageMaximum: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
                placeholder="e.g., 55"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="jobDescription" className="block text-sm font-medium text-slate-700 mb-2">
              Job Description
            </label>
            <textarea
              id="jobDescription"
              value={formData.jobDescription}
              onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition resize-none"
              rows={4}
              placeholder="Describe the role, responsibilities, and what makes this position unique..."
              required
            />
          </div>

          <div>
            <label htmlFor="jobRequirements" className="block text-sm font-medium text-slate-700 mb-2">
              Job Requirements <span className="text-slate-400">(one per line)</span>
            </label>
            <textarea
              id="jobRequirements"
              value={formData.jobRequirements}
              onChange={(e) => setFormData({ ...formData, jobRequirements: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition resize-none"
              rows={5}
              placeholder="Bachelor's degree in Nursing&#10;Active RN license&#10;2+ years ICU experience&#10;BLS and ACLS certification"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-lg font-semibold hover:bg-slate-300 transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-sky-500 to-teal-500 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? 'Creating...' : 'Create Job Posting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function JobDetailModal({
  job,
  onClose,
  onScreeningSent
}: {
  job: Job | null;
  onClose: () => void;
  onScreeningSent: () => void;
}) {
  const [candidates, setCandidates] = useState<MatchedCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingScreening, setSendingScreening] = useState<string | null>(null);
  const [downloadingResume, setDownloadingResume] = useState<string | null>(null);

  useEffect(() => {
    if (job) {
      fetchCandidates();
    }
  }, [job]);

  const fetchCandidates = async () => {
    if (!job) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          match_id,
          user_id,
          questionnaire_sent,
          u_candidates (
            user_id,
            name,
            email,
            resume
          )
        `)
        .eq('job_id', job.job_id);

      if (error) {
        console.error('Error fetching candidates:', error);
        return;
      }

      const transformedCandidates: MatchedCandidate[] = (data || []).map((match: any) => ({
        match_id: match.match_id,
        user_id: match.user_id,
        questionnaire_sent: match.questionnaire_sent,
        candidate: {
          user_id: match.u_candidates.user_id,
          name: match.u_candidates.name,
          email: match.u_candidates.email,
          resume: match.u_candidates.resume
        }
      }));

      setCandidates(transformedCandidates);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadResume = async (candidate: MatchedCandidate) => {
    if (!candidate.candidate.resume) return;

    setDownloadingResume(candidate.user_id);
    try {
      const { data, error } = await supabase.storage
        .from('resumes')
        .download(candidate.candidate.resume);

      if (error) {
        throw error;
      }

      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${candidate.candidate.name.replace(/\s+/g, '_')}_resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading resume:', error);
    } finally {
      setDownloadingResume(null);
    }
  };

  const handleSendScreening = async (matchId: string) => {
    setSendingScreening(matchId);
    try {
      const { error } = await supabase
        .from('matches')
        .update({ questionnaire_sent: true })
        .eq('match_id', matchId);

      if (error) {
        throw error;
      }

      // Update local state
      setCandidates(prev =>
        prev.map(c =>
          c.match_id === matchId ? { ...c, questionnaire_sent: true } : c
        )
      );

      onScreeningSent();
    } catch (error) {
      console.error('Error sending screening:', error);
    } finally {
      setSendingScreening(null);
    }
  };

  if (!job) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 bg-white border-b border-slate-200 p-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-1">{job.job_name}</h2>
            <div className="flex items-center gap-4 text-slate-600">
              <span className="flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {job.city}, {job.state}
              </span>
              <span className="flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ${job.hourly_wage_minimum}/hr - ${job.hourly_wage_maximum}/hr
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="h-6 w-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">Matched Candidates</h3>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
              </div>
            ) : candidates.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-lg">
                <svg className="h-12 w-12 text-slate-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-slate-600">No candidates matched yet</p>
                <p className="text-sm text-slate-500 mt-1">Check back later for new matches</p>
              </div>
            ) : (
              <div className="space-y-4">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.match_id}
                    className="bg-slate-50 rounded-lg p-4 border border-slate-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-gradient-to-br from-sky-100 to-teal-100 rounded-full flex items-center justify-center">
                          <svg className="h-6 w-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800">{candidate.candidate.name}</h4>
                          <p className="text-sm text-slate-600">{candidate.candidate.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {candidate.candidate.resume && (
                          <button
                            onClick={() => handleDownloadResume(candidate)}
                            disabled={downloadingResume === candidate.user_id}
                            className="px-4 py-2 bg-sky-100 text-sky-700 rounded-lg hover:bg-sky-200 transition font-medium text-sm flex items-center gap-2 disabled:opacity-50"
                          >
                            {downloadingResume === candidate.user_id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-700"></div>
                            ) : (
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            )}
                            Resume
                          </button>
                        )}

                        {candidate.questionnaire_sent ? (
                          <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium text-sm flex items-center gap-2">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Screening Sent
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSendScreening(candidate.match_id)}
                            disabled={sendingScreening === candidate.match_id}
                            className="px-4 py-2 bg-gradient-to-r from-sky-500 to-teal-500 text-white rounded-lg hover:shadow-lg transition font-medium text-sm flex items-center gap-2 disabled:opacity-50"
                          >
                            {sendingScreening === candidate.match_id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                            )}
                            Send Screening
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">Job Details</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">Description</h4>
                <p className="text-slate-600">{job.job_description}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">Requirements</h4>
                <ul className="space-y-2">
                  {job.job_requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-2 text-slate-600">
                      <svg className="h-5 w-5 text-sky-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BusinessDashboardPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'job-postings' | 'profile'>('job-postings');
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [showCreateJobModal, setShowCreateJobModal] = useState(false);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/business/login');
      return;
    }

    // Check if user is a business user
    const { data: businessData, error: businessError } = await supabase
      .from('u_businesses')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (businessError || !businessData) {
      router.push('/business/login');
      return;
    }

    setBusinessProfile(businessData);
    fetchJobs(businessData.business_id);
  };

  const fetchJobs = async (businessId: string) => {
    setLoading(true);
    try {
      // Fetch jobs for this business
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (jobsError) {
        console.error('Error fetching jobs:', jobsError);
        return;
      }

      // Fetch match counts for each job
      const jobsWithCounts = await Promise.all(
        (jobsData || []).map(async (job: Job) => {
          const { count } = await supabase
            .from('matches')
            .select('*', { count: 'exact', head: true })
            .eq('job_id', job.job_id);

          return {
            ...job,
            match_count: count || 0
          };
        })
      );

      setJobs(jobsWithCounts);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleJobCreated = () => {
    if (businessProfile) {
      fetchJobs(businessProfile.business_id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-teal-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-slate-200 z-50">
        <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-teal-500 shadow-md">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gradient">Health Care Hunter</h1>
              <p className="text-xs text-slate-500">Employer Dashboard</p>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
          >
            <svg className="h-6 w-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed top-0 lg:top-[73px] bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out`}
      >
        <div className="h-full flex flex-col pt-20 lg:pt-6">
          <nav className="flex-1 space-y-2 px-6">
            <button
              onClick={() => setActiveTab('job-postings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
                activeTab === 'job-postings'
                  ? 'bg-sky-50 text-sky-700'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Job Postings
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
                activeTab === 'profile'
                  ? 'bg-sky-50 text-sky-700'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Company Profile
            </button>
          </nav>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 mx-6 mb-6 rounded-lg text-red-600 hover:bg-red-50 font-medium"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen pt-[73px]">
        <main className="p-6 lg:p-8">
          {activeTab === 'job-postings' ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-slate-800 mb-2">Your Job Postings</h2>
                  <p className="text-slate-600">Manage your open positions and view matched candidates</p>
                </div>
                <button
                  onClick={() => setShowCreateJobModal(true)}
                  className="bg-gradient-to-r from-sky-500 to-teal-500 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Job Posting
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-md border border-slate-200">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                    <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">No Job Postings Yet</h3>
                  <p className="text-slate-600 mb-6">Create your first job posting to start finding candidates</p>
                  <button
                    onClick={() => setShowCreateJobModal(true)}
                    className="bg-gradient-to-r from-sky-500 to-teal-500 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 inline-flex items-center gap-2"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Your First Job
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {jobs.map((job) => (
                    <div
                      key={job.job_id}
                      onClick={() => setSelectedJob(job)}
                      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-slate-200 hover:border-sky-300 p-6 group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-slate-800 group-hover:text-sky-600 transition-colors mb-1">
                            {job.job_name}
                          </h3>
                          <p className="text-slate-600 font-medium">{job.company_name}</p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-sky-100 to-teal-100 group-hover:from-sky-200 group-hover:to-teal-200 transition-colors">
                          <svg className="h-5 w-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {job.city}, {job.state}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          ${job.hourly_wage_minimum}/hr - ${job.hourly_wage_maximum}/hr
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {job.match_count} matched candidate{job.match_count !== 1 ? 's' : ''}
                        </div>
                      </div>

                      <div className="flex items-center justify-end">
                        <span className="text-sky-600 font-medium text-sm group-hover:underline">
                          View Candidates →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <ProfileTab businessProfile={businessProfile} setBusinessProfile={setBusinessProfile} />
          )}
        </main>
      </div>

      {/* Create Job Modal */}
      <CreateJobModal
        isOpen={showCreateJobModal}
        onClose={() => setShowCreateJobModal(false)}
        businessProfile={businessProfile}
        onJobCreated={handleJobCreated}
      />

      {/* Job Detail Modal */}
      <JobDetailModal
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onScreeningSent={() => {}}
      />
    </div>
  );
}
