import type { EvidenceSnippet } from '@/types/alerts';

interface ExplainabilityPanelProps {
  evidenceSnippets: EvidenceSnippet[];
  reasoningBullets: string[];
  modelsUsed: string[];
  systemValidated: boolean;
}

export function ExplainabilityPanel({
  evidenceSnippets,
  reasoningBullets,
  modelsUsed,
  systemValidated,
}: ExplainabilityPanelProps) {
  return (
    <details className="rounded-lg border border-neutral-200 bg-white shadow-sm group">
      <summary className="cursor-pointer list-none px-5 py-3 sm:px-6 sm:py-4 flex items-center justify-between gap-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 rounded-lg [&::-webkit-details-marker]:hidden">
        <span>Supporting evidence & how this was derived</span>
        <span className="text-neutral-400 text-xs group-open:rotate-180 transition-transform">▼</span>
      </summary>
      <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0 border-t border-neutral-100 space-y-4">
        {evidenceSnippets.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
              Key log / event snippets
            </h4>
            <ul className="space-y-2">
              {evidenceSnippets.map((e) => (
                <li
                  key={e.id}
                  className="text-xs font-mono bg-neutral-50 border border-neutral-100 rounded-md p-2 text-neutral-800"
                >
                  {e.source && <span className="text-neutral-500 not-italic mr-2">[{e.source}]</span>}
                  {e.text}
                </li>
              ))}
            </ul>
          </div>
        )}
        {reasoningBullets.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
              Reasoning
            </h4>
            <ul className="list-disc list-inside text-sm text-neutral-700 space-y-1">
              {reasoningBullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex flex-wrap gap-2 items-center text-xs text-neutral-600">
          <span className="font-medium text-neutral-500">Models:</span>
          {modelsUsed.map((m) => (
            <span key={m} className="rounded-md bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700">
              {m}
            </span>
          ))}
          <span
            className={`rounded-md px-2 py-0.5 font-medium ${
              systemValidated ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            {systemValidated ? 'System validated' : 'Not system-validated'}
          </span>
        </div>
      </div>
    </details>
  );
}
