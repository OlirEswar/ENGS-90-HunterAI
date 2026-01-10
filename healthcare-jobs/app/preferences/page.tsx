'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function PreferencesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    preferredLocation: '',
    maxCommuteDistance: '',
    minHourlyWage: '',
    maxHourlyWage: '',
    willingToRelocate: false,
    employmentType: [] as string[],
    shiftPreference: [] as string[],
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCheckboxGroup = (name: string, value: string) => {
    setFormData(prev => {
      const currentArray = prev[name as keyof typeof formData] as string[];
      const isChecked = currentArray.includes(value);

      return {
        ...prev,
        [name]: isChecked
          ? currentArray.filter(item => item !== value)
          : [...currentArray, value]
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // For now, just log the data and redirect to dashboard
      // You can implement database saving later
      console.log('Preferences submitted:', formData);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Set Your Preferences</h1>
          <p className="text-slate-600">Help us find the perfect job matches for you by telling us what you're looking for.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Preferred Location (City, State)
            </label>
            <input
              type="text"
              name="preferredLocation"
              value={formData.preferredLocation}
              onChange={handleInputChange}
              placeholder="e.g., Boston, MA"
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>

          {/* Commute Distance */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Maximum Commute Distance (miles)
            </label>
            <select
              name="maxCommuteDistance"
              value={formData.maxCommuteDistance}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            >
              <option value="">Select distance</option>
              <option value="5">Up to 5 miles</option>
              <option value="10">Up to 10 miles</option>
              <option value="15">Up to 15 miles</option>
              <option value="25">Up to 25 miles</option>
              <option value="50">Up to 50 miles</option>
              <option value="100">Up to 100 miles</option>
              <option value="unlimited">Any distance</option>
            </select>
          </div>

          {/* Hourly Wage Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Minimum Hourly Wage ($)
              </label>
              <input
                type="number"
                name="minHourlyWage"
                value={formData.minHourlyWage}
                onChange={handleInputChange}
                placeholder="e.g., 20"
                min="0"
                step="0.50"
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Maximum Hourly Wage ($)
              </label>
              <input
                type="number"
                name="maxHourlyWage"
                value={formData.maxHourlyWage}
                onChange={handleInputChange}
                placeholder="e.g., 40"
                min="0"
                step="0.50"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Employment Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Employment Type (Select all that apply)
            </label>
            <div className="space-y-2">
              {['Full-time', 'Part-time', 'Contract', 'Per Diem', 'Travel'].map((type) => (
                <label key={type} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.employmentType.includes(type)}
                    onChange={() => handleCheckboxGroup('employmentType', type)}
                    className="w-4 h-4 text-sky-500 border-slate-300 rounded focus:ring-sky-500"
                  />
                  <span className="ml-2 text-slate-700">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Shift Preference */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Shift Preference (Select all that apply)
            </label>
            <div className="space-y-2">
              {['Day Shift', 'Night Shift', 'Evening Shift', 'Rotating', 'Weekend Only'].map((shift) => (
                <label key={shift} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.shiftPreference.includes(shift)}
                    onChange={() => handleCheckboxGroup('shiftPreference', shift)}
                    className="w-4 h-4 text-sky-500 border-slate-300 rounded focus:ring-sky-500"
                  />
                  <span className="ml-2 text-slate-700">{shift}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Willing to Relocate */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="willingToRelocate"
              checked={formData.willingToRelocate}
              onChange={handleInputChange}
              className="w-4 h-4 text-sky-500 border-slate-300 rounded focus:ring-sky-500"
            />
            <label className="ml-2 text-sm font-medium text-slate-700">
              I am willing to relocate for the right opportunity
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-sky-500 to-teal-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? 'Saving...' : 'Continue to Dashboard'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
