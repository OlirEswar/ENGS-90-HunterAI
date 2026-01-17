import { Job, UserProfile } from '@/types';
import { supabase } from '@/lib/supabase';

// Dummy data for jobs
export const dummyJobs: Job[] = [
  {
    id: '1',
    title: 'Registered Nurse - ICU',
    company: 'City General Hospital',
    city: 'New York',
    state: 'NY',
    hourlyWageMin: 36,
    hourlyWageMax: 46,
    description: 'We are seeking a compassionate and skilled Registered Nurse to join our Intensive Care Unit. The ideal candidate will provide high-quality patient care in a fast-paced critical care environment.',
    requirements: [
      'Active RN license',
      '2+ years ICU experience',
      'BLS and ACLS certification',
      'Strong critical thinking skills'
    ]
  },
  {
    id: '2',
    title: 'Physical Therapist',
    company: 'Wellness Rehabilitation Center',
    city: 'Los Angeles',
    state: 'CA',
    hourlyWageMin: 38,
    hourlyWageMax: 48,
    description: 'Join our team of dedicated physical therapists helping patients recover and improve their quality of life through evidence-based therapeutic interventions.',
    requirements: [
      'Doctor of Physical Therapy degree',
      'State PT license',
      '1+ years experience preferred',
      'Excellent communication skills'
    ]
  },
  {
    id: '3',
    title: 'Medical Laboratory Technician',
    company: 'Precision Diagnostics Lab',
    city: 'Chicago',
    state: 'IL',
    hourlyWageMin: 26,
    hourlyWageMax: 34,
    description: 'Seeking a detail-oriented MLT to perform laboratory tests and procedures to assist in the diagnosis and treatment of diseases.',
    requirements: [
      'MLT certification (ASCP)',
      'Associate degree in Medical Laboratory Technology',
      'Experience with laboratory equipment',
      'Strong attention to detail'
    ]
  },
  {
    id: '4',
    title: 'Physician Assistant - Emergency Medicine',
    company: 'Metropolitan Medical Center',
    city: 'Houston',
    state: 'TX',
    hourlyWageMin: 53,
    hourlyWageMax: 63,
    description: 'Dynamic Emergency Department seeking an experienced PA to provide comprehensive emergency medical care under physician supervision.',
    requirements: [
      'PA-C certification',
      'Master\'s degree from accredited PA program',
      'Emergency medicine experience preferred',
      'DEA license'
    ]
  },
  {
    id: '5',
    title: 'Radiology Technologist',
    company: 'Advanced Imaging Associates',
    city: 'Phoenix',
    state: 'AZ',
    hourlyWageMin: 29,
    hourlyWageMax: 36,
    description: 'We need a skilled Radiology Technologist to perform diagnostic imaging examinations while ensuring patient safety and comfort.',
    requirements: [
      'ARRT certification',
      'State radiography license',
      '2+ years experience',
      'Knowledge of PACS systems'
    ]
  },
  {
    id: '6',
    title: 'Clinical Pharmacist',
    company: 'University Health System',
    city: 'Boston',
    state: 'MA',
    hourlyWageMin: 58,
    hourlyWageMax: 67,
    description: 'Join our clinical pharmacy team to optimize medication therapy and provide pharmaceutical care in a teaching hospital environment.',
    requirements: [
      'PharmD degree',
      'Active pharmacist license',
      'Residency completion preferred',
      'Board certification'
    ]
  },
  {
    id: '7',
    title: 'Occupational Therapist',
    company: 'Pediatric Care Specialists',
    city: 'Seattle',
    state: 'WA',
    hourlyWageMin: 36,
    hourlyWageMax: 43,
    description: 'Passionate OT needed to help children develop skills for daily living and enhance their independence through therapeutic activities.',
    requirements: [
      'Master\'s in Occupational Therapy',
      'State OT license',
      'Pediatric experience preferred',
      'Strong interpersonal skills'
    ]
  },
  {
    id: '8',
    title: 'Respiratory Therapist',
    company: 'Pulmonary Care Center',
    city: 'Denver',
    state: 'CO',
    hourlyWageMin: 31,
    hourlyWageMax: 38,
    description: 'Seeking a skilled Respiratory Therapist to provide care for patients with breathing disorders and critical care needs.',
    requirements: [
      'RRT certification',
      'State license',
      'BLS and ACLS certified',
      'Critical care experience'
    ]
  }
];

// API calls using Supabase
export async function loginUser(email: string, password: string): Promise<{ success: boolean; user?: UserProfile }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      return { success: false };
    }

    if (data.user) {
      // Fetch user profile from u_candidates
      const { data: candidateData, error: candidateError } = await supabase
        .from('u_candidates')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      if (candidateError || !candidateData) {
        console.error('Error fetching candidate data:', candidateError);
        return { success: false };
      }

      return {
        success: true,
        user: {
          id: candidateData.user_id,
          name: candidateData.name,
          email: candidateData.email,
          location: '',
          desiredSalary: '',
          willingToRelocate: false,
          preferredDepartments: []
        }
      };
    }

    return { success: false };
  } catch (error) {
    console.error('Unexpected login error:', error);
    return { success: false };
  }
}

export async function registerUser(data: Partial<UserProfile>): Promise<{ success: boolean; user?: UserProfile }> {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await response.json();
  } catch (error) {
    console.log('API call failed (expected):', error);
    return {
      success: true,
      user: {
        id: '1',
        ...data,
        name: data.name || 'User',
        email: data.email || 'user@example.com',
        location: data.location || '',
        desiredSalary: data.desiredSalary || '',
        willingToRelocate: data.willingToRelocate || false,
        preferredDepartments: data.preferredDepartments || []
      } as UserProfile
    };
  }
}

export async function uploadResume(file: File): Promise<{ success: boolean; url?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false };
    }

    // Preserve original filename, sanitize it for storage
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${user.id}/${sanitizedFileName}`;

    // First, check if there's an existing resume to delete
    const { data: candidateData } = await supabase
      .from('u_candidates')
      .select('resume')
      .eq('user_id', user.id)
      .single();

    // Delete old resume if it exists
    if (candidateData?.resume) {
      await supabase.storage
        .from('resumes')
        .remove([candidateData.resume]);
    }

    // Upload new file
    const { error } = await supabase.storage
      .from('resumes')
      .upload(fileName, file, {
        upsert: false, // Changed to false since we're deleting old file first
        contentType: 'application/pdf'
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false };
    }

    // Store the file path (not public URL since bucket is private)
    const resumePath = fileName;

    // Update candidate record with resume path
    await supabase
      .from('u_candidates')
      .update({ resume: resumePath })
      .eq('user_id', user.id);

    return {
      success: true,
      url: resumePath
    };
  } catch (error) {
    console.error('Unexpected upload error:', error);
    return { success: false };
  }
}

export async function getMatchedJobs(userId: string): Promise<Job[]> {
  try {
    const response = await fetch(`/api/jobs/matched/${userId}`);
    return await response.json();
  } catch (error) {
    console.log('API call failed (expected):', error);
    return dummyJobs;
  }
}

export async function updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await response.json();
  } catch (error) {
    console.log('API call failed (expected):', error);
    return { success: true };
  }
}
