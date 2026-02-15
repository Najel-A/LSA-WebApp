import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { mockModels } from '@/mock/admin';
import { initialMockTrainingJobs } from '@/mock/admin';
import type { TrainingJob, TrainingJobStatus } from '@/types/admin';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const ALLOWED_EXTENSIONS = ['.csv', '.json'];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

const statusStyles: Record<TrainingJobStatus, string> = {
  pending: 'bg-neutral-100 text-neutral-700',
  running: 'bg-primary-100 text-primary-800',
  completed: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-800',
};

export function AdminModelPage() {
  const [jobs, setJobs] = useState<TrainingJob[]>(initialMockTrainingJobs);
  const [selectedModelId, setSelectedModelId] = useState<string>(mockModels[0]?.id ?? '');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [jobIdCounter, setJobIdCounter] = useState(100);

  const validateFile = useCallback((file: File): string | null => {
    const ext = file.name.includes('.') ? '.' + file.name.split('.').pop()?.toLowerCase() : '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File too large. Max size: ${MAX_FILE_SIZE_MB}MB`;
    }
    return null;
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      setUploadFile(null);
      setUploadError(null);
      if (!file) return;
      const err = validateFile(file);
      if (err) {
        setUploadError(err);
        return;
      }
      setUploadFile(file);
    },
    [validateFile]
  );

  const handleRetrain = useCallback(() => {
    const model = mockModels.find((m) => m.id === selectedModelId) ?? mockModels[0];
    if (!model) return;
    const newId = `job-${jobIdCounter}`;
    setJobIdCounter((c) => c + 1);
    const newJob: TrainingJob = {
      id: newId,
      modelId: model.id,
      modelName: model.name,
      status: 'pending',
      createdAt: new Date().toISOString(),
      datasetName: uploadFile?.name,
    };
    setJobs((prev) => [newJob, ...prev]);
    setUploadFile(null);
    setUploadError(null);
    // Simulate progress: pending -> running -> completed
    setTimeout(() => {
      setJobs((prev) =>
        prev.map((j) => (j.id === newId ? { ...j, status: 'running' as const } : j))
      );
    }, 800);
    setTimeout(() => {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === newId
            ? { ...j, status: 'completed' as const, completedAt: new Date().toISOString() }
            : j
        )
      );
    }, 4000);
  }, [selectedModelId, uploadFile, jobIdCounter]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/admin"
            className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
          >
            ← Admin
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900 mt-1">Model</h1>
        </div>
      </div>

      {/* Model cards */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-3">
          Models
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mockModels.map((model) => (
            <div
              key={model.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedModelId(model.id)}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedModelId(model.id)}
              className={`cursor-pointer ${selectedModelId === model.id ? 'ring-2 ring-primary-500 ring-offset-2 rounded-lg' : ''}`}
            >
              <Card
                className={
                  selectedModelId === model.id
                    ? 'border-primary-200'
                    : 'hover:border-neutral-300'
                }
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-neutral-900">{model.name}</h3>
                    <p className="text-sm text-neutral-500 mt-0.5">{model.version}</p>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${
                      model.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : model.status === 'draft'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {model.status}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-2">
                  Updated {formatDate(model.updatedAt)}
                </p>
              </Card>
            </div>
          ))}
        </div>
      </section>

      {/* Dataset upload + Retrain */}
      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-3">
          Dataset upload & retrain
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Dataset (optional)
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <label className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1">
                Choose file
                <input
                  type="file"
                  accept=".csv,.json"
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </label>
              {uploadFile && (
                <span className="text-sm text-neutral-600 truncate" title={uploadFile.name}>
                  {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Allowed: {ALLOWED_EXTENSIONS.join(', ')}. Max size: {MAX_FILE_SIZE_MB}MB.
            </p>
            {uploadError && (
              <p role="alert" className="text-sm text-red-600 mt-1">
                {uploadError}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleRetrain}>Start retrain</Button>
            <span className="text-sm text-neutral-500">
              {selectedModelId
                ? `Model: ${mockModels.find((m) => m.id === selectedModelId)?.name ?? selectedModelId}`
                : 'Select a model above'}
            </span>
          </div>
        </div>
      </Card>

      {/* Training jobs list */}
      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-3">
          Training jobs
        </h2>
        {jobs.length === 0 ? (
          <p className="text-sm text-neutral-500">No training jobs yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  <th className="pb-2 pr-4">Job</th>
                  <th className="pb-2 pr-4">Model</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Dataset</th>
                  <th className="pb-2 pr-4">Created</th>
                  <th className="pb-2">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td className="py-3 pr-4 font-mono text-neutral-700">{job.id}</td>
                    <td className="py-3 pr-4 text-neutral-700">{job.modelName}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusStyles[job.status]}`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-neutral-600">{job.datasetName ?? '—'}</td>
                    <td className="py-3 pr-4 text-neutral-600">{formatDate(job.createdAt)}</td>
                    <td className="py-3 text-neutral-600">
                      {job.completedAt ? formatDate(job.completedAt) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
