import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

// Update with project features later on
const features = [
  {
    title: 'Real-time deployment alerts',
    description:
      'Get notified immediately when something goes wrong with your cloud deployments.',
  },
  {
    title: 'Auto-resolve or escalate',
    description:
      'Know instantly whether our system can fix it automatically or if manual intervention is needed.',
  },
  {
    title: 'Cloud health at a glance',
    description:
      'Monitor deployment status across your infrastructure in one place.',
  },
  {
    title: 'Incident detection',
    description:
      'Smart detection of deployment failures, rollbacks, and configuration drift.',
  },
  {
    title: 'Actionable recommendations',
    description:
      'Clear guidance on what to do when manual intervention is required.',
  },
  {
    title: 'Multi-cloud support',
    description:
      'Works across AWS, GCP, Azure, and other cloud providers.',
  },
];

export function HomePage() {
  return (
    <div className="-mx-4 overflow-x-hidden sm:-mx-6">
      {/* Hero */}
      <section className="relative px-4 pt-16 pb-24 sm:px-6 sm:pt-24 sm:pb-32 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-primary-600 sm:text-base">
            Cloud Deployment Monitoring
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl md:text-6xl">
            Stay ahead of deployment issues.{' '}
            <span className="bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
              Auto-resolve or get alerted.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600 sm:text-xl">
            Get instant alerts when deployments fail. Know whether our system can
            resolve it automatically or when you need to step in.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/signup"
              className="inline-flex justify-center items-center rounded-lg bg-primary-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Get started free
            </Link>
            <Link to="/login">
              <Button variant="secondary" className="w-full sm:w-auto px-6 py-3">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-neutral-200 bg-white px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              Never miss a deployment incident
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
              Get clear visibility into what&apos;s failing and whether you need
              to intervene or let our system handle it.
            </p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-neutral-200 bg-neutral-50/50 p-6 transition-shadow hover:border-neutral-300 hover:shadow-md sm:p-8"
              >
                <h3 className="text-lg font-semibold text-neutral-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-neutral-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-neutral-200 bg-neutral-50 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Ready to stay on top of your deployments?
          </h2>
          <p className="mt-4 text-lg text-neutral-600">
            Get started and receive instant alerts when your cloud deployments
            need attention.
          </p>
          <div className="mt-10">
            <Link
              to="/signup"
              className="inline-flex justify-center items-center rounded-lg bg-primary-600 px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Get started free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
