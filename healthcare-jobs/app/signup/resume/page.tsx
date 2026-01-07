'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { uploadResume } from '@/lib/api';

export default function ResumeUploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

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
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    try {
      await uploadResume(file);
      sessionStorage.setItem('signupData', JSON.stringify({ email, name }));
      router.push('/signup/questionnaire');
    } catch (error) {
      console.error('Upload error:', error);
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
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Let&apos;s Get Started</h1>
          <p className="text-slate-600">Step 1 of 3: Upload your resume and basic info</p>

          <div className="flex justify-center gap-2 mt-4">
            <div className="h-2 w-16 rounded-full bg-sky-500"></div>
            <div className="h-2 w-16 rounded-full bg-slate-200"></div>
            <div className="h-2 w-16 rounded-full bg-slate-200"></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Resume / CV
              </label>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-sky-500 bg-sky-50'
                    : 'border-slate-300 hover:border-sky-400'
                }`}
              >
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!file ? (
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <div className="text-slate-600">
                        <span className="font-semibold text-sky-600">Click to upload</span> or drag and drop
                      </div>
                      <p className="text-sm text-slate-500">PDF, DOC, or DOCX (max. 10MB)</p>
                    </div>
                  </label>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <svg className="h-10 w-10 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="text-left">
                      <p className="font-medium text-slate-700">{file.name}</p>
                      <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="ml-4 text-red-500 hover:text-red-700"
                    >
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Link
                href="/"
                className="flex-1 px-6 py-3 rounded-lg border-2 border-slate-300 text-slate-700 font-semibold text-center hover:bg-slate-50 transition"
              >
                Back
              </Link>
              <button
                type="submit"
                disabled={loading || !file}
                className="flex-1 bg-gradient-to-r from-sky-500 to-teal-500 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? 'Uploading...' : 'Continue'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-600">
              Already have an account?{' '}
              <Link href="/login" className="text-sky-600 hover:text-sky-700 font-semibold">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
