'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { uploadResume } from '@/lib/api';
import { Job, Question, CandidateAnswer } from '@/types';
import { supabase } from '@/lib/supabase';

// Label mappings for display
const CERTIFICATION_LABELS: {[key: string]: string} = {
  cna: 'Certified Nursing Assistant (CNA)',
  ma: 'Medical Assistant (MA)',
  phlebotomy: 'Phlebotomy',
  emt: 'EMT',
  lpn: 'LPN',
  rn: 'RN',
  home_health_aide: 'Home Health Aide',
  cpr_bls: 'CPR/BLS',
  other: 'Other'
};

const WORK_SETTING_LABELS: {[key: string]: string} = {
  hospital: 'Hospital',
  clinic: 'Clinic',
  nursing_home: 'Nursing Home',
  home_care: 'Home Care',
  assisted_living: 'Assisted Living',
  other: 'Other'
};

const SHIFT_LABELS: {[key: string]: string} = {
  morning: 'Morning (6am-2pm)',
  day: 'Day (9am-5pm)',
  evening: 'Evening (2pm-10pm)',
  night: 'Night (10pm-6am)',
  overnight: 'Overnight',
  weekends: 'Weekends'
};

const SCHEDULE_TYPE_LABELS: {[key: string]: string} = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  'per-diem': 'Per Diem',
  'temporary': 'Temporary'
};

const JOB_PRIORITY_LABELS: {[key: string]: string} = {
  stable_hours: 'Stable Hours',
  higher_pay: 'Higher Pay',
  helping_people: 'Helping People',
  career_growth: 'Career Growth',
  low_stress: 'Low Stress',
  flexible_schedule: 'Flexible Schedule',
  supportive_coworkers: 'Supportive Coworkers'
};

const PATIENT_ASSISTANCE_LABELS: {[key: string]: string} = {
  bathing: 'Bathing',
  toileting: 'Toileting',
  mobility: 'Mobility',
  feeding: 'Feeding'
};

interface QuestionnaireData {
  work_authorized: boolean | null;
  requires_sponsorship: boolean | null;
  certifications: Array<{
    type: string;
    is_active: boolean;
    expiration_date: string;
    does_not_expire: boolean;
    other_name?: string;
  }>;
  years_experience: string;
  work_settings: string[];
  has_transportation: string;
  willing_to_travel: boolean | null;
  max_commute: string;
  preferred_shifts: string[];
  willing_to_rotate: string;
  schedule_type: string[];
  hours_per_week: string;
  start_availability: string;
  work_type_preference: string;
  environment_preferences: string[];
  location_preference: string;
  enjoys_patient_interaction: number;
  enjoys_teamwork: number;
  comfortable_with_families: number;
  handles_emotions: number;
  prefers_routine: number;
  works_independently: number;
  likes_fast_paced: number;
  stays_calm: number;
  handles_distress: number;
  job_priorities: string[];
  can_stand_long: string;
  can_lift_50: boolean | null;
  comfortable_assisting: string[];
  additional_info: string;
}

const PROFILE_SECTIONS = [
  { id: 'basic', title: 'Basic Info', icon: 'user' },
  { id: 'authorization', title: 'Work Authorization', icon: 'shield' },
  { id: 'certifications', title: 'Certifications', icon: 'badge' },
  { id: 'experience', title: 'Experience', icon: 'briefcase' },
  { id: 'transportation', title: 'Transportation', icon: 'car' },
  { id: 'schedule', title: 'Schedule', icon: 'clock' },
  { id: 'environment', title: 'Environment', icon: 'building' },
  { id: 'workstyle', title: 'Work Style', icon: 'heart' },
  { id: 'physical', title: 'Physical & More', icon: 'activity' }
];

