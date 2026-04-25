import mongoose from 'mongoose';

export type DiagnosisCorrectness = 'correct' | 'partial' | 'incorrect';
export type FixUsefulness = 'useful' | 'partial' | 'not_useful';

export interface TriageFeedbackDoc extends mongoose.Document {
  incidentId: string;
  incidentTitle?: string;
  userEmail: string;
  diagnosisCorrectness: DiagnosisCorrectness;
  fixUsefulness: FixUsefulness;
  actualRootCause?: string;
  actualFix?: string;
  notes?: string;
  submittedAt: string; // ISO
  updatedAt: string; // ISO
}

const TriageFeedbackSchema = new mongoose.Schema<TriageFeedbackDoc>(
  {
    incidentId: { type: String, required: true, index: true },
    incidentTitle: { type: String, required: false },
    userEmail: { type: String, required: true, index: true },
    diagnosisCorrectness: {
      type: String,
      required: true,
      enum: ['correct', 'partial', 'incorrect'],
    },
    fixUsefulness: {
      type: String,
      required: true,
      enum: ['useful', 'partial', 'not_useful'],
    },
    actualRootCause: { type: String, required: false },
    actualFix: { type: String, required: false },
    notes: { type: String, required: false },
    submittedAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  {
    collection: 'triage_feedback',
  }
);

TriageFeedbackSchema.index({ incidentId: 1, userEmail: 1 }, { unique: true });

export const TriageFeedbackModel =
  (mongoose.models.TriageFeedback as mongoose.Model<TriageFeedbackDoc>) ||
  mongoose.model<TriageFeedbackDoc>('TriageFeedback', TriageFeedbackSchema);

