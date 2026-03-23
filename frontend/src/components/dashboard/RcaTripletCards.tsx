import { Card } from '@/components/ui/Card';
import type { AlertRcaDetail, RcaConfidenceBand, ValidationState } from '@/types/alerts';

type Triplet = Pick<AlertRcaDetail, 'rootCause' | 'recommendedFix' | 'validation'>;

function confidencePct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

const bandStyles: Record<RcaConfidenceBand, string> = {
  low: 'bg-neutral-100 text-neutral-700',
  medium: 'bg-amber-100 text-amber-800',
  high: 'bg-emerald-100 text-emerald-800',
};

function validationLabel(s: ValidationState): string {
  switch (s) {
    case 'validated_by_system':
      return 'Validated by system';
    case 'needs_review':
      return 'Needs review';
    case 'pending_validation':
      return 'Pending validation';
    default:
      return s;
  }
}

interface RcaTripletCardsProps {
  data: Triplet;
  className?: string;
}

export function RcaTripletCards({ data, className = '' }: RcaTripletCardsProps) {
  const { rootCause, recommendedFix, validation } = data;

  return (
    <div className={`grid gap-4 sm:grid-cols-1 lg:grid-cols-3 ${className}`}>
      <Card className="!p-5 sm:!p-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
          Likely root cause
        </h3>
        <p className="text-sm font-medium text-neutral-900 leading-snug">{rootCause.summary}</p>
        <p className="mt-2 text-xs text-neutral-500">
          Category: <span className="text-neutral-700">{rootCause.category}</span>
        </p>
        <p className="mt-2 text-xs text-neutral-500">
          Model confidence: <strong className="text-neutral-800">{confidencePct(rootCause.confidence)}</strong>
        </p>
      </Card>

      <Card className="!p-5 sm:!p-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
          Recommended fix
        </h3>
        <ol className="list-decimal list-inside space-y-1.5 text-sm text-neutral-700">
          {recommendedFix.steps.map((step, i) => (
            <li key={i} className="leading-snug">
              {step}
            </li>
          ))}
        </ol>
        {recommendedFix.command && (
          <pre className="mt-3 text-xs font-mono bg-neutral-50 border border-neutral-200 rounded-md p-2 overflow-x-auto text-neutral-800">
            {recommendedFix.command}
          </pre>
        )}
      </Card>

      <Card className="!p-5 sm:!p-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
          Confidence & validation
        </h3>
        <div className="flex flex-wrap gap-2 mb-3">
          <span
            className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${bandStyles[validation.confidenceLevel]}`}
          >
            {validation.confidenceLevel} confidence
          </span>
        </div>
        <p className="text-sm text-neutral-800 font-medium">{validationLabel(validation.status)}</p>
        <p className="mt-2 text-xs text-neutral-500 leading-relaxed">
          {validation.status === 'validated_by_system' &&
            'Automated checks aligned this incident with known patterns.'}
          {validation.status === 'needs_review' &&
            'Human review is recommended before acting on remediation.'}
          {validation.status === 'pending_validation' &&
            'Not enough corroborating evidence yet for automatic validation.'}
        </p>
      </Card>
    </div>
  );
}
