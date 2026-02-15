export interface ModelCard {
  id: string;
  name: string;
  version: string;
  status: 'active' | 'draft' | 'archived';
  updatedAt: string; // ISO
}

export type TrainingJobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface TrainingJob {
  id: string;
  modelId: string;
  modelName: string;
  status: TrainingJobStatus;
  createdAt: string; // ISO
  completedAt?: string; // ISO
  datasetName?: string;
}
