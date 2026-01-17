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
  questionnaireId?: string;
  questionnaireSent?: boolean;
  matchId?: string;
  matchFailed?: boolean;
}

export interface Question {
  question_id: string;
  questionnaire_id: string;
  position: number;
  prompt: string;
}

export interface CandidateAnswer {
  answer_id?: string;
  candidate_id: string;
  question_id: string;
  answer: string;
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
