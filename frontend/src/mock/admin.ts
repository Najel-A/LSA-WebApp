import type { ModelCard, TrainingJob } from '@/types/admin';

export const mockModels: ModelCard[] = [
  {
    id: 'model-1',
    name: 'Alert Classifier',
    version: 'v2.1.0',
    status: 'active',
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'model-2',
    name: 'Log Anomaly Detector',
    version: 'v1.0.0',
    status: 'active',
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'model-3',
    name: 'Root Cause Model',
    version: 'v0.3.0',
    status: 'draft',
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
];

const baseTime = Date.now();
export const initialMockTrainingJobs: TrainingJob[] = [
  {
    id: 'job-1',
    modelId: 'model-1',
    modelName: 'Alert Classifier',
    status: 'completed',
    createdAt: new Date(baseTime - 3 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(baseTime - 3 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
    datasetName: 'alerts-2024-q1.csv',
  },
  {
    id: 'job-2',
    modelId: 'model-2',
    modelName: 'Log Anomaly Detector',
    status: 'running',
    createdAt: new Date(baseTime - 2 * 60 * 60 * 1000).toISOString(),
    datasetName: 'logs-sample.json',
  },
  {
    id: 'job-3',
    modelId: 'model-1',
    modelName: 'Alert Classifier',
    status: 'failed',
    createdAt: new Date(baseTime - 5 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(baseTime - 5 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(),
    datasetName: 'bad-data.csv',
  },
];
