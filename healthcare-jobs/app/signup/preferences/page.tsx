'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/lib/api';

const departments = [
  'Nursing',
  'Emergency Medicine',
  'Surgery',
  'Radiology',
  'Laboratory',
  'Pharmacy',
  'Physical Therapy',
  'Occupational Therapy',
  'Respiratory Therapy',
  'Cardiology',
  'Pediatrics',
  'Mental Health'
];

export default function PreferencesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    location: '',
    desiredSalary: '',
    willingToRelocate: false,
    preferredDepartments: [] as string[]
  });

  const toggleDepartment = (dept: string) => {
    setPreferences(prev => ({
      ...prev,
      preferredDepartments: prev.preferredDepartments.includes(dept)
        ? prev.preferredDepartments.filter(d => d !== dept)
        : [...prev.preferredDepartments, dept]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const existingData = sessionStorage.getItem('signupData');
      const signupData = existingData ? JSON.parse(existingData) : {};
      const completeData = { ...signupData, ...preferences };

      await registerUser(completeData);
      sessionStorage.removeItem('signupData');
      router.push('/dashboard');
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
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Set Your Preferences</h1>
          <p className="text-slate-600">Step 3 of 3: Help us find your perfect match</p>

          <div className="flex justify-center gap-2 mt-4">
            <div className="h-2 w-16 rounded-full bg-sky-500"></div>
            <div className="h-2 w-16 rounded-full bg-sky-500"></div>
            <div className="h-2 w-16 rounded-full bg-sky-500"></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-2">
                Preferred Location
              </label>
              <input
                id="location"
                type="text"
                required
                value={preferences.location}
                onChange={(e) => setPreferences({ ...preferences, location: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
                placeholder="e.g., New York, NY or Remote"
              />
            </div>

            <div>
              <label htmlFor="salary" className="block text-sm font-medium text-slate-700 mb-2">
                Desired Salary Range
              </label>
              <select
                id="salary"
                required
                value={preferences.desiredSalary}
                onChange={(e) => setPreferences({ ...preferences, desiredSalary: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
              >
                <option value="">Select salary range</option>
                <option value="$40,000 - $60,000">$40,000 - $60,000</option>
                <option value="$60,000 - $80,000">$60,000 - $80,000</option>
                <option value="$80,000 - $100,000">$80,000 - $100,000</option>
                <option value="$100,000 - $120,000">$100,000 - $120,000</option>
                <option value="$120,000+">$120,000+</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="relocate"
                type="checkbox"
                checked={preferences.willingToRelocate}
                onChange={(e) => setPreferences({ ...preferences, willingToRelocate: e.target.checked })}
                className="h-5 w-5 rounded border-slate-300 text-sky-500 focus:ring-sky-500"
              />
              <label htmlFor="relocate" className="text-sm font-medium text-slate-700">
                I am willing to relocate for the right opportunity
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Preferred Departments (Select all that apply)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {departments.map((dept) => (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => toggleDepartment(dept)}
                    className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      preferences.preferredDepartments.includes(dept)
                        ? 'border-sky-500 bg-sky-50 text-sky-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-sky-300'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
              {preferences.preferredDepartments.length === 0 && (
                <p className="mt-2 text-sm text-slate-500">Please select at least one department</p>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Link
                href="/signup/questionnaire"
                className="flex-1 px-6 py-3 rounded-lg border-2 border-slate-300 text-slate-700 font-semibold text-center hover:bg-slate-50 transition"
              >
                Back
              </Link>
              <button
                type="submit"
                disabled={loading || preferences.preferredDepartments.length === 0}
                className="flex-1 bg-gradient-to-r from-sky-500 to-teal-500 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? 'Creating Profile...' : 'Complete Setup'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
