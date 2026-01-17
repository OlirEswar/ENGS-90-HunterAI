'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error('Password reset error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-teal-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 shadow-lg">
              <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Reset Password</h1>
          <p className="text-slate-600">Enter your email to receive a password reset link</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {success ? (
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">Check Your Email</h2>
              <p className="text-slate-600 mb-6">
                We&apos;ve sent a password reset link to <strong>{email}</strong>.
                Please check your inbox and click the link to reset your password.
              </p>
              <p className="text-sm text-slate-500 mb-6">
                Didn&apos;t receive the email? Check your spam folder or try again.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="text-sky-600 hover:text-sky-700 font-medium"
              >
                Try a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-sky-500 to-teal-500 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-slate-600">
              Remember your password?{' '}
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
