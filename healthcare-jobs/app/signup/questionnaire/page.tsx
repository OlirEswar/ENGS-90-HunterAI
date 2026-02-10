'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Certification types
const CERTIFICATIONS = [
  { id: 'cna', label: 'Certified Nursing Assistant (CNA)' },
  { id: 'ma', label: 'Medical Assistant (MA)' },
  { id: 'phlebotomy', label: 'Phlebotomy' },
  { id: 'emt', label: 'EMT' },
  { id: 'lpn', label: 'LPN' },
  { id: 'rn', label: 'RN' },
  { id: 'home_health_aide', label: 'Home Health Aide' },
  { id: 'cpr_bls', label: 'CPR/BLS' },
  { id: 'other', label: 'Other' }
];

const WORK_SETTINGS = [
  { id: 'hospital', label: 'Hospital' },
  { id: 'clinic', label: 'Clinic' },
  { id: 'nursing_home', label: 'Nursing Home' },
  { id: 'home_care', label: 'Home Care' },
  { id: 'assisted_living', label: 'Assisted Living' },
  { id: 'other', label: 'Other' }
];

const SHIFTS = [
  { id: 'morning', label: 'Morning (6am-2pm)' },
  { id: 'day', label: 'Day (9am-5pm)' },
  { id: 'evening', label: 'Evening (2pm-10pm)' },
  { id: 'night', label: 'Night (10pm-6am)' },
  { id: 'overnight', label: 'Overnight' },
  { id: 'weekends', label: 'Weekends' }
];

const SCHEDULE_TYPES = [
  { id: 'full-time', label: 'Full-time' },
  { id: 'part-time', label: 'Part-time' },
  { id: 'per-diem', label: 'Per Diem' },
  { id: 'temporary', label: 'Temporary' }
];

const JOB_PRIORITIES = [
  { id: 'stable_hours', label: 'Stable Hours' },
  { id: 'higher_pay', label: 'Higher Pay' },
  { id: 'helping_people', label: 'Helping People' },
  { id: 'career_growth', label: 'Career Growth' },
  { id: 'low_stress', label: 'Low Stress' },
  { id: 'flexible_schedule', label: 'Flexible Schedule' },
  { id: 'supportive_coworkers', label: 'Supportive Coworkers' }
];

const PATIENT_ASSISTANCE = [
  { id: 'bathing', label: 'Bathing' },
  { id: 'toileting', label: 'Toileting' },
  { id: 'mobility', label: 'Mobility' },
  { id: 'feeding', label: 'Feeding' }
];

interface Certification {
  type: string;
  is_active: boolean;
  expiration_date: string;
  does_not_expire: boolean;
  other_name?: string;
}

interface FormData {
  // Identity & Work Authorization
  location: string;
  work_authorized: boolean | null;
  requires_sponsorship: boolean | null;

  // Certifications
  certifications: Certification[];

  // Experience
  years_experience: string;
  work_settings: string[];

  // Transportation & Location
  has_transportation: string;
  willing_to_travel: boolean | null;
  max_commute: string;

  // Shifts
  preferred_shifts: string[];
  willing_to_rotate: string;

  // Hours
  schedule_type: string[];
  hours_per_week: string;

  // Start Date
  start_availability: string;

  // Environment
  work_type_preference: string;
  environment_preferences: string[];
  location_preference: string;

  // Social & Interaction Style
  enjoys_patient_interaction: number;
  enjoys_teamwork: number;
  comfortable_with_families: number;
  handles_emotions: number;

  // Structure vs Autonomy
  prefers_routine: number;
  works_independently: number;
  likes_fast_paced: number;

  // Stress & Pressure
  stays_calm: number;
  handles_distress: number;

  // Motivation
  job_priorities: string[];

  // Physical Ability
  can_stand_long: string;
  can_lift_50: boolean | null;
  comfortable_assisting: string[];

  // Open Ended
  additional_info: string;
}

const SECTIONS = [
  { id: 'authorization', title: 'Work Authorization', icon: '1' },
  { id: 'certifications', title: 'Certifications', icon: '2' },
  { id: 'experience', title: 'Experience', icon: '3' },
  { id: 'transportation', title: 'Transportation', icon: '4' },
  { id: 'schedule', title: 'Schedule', icon: '5' },
  { id: 'environment', title: 'Environment', icon: '6' },
  { id: 'workstyle', title: 'Work Style', icon: '7' },
  { id: 'physical', title: 'Physical & Final', icon: '8' }
];

