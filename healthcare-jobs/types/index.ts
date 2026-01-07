export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  requirements: string[];
  benefits: string[];
  department: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  resumeUrl?: string;
  location: string;
  desiredSalary: string;
  willingToRelocate: boolean;
  preferredDepartments: string[];
  questionnaire?: QuestionnaireAnswers;
}

export interface QuestionnaireAnswers {
  motivation: string;
  experience: string;
  workStyle: string;
  careerGoals: string;
}
