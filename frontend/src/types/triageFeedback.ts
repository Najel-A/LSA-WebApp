export type TriageFeedback = {
  id?: string;
  incidentId: string;
  incidentTitle?: string;
  userEmail: string;
  diagnosisCorrectness: 'correct' | 'partial' | 'incorrect';
  fixUsefulness: 'useful' | 'partial' | 'not_useful';
  actualRootCause?: string;
  actualFix?: string;
  notes?: string;
  submittedAt: string;
  updatedAt?: string;
};

