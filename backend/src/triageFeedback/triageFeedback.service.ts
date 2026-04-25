import { TriageFeedbackModel, type DiagnosisCorrectness, type FixUsefulness } from './triageFeedback.model';

export type UpsertTriageFeedbackInput = {
  incidentId: string;
  incidentTitle?: string;
  userEmail: string;
  diagnosisCorrectness: DiagnosisCorrectness;
  fixUsefulness: FixUsefulness;
  actualRootCause?: string;
  actualFix?: string;
  notes?: string;
};

export const triageFeedbackService = {
  async upsert(input: UpsertTriageFeedbackInput) {
    const now = new Date().toISOString();

    const doc = await TriageFeedbackModel.findOneAndUpdate(
      { incidentId: input.incidentId, userEmail: input.userEmail },
      {
        $set: {
          incidentTitle: input.incidentTitle,
          diagnosisCorrectness: input.diagnosisCorrectness,
          fixUsefulness: input.fixUsefulness,
          actualRootCause: input.actualRootCause ?? '',
          actualFix: input.actualFix ?? '',
          notes: input.notes ?? '',
          updatedAt: now,
        },
        $setOnInsert: {
          submittedAt: now,
        },
      },
      { upsert: true, new: true }
    ).lean();

    return doc;
  },

  async getForIncident(incidentId: string, userEmail: string) {
    return await TriageFeedbackModel.findOne({ incidentId, userEmail }).lean();
  },

  async listForUser(userEmail: string) {
    return await TriageFeedbackModel.find({ userEmail }).sort({ updatedAt: -1 }).lean();
  },
};

