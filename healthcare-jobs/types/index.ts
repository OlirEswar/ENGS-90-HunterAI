export interface Job {
  id: string;
  title: string;
  company: string;
  city: string;
  state: string;
  hourlyWageMin: number;
  hourlyWageMax: number;
  description: string;
  requirements: string[];
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