const STORAGE_KEY = 'healthcareHunterProfileData';

const defaultFormData: FormData = {
  location: '',
  work_authorized: null,
  requires_sponsorship: null,
  certifications: [],
  years_experience: '',
  work_settings: [],
  has_transportation: '',
  willing_to_travel: null,
  max_commute: '',
  preferred_shifts: [],
  willing_to_rotate: '',
  schedule_type: [],
  hours_per_week: '',
  start_availability: '',
  work_type_preference: '',
  environment_preferences: [],
  location_preference: '',
  enjoys_patient_interaction: 3,
  enjoys_teamwork: 3,
  comfortable_with_families: 3,
  handles_emotions: 3,
  prefers_routine: 3,
  works_independently: 3,
  likes_fast_paced: 3,
  stays_calm: 3,
  handles_distress: 3,
  job_priorities: [],
  can_stand_long: '',
  can_lift_50: null,
  comfortable_assisting: [],
  additional_info: ''
};

export default function QuestionnairePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  const progress = ((currentSection + 1) / SECTIONS.length) * 100;

  // Load saved progress on mount
  useEffect(() => {
    const loadSavedProgress = async () => {
      try {
        // First check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // Try to load from localStorage first (for unsaved changes)
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          setFormData(parsed.formData || defaultFormData);
          setCurrentSection(parsed.currentSection || 0);
        }
      } catch (error) {
        console.error('Error loading saved progress:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadSavedProgress();
  }, [router]);

  // Auto-save to localStorage whenever form data changes
  const saveProgress = useCallback(() => {
    setSaveStatus('saving');
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        formData,
        currentSection,
        savedAt: new Date().toISOString()
      }));
      setSaveStatus('saved');
    } catch (error) {
      console.error('Error saving progress:', error);
      setSaveStatus('unsaved');
    }
  }, [formData, currentSection]);

  // Debounced auto-save
  useEffect(() => {
    if (initialLoading) return;

    setSaveStatus('unsaved');
    const timeoutId = setTimeout(saveProgress, 500);
    return () => clearTimeout(timeoutId);
  }, [formData, currentSection, saveProgress, initialLoading]);

  const handleNext = () => {
    if (currentSection < SECTIONS.length - 1) {
      setSlideDirection('left');
      setCurrentSection(currentSection + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentSection > 0) {
      setSlideDirection('right');
      setCurrentSection(currentSection - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const toggleArrayValue = (array: string[], value: string): string[] => {
    if (array.includes(value)) {
      return array.filter(v => v !== value);
    }
    return [...array, value];
  };

  const toggleCertification = (certId: string) => {
    const existing = formData.certifications.find(c => c.type === certId);
    if (existing) {
      setFormData({
        ...formData,
        certifications: formData.certifications.filter(c => c.type !== certId)
      });
    } else {
      setFormData({
        ...formData,
        certifications: [...formData.certifications, {
          type: certId,
          is_active: true,
          expiration_date: '',
          does_not_expire: false
        }]
      });
    }
  };

  const updateCertification = (certId: string, field: keyof Certification, value: boolean | string) => {
    setFormData({
      ...formData,
      certifications: formData.certifications.map(c => {
        if (c.type === certId) {
          const updated = { ...c, [field]: value };
          // If "does not expire" is checked, clear the expiration date
          if (field === 'does_not_expire' && value === true) {
            updated.expiration_date = '';
          }
          return updated;
        }
        return c;
      })
    });
  };

  const toggleJobPriority = (priority: string) => {
    if (formData.job_priorities.includes(priority)) {
      setFormData({
        ...formData,
        job_priorities: formData.job_priorities.filter(p => p !== priority)
      });
    } else if (formData.job_priorities.length < 3) {
      setFormData({
        ...formData,
        job_priorities: [...formData.job_priorities, priority]
      });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Store in sessionStorage for the chat/preferences page to pick up
      sessionStorage.setItem('signupData', JSON.stringify({ profile: formData }));
      // Clear the localStorage progress since we're moving forward
      localStorage.removeItem(STORAGE_KEY);
      router.push('/signup/chat');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateCurrentSection = (): boolean => {
    switch (SECTIONS[currentSection].id) {
      case 'authorization':
        return formData.location.trim() !== '' && formData.work_authorized !== null && formData.requires_sponsorship !== null;
      case 'certifications':
        // Check that all selected certifications have either an expiration date or "does not expire" checked
        const allCertsValid = formData.certifications.every(cert =>
          cert.does_not_expire || cert.expiration_date !== ''
        );
        // Also check that "other" certifications have a name specified
        const otherCertsValid = formData.certifications
          .filter(c => c.type === 'other')
          .every(c => c.other_name && c.other_name.trim() !== '');
        return allCertsValid && otherCertsValid;
      case 'experience':
        return formData.years_experience !== '';
      case 'transportation':
        return formData.has_transportation !== '' && formData.willing_to_travel !== null && formData.max_commute !== '';
      case 'schedule':
        return formData.preferred_shifts.length > 0 && formData.willing_to_rotate !== '' &&
               formData.schedule_type.length > 0 && formData.hours_per_week !== '' && formData.start_availability !== '';
      case 'environment':
        return formData.work_type_preference !== '' && formData.environment_preferences.length > 0 && formData.location_preference !== '';
      case 'workstyle':
        return true; // Sliders have default values
      case 'physical':
        return formData.can_stand_long !== '' && formData.can_lift_50 !== null;
      default:
        return true;
    }
  };

  const RadioOption = ({ selected, onClick, label }: { selected: boolean; onClick: () => void; label: string }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
        selected
          ? 'border-sky-500 bg-sky-50 text-sky-700 font-medium'
          : 'border-slate-200 hover:border-slate-300 text-slate-600'
      }`}
    >
      {label}
    </button>
  );

  const CheckboxOption = ({ selected, onClick, label }: { selected: boolean; onClick: () => void; label: string }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-3 rounded-lg border-2 transition-all duration-200 flex items-center gap-2 ${
        selected
          ? 'border-sky-500 bg-sky-50 text-sky-700 font-medium'
          : 'border-slate-200 hover:border-slate-300 text-slate-600'
      }`}
    >
      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
        selected ? 'border-sky-500 bg-sky-500' : 'border-slate-300'
      }`}>
        {selected && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      {label}
    </button>
  );

  const SliderQuestion = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div className="space-y-3">
      <p className="text-slate-700 font-medium">{label}</p>
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-500 w-20">Disagree</span>
        <div className="flex-1 flex gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`flex-1 py-3 rounded-lg border-2 font-medium transition-all duration-200 ${
                value === n
                  ? 'border-sky-500 bg-sky-500 text-white'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <span className="text-sm text-slate-500 w-20 text-right">Agree</span>
      </div>
    </div>
  );

  const renderSection = () => {
    const sectionId = SECTIONS[currentSection].id;

    switch (sectionId) {
      case 'authorization':
        return (
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="block text-lg font-medium text-slate-800">
                Where are you located?
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
                placeholder="e.g., New York, NY"
              />
            </div>

            <div className="space-y-4">
              <label className="block text-lg font-medium text-slate-800">
                Are you legally authorized to work in the United States?
              </label>
              <div className="flex gap-4">
                <RadioOption
                  selected={formData.work_authorized === true}
                  onClick={() => setFormData({ ...formData, work_authorized: true })}
                  label="Yes"
                />
                <RadioOption
                  selected={formData.work_authorized === false}
                  onClick={() => setFormData({ ...formData, work_authorized: false })}
                  label="No"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-lg font-medium text-slate-800">
                Do you require employer sponsorship now or in the future?
              </label>
              <div className="flex gap-4">
                <RadioOption
                  selected={formData.requires_sponsorship === true}
                  onClick={() => setFormData({ ...formData, requires_sponsorship: true })}
                  label="Yes"
                />
                <RadioOption
                  selected={formData.requires_sponsorship === false}
                  onClick={() => setFormData({ ...formData, requires_sponsorship: false })}
                  label="No"
                />
              </div>
            </div>
          </div>
        );

      case 'certifications':
        return (
          <div className="space-y-6">
            <p className="text-slate-600">Select all certifications you hold. For each certification, please provide the expiration date or indicate if it does not expire.</p>

            <div className="space-y-4">
              {CERTIFICATIONS.map(cert => {
                const selectedCert = formData.certifications.find(c => c.type === cert.id);
                const isSelected = !!selectedCert;

                return (
                  <div key={cert.id} className={`rounded-lg border-2 transition-all duration-200 ${
                    isSelected ? 'border-sky-500 bg-sky-50' : 'border-slate-200'
                  }`}>
                    <button
                      type="button"
                      onClick={() => toggleCertification(cert.id)}
                      className="w-full px-4 py-4 flex items-center gap-3 text-left"
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'border-sky-500 bg-sky-500' : 'border-slate-300'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={`font-medium ${isSelected ? 'text-sky-700' : 'text-slate-600'}`}>
                        {cert.label}
                      </span>
                    </button>

                    {isSelected && selectedCert && (
                      <div className="px-4 pb-4 pt-2 border-t border-sky-200 space-y-3">
                        {cert.id === 'other' && (
                          <div>
                            <label className="block text-sm text-slate-600 mb-1">Certification name *</label>
                            <input
                              type="text"
                              placeholder="Enter certification name"
                              value={selectedCert.other_name || ''}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => updateCertification(cert.id, 'other_name', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none text-sm"
                            />
                          </div>
                        )}

                        <div className="flex items-center gap-3">
                          <label className="text-sm text-slate-600">Status:</label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); updateCertification(cert.id, 'is_active', true); }}
                              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                                selectedCert.is_active
                                  ? 'bg-green-500 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Active
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); updateCertification(cert.id, 'is_active', false); }}
                              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                                !selectedCert.is_active
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Inactive
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <label className="text-sm text-slate-600">Expiration:</label>
                          {!selectedCert.does_not_expire ? (
                            <input
                              type="date"
                              value={selectedCert.expiration_date}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => updateCertification(cert.id, 'expiration_date', e.target.value)}
                              className="px-3 py-1.5 rounded border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                            />
                          ) : (
                            <span className="text-sm text-slate-500 italic">No expiration</span>
                          )}
                          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedCert.does_not_expire}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => updateCertification(cert.id, 'does_not_expire', e.target.checked)}
                              className="w-4 h-4 rounded border-slate-300 text-sky-500 focus:ring-sky-500"
                            />
                            Does not expire
                          </label>
                        </div>

                        {!selectedCert.does_not_expire && !selectedCert.expiration_date && (
                          <p className="text-sm text-amber-600">Please enter an expiration date or check "Does not expire"</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {formData.certifications.length === 0 && (
              <p className="text-sm text-slate-500 italic">No certifications selected. You can skip this section if you don't have any certifications.</p>
            )}
          </div>
        );

      case 'experience':
        return (
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="block text-lg font-medium text-slate-800">
                How many years of experience do you have in healthcare?
              </label>
              <div className="flex flex-wrap gap-3">
                {[
                  { value: 'none', label: 'None' },
                  { value: '<1', label: 'Less than 1' },
                  { value: '1-3', label: '1-3 years' },
                  { value: '3-5', label: '3-5 years' },
                  { value: '5+', label: '5+ years' }
                ].map(opt => (
                  <RadioOption
                    key={opt.value}
                    selected={formData.years_experience === opt.value}
                    onClick={() => setFormData({ ...formData, years_experience: opt.value })}
                    label={opt.label}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-lg font-medium text-slate-800">
                What types of settings have you worked in?
              </label>
              <p className="text-slate-600 text-sm">Select all that apply (optional)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {WORK_SETTINGS.map(setting => (
                  <CheckboxOption
                    key={setting.id}
                    selected={formData.work_settings.includes(setting.id)}
                    onClick={() => setFormData({
                      ...formData,
                      work_settings: toggleArrayValue(formData.work_settings, setting.id)
                    })}
                    label={setting.label}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case 'transportation':
        return (
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="block text-lg font-medium text-slate-800">
                Do you have reliable transportation?
              </label>
              <div className="flex flex-wrap gap-3">
                {[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                  { value: 'sometimes', label: 'Sometimes' }
                ].map(opt => (
                  <RadioOption
                    key={opt.value}
                    selected={formData.has_transportation === opt.value}
                    onClick={() => setFormData({ ...formData, has_transportation: opt.value })}
                    label={opt.label}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-lg font-medium text-slate-800">
                Are you willing to travel between multiple patient sites in a day?
              </label>
              <div className="flex gap-4">
                <RadioOption
                  selected={formData.willing_to_travel === true}
                  onClick={() => setFormData({ ...formData, willing_to_travel: true })}
                  label="Yes"
                />
                <RadioOption
                  selected={formData.willing_to_travel === false}
                  onClick={() => setFormData({ ...formData, willing_to_travel: false })}
                  label="No"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-lg font-medium text-slate-800">
                How far are you willing to commute?
              </label>
              <div className="flex flex-wrap gap-3">
                {[
                  { value: '<5', label: 'Less than 5 miles' },
                  { value: '5-10', label: '5-10 miles' },
                  { value: '10-20', label: '10-20 miles' },
                  { value: '20+', label: '20+ miles' }
                ].map(opt => (
                  <RadioOption
                    key={opt.value}
                    selected={formData.max_commute === opt.value}
                    onClick={() => setFormData({ ...formData, max_commute: opt.value })}
                    label={opt.label}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case 'schedule':
        return (
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="block text-lg font-medium text-slate-800">
                Which shifts are you willing to work?
              </label>
              <p className="text-slate-600 text-sm">Select all that apply</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SHIFTS.map(shift => (
                  <CheckboxOption
                    key={shift.id}
                    selected={formData.preferred_shifts.includes(shift.id)}
                    onClick={() => setFormData({
                      ...formData,
                      preferred_shifts: toggleArrayValue(formData.preferred_shifts, shift.id)
                    })}
                    label={shift.label}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-lg font-medium text-slate-800">
                Are you willing to rotate shifts?
              </label>
              <div className="flex flex-wrap gap-3">
                {[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                  { value: 'prefer_not', label: 'Prefer not to' }
                ].map(opt => (
                  <RadioOption
                    key={opt.value}
                    selected={formData.willing_to_rotate === opt.value}
                    onClick={() => setFormData({ ...formData, willing_to_rotate: opt.value })}
                    label={opt.label}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-lg font-medium text-slate-800">
                What type of schedule do you want?
              </label>
              <p className="text-slate-600 text-sm">Select all that apply</p>
              <div className="flex flex-wrap gap-3">
                {SCHEDULE_TYPES.map(type => (
                  <CheckboxOption
                    key={type.id}
                    selected={formData.schedule_type.includes(type.id)}
                    onClick={() => setFormData({
                      ...formData,
                      schedule_type: toggleArrayValue(formData.schedule_type, type.id)
                    })}
                    label={type.label}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-lg font-medium text-slate-800">
                How many hours per week are you looking for?
              </label>
              <div className="flex flex-wrap gap-3">
                {[
                  { value: '<20', label: 'Less than 20' },
                  { value: '20-30', label: '20-30' },
                  { value: '30-40', label: '30-40' },
                  { value: '40+', label: '40+' }
                ].map(opt => (
                  <RadioOption
                    key={opt.value}
                    selected={formData.hours_per_week === opt.value}
                    onClick={() => setFormData({ ...formData, hours_per_week: opt.value })}
                    label={opt.label}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-lg font-medium text-slate-800">
                When could you start a new job?
              </label>
              <div className="flex flex-wrap gap-3">
                {[
                  { value: 'immediately', label: 'Immediately' },
                  { value: '2_weeks', label: 'Within 2 weeks' },
                  { value: '1_month', label: '1 month' },
                  { value: '2+_months', label: '2+ months' }
                ].map(opt => (
                  <RadioOption
                    key={opt.value}
                    selected={formData.start_availability === opt.value}
                    onClick={() => setFormData({ ...formData, start_availability: opt.value })}
                    label={opt.label}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case 'environment':
        return (
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="block text-lg font-medium text-slate-800">
                What type of work do you prefer most?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { value: 'direct_patient_care', label: 'Direct Patient Care' },
                  { value: 'administrative', label: 'Administrative / Front Desk' },
                  { value: 'lab_technical', label: 'Lab / Technical' },
                  { value: 'mix', label: 'Mix of Both' }
                ].map(opt => (
                  <RadioOption
                    key={opt.value}
                    selected={formData.work_type_preference === opt.value}
                    onClick={() => setFormData({ ...formData, work_type_preference: opt.value })}
                    label={opt.label}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-lg font-medium text-slate-800">
                Which environments do you prefer?
              </label>
              <p className="text-slate-600 text-sm">Select all that apply</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {WORK_SETTINGS.filter(s => s.id !== 'other').map(setting => (
                  <CheckboxOption
                    key={setting.id}
                    selected={formData.environment_preferences.includes(setting.id)}
                    onClick={() => setFormData({
                      ...formData,
                      environment_preferences: toggleArrayValue(formData.environment_preferences, setting.id)
                    })}
                    label={setting.label}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-lg font-medium text-slate-800">
                Do you prefer:
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <RadioOption
                  selected={formData.location_preference === 'consistent'}
                  onClick={() => setFormData({ ...formData, location_preference: 'consistent' })}
                  label="One consistent location"
                />
                <RadioOption
                  selected={formData.location_preference === 'multiple'}
                  onClick={() => setFormData({ ...formData, location_preference: 'multiple' })}
                  label="Multiple locations / Visiting patients"
                />
              </div>
            </div>
          </div>
        );

      case 'workstyle':
        return (
          <div className="space-y-8">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-800">Social & Interaction Style</h3>
              <SliderQuestion
                label="I enjoy working closely with patients all day"
                value={formData.enjoys_patient_interaction}
                onChange={(v) => setFormData({ ...formData, enjoys_patient_interaction: v })}
              />
              <SliderQuestion
                label="I enjoy working as part of a team"
                value={formData.enjoys_teamwork}
                onChange={(v) => setFormData({ ...formData, enjoys_teamwork: v })}
              />
              <SliderQuestion
                label="I am comfortable speaking with families"
                value={formData.comfortable_with_families}
                onChange={(v) => setFormData({ ...formData, comfortable_with_families: v })}
              />
              <SliderQuestion
                label="I am comfortable handling emotional situations"
                value={formData.handles_emotions}
                onChange={(v) => setFormData({ ...formData, handles_emotions: v })}
              />
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-800">Structure vs Autonomy</h3>
              <SliderQuestion
                label="I prefer clear instructions and routines"
                value={formData.prefers_routine}
                onChange={(v) => setFormData({ ...formData, prefers_routine: v })}
              />
              <SliderQuestion
                label="I am comfortable working independently"
                value={formData.works_independently}
                onChange={(v) => setFormData({ ...formData, works_independently: v })}
              />
              <SliderQuestion
                label="I like fast-paced environments"
                value={formData.likes_fast_paced}
                onChange={(v) => setFormData({ ...formData, likes_fast_paced: v })}
              />
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-800">Stress & Pressure</h3>
              <SliderQuestion
                label="I stay calm when things get hectic"
                value={formData.stays_calm}
                onChange={(v) => setFormData({ ...formData, stays_calm: v })}
              />
              <SliderQuestion
                label="I can handle seeing people in distress"
                value={formData.handles_distress}
                onChange={(v) => setFormData({ ...formData, handles_distress: v })}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800">What is most important to you in a job?</h3>
              <p className="text-slate-600 text-sm">Pick up to 3</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {JOB_PRIORITIES.map(priority => (
                  <CheckboxOption
                    key={priority.id}
                    selected={formData.job_priorities.includes(priority.id)}
                    onClick={() => toggleJobPriority(priority.id)}
                    label={priority.label}
                  />
                ))}
              </div>
              {formData.job_priorities.length === 3 && (
                <p className="text-sm text-sky-600">Maximum of 3 selected</p>
              )}
            </div>
          </div>
        );

      case 'physical':
        return (
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="block text-lg font-medium text-slate-800">
                Are you able to stand for long periods?
              </label>
              <div className="flex flex-wrap gap-3">
                {[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                  { value: 'sometimes', label: 'Sometimes' }
                ].map(opt => (
                  <RadioOption
                    key={opt.value}
                    selected={formData.can_stand_long === opt.value}
                    onClick={() => setFormData({ ...formData, can_stand_long: opt.value })}
                    label={opt.label}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-lg font-medium text-slate-800">
                Are you able to lift 25-50 lbs?
              </label>
              <div className="flex gap-4">
                <RadioOption
                  selected={formData.can_lift_50 === true}
                  onClick={() => setFormData({ ...formData, can_lift_50: true })}
                  label="Yes"
                />
                <RadioOption
                  selected={formData.can_lift_50 === false}
                  onClick={() => setFormData({ ...formData, can_lift_50: false })}
                  label="No"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-lg font-medium text-slate-800">
                Are you comfortable assisting patients with:
              </label>
              <p className="text-slate-600 text-sm">Select all that apply (optional)</p>
              <div className="grid grid-cols-2 gap-3">
                {PATIENT_ASSISTANCE.map(item => (
                  <CheckboxOption
                    key={item.id}
                    selected={formData.comfortable_assisting.includes(item.id)}
                    onClick={() => setFormData({
                      ...formData,
                      comfortable_assisting: toggleArrayValue(formData.comfortable_assisting, item.id)
                    })}
                    label={item.label}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-lg font-medium text-slate-800">
                Is there anything else you'd like to tell us?
              </label>
              <p className="text-slate-600 text-sm">Optional - help us find the best fit for you</p>
              <textarea
                value={formData.additional_info}
                onChange={(e) => setFormData({ ...formData, additional_info: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition resize-none"
                placeholder="Any additional information that might help us match you with the right opportunity..."
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-teal-50 px-4 py-12">
      <div className="w-full max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 shadow-lg">
              <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Build Your Profile</h1>
          <p className="text-slate-600">{SECTIONS[currentSection].title}</p>

          {/* Progress bar */}
          <div className="mt-6 w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-teal-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm text-slate-500">{currentSection + 1} of {SECTIONS.length}</p>
            <p className={`text-xs ${
              saveStatus === 'saved' ? 'text-green-600' :
              saveStatus === 'saving' ? 'text-slate-500' :
              'text-amber-600'
            }`}>
              {saveStatus === 'saved' ? 'Progress saved' :
               saveStatus === 'saving' ? 'Saving...' :
               'Unsaved changes'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Section navigation dots */}
          <div className="px-8 pt-6 flex justify-center gap-2">
            {SECTIONS.map((section, index) => (
              <button
                key={section.id}
                onClick={() => {
                  if (index < currentSection) {
                    setSlideDirection('right');
                    setCurrentSection(index);
                  }
                }}
                disabled={index > currentSection}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSection
                    ? 'bg-sky-500 w-8'
                    : index < currentSection
                    ? 'bg-sky-300 hover:bg-sky-400 cursor-pointer'
                    : 'bg-slate-200'
                }`}
                title={section.title}
              />
            ))}
          </div>

          {/* Form content with slide animation */}
          <div className="relative overflow-hidden">
            <div
              key={currentSection}
              className={`p-8 transition-all duration-300 ease-out ${
                slideDirection === 'left' ? 'animate-slide-in-left' : 'animate-slide-in-right'
              }`}
            >
              <h2 className="text-xl font-semibold text-slate-800 mb-6">{SECTIONS[currentSection].title}</h2>
              {renderSection()}
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="px-8 pb-8 flex gap-4">
            {currentSection === 0 ? (
              <Link
                href="/upload-resume"
                className="flex-1 px-6 py-3 rounded-lg border-2 border-slate-300 text-slate-700 font-semibold text-center hover:bg-slate-50 transition"
              >
                Back
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 px-6 py-3 rounded-lg border-2 border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition"
              >
                Back
              </button>
            )}

            {currentSection === SECTIONS.length - 1 ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !validateCurrentSection()}
                className="flex-1 bg-gradient-to-r from-sky-500 to-teal-500 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? 'Saving...' : 'Continue'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                disabled={!validateCurrentSection()}
                className="flex-1 bg-gradient-to-r from-sky-500 to-teal-500 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.3s ease-out;
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
