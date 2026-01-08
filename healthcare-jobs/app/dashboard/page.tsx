'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMatchedJobs, uploadResume } from '@/lib/api';
import { Job } from '@/types';
import { supabase } from '@/lib/supabase';

function ProfileTab({
  userProfile,
  setUserProfile
}: {
  userProfile: {name: string; email: string; resumePath: string; userId: string} | null;
  setUserProfile: (profile: {name: string; email: string; resumePath: string; userId: string}) => void;
}) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: userProfile?.email || ''
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error'; text: string} | null>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (userProfile) {
      // Split the full name into first and last name
      const nameParts = userProfile.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      setFormData({
        firstName,
        lastName,
        email: userProfile.email
      });
    }
  }, [userProfile]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    setUpdating(true);
    setMessage(null);

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();

      // Update name and email in database
      const { error: updateError } = await supabase
        .from('u_candidates')
        .update({
          name: fullName,
          email: formData.email
        })
        .eq('user_id', userProfile.userId);

      if (updateError) {
        throw new Error('Failed to update profile');
      }

      // If there's a new resume file, upload it
      if (resumeFile) {
        const uploadResult = await uploadResume(resumeFile);
        if (!uploadResult.success) {
          throw new Error('Failed to upload resume');
        }
      }

      // Fetch updated profile data from database to get the new resume path
      const { data: updatedData, error: fetchError } = await supabase
        .from('u_candidates')
        .select('name, email, resume, user_id')
        .eq('user_id', userProfile.userId)
        .single();

      if (fetchError || !updatedData) {
        throw new Error('Failed to fetch updated profile');
      }

      // Update local state with fresh data from database
      setUserProfile({
        name: updatedData.name,
        email: updatedData.email,
        resumePath: updatedData.resume,
        userId: updatedData.user_id
      });

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setResumeFile(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setUpdating(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    setMessage(null);

    // Validate file type
    if (selectedFile.type !== 'application/pdf') {
      setMessage({ type: 'error', text: 'Please upload a PDF file only' });
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 5MB' });
      return;
    }

    setResumeFile(selectedFile);
  };

  const handleDownloadResume = async () => {
    if (!userProfile) return;

    try {
      const { data, error } = await supabase.storage
        .from('resumes')
        .download(userProfile.resumePath);

      if (error) {
        throw error;
      }

      // Extract the original filename from the path
      const originalFileName = userProfile.resumePath.split('/').pop() || 'resume.pdf';

      // Create download link
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = originalFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading resume:', error);
      setMessage({ type: 'error', text: 'Failed to download resume. Please try again.' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Your Profile</h2>
        <p className="text-slate-600">Update your personal information and resume</p>
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

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
                required
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
                required
              />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
              Email Address
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

          {/* Resume Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Resume
            </label>

            {/* Current Resume with Download Button */}
            {userProfile && !resumeFile && (
              <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="h-8 w-8 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <p className="font-medium text-slate-800">Current Resume</p>
                    <p className="text-sm text-slate-500">{userProfile.resumePath.split('/').pop()}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadResume}
                  className="px-4 py-2 bg-sky-100 text-sky-700 rounded-lg hover:bg-sky-200 transition font-medium text-sm flex items-center gap-2"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
              </div>
            )}

            {/* Upload New Resume */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                dragActive
                  ? 'border-sky-500 bg-sky-50'
                  : 'border-slate-300 hover:border-sky-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="resume"
                accept=".pdf"
                onChange={handleFileInput}
                className="hidden"
              />

              {!resumeFile ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <svg className="h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <label
                      htmlFor="resume"
                      className="cursor-pointer text-sky-600 hover:text-sky-700 font-semibold"
                    >
                      Click to upload
                    </label>
                    <span className="text-slate-600"> or drag and drop</span>
                  </div>
                  <p className="text-sm text-slate-500">Upload a new resume to replace your current one</p>
                  <p className="text-xs text-slate-400">PDF only (max 5MB)</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <svg className="h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-slate-800 font-medium">{resumeFile.name}</div>
                  <div className="text-sm text-slate-500">
                    {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                  <button
                    type="button"
                    onClick={() => setResumeFile(null)}
                    className="text-sky-600 hover:text-sky-700 text-sm font-medium"
                  >
                    Change file
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
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

export default function DashboardPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'matched-jobs' | 'profile'>('matched-jobs');
  const [userProfile, setUserProfile] = useState<{name: string; email: string; resumePath: string; userId: string} | null>(null);

  useEffect(() => {
    const checkAuthAndResume = async () => {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Check if user has uploaded a resume
      const { data: candidateData } = await supabase
        .from('u_candidates')
        .select('name, email, resume, user_id')
        .eq('user_id', user.id)
        .single();

      if (!candidateData?.resume) {
        // No resume uploaded, redirect to upload page
        router.push('/upload-resume');
        return;
      }

      // Store user profile data
      setUserProfile({
        name: candidateData.name,
        email: candidateData.email,
        resumePath: candidateData.resume,
        userId: candidateData.user_id
      });

      // User is authenticated and has resume, fetch jobs
      fetchJobs();
    };

    const fetchJobs = async () => {
      try {
        // Fetch matched jobs for the authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select(`
            job_id,
            jobs (
              job_id,
              job_name,
              company_name,
              city,
              state,
              hourly_wage_minimum,
              hourly_wage_maximum,
              job_description,
              job_requirements
            )
          `)
          .eq('user_id', user.id);

        if (matchesError) {
          console.error('Error fetching matches:', matchesError);
          return;
        }

        // Transform the data to match the Job interface
        const transformedJobs: Job[] = matchesData.map((match: any) => ({
          id: match.jobs.job_id,
          title: match.jobs.job_name,
          company: match.jobs.company_name,
          city: match.jobs.city,
          state: match.jobs.state,
          hourlyWageMin: parseFloat(match.jobs.hourly_wage_minimum),
          hourlyWageMax: parseFloat(match.jobs.hourly_wage_maximum),
          description: match.jobs.job_description,
          requirements: match.jobs.job_requirements
        }));

        setJobs(transformedJobs);
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndResume();
  }, [router]);

  const handleSignOut = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-teal-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-slate-200 z-50">
        <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-teal-500 shadow-md">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gradient">HealthCare Connect</h1>
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
                onClick={() => setActiveTab('matched-jobs')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
                  activeTab === 'matched-jobs'
                    ? 'bg-sky-50 text-sky-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Matched Jobs
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
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
          {activeTab === 'matched-jobs' ? (
            <>
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-slate-800 mb-2">Your Matched Jobs</h2>
                <p className="text-slate-600">We found {jobs.length} opportunities that match your profile</p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-slate-200 hover:border-sky-300 p-6 group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-slate-800 group-hover:text-sky-600 transition-colors mb-1">
                            {job.title}
                          </h3>
                          <p className="text-slate-600 font-medium">{job.company}</p>
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
                          ${job.hourlyWageMin}/hr - ${job.hourlyWageMax}/hr
                        </div>
                      </div>

                      <div className="flex items-center justify-end">
                        <span className="text-sky-600 font-medium text-sm group-hover:underline">
                          View Details →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <ProfileTab userProfile={userProfile} setUserProfile={setUserProfile} />
          )}
        </main>
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedJob(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-1">{selectedJob.title}</h2>
                <p className="text-lg text-slate-600">{selectedJob.company}</p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="h-6 w-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-slate-700">
                  <svg className="h-5 w-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {selectedJob.city}, {selectedJob.state}
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <svg className="h-5 w-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  ${selectedJob.hourlyWageMin}/hr - ${selectedJob.hourlyWageMax}/hr
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Job Description</h3>
                <p className="text-slate-600 leading-relaxed">{selectedJob.description}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Requirements</h3>
                <ul className="space-y-2">
                  {selectedJob.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-2 text-slate-600">
                      <svg className="h-5 w-5 text-sky-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-4 pt-4">
                <button className="flex-1 bg-gradient-to-r from-sky-500 to-teal-500 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  Apply Now
                </button>
                <button className="px-6 py-3 rounded-lg border-2 border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition">
                  Save Job
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
