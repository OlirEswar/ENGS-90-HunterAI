import { Job, UserProfile } from '@/types';

// Dummy data for jobs
export const dummyJobs: Job[] = [
  {
    id: '1',
    title: 'Registered Nurse - ICU',
    company: 'City General Hospital',
    location: 'New York, NY',
    salary: '$75,000 - $95,000',
    description: 'We are seeking a compassionate and skilled Registered Nurse to join our Intensive Care Unit. The ideal candidate will provide high-quality patient care in a fast-paced critical care environment.',
    requirements: [
      'Active RN license',
      '2+ years ICU experience',
      'BLS and ACLS certification',
      'Strong critical thinking skills'
    ],
    benefits: [
      'Comprehensive health insurance',
      '401(k) matching',
      'Continuing education support',
      'Flexible scheduling'
    ],
    department: 'Nursing'
  },
  {
    id: '2',
    title: 'Physical Therapist',
    company: 'Wellness Rehabilitation Center',
    location: 'Los Angeles, CA',
    salary: '$80,000 - $100,000',
    description: 'Join our team of dedicated physical therapists helping patients recover and improve their quality of life through evidence-based therapeutic interventions.',
    requirements: [
      'Doctor of Physical Therapy degree',
      'State PT license',
      '1+ years experience preferred',
      'Excellent communication skills'
    ],
    benefits: [
      'Sign-on bonus',
      'Health and dental insurance',
      'Professional development opportunities',
      'Work-life balance'
    ],
    department: 'Rehabilitation'
  },
  {
    id: '3',
    title: 'Medical Laboratory Technician',
    company: 'Precision Diagnostics Lab',
    location: 'Chicago, IL',
    salary: '$55,000 - $70,000',
    description: 'Seeking a detail-oriented MLT to perform laboratory tests and procedures to assist in the diagnosis and treatment of diseases.',
    requirements: [
      'MLT certification (ASCP)',
      'Associate degree in Medical Laboratory Technology',
      'Experience with laboratory equipment',
      'Strong attention to detail'
    ],
    benefits: [
      'Competitive salary',
      'Health benefits',
      'Paid time off',
      'Retirement plan'
    ],
    department: 'Laboratory'
  },
  {
    id: '4',
    title: 'Physician Assistant - Emergency Medicine',
    company: 'Metropolitan Medical Center',
    location: 'Houston, TX',
    salary: '$110,000 - $130,000',
    description: 'Dynamic Emergency Department seeking an experienced PA to provide comprehensive emergency medical care under physician supervision.',
    requirements: [
      'PA-C certification',
      'Master\'s degree from accredited PA program',
      'Emergency medicine experience preferred',
      'DEA license'
    ],
    benefits: [
      'Excellent compensation',
      'Full benefits package',
      'CME allowance',
      'Malpractice insurance'
    ],
    department: 'Emergency Medicine'
  },
  {
    id: '5',
    title: 'Radiology Technologist',
    company: 'Advanced Imaging Associates',
    location: 'Phoenix, AZ',
    salary: '$60,000 - $75,000',
    description: 'We need a skilled Radiology Technologist to perform diagnostic imaging examinations while ensuring patient safety and comfort.',
    requirements: [
      'ARRT certification',
      'State radiography license',
      '2+ years experience',
      'Knowledge of PACS systems'
    ],
    benefits: [
      'Comprehensive benefits',
      'Continuing education',
      'Career advancement',
      'Supportive team environment'
    ],
    department: 'Radiology'
  },
  {
    id: '6',
    title: 'Clinical Pharmacist',
    company: 'University Health System',
    location: 'Boston, MA',
    salary: '$120,000 - $140,000',
    description: 'Join our clinical pharmacy team to optimize medication therapy and provide pharmaceutical care in a teaching hospital environment.',
    requirements: [
      'PharmD degree',
      'Active pharmacist license',
      'Residency completion preferred',
      'Board certification'
    ],
    benefits: [
      'Competitive salary',
      'Full benefits',
      'Loan repayment assistance',
      'Academic opportunities'
    ],
    department: 'Pharmacy'
  },
  {
    id: '7',
    title: 'Occupational Therapist',
    company: 'Pediatric Care Specialists',
    location: 'Seattle, WA',
    salary: '$75,000 - $90,000',
    description: 'Passionate OT needed to help children develop skills for daily living and enhance their independence through therapeutic activities.',
    requirements: [
      'Master\'s in Occupational Therapy',
      'State OT license',
      'Pediatric experience preferred',
      'Strong interpersonal skills'
    ],
    benefits: [
      'Health insurance',
      'Flexible schedule',
      'Professional development',
      'Rewarding work environment'
    ],
    department: 'Occupational Therapy'
  },
  {
    id: '8',
    title: 'Respiratory Therapist',
    company: 'Pulmonary Care Center',
    location: 'Denver, CO',
    salary: '$65,000 - $80,000',
    description: 'Seeking a skilled Respiratory Therapist to provide care for patients with breathing disorders and critical care needs.',
    requirements: [
      'RRT certification',
      'State license',
      'BLS and ACLS certified',
      'Critical care experience'
    ],
    benefits: [
      'Comprehensive benefits',
      'Shift differentials',
      'Tuition reimbursement',
      'Growth opportunities'
    ],
    department: 'Respiratory Therapy'
  }
];

// Placeholder API calls
export async function loginUser(email: string, password: string): Promise<{ success: boolean; user?: UserProfile }> {
  // Placeholder API call - will fail but that's expected
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return await response.json();
  } catch (error) {
    // Ignore error and return mock success
    console.log('API call failed (expected):', error);
    return {
      success: true,
      user: {
        id: '1',
        name: 'John Doe',
        email: email,
        location: 'New York, NY',
        desiredSalary: '$80,000+',
        willingToRelocate: false,
        preferredDepartments: ['Nursing']
      }
    };
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
    const formData = new FormData();
    formData.append('resume', file);
    const response = await fetch('/api/upload/resume', {
      method: 'POST',
      body: formData
    });
    return await response.json();
  } catch (error) {
    console.log('API call failed (expected):', error);
    return {
      success: true,
      url: '/uploads/resume.pdf'
    };
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
