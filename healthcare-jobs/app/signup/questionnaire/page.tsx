'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function QuestionnairePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState({
    motivation: '',
    experience: '',
    workStyle: '',
    careerGoals: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const existingData = sessionStorage.getItem('signupData');
      const signupData = existingData ? JSON.parse(existingData) : {};
      sessionStorage.setItem('signupData', JSON.stringify({ ...signupData, questionnaire: answers }));
      router.push('/signup/preferences');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-teal-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 shadow-lg">
              <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Tell Us About Yourself</h1>
          <p className="text-slate-600">Step 2 of 3: Help us understand what makes you unique</p>

          <div className="flex justify-center gap-2 mt-4">
            <div className="h-2 w-16 rounded-full bg-sky-500"></div>
            <div className="h-2 w-16 rounded-full bg-sky-500"></div>
            <div className="h-2 w-16 rounded-full bg-slate-200"></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="motivation" className="block text-sm font-medium text-slate-700 mb-2">
                What motivates you to work in healthcare?
              </label>
              <textarea
                id="motivation"
                required
                value={answers.motivation}
                onChange={(e) => setAnswers({ ...answers, motivation: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition resize-none"
                placeholder="Share what drives your passion for healthcare..."
              />
            </div>

            <div>
              <label htmlFor="experience" className="block text-sm font-medium text-slate-700 mb-2">
                Describe your most meaningful healthcare experience
              </label>
              <textarea
                id="experience"
                required
                value={answers.experience}
                onChange={(e) => setAnswers({ ...answers, experience: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition resize-none"
                placeholder="Tell us about a memorable moment in your career..."
              />
            </div>

            <div>
              <label htmlFor="workStyle" className="block text-sm font-medium text-slate-700 mb-2">
                How would you describe your work style?
              </label>
              <textarea
                id="workStyle"
                required
                value={answers.workStyle}
                onChange={(e) => setAnswers({ ...answers, workStyle: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition resize-none"
                placeholder="Are you collaborative, independent, detail-oriented...?"
              />
            </div>

            <div>
              <label htmlFor="careerGoals" className="block text-sm font-medium text-slate-700 mb-2">
                What are your career goals for the next 5 years?
              </label>
              <textarea
                id="careerGoals"
                required
                value={answers.careerGoals}
                onChange={(e) => setAnswers({ ...answers, careerGoals: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition resize-none"
                placeholder="Where do you see yourself in the future...?"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Link
                href="/signup/resume"
                className="flex-1 px-6 py-3 rounded-lg border-2 border-slate-300 text-slate-700 font-semibold text-center hover:bg-slate-50 transition"
              >
                Back
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-sky-500 to-teal-500 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? 'Saving...' : 'Continue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
