import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import type { ParsedRcaSections } from '@/types/incidentAnalysis';

function SectionCard({
  title,
  children,
  mono,
}: {
  title: string;
  children: ReactNode;
  mono?: boolean;
}) {
  return (
    <Card>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-3">{title}</h2>
      {children ? (
        <div
          className={`text-sm text-neutral-800 leading-relaxed whitespace-pre-wrap ${mono ? 'font-mono text-xs' : ''}`}
        >
          {children}
        </div>
      ) : (
        <p className="text-sm text-neutral-500">No content for this section.</p>
      )}
    </Card>
  );
}

interface RcaWorkspaceSectionsProps {
  sections: ParsedRcaSections;
  parseOk: boolean;
  rawResponse: string;
}

export function RcaWorkspaceSections({ sections, parseOk, rawResponse }: RcaWorkspaceSectionsProps) {
  const hasAny =
    sections.diagnosis ||
    sections.fixPlan ||
    sections.actions ||
    sections.verification ||
    sections.rollback;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-1">
        <SectionCard title="Diagnosis">{sections.diagnosis}</SectionCard>
        <SectionCard title="Fix plan">{sections.fixPlan}</SectionCard>
        <SectionCard title="Commands / actions" mono>
          {sections.actions}
        </SectionCard>
        <SectionCard title="Verification">{sections.verification}</SectionCard>
        <SectionCard title="Rollback guidance">{sections.rollback}</SectionCard>
      </div>

      {(!parseOk || !hasAny) && rawResponse.trim() && (
        <Card className="border-amber-200 bg-amber-50/40">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-900 mb-2">
            Model output (unparsed or partial)
          </h2>
          <p className="text-xs text-amber-900/80 mb-2">
            Sections could not be fully mapped. Full response is shown below.
          </p>
          <pre className="text-xs font-mono text-neutral-800 whitespace-pre-wrap overflow-x-auto max-h-[28rem] overflow-y-auto">
            {rawResponse}
          </pre>
        </Card>
      )}
    </div>
  );
}
