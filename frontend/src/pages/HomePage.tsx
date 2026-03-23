import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

const capabilities = [
  {
    title: 'Incident detection',
    description:
      'Surfaces deployment and runtime failures from alerts, health checks, and error budgets—grouped into incidents with severity and ownership context.',
  },
  {
    title: 'Root cause analysis',
    description:
      'Builds a structured RCA from correlated signals: logs, events, resource state, and recent changes—not a single noisy stream.',
  },
  {
    title: 'Evidence correlation',
    description:
      'Ties namespaces, workloads, pods, events, and metrics into one evidence bundle so responders see the same picture.',
  },
  {
    title: 'Remediation recommendations',
    description:
      'Suggests concrete steps and commands ranked by fit to the incident, with clear sequencing for rollback-friendly changes.',
  },
  {
    title: 'Validation & safety checks',
    description:
      'Separates automated triage from human approval: confidence bands, review gates, and audit-friendly outputs before changes go live.',
  },
  {
    title: 'Multi-environment monitoring',
    description:
      'Track production, staging, and non-prod with environment-scoped views so drift and promotion issues are visible in context.',
  },
] as const;

const howItWorksSteps = [
  {
    step: 1,
    title: 'Collect',
    description: 'Ingest logs, events, and system state from your clusters and deployment pipeline.',
  },
  {
    step: 2,
    title: 'Correlate',
    description: 'Group related signals into incidents with timelines and impact scope.',
  },
  {
    step: 3,
    title: 'Diagnose',
    description: 'Identify likely root causes from correlated evidence and change history.',
  },
  {
    step: 4,
    title: 'Remediate',
    description: 'Generate remediation steps and commands tailored to the failure mode.',
  },
  {
    step: 5,
    title: 'Validate',
    description: 'Review confidence, verify fixes, and plan rollback before applying changes.',
  },
] as const;

export function HomePage() {
  return (
    <div className="-mx-4 overflow-x-hidden sm:-mx-6">
      {/* Hero */}
      <section className="relative border-b border-neutral-200 bg-white px-4 pt-14 pb-16 sm:px-6 sm:pt-16 sm:pb-20 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            NexusTrace · Incident monitoring & RCA
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Detect, diagnose, and resolve deployment failures in real time
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-neutral-600 sm:text-lg">
            NexusTrace monitors deployment incidents, identifies root causes from system evidence, and recommends
            validated remediation steps—built for engineers who need clarity under pressure.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link to="/dashboard">
              <Button className="w-full sm:w-auto px-5 py-2.5">Open dashboard</Button>
            </Link>
            <Link to="/analyze">
              <Button variant="secondary" className="w-full sm:w-auto px-5 py-2.5">
                Analyze incident
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-neutral-500">
            For SRE, DevOps, and platform teams.{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700 hover:underline">
              Sign in
            </Link>
            {' · '}
            <Link to="/signup" className="font-medium text-primary-600 hover:text-primary-700 hover:underline">
              Request access
            </Link>
          </p>
        </div>
      </section>

      {/* Capabilities */}
      <section className="relative bg-neutral-50/80 px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">Capabilities</h2>
            <p className="mt-3 text-base text-neutral-600">
              What the platform does in your stack—monitoring, analysis, and operational guidance end to end.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:border-neutral-300 hover:shadow-md sm:p-6"
              >
                <h3 className="text-base font-semibold text-neutral-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-neutral-200 bg-white px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">How it works</h2>
            <p className="mt-3 text-base text-neutral-600">
              A straight-line workflow from signal to action—aligned with how teams triage production incidents.
            </p>
          </div>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {howItWorksSteps.map((item) => (
              <li
                key={item.step}
                className="relative flex gap-4 rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 lg:flex-col lg:gap-3"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white"
                  aria-hidden
                >
                  {item.step}
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-neutral-900">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Closing */}
      <section className="border-t border-neutral-200 bg-neutral-50 px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-neutral-200 bg-white p-8 sm:p-10">
            <h2 className="text-xl font-bold text-neutral-900 sm:text-2xl">Operational incident workspace</h2>
            <p className="mt-3 max-w-2xl text-base text-neutral-600">
              Use the dashboard to monitor open incidents and drill into RCA. Use analysis to run evidence through the
              same pipeline when you are debugging ad hoc.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link to="/dashboard">
                <Button className="w-full sm:w-auto px-5 py-2.5">Open dashboard</Button>
              </Link>
              <Link to="/analyze">
                <Button variant="secondary" className="w-full sm:w-auto px-5 py-2.5">
                  Analyze incident
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
