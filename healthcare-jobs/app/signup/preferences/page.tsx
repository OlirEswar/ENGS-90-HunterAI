'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

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
  const [error, setError] = useState('');
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
    setError('');

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Get profile data from session storage
      const existingData = sessionStorage.getItem('signupData');
      const signupData = existingData ? JSON.parse(existingData) : {};
      const profileData = signupData.profile || {};

      // Prepare the update object with all profile fields
      const updateData: Record<string, any> = {
        // Profile completion flag
        profile_completed: true,

        // Identity & Work Authorization
        work_authorized: profileData.work_authorized,
        requires_sponsorship: profileData.requires_sponsorship,

        // Certifications (JSONB)
        certifications: profileData.certifications || [],

        // Experience
        years_experience: profileData.years_experience,
        work_settings: profileData.work_settings || [],

        // Transportation & Location
        has_transportation: profileData.has_transportation,
        willing_to_travel: profileData.willing_to_travel,
        max_commute: profileData.max_commute,

        // Shifts
        preferred_shifts: profileData.preferred_shifts || [],
        willing_to_rotate: profileData.willing_to_rotate,

        // Hours
        schedule_type: profileData.schedule_type || [],
        hours_per_week: profileData.hours_per_week,

        // Start Date
        start_availability: profileData.start_availability,

        // Environment
        work_type_preference: profileData.work_type_preference,
        environment_preferences: profileData.environment_preferences || [],
        location_preference: profileData.location_preference,

        // Social & Interaction Style (1-5 scale)
        enjoys_patient_interaction: profileData.enjoys_patient_interaction,
        enjoys_teamwork: profileData.enjoys_teamwork,
        comfortable_with_families: profileData.comfortable_with_families,
        handles_emotions: profileData.handles_emotions,

        // Structure vs Autonomy (1-5 scale)
        prefers_routine: profileData.prefers_routine,
        works_independently: profileData.works_independently,
        likes_fast_paced: profileData.likes_fast_paced,

        // Stress & Pressure (1-5 scale)
        stays_calm: profileData.stays_calm,
        handles_distress: profileData.handles_distress,

        // Motivation
        job_priorities: profileData.job_priorities || [],

        // Physical Ability
        can_stand_long: profileData.can_stand_long,
        can_lift_50: profileData.can_lift_50,
        comfortable_assisting: profileData.comfortable_assisting || [],

        // Open Ended
        additional_info: profileData.additional_info || null,

        // Update timestamp
        updated_at: new Date().toISOString()
      };

      // Update the candidate profile in the database
      const { error: updateError } = await supabase
        .from('u_candidates')
        .update(updateData)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        setError('Failed to save profile. Please try again.');
        return;
      }

      // Clear session storage
      sessionStorage.removeItem('signupData');

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Error:', err);
      setError('An unexpected error occurred. Please try again.');
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
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Almost Done!</h1>
          <p className="text-slate-600">Step 3 of 3: Final preferences</p>

          <div className="flex justify-center gap-2 mt-4">
            <div className="h-2 w-16 rounded-full bg-sky-500"></div>
            <div className="h-2 w-16 rounded-full bg-sky-500"></div>
            <div className="h-2 w-16 rounded-full bg-sky-500"></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

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
                {loading ? 'Saving Profile...' : 'Complete Setup'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
