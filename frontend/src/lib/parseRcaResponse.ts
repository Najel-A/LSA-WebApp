import type { ParsedRcaSections } from '@/types/incidentAnalysis';

const EMPTY: ParsedRcaSections = {
  diagnosis: '',
  fixPlan: '',
  actions: '',
  verification: '',
  rollback: '',
};

type SectionKey = keyof ParsedRcaSections;

/** Match a line as a section header (Markdown # or plain). */
function matchSection(line: string): SectionKey | null {
  const t = line.trim();
  const stripped = t.replace(/^#+\s*/, '').replace(/\*+/g, '').trim();

  if (/^diagnosis$/i.test(stripped)) return 'diagnosis';
  if (/^step-by-step fix plan$/i.test(stripped) || /^fix plan$/i.test(stripped)) return 'fixPlan';
  if (
    /^concrete actions or commands/i.test(stripped) ||
    /^commands or actions/i.test(stripped) ||
    /^concrete actions$/i.test(stripped)
  ) {
    return 'actions';
  }
  if (/^verification steps/i.test(stripped) || /^verification$/i.test(stripped)) return 'verification';
  if (/^rollback guidance/i.test(stripped) || /^rollback$/i.test(stripped)) return 'rollback';
  return null;
}

/**
 * Parse model output that uses labeled sections like:
 * Diagnosis / Step-by-Step Fix Plan / Concrete Actions... / Verification... / Rollback...
 */
export function parseRcaResponse(raw: string): { sections: ParsedRcaSections; parseOk: boolean } {
  if (!raw?.trim()) {
    return { sections: EMPTY, parseOk: false };
  }

  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  let current: SectionKey | 'preamble' = 'preamble';
  const buffers: Record<SectionKey, string[]> = {
    diagnosis: [],
    fixPlan: [],
    actions: [],
    verification: [],
    rollback: [],
  };

  for (const line of lines) {
    const next = matchSection(line);
    if (next) {
      current = next;
      continue;
    }
    if (current === 'preamble') continue;
    buffers[current].push(line);
  }

  const trimJoin = (arr: string[]) => arr.join('\n').trim();

  const sections: ParsedRcaSections = {
    diagnosis: trimJoin(buffers.diagnosis),
    fixPlan: trimJoin(buffers.fixPlan),
    actions: trimJoin(buffers.actions),
    verification: trimJoin(buffers.verification),
    rollback: trimJoin(buffers.rollback),
  };

  const filled = Object.values(sections).filter(Boolean).length;
  const parseOk = filled >= 2 || sections.diagnosis.length > 80;

  return { sections, parseOk };
}
