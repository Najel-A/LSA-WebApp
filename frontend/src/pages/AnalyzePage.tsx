import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { runMockAnalysis } from '@/mock/analyze';
import type { AnalysisResult } from '@/types/analyze';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const severityStyles = {
  low: 'bg-neutral-100 text-neutral-700',
  medium: 'bg-amber-100 text-amber-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

function confidenceLabel(p: number): string {
  return `${Math.round(p * 100)}%`;
}

export function AnalyzePage() {
  const [logInput, setLogInput] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File too large. Max 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogInput(String(reader.result ?? ''));
    };
    reader.onerror = () => setUploadError('Failed to read file.');
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  const runAnalysis = useCallback(() => {
    const text = logInput.trim() || 'No input provided.';
    setResult(runMockAnalysis(text));
  }, [logInput]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/dashboard"
            className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
          >
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900 mt-1">Log analyzer</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Upload or paste logs to run a mock analysis (no data sent to the server).
          </p>
        </div>
      </div>

      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-3">
          Input logs
        </h2>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 cursor-pointer focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-1">
              Upload file
              <input
                type="file"
                accept=".log,.txt,.json,.csv,text/plain,application/json"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
            {uploadError && (
              <span role="alert" className="text-sm text-red-600">
                {uploadError}
              </span>
            )}
          </div>
          <textarea
            value={logInput}
            onChange={(e) => setLogInput(e.target.value)}
            placeholder="Or paste logs here..."
            rows={12}
            className="block w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <Button onClick={runAnalysis} disabled={!logInput.trim()}>
            Run analysis
          </Button>
        </div>
      </Card>

      {result && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="font-medium text-neutral-700">
              Model version: <code className="rounded bg-neutral-100 px-1.5 py-0.5">{result.modelVersion}</code>
            </span>
            <span className="text-neutral-600">
              Overall confidence: <strong>{confidenceLabel(result.overallConfidence)}</strong>
            </span>
          </div>

          <Card>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-3">
              Anomalies
            </h2>
            {result.anomalies.length === 0 ? (
              <p className="text-sm text-neutral-500">None detected.</p>
            ) : (
              <ul className="space-y-3">
                {result.anomalies.map((a) => (
                  <li key={a.id} className="flex flex-col gap-1 border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${severityStyles[a.severity]}`}>
                        {a.severity}
                      </span>
                      <span className="text-xs text-neutral-500">
                        Confidence: {confidenceLabel(a.confidence)}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-900">{a.message}</p>
                    {a.lineRef && (
                      <p className="text-xs font-mono text-neutral-500 truncate" title={a.lineRef}>
                        {a.lineRef}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-3">
              RCA guesses
            </h2>
            {result.rcaGuesses.length === 0 ? (
              <p className="text-sm text-neutral-500">None.</p>
            ) : (
              <ul className="space-y-3">
                {result.rcaGuesses.map((r) => (
                  <li key={r.id} className="border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
                    <p className="text-sm text-neutral-900">{r.description}</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Confidence: {confidenceLabel(r.confidence)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-3">
              Recommended fixes
            </h2>
            {result.recommendedFixes.length === 0 ? (
              <p className="text-sm text-neutral-500">None.</p>
            ) : (
              <ul className="space-y-3">
                {result.recommendedFixes.map((f) => (
                  <li key={f.id} className="border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
                    <p className="font-medium text-neutral-900">{f.title}</p>
                    <p className="text-sm text-neutral-600 mt-0.5">{f.description}</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Confidence: {confidenceLabel(f.confidence)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
