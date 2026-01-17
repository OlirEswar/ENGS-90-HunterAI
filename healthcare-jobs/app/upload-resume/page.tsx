'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function UploadResumePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUserId(user.id);

      // Check if user already has a resume uploaded
      const { data: candidateData } = await supabase
        .from('u_candidates')
        .select('resume')
        .eq('user_id', user.id)
        .single();

      if (candidateData?.resume) {
        // User already has a resume, redirect to dashboard
        router.push('/dashboard');
      }
    };

    checkAuth();
  }, [router]);

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
    setError('');

    // Validate file type
    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file only');
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a PDF file to upload');
      return;
    }

    if (!userId) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Upload file to Supabase Storage with organized path: userId/resume.pdf
      const fileName = `${userId}/resume.pdf`;

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file, {
          upsert: true,
          contentType: 'application/pdf'
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setError('Failed to upload resume. Please try again.');
        return;
      }

      // Get public URL (note: bucket is private, so we'll store the path)
      const resumePath = fileName;

      // Update candidate record with resume path
      const { data: updateData, error: updateError } = await supabase
        .from('u_candidates')
        .update({ resume: resumePath })
        .eq('user_id', userId)
        .select();

      if (updateError) {
        console.error('Error updating candidate data:', updateError);
        setError(`Resume uploaded but failed to update profile: ${updateError.message}`);
        return;
      }

      if (!updateData || updateData.length === 0) {
        console.error('No rows updated');
        setError('Resume uploaded but no candidate record was updated. Please contact support.');
        return;
      }

      console.log('Successfully updated candidate record:', updateData);

      // Success! Redirect to questionnaire page
      router.push('/signup/questionnaire');
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-teal-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 shadow-lg">
              <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Upload Your Resume</h1>
          <p className="text-slate-600">Required: Upload your resume to continue</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

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

              {!file ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <svg className="h-16 w-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <p className="text-sm text-slate-500">PDF only (max 5MB)</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <svg className="h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-slate-800 font-medium">{file.name}</div>
                  <div className="text-sm text-slate-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-sky-600 hover:text-sky-700 text-sm font-medium"
                  >
                    Change file
                  </button>
                </div>
              )}
            </div>

            <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
              <div className="flex gap-3">
                <svg className="h-5 w-5 text-sky-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-slate-700">
                  <p className="font-semibold mb-1">Tips for your resume:</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    <li>Ensure your resume is up-to-date</li>
                    <li>Include relevant healthcare experience</li>
                    <li>List certifications and licenses</li>
                    <li>Keep it professional and concise</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!file || loading}
              className="w-full bg-gradient-to-r from-sky-500 to-teal-500 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? 'Uploading...' : 'Continue'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center text-sm text-slate-600">
          <p>You can update your resume later from your profile settings</p>
        </div>
      </div>
    </div>
  );
}