// Option arrays for editing
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
  const [questionnaireData, setQuestionnaireData] = useState<QuestionnaireData | null>(null);
  const [editData, setEditData] = useState<QuestionnaireData | null>(null);
  const [activeSection, setActiveSection] = useState('basic');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']));
  const [editingSections, setEditingSections] = useState<Set<string>>(new Set());
  const [loadingQuestionnaire, setLoadingQuestionnaire] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);

  // Fetch questionnaire data
  useEffect(() => {
    const fetchQuestionnaireData = async () => {
      if (!userProfile?.userId) return;

      try {
        const { data, error } = await supabase
          .from('u_candidates')
          .select(`
            work_authorized,
            requires_sponsorship,
            certifications,
            years_experience,
            work_settings,
            has_transportation,
            willing_to_travel,
            max_commute,
            preferred_shifts,
            willing_to_rotate,
            schedule_type,
            hours_per_week,
            start_availability,
            work_type_preference,
            environment_preferences,
            location_preference,
            enjoys_patient_interaction,
            enjoys_teamwork,
            comfortable_with_families,
            handles_emotions,
            prefers_routine,
            works_independently,
            likes_fast_paced,
            stays_calm,
            handles_distress,
            job_priorities,
            can_stand_long,
            can_lift_50,
            comfortable_assisting,
            additional_info
          `)
          .eq('user_id', userProfile.userId)
          .single();

        if (error) throw error;
        setQuestionnaireData(data);
        setEditData(data);
      } catch (error) {
        console.error('Error fetching questionnaire data:', error);
      } finally {
        setLoadingQuestionnaire(false);
      }
    };

    fetchQuestionnaireData();
  }, [userProfile?.userId]);

  useEffect(() => {
    if (userProfile) {
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

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    setExpandedSections(prev => new Set([...prev, sectionId]));
    const element = document.getElementById(`profile-section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const startEditing = (sectionId: string) => {
    setEditingSections(prev => new Set([...prev, sectionId]));
    setEditData(questionnaireData ? { ...questionnaireData } : null);
  };

  const cancelEditing = (sectionId: string) => {
    setEditingSections(prev => {
      const newSet = new Set(prev);
      newSet.delete(sectionId);
      return newSet;
    });
    setEditData(questionnaireData ? { ...questionnaireData } : null);
  };

  const saveSection = async (sectionId: string) => {
    if (!userProfile?.userId || !editData) return;

    setSavingSection(sectionId);
    setMessage(null);

    try {
      let updateData: Partial<QuestionnaireData> = {};

      switch (sectionId) {
        case 'authorization':
          updateData = {
            work_authorized: editData.work_authorized,
            requires_sponsorship: editData.requires_sponsorship
          };
          break;
        case 'certifications':
          updateData = { certifications: editData.certifications };
          break;
        case 'experience':
          updateData = {
            years_experience: editData.years_experience,
            work_settings: editData.work_settings
          };
          break;
        case 'transportation':
          updateData = {
            has_transportation: editData.has_transportation,
            willing_to_travel: editData.willing_to_travel,
            max_commute: editData.max_commute
          };
          break;
        case 'schedule':
          updateData = {
            preferred_shifts: editData.preferred_shifts,
            willing_to_rotate: editData.willing_to_rotate,
            schedule_type: editData.schedule_type,
            hours_per_week: editData.hours_per_week,
            start_availability: editData.start_availability
          };
          break;
        case 'environment':
          updateData = {
            work_type_preference: editData.work_type_preference,
            environment_preferences: editData.environment_preferences,
            location_preference: editData.location_preference
          };
          break;
        case 'workstyle':
          updateData = {
            enjoys_patient_interaction: editData.enjoys_patient_interaction,
            enjoys_teamwork: editData.enjoys_teamwork,
            comfortable_with_families: editData.comfortable_with_families,
            handles_emotions: editData.handles_emotions,
            prefers_routine: editData.prefers_routine,
            works_independently: editData.works_independently,
            likes_fast_paced: editData.likes_fast_paced,
            stays_calm: editData.stays_calm,
            handles_distress: editData.handles_distress,
            job_priorities: editData.job_priorities
          };
          break;
        case 'physical':
          updateData = {
            can_stand_long: editData.can_stand_long,
            can_lift_50: editData.can_lift_50,
            comfortable_assisting: editData.comfortable_assisting,
            additional_info: editData.additional_info
          };
          break;
      }

      const { error } = await supabase
        .from('u_candidates')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('user_id', userProfile.userId);

      if (error) throw error;

      setQuestionnaireData(editData);
      setEditingSections(prev => {
        const newSet = new Set(prev);
        newSet.delete(sectionId);
        return newSet;
      });
      setMessage({ type: 'success', text: 'Changes saved successfully!' });
    } catch (error) {
      console.error('Error saving section:', error);
      setMessage({ type: 'error', text: 'Failed to save changes. Please try again.' });
    } finally {
      setSavingSection(null);
    }
  };

  const formatYesNo = (value: boolean | null) => {
    if (value === null) return 'Not specified';
    return value ? 'Yes' : 'No';
  };

  const formatValue = (value: string | null | undefined) => {
    if (!value) return 'Not specified';
    return value.replace(/_/g, ' ').replace(/</g, 'Less than ').replace(/\+/g, '+');
  };

  const formatArrayLabels = (arr: string[] | null | undefined, labels: {[key: string]: string}) => {
    if (!arr || arr.length === 0) return 'None selected';
    return arr.map(item => labels[item] || item).join(', ');
  };

  const toggleArrayValue = (arr: string[], value: string): string[] => {
    if (arr.includes(value)) {
      return arr.filter(v => v !== value);
    }
    return [...arr, value];
  };

  // Reusable UI components
  const RadioOption = ({ selected, onClick, label }: { selected: boolean; onClick: () => void; label: string }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-lg border-2 transition-all duration-200 text-sm ${
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
      className={`px-3 py-2 rounded-lg border-2 transition-all duration-200 flex items-center gap-2 text-sm ${
        selected
          ? 'border-sky-500 bg-sky-50 text-sky-700 font-medium'
          : 'border-slate-200 hover:border-slate-300 text-slate-600'
      }`}
    >
      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
        selected ? 'border-sky-500 bg-sky-500' : 'border-slate-300'
      }`}>
        {selected && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      {label}
    </button>
  );

  const SliderEdit = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-slate-600 text-sm flex-1">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
              n === value
                ? 'bg-sky-500 text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );

  const SliderDisplay = ({ label, value }: { label: string; value: number }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-slate-600 text-sm">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <div
            key={n}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
              n === value
                ? 'bg-sky-500 text-white'
                : n < value
                ? 'bg-sky-100 text-sky-600'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            {n}
          </div>
        ))}
      </div>
    </div>
  );

  const SectionHeader = ({ id, title, isExpanded, isEditing, onEdit }: { id: string; title: string; isExpanded: boolean; isEditing?: boolean; onEdit?: () => void }) => (
    <div className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
      <button onClick={() => toggleSection(id)} className="flex-1 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      </button>
      <div className="flex items-center gap-2">
        {id !== 'basic' && isExpanded && !isEditing && onEdit && (
          <button
            onClick={onEdit}
            className="px-3 py-1 text-sm text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors font-medium"
          >
            Edit
          </button>
        )}
        <button onClick={() => toggleSection(id)}>
          <svg
            className={`w-5 h-5 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  );

  const EditActions = ({ sectionId, saving }: { sectionId: string; saving: boolean }) => (
    <div className="flex gap-3 mt-4 pt-4 border-t border-slate-200">
      <button
        onClick={() => cancelEditing(sectionId)}
        disabled={saving}
        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        onClick={() => saveSection(sectionId)}
        disabled={saving}
        className="flex-1 px-4 py-2 bg-gradient-to-r from-sky-500 to-teal-500 text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-slate-500 text-sm">{label}</span>
      <span className="text-slate-800 text-sm font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );

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

  if (loadingQuestionnaire) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Your Profile</h2>
        <p className="text-slate-600">View and manage your profile information</p>
      </div>

      {/* Quick Navigation Tabs - Wrapping */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {PROFILE_SECTIONS.map(section => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeSection === section.id
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {section.title}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        {/* Basic Info Section */}
        <div id="profile-section-basic" className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <SectionHeader id="basic" title="Basic Info & Resume" isExpanded={expandedSections.has('basic')} />
          {expandedSections.has('basic') && (
            <div className="p-6 border-t border-slate-100">
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                {/* Resume */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Resume</label>
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

                  <div
                    className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                      dragActive ? 'border-sky-500 bg-sky-50' : 'border-slate-300 hover:border-sky-400'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input type="file" id="resume" accept=".pdf" onChange={handleFileInput} className="hidden" />
                    {!resumeFile ? (
                      <div className="space-y-2">
                        <label htmlFor="resume" className="cursor-pointer text-sky-600 hover:text-sky-700 font-semibold">
                          Click to upload
                        </label>
                        <span className="text-slate-600"> or drag and drop</span>
                        <p className="text-xs text-slate-400">PDF only (max 5MB)</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-slate-800 font-medium">{resumeFile.name}</div>
                        <button type="button" onClick={() => setResumeFile(null)} className="text-sky-600 hover:text-sky-700 text-sm font-medium">
                          Change file
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className="w-full bg-gradient-to-r from-sky-500 to-teal-500 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {updating ? 'Updating...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Work Authorization Section */}
        <div id="profile-section-authorization" className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <SectionHeader id="authorization" title="Work Authorization" isExpanded={expandedSections.has('authorization')} isEditing={editingSections.has('authorization')} onEdit={() => startEditing('authorization')} />
          {expandedSections.has('authorization') && questionnaireData && (
            <div className="p-6 border-t border-slate-100">
              {editingSections.has('authorization') && editData ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Authorized to work in the US?</p>
                    <div className="flex gap-3">
                      <RadioOption selected={editData.work_authorized === true} onClick={() => setEditData({...editData, work_authorized: true})} label="Yes" />
                      <RadioOption selected={editData.work_authorized === false} onClick={() => setEditData({...editData, work_authorized: false})} label="No" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Requires employer sponsorship?</p>
                    <div className="flex gap-3">
                      <RadioOption selected={editData.requires_sponsorship === true} onClick={() => setEditData({...editData, requires_sponsorship: true})} label="Yes" />
                      <RadioOption selected={editData.requires_sponsorship === false} onClick={() => setEditData({...editData, requires_sponsorship: false})} label="No" />
                    </div>
                  </div>
                  <EditActions sectionId="authorization" saving={savingSection === 'authorization'} />
                </div>
              ) : (
                <>
                  <InfoRow label="Authorized to work in US" value={formatYesNo(questionnaireData.work_authorized)} />
                  <InfoRow label="Requires sponsorship" value={formatYesNo(questionnaireData.requires_sponsorship)} />
                </>
              )}
            </div>
          )}
        </div>

        {/* Certifications Section */}
        <div id="profile-section-certifications" className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <SectionHeader id="certifications" title="Certifications" isExpanded={expandedSections.has('certifications')} isEditing={editingSections.has('certifications')} onEdit={() => startEditing('certifications')} />
          {expandedSections.has('certifications') && questionnaireData && (
            <div className="p-6 border-t border-slate-100">
              {editingSections.has('certifications') && editData ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 mb-2">Select your certifications:</p>
                  <div className="space-y-3">
                    {CERTIFICATIONS.map(cert => {
                      const selectedCert = editData.certifications?.find(c => c.type === cert.id);
                      const isSelected = !!selectedCert;
                      return (
                        <div key={cert.id} className={`rounded-lg border-2 transition-all ${isSelected ? 'border-sky-500 bg-sky-50' : 'border-slate-200'}`}>
                          <button
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setEditData({...editData, certifications: editData.certifications.filter(c => c.type !== cert.id)});
                              } else {
                                setEditData({...editData, certifications: [...(editData.certifications || []), { type: cert.id, is_active: true, expiration_date: '', does_not_expire: false }]});
                              }
                            }}
                            className="w-full px-4 py-3 flex items-center gap-3 text-left"
                          >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-sky-500 bg-sky-500' : 'border-slate-300'}`}>
                              {isSelected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <span className={`font-medium ${isSelected ? 'text-sky-700' : 'text-slate-600'}`}>{cert.label}</span>
                          </button>
                          {isSelected && selectedCert && (
                            <div className="px-4 pb-3 pt-2 border-t border-sky-200 space-y-2">
                              {cert.id === 'other' && (
                                <input type="text" placeholder="Certification name" value={selectedCert.other_name || ''} onChange={(e) => setEditData({...editData, certifications: editData.certifications.map(c => c.type === cert.id ? {...c, other_name: e.target.value} : c)})} className="w-full px-3 py-2 rounded border border-slate-300 text-sm" />
                              )}
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex gap-2">
                                  <button type="button" onClick={() => setEditData({...editData, certifications: editData.certifications.map(c => c.type === cert.id ? {...c, is_active: true} : c)})} className={`px-3 py-1 rounded text-xs font-medium ${selectedCert.is_active ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-600'}`}>Active</button>
                                  <button type="button" onClick={() => setEditData({...editData, certifications: editData.certifications.map(c => c.type === cert.id ? {...c, is_active: false} : c)})} className={`px-3 py-1 rounded text-xs font-medium ${!selectedCert.is_active ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'}`}>Inactive</button>
                                </div>
                                {!selectedCert.does_not_expire && <input type="date" value={selectedCert.expiration_date} onChange={(e) => setEditData({...editData, certifications: editData.certifications.map(c => c.type === cert.id ? {...c, expiration_date: e.target.value} : c)})} className="px-2 py-1 rounded border border-slate-300 text-sm" />}
                                <label className="flex items-center gap-2 text-sm text-slate-600">
                                  <input type="checkbox" checked={selectedCert.does_not_expire} onChange={(e) => setEditData({...editData, certifications: editData.certifications.map(c => c.type === cert.id ? {...c, does_not_expire: e.target.checked, expiration_date: ''} : c)})} className="w-4 h-4 rounded" />
                                  No expiration
                                </label>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <EditActions sectionId="certifications" saving={savingSection === 'certifications'} />
                </div>
              ) : (
                questionnaireData.certifications && questionnaireData.certifications.length > 0 ? (
                  <div className="space-y-3">
                    {questionnaireData.certifications.map((cert, index) => (
                      <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-slate-800">{cert.type === 'other' ? cert.other_name : CERTIFICATION_LABELS[cert.type] || cert.type}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${cert.is_active ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{cert.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                        <p className="text-sm text-slate-500">{cert.does_not_expire ? 'Does not expire' : `Expires: ${cert.expiration_date || 'Not specified'}`}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm italic">No certifications listed</p>
                )
              )}
            </div>
          )}
        </div>

        {/* Experience Section */}
        <div id="profile-section-experience" className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <SectionHeader id="experience" title="Experience" isExpanded={expandedSections.has('experience')} isEditing={editingSections.has('experience')} onEdit={() => startEditing('experience')} />
          {expandedSections.has('experience') && questionnaireData && (
            <div className="p-6 border-t border-slate-100">
              {editingSections.has('experience') && editData ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Years of healthcare experience</p>
                    <div className="flex flex-wrap gap-2">
                      {[{v:'none',l:'None'},{v:'<1',l:'Less than 1'},{v:'1-3',l:'1-3 years'},{v:'3-5',l:'3-5 years'},{v:'5+',l:'5+ years'}].map(opt => (
                        <RadioOption key={opt.v} selected={editData.years_experience === opt.v} onClick={() => setEditData({...editData, years_experience: opt.v})} label={opt.l} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Work settings (select all that apply)</p>
                    <div className="flex flex-wrap gap-2">
                      {WORK_SETTINGS.map(s => (
                        <CheckboxOption key={s.id} selected={(editData.work_settings || []).includes(s.id)} onClick={() => setEditData({...editData, work_settings: toggleArrayValue(editData.work_settings || [], s.id)})} label={s.label} />
                      ))}
                    </div>
                  </div>
                  <EditActions sectionId="experience" saving={savingSection === 'experience'} />
                </div>
              ) : (
                <>
                  <InfoRow label="Years of experience" value={formatValue(questionnaireData.years_experience)} />
                  <InfoRow label="Work settings" value={formatArrayLabels(questionnaireData.work_settings, WORK_SETTING_LABELS)} />
                </>
              )}
            </div>
          )}
        </div>

        {/* Transportation Section */}
        <div id="profile-section-transportation" className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <SectionHeader id="transportation" title="Transportation" isExpanded={expandedSections.has('transportation')} isEditing={editingSections.has('transportation')} onEdit={() => startEditing('transportation')} />
          {expandedSections.has('transportation') && questionnaireData && (
            <div className="p-6 border-t border-slate-100">
              {editingSections.has('transportation') && editData ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Do you have reliable transportation?</p>
                    <div className="flex flex-wrap gap-2">
                      {[{v:'yes',l:'Yes'},{v:'no',l:'No'},{v:'sometimes',l:'Sometimes'}].map(opt => (
                        <RadioOption key={opt.v} selected={editData.has_transportation === opt.v} onClick={() => setEditData({...editData, has_transportation: opt.v})} label={opt.l} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Willing to travel between sites?</p>
                    <div className="flex gap-3">
                      <RadioOption selected={editData.willing_to_travel === true} onClick={() => setEditData({...editData, willing_to_travel: true})} label="Yes" />
                      <RadioOption selected={editData.willing_to_travel === false} onClick={() => setEditData({...editData, willing_to_travel: false})} label="No" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Maximum commute distance</p>
                    <div className="flex flex-wrap gap-2">
                      {[{v:'<5',l:'Less than 5 miles'},{v:'5-10',l:'5-10 miles'},{v:'10-20',l:'10-20 miles'},{v:'20+',l:'20+ miles'}].map(opt => (
                        <RadioOption key={opt.v} selected={editData.max_commute === opt.v} onClick={() => setEditData({...editData, max_commute: opt.v})} label={opt.l} />
                      ))}
                    </div>
                  </div>
                  <EditActions sectionId="transportation" saving={savingSection === 'transportation'} />
                </div>
              ) : (
                <>
                  <InfoRow label="Reliable transportation" value={formatValue(questionnaireData.has_transportation)} />
                  <InfoRow label="Willing to travel between sites" value={formatYesNo(questionnaireData.willing_to_travel)} />
                  <InfoRow label="Maximum commute" value={formatValue(questionnaireData.max_commute) + ' miles'} />
                </>
              )}
            </div>
          )}
        </div>

        {/* Schedule Section */}
        <div id="profile-section-schedule" className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <SectionHeader id="schedule" title="Schedule Preferences" isExpanded={expandedSections.has('schedule')} isEditing={editingSections.has('schedule')} onEdit={() => startEditing('schedule')} />
          {expandedSections.has('schedule') && questionnaireData && (
            <div className="p-6 border-t border-slate-100">
              {editingSections.has('schedule') && editData ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Preferred shifts (select all)</p>
                    <div className="flex flex-wrap gap-2">
                      {SHIFTS.map(s => (
                        <CheckboxOption key={s.id} selected={(editData.preferred_shifts || []).includes(s.id)} onClick={() => setEditData({...editData, preferred_shifts: toggleArrayValue(editData.preferred_shifts || [], s.id)})} label={s.label} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Willing to rotate shifts?</p>
                    <div className="flex flex-wrap gap-2">
                      {[{v:'yes',l:'Yes'},{v:'no',l:'No'},{v:'prefer_not',l:'Prefer not to'}].map(opt => (
                        <RadioOption key={opt.v} selected={editData.willing_to_rotate === opt.v} onClick={() => setEditData({...editData, willing_to_rotate: opt.v})} label={opt.l} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Schedule type (select all)</p>
                    <div className="flex flex-wrap gap-2">
                      {SCHEDULE_TYPES.map(s => (
                        <CheckboxOption key={s.id} selected={(editData.schedule_type || []).includes(s.id)} onClick={() => setEditData({...editData, schedule_type: toggleArrayValue(editData.schedule_type || [], s.id)})} label={s.label} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Hours per week</p>
                    <div className="flex flex-wrap gap-2">
                      {[{v:'<20',l:'Less than 20'},{v:'20-30',l:'20-30'},{v:'30-40',l:'30-40'},{v:'40+',l:'40+'}].map(opt => (
                        <RadioOption key={opt.v} selected={editData.hours_per_week === opt.v} onClick={() => setEditData({...editData, hours_per_week: opt.v})} label={opt.l} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">When can you start?</p>
                    <div className="flex flex-wrap gap-2">
                      {[{v:'immediately',l:'Immediately'},{v:'2_weeks',l:'Within 2 weeks'},{v:'1_month',l:'1 month'},{v:'2+_months',l:'2+ months'}].map(opt => (
                        <RadioOption key={opt.v} selected={editData.start_availability === opt.v} onClick={() => setEditData({...editData, start_availability: opt.v})} label={opt.l} />
                      ))}
                    </div>
                  </div>
                  <EditActions sectionId="schedule" saving={savingSection === 'schedule'} />
                </div>
              ) : (
                <>
                  <InfoRow label="Preferred shifts" value={formatArrayLabels(questionnaireData.preferred_shifts, SHIFT_LABELS)} />
                  <InfoRow label="Willing to rotate shifts" value={formatValue(questionnaireData.willing_to_rotate)} />
                  <InfoRow label="Schedule type" value={formatArrayLabels(questionnaireData.schedule_type, SCHEDULE_TYPE_LABELS)} />
                  <InfoRow label="Hours per week" value={formatValue(questionnaireData.hours_per_week)} />
                  <InfoRow label="Available to start" value={formatValue(questionnaireData.start_availability)} />
                </>
              )}
            </div>
          )}
        </div>

        {/* Environment Section */}
        <div id="profile-section-environment" className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <SectionHeader id="environment" title="Work Environment" isExpanded={expandedSections.has('environment')} isEditing={editingSections.has('environment')} onEdit={() => startEditing('environment')} />
          {expandedSections.has('environment') && questionnaireData && (
            <div className="p-6 border-t border-slate-100">
              {editingSections.has('environment') && editData ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Work type preference</p>
                    <div className="flex flex-wrap gap-2">
                      {[{v:'direct_patient_care',l:'Direct Patient Care'},{v:'administrative',l:'Administrative'},{v:'lab_technical',l:'Lab/Technical'},{v:'mix',l:'Mix of Both'}].map(opt => (
                        <RadioOption key={opt.v} selected={editData.work_type_preference === opt.v} onClick={() => setEditData({...editData, work_type_preference: opt.v})} label={opt.l} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Preferred environments (select all)</p>
                    <div className="flex flex-wrap gap-2">
                      {WORK_SETTINGS.filter(s => s.id !== 'other').map(s => (
                        <CheckboxOption key={s.id} selected={(editData.environment_preferences || []).includes(s.id)} onClick={() => setEditData({...editData, environment_preferences: toggleArrayValue(editData.environment_preferences || [], s.id)})} label={s.label} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Location preference</p>
                    <div className="flex flex-wrap gap-2">
                      <RadioOption selected={editData.location_preference === 'consistent'} onClick={() => setEditData({...editData, location_preference: 'consistent'})} label="One consistent location" />
                      <RadioOption selected={editData.location_preference === 'multiple'} onClick={() => setEditData({...editData, location_preference: 'multiple'})} label="Multiple locations" />
                    </div>
                  </div>
                  <EditActions sectionId="environment" saving={savingSection === 'environment'} />
                </div>
              ) : (
                <>
                  <InfoRow label="Work type preference" value={formatValue(questionnaireData.work_type_preference)} />
                  <InfoRow label="Preferred environments" value={formatArrayLabels(questionnaireData.environment_preferences, WORK_SETTING_LABELS)} />
                  <InfoRow label="Location preference" value={questionnaireData.location_preference === 'consistent' ? 'One consistent location' : 'Multiple locations / Visiting patients'} />
                </>
              )}
            </div>
          )}
        </div>

        {/* Work Style Section */}
        <div id="profile-section-workstyle" className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <SectionHeader id="workstyle" title="Work Style & Preferences" isExpanded={expandedSections.has('workstyle')} isEditing={editingSections.has('workstyle')} onEdit={() => startEditing('workstyle')} />
          {expandedSections.has('workstyle') && questionnaireData && (
            <div className="p-6 border-t border-slate-100 space-y-6">
              {editingSections.has('workstyle') && editData ? (
                <>
                  <div>
                    <h4 className="font-medium text-slate-800 mb-3">Social & Interaction Style</h4>
                    <div className="space-y-1">
                      <SliderEdit label="I enjoy working with patients" value={editData.enjoys_patient_interaction || 3} onChange={(v) => setEditData({...editData, enjoys_patient_interaction: v})} />
                      <SliderEdit label="I enjoy teamwork" value={editData.enjoys_teamwork || 3} onChange={(v) => setEditData({...editData, enjoys_teamwork: v})} />
                      <SliderEdit label="Comfortable with families" value={editData.comfortable_with_families || 3} onChange={(v) => setEditData({...editData, comfortable_with_families: v})} />
                      <SliderEdit label="Handle emotional situations" value={editData.handles_emotions || 3} onChange={(v) => setEditData({...editData, handles_emotions: v})} />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800 mb-3">Structure & Autonomy</h4>
                    <div className="space-y-1">
                      <SliderEdit label="Prefer routine" value={editData.prefers_routine || 3} onChange={(v) => setEditData({...editData, prefers_routine: v})} />
                      <SliderEdit label="Work independently" value={editData.works_independently || 3} onChange={(v) => setEditData({...editData, works_independently: v})} />
                      <SliderEdit label="Like fast-paced environments" value={editData.likes_fast_paced || 3} onChange={(v) => setEditData({...editData, likes_fast_paced: v})} />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800 mb-3">Stress & Pressure</h4>
                    <div className="space-y-1">
                      <SliderEdit label="Stay calm under pressure" value={editData.stays_calm || 3} onChange={(v) => setEditData({...editData, stays_calm: v})} />
                      <SliderEdit label="Handle distress" value={editData.handles_distress || 3} onChange={(v) => setEditData({...editData, handles_distress: v})} />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800 mb-3">Job Priorities (pick up to 3)</h4>
                    <div className="flex flex-wrap gap-2">
                      {JOB_PRIORITIES.map(p => (
                        <CheckboxOption key={p.id} selected={(editData.job_priorities || []).includes(p.id)} onClick={() => {
                          const current = editData.job_priorities || [];
                          if (current.includes(p.id)) {
                            setEditData({...editData, job_priorities: current.filter(x => x !== p.id)});
                          } else if (current.length < 3) {
                            setEditData({...editData, job_priorities: [...current, p.id]});
                          }
                        }} label={p.label} />
                      ))}
                    </div>
                  </div>
                  <EditActions sectionId="workstyle" saving={savingSection === 'workstyle'} />
                </>
              ) : (
                <>
                  <div>
                    <h4 className="font-medium text-slate-800 mb-3">Social & Interaction Style</h4>
                    <div className="space-y-1">
                      <SliderDisplay label="Enjoy working with patients" value={questionnaireData.enjoys_patient_interaction || 3} />
                      <SliderDisplay label="Enjoy teamwork" value={questionnaireData.enjoys_teamwork || 3} />
                      <SliderDisplay label="Comfortable with families" value={questionnaireData.comfortable_with_families || 3} />
                      <SliderDisplay label="Handle emotional situations" value={questionnaireData.handles_emotions || 3} />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800 mb-3">Structure & Autonomy</h4>
                    <div className="space-y-1">
                      <SliderDisplay label="Prefer routine" value={questionnaireData.prefers_routine || 3} />
                      <SliderDisplay label="Work independently" value={questionnaireData.works_independently || 3} />
                      <SliderDisplay label="Like fast-paced environments" value={questionnaireData.likes_fast_paced || 3} />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800 mb-3">Stress & Pressure</h4>
                    <div className="space-y-1">
                      <SliderDisplay label="Stay calm under pressure" value={questionnaireData.stays_calm || 3} />
                      <SliderDisplay label="Handle distress" value={questionnaireData.handles_distress || 3} />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800 mb-3">Job Priorities</h4>
                    <div className="flex flex-wrap gap-2">
                      {questionnaireData.job_priorities && questionnaireData.job_priorities.length > 0 ? (
                        questionnaireData.job_priorities.map(priority => (
                          <span key={priority} className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-sm font-medium">{JOB_PRIORITY_LABELS[priority] || priority}</span>
                        ))
                      ) : (
                        <span className="text-slate-500 text-sm italic">None selected</span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Physical & Additional Info Section */}
        <div id="profile-section-physical" className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <SectionHeader id="physical" title="Physical Requirements & Additional Info" isExpanded={expandedSections.has('physical')} isEditing={editingSections.has('physical')} onEdit={() => startEditing('physical')} />
          {expandedSections.has('physical') && questionnaireData && (
            <div className="p-6 border-t border-slate-100">
              {editingSections.has('physical') && editData ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Can you stand for long periods?</p>
                    <div className="flex flex-wrap gap-2">
                      {[{v:'yes',l:'Yes'},{v:'no',l:'No'},{v:'sometimes',l:'Sometimes'}].map(opt => (
                        <RadioOption key={opt.v} selected={editData.can_stand_long === opt.v} onClick={() => setEditData({...editData, can_stand_long: opt.v})} label={opt.l} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Can you lift 25-50 lbs?</p>
                    <div className="flex gap-3">
                      <RadioOption selected={editData.can_lift_50 === true} onClick={() => setEditData({...editData, can_lift_50: true})} label="Yes" />
                      <RadioOption selected={editData.can_lift_50 === false} onClick={() => setEditData({...editData, can_lift_50: false})} label="No" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Comfortable assisting patients with (select all)</p>
                    <div className="flex flex-wrap gap-2">
                      {PATIENT_ASSISTANCE.map(p => (
                        <CheckboxOption key={p.id} selected={(editData.comfortable_assisting || []).includes(p.id)} onClick={() => setEditData({...editData, comfortable_assisting: toggleArrayValue(editData.comfortable_assisting || [], p.id)})} label={p.label} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Additional Information</p>
                    <textarea value={editData.additional_info || ''} onChange={(e) => setEditData({...editData, additional_info: e.target.value})} rows={3} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none resize-none text-sm" placeholder="Anything else you'd like us to know..." />
                  </div>
                  <EditActions sectionId="physical" saving={savingSection === 'physical'} />
                </div>
              ) : (
                <>
                  <InfoRow label="Can stand for long periods" value={formatValue(questionnaireData.can_stand_long)} />
                  <InfoRow label="Can lift 25-50 lbs" value={formatYesNo(questionnaireData.can_lift_50)} />
                  <InfoRow label="Comfortable assisting with" value={formatArrayLabels(questionnaireData.comfortable_assisting, PATIENT_ASSISTANCE_LABELS)} />
                  {questionnaireData.additional_info && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-sm font-medium text-slate-700 mb-2">Additional Information</p>
                      <p className="text-slate-600 text-sm bg-slate-50 p-3 rounded-lg">{questionnaireData.additional_info}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [screeningInvitations, setScreeningInvitations] = useState<Job[]>([]);
  const [regularMatches, setRegularMatches] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'matched-jobs' | 'profile'>('matched-jobs');
  const [userProfile, setUserProfile] = useState<{name: string; email: string; resumePath: string; userId: string} | null>(null);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<{[key: string]: string}>({});
  const [submitting, setSubmitting] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [currentQuestionnaireId, setCurrentQuestionnaireId] = useState<string | null>(null);

  // Refetch questions for the current questionnaire (used by realtime subscription)
  const refetchCurrentQuestions = async (questionnaireId: string) => {
    const { data: questionsData } = await supabase
      .from('job_questions')
      .select('*')
      .eq('questionnaire_id', questionnaireId)
      .order('position');

    if (questionsData) {
      setQuestions(questionsData);
    }
  };

  // Subscribe to questionnaire changes when viewing a questionnaire
  useEffect(() => {
    if (!showQuestionnaire || !currentQuestionnaireId) return;

    const questionnaireId = currentQuestionnaireId;

    const channel = supabase
      .channel(`questionnaire-changes-${questionnaireId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_questions'
        },
        (payload) => {
          // Check if the change is for our questionnaire
          const record = payload.new as { questionnaire_id?: string } | null;
          const oldRecord = payload.old as { questionnaire_id?: string } | null;
          if (record?.questionnaire_id === questionnaireId || oldRecord?.questionnaire_id === questionnaireId) {
            refetchCurrentQuestions(questionnaireId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showQuestionnaire, currentQuestionnaireId]);

  // Fetch jobs function - extracted so it can be called by realtime subscription
  const fetchJobs = async () => {
    try {
      // Fetch matched jobs for the authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('job_id, questionnaire_sent')
        .eq('user_id', user.id);

      if (matchesError) {
        console.error('Error fetching matches:', matchesError);
        return;
      }

      const matchList = matchesData || [];
      const jobIds = matchList.map((match: any) => match.job_id);

      if (jobIds.length === 0) {
        setJobs([]);
        setScreeningInvitations([]);
        setRegularMatches([]);
        return;
      }

      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs_with_business')
        .select(`
          job_id,
          job_name,
          company_name,
          city,
          state,
          hourly_wage_minimum,
          hourly_wage_maximum,
          job_description,
          job_requirements,
          questionnaire_id
        `)
        .in('job_id', jobIds);

      if (jobsError) {
        console.error('Error fetching jobs:', jobsError);
        return;
      }

      const jobsById = new Map(
        (jobsData || []).map((job: any) => [job.job_id, job])
      );

      // Transform the data to match the Job interface
      const transformedJobs: Job[] = matchList
        .map((match: any) => {
          const job = jobsById.get(match.job_id);
          if (!job) return null;
          return {
            id: job.job_id,
            title: job.job_name,
            company: job.company_name,
            city: job.city,
            state: job.state,
            hourlyWageMin: parseFloat(job.hourly_wage_minimum),
            hourlyWageMax: parseFloat(job.hourly_wage_maximum),
            description: job.job_description,
            requirements: job.job_requirements,
            questionnaireId: job.questionnaire_id || null,
            questionnaireSent: match.questionnaire_sent
          };
        })
        .filter(Boolean) as Job[];

      // Split jobs based on questionnaire_sent status
      const screening: Job[] = [];
      const regular: Job[] = [];

      transformedJobs.forEach((job: Job) => {
        if (job.questionnaireSent) {
          screening.push(job);
        } else {
          regular.push(job);
        }
      });

      setJobs(transformedJobs);
      setScreeningInvitations(screening);
      setRegularMatches(regular);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial auth check and data fetch
  useEffect(() => {
    const checkAuthAndResume = async () => {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Check if user has uploaded a resume and completed profile
      const { data: candidateData } = await supabase
        .from('u_candidates')
        .select('name, email, resume, user_id, profile_completed')
        .eq('user_id', user.id)
        .single();

      if (!candidateData?.resume) {
        // No resume uploaded, redirect to upload page
        router.push('/upload-resume');
        return;
      }

      if (!candidateData?.profile_completed) {
        // Profile not completed, redirect to questionnaire
        router.push('/signup/questionnaire');
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

    checkAuthAndResume();
  }, [router]);

  // Subscribe to job and questionnaire changes to keep data fresh
  useEffect(() => {
    // Get the job IDs we're interested in
    const jobIds = jobs.map(job => job.id);
    const questionnaireIds = jobs.map(job => job.questionnaireId).filter(Boolean) as string[];

    if (jobIds.length === 0) return;

    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs'
        },
        (payload) => {
          // Check if the change affects any of our matched jobs
          const record = payload.new as { job_id?: string } | null;
          const oldRecord = payload.old as { job_id?: string } | null;
          if (jobIds.includes(record?.job_id || '') || jobIds.includes(oldRecord?.job_id || '')) {
            fetchJobs();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_questions'
        },
        (payload) => {
          // Check if the change affects any of our questionnaires
          const record = payload.new as { questionnaire_id?: string } | null;
          const oldRecord = payload.old as { questionnaire_id?: string } | null;
          if (questionnaireIds.includes(record?.questionnaire_id || '') || questionnaireIds.includes(oldRecord?.questionnaire_id || '')) {
            fetchJobs();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches'
        },
        (payload) => {
          // Check if the change affects any of our matched jobs
          const record = payload.new as { job_id?: string } | null;
          const oldRecord = payload.old as { job_id?: string } | null;
          if (jobIds.includes(record?.job_id || '') || jobIds.includes(oldRecord?.job_id || '')) {
            fetchJobs();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobs]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleTakeQuestionnaire = async (job: Job) => {
    if (!job.questionnaireId || !userProfile) return;

    try {
      // Fetch questions for this questionnaire
      const { data: questionsData, error: questionsError } = await supabase
        .from('job_questions')
        .select('*')
        .eq('questionnaire_id', job.questionnaireId)
        .order('position');

      if (questionsError) {
        console.error('Error fetching questions:', questionsError);
        return;
      }

      setQuestions(questionsData || []);

      // Fetch existing answers if any
      const { data: existingAnswers, error: answersError } = await supabase
        .from('candidate_answers')
        .select('*')
        .eq('candidate_id', userProfile.userId)
        .in('question_id', questionsData.map(q => q.question_id));

      if (answersError) {
        console.error('Error fetching existing answers:', answersError);
      }

      // Populate answers state with existing answers
      const answersMap: {[key: string]: string} = {};
      if (existingAnswers) {
        existingAnswers.forEach((answer: any) => {
          answersMap[answer.question_id] = answer.answer;
        });
      }
      setAnswers(answersMap);
      setCurrentQuestionnaireId(job.questionnaireId);
      setSlideDirection('left');
      setShowQuestionnaire(true);
    } catch (error) {
      console.error('Error loading questionnaire:', error);
    }
  };

  const handleSubmitQuestionnaire = async () => {
    if (!selectedJob || !userProfile) return;

    // Clear previous validation error
    setValidationError(null);

    // Validate that all questions are answered
    const unansweredQuestions = questions.filter(
      question => !answers[question.question_id]?.trim()
    );

    if (unansweredQuestions.length > 0) {
      setValidationError(`Please answer all questions before submitting. ${unansweredQuestions.length} question${unansweredQuestions.length > 1 ? 's' : ''} remaining.`);

      // Focus on the first unanswered question
      const firstUnansweredId = unansweredQuestions[0].question_id;
      const element = document.getElementById(`question-${firstUnansweredId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
      return;
    }

    setSubmitting(true);
    try {
      // Prepare answers for insertion/update
      const answerRecords = questions.map(question => ({
        candidate_id: userProfile.userId,
        question_id: question.question_id,
        answer: answers[question.question_id] || ''
      }));

      // Delete existing answers first
      const { error: deleteError } = await supabase
        .from('candidate_answers')
        .delete()
        .eq('candidate_id', userProfile.userId)
        .in('question_id', questions.map(q => q.question_id));

      // Insert new answers
      const { error: insertError } = await supabase
        .from('candidate_answers')
        .insert(answerRecords);

      if (insertError) {
        console.error('Error saving answers:', insertError);
        setValidationError('Failed to save answers. Please try again.');
        return;
      }

      // Successfully saved - show congratulations screen
      setSlideDirection('left');
      setShowCongratulations(true);
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
      setValidationError('Failed to submit questionnaire. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToJobDetails = () => {
    setSlideDirection('right');
    setShowQuestionnaire(false);
  };

  const handleCloseModal = () => {
    setSelectedJob(null);
    setShowQuestionnaire(false);
    setShowCongratulations(false);
    setCurrentQuestionnaireId(null);
    setAnswers({});
    setValidationError(null);
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
            <h1 className="text-2xl font-bold text-gradient">Health Care Hunter</h1>
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
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
                </div>
              ) : (
                <div className="space-y-12">
                  {/* Screening Invitations Section */}
                  {screeningInvitations.length > 0 && (
                    <div>
                      <div className="mb-6">
                        <h2 className="text-3xl font-bold text-slate-800 mb-2">Screening Invitations</h2>
                        <p className="text-slate-600">These companies have invited you to take an initial screening</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {screeningInvitations.map((job) => (
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
                    </div>
                  )}

                  {/* Your Matches Section */}
                  {regularMatches.length > 0 && (
                    <div>
                      <div className="mb-6">
                        <h2 className="text-3xl font-bold text-slate-800 mb-2">Your Matches</h2>
                        <p className="text-slate-600">We've recommended your profile to these jobs!</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {regularMatches.map((job) => (
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
                    </div>
                  )}

                  {/* Empty State */}
                  {screeningInvitations.length === 0 && regularMatches.length === 0 && (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                        <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-slate-800 mb-2">No Matches Yet</h3>
                      <p className="text-slate-600">We're working on finding the perfect opportunities for you!</p>
                    </div>
                  )}
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
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-shrink-0 bg-white border-b border-slate-200 p-6 flex items-start justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-1">{selectedJob.title}</h2>
                <p className="text-lg text-slate-600">{selectedJob.company}</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="h-6 w-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="relative flex-1 overflow-hidden">
              {/* Job Details View */}
              <div
                className={`absolute inset-0 transition-transform duration-500 ease-in-out ${
                  showQuestionnaire || showCongratulations
                    ? slideDirection === 'left'
                      ? '-translate-x-full'
                      : 'translate-x-full'
                    : 'translate-x-0'
                }`}
              >
                <div className="h-full flex flex-col">
                  <div className="flex-1 p-6 space-y-6 overflow-y-auto">
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
                  </div>

                  {selectedJob.questionnaireSent && selectedJob.questionnaireId && (
                    <div className="flex-shrink-0 p-6 pt-4 border-t border-slate-100">
                      <button
                        onClick={() => handleTakeQuestionnaire(selectedJob)}
                        className="w-full bg-gradient-to-r from-sky-500 to-teal-500 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      >
                        Take Questionnaire
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Questionnaire View */}
              <div
                className={`absolute inset-0 transition-transform duration-500 ease-in-out ${
                  showQuestionnaire && !showCongratulations
                    ? 'translate-x-0'
                    : showCongratulations
                    ? '-translate-x-full'
                    : 'translate-x-full'
                }`}
              >
                <div className="h-full flex flex-col">
                  <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-4">Questionnaire</h3>
                      <p className="text-slate-600 mb-6">Please answer the following questions to help us better understand your qualifications.</p>

                      {validationError && (
                        <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg">
                          {validationError}
                        </div>
                      )}

                      <div className="space-y-6">
                        {questions.map((question, index) => (
                          <div key={question.question_id}>
                            <label htmlFor={`question-${question.question_id}`} className="block text-sm font-medium text-slate-700 mb-2">
                              {index + 1}. {question.prompt}
                            </label>
                            <textarea
                              id={`question-${question.question_id}`}
                              value={answers[question.question_id] || ''}
                              onChange={(e) => {
                                setAnswers({
                                  ...answers,
                                  [question.question_id]: e.target.value
                                });
                                // Clear validation error when user starts typing
                                if (validationError) {
                                  setValidationError(null);
                                }
                              }}
                              rows={4}
                              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition resize-none"
                              placeholder="Type your answer here..."
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 p-6 pt-4 border-t border-slate-100">
                    <div className="flex gap-3">
                      <button
                        onClick={handleBackToJobDetails}
                        className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-lg font-semibold hover:bg-slate-300 transition-all duration-300"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleSubmitQuestionnaire}
                        disabled={submitting}
                        className="flex-1 bg-gradient-to-r from-sky-500 to-teal-500 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {submitting ? 'Submitting...' : 'Submit'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Congratulations View */}
              <div
                className={`absolute inset-0 transition-transform duration-500 ease-in-out ${
                  showCongratulations
                    ? 'translate-x-0'
                    : 'translate-x-full'
                }`}
              >
                <div className="h-full p-6 flex items-center justify-center overflow-y-auto">
                  <div className="text-center space-y-6 max-w-md">
                    <div className="flex justify-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-3">
                        Congrats! We've sent over your responses!
                      </h3>
                      <p className="text-lg text-slate-600 mb-4">
                        The employer will set up next steps if there is a fit.
                      </p>
                      <p className="text-sm text-slate-500">
                        You can take the questionnaire again to edit your responses.
                      </p>
                    </div>

                    <button
                      onClick={handleCloseModal}
                      className="w-full bg-gradient-to-r from-sky-500 to-teal-500 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
