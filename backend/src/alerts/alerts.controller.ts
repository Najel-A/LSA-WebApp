import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { alertsService } from './alerts.service';
import { createAlertFromExternalSource } from './alerts.service';
import type {
  AlertSeverity,
  AlertSourceType,
  AlertStatus,
  RcaConfidenceBand,
  RcaStatus,
} from './alerts.model';

function toAlertId(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  if (!mongoose.isValidObjectId(v)) return null;
  return v;
}

function toStringQuery(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

function mapListRow(doc: any) {
  return {
    id: String(doc._id),
    title: doc.title,
    severity: doc.severity,
    status: doc.status,
    environment: doc.environment,
    project: doc.project,
    total: doc.totalCount,
    lastSeen: new Date(doc.lastSeenAt).toISOString(),
    trend: Array.isArray(doc.trend) ? doc.trend : [],
    ips: doc.ips,
    people: doc.people,
    rcaStatus: doc.rcaStatus,
    rcaConfidence: doc.rcaConfidence,
  };
}

function mapDetail(doc: any) {
  return {
    ...mapListRow(doc),
    evidenceText: doc.evidenceText,
    rootCause: doc.rootCause,
    recommendedFix: doc.recommendedFix,
    recentEvents: Array.isArray(doc.recentEvents)
      ? doc.recentEvents.map((e: any) => ({
          message: e.message,
          timestamp: new Date(e.timestamp).toISOString(),
          level: e.level,
        }))
      : [],
    timeline: Array.isArray(doc.timeline)
      ? doc.timeline.map((e: any) => ({
          message: e.message,
          timestamp: new Date(e.timestamp).toISOString(),
          level: e.level,
        }))
      : [],
    source: doc.source,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
  };
}

type IngestBody = {
  title?: unknown;
  environment?: unknown;
  project?: unknown;
  status?: unknown;
  severity?: unknown;
  totalCount?: unknown;
  lastSeenAt?: unknown;
  trend?: unknown;
  ips?: unknown;
  people?: unknown;
  rcaStatus?: unknown;
  rcaConfidence?: unknown;
  evidenceText?: unknown;
  rootCause?: unknown;
  recommendedFix?: unknown;
  recentEvents?: unknown;
  timeline?: unknown;
  source?: unknown;
};

function isAlertStatus(v: unknown): v is AlertStatus {
  return v === 'active' || v === 'resolved' || v === 'muted';
}
function isAlertSeverity(v: unknown): v is AlertSeverity {
  return v === 'critical' || v === 'error' || v === 'warning' || v === 'info' || v === 'debug';
}
function isRcaStatus(v: unknown): v is RcaStatus {
  return v === 'pending' || v === 'analyzing' || v === 'validated' || v === 'needs_review';
}
function isRcaConfidence(v: unknown): v is RcaConfidenceBand {
  return v === 'low' || v === 'medium' || v === 'high';
}
function isSourceType(v: unknown): v is AlertSourceType {
  return v === 'seed' || v === 'prometheus' || v === 'cloudwatch' || v === 'manual' || v === 'system';
}

function asDate(v: unknown): Date | null {
  if (v instanceof Date) return v;
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function asNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  return null;
}

function asNumberArray(v: unknown): number[] | null {
  if (!Array.isArray(v)) return null;
  const out: number[] = [];
  for (const item of v) {
    if (typeof item !== 'number' || !Number.isFinite(item)) return null;
    out.push(item);
  }
  return out;
}

function asEventArray(v: unknown): Array<{ message: string; timestamp: Date; level?: string }> | null {
  if (v == null) return [];
  if (!Array.isArray(v)) return null;
  const out: Array<{ message: string; timestamp: Date; level?: string }> = [];
  for (const raw of v) {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Record<string, unknown>;
    if (typeof r.message !== 'string' || !r.message.trim()) return null;
    const ts = asDate(r.timestamp);
    if (!ts) return null;
    out.push({
      message: r.message,
      timestamp: ts,
      level: typeof r.level === 'string' ? r.level : undefined,
    });
  }
  return out;
}

function asSource(v: unknown): {
  sourceType: AlertSourceType;
  sourceRef?: string;
  labels?: Record<string, string>;
  tags?: string[];
  service?: string;
  namespace?: string;
  cluster?: string;
} | null {
  if (!v || typeof v !== 'object') return null;
  const r = v as Record<string, unknown>;
  if (!isSourceType(r.sourceType)) return null;
  const labels =
    r.labels && typeof r.labels === 'object' && !Array.isArray(r.labels)
      ? Object.fromEntries(
          Object.entries(r.labels as Record<string, unknown>).flatMap(([k, val]) =>
            typeof val === 'string' ? [[k, val]] : []
          )
        )
      : undefined;
  const tags = Array.isArray(r.tags) ? r.tags.filter((t) => typeof t === 'string') : undefined;
  return {
    sourceType: r.sourceType,
    sourceRef: typeof r.sourceRef === 'string' ? r.sourceRef : undefined,
    labels,
    tags,
    service: typeof r.service === 'string' ? r.service : undefined,
    namespace: typeof r.namespace === 'string' ? r.namespace : undefined,
    cluster: typeof r.cluster === 'string' ? r.cluster : undefined,
  };
}

export async function listAlerts(req: Request, res: Response): Promise<void> {
  const rows = await alertsService.list({
    environment: toStringQuery(req.query.environment),
    status: toStringQuery(req.query.status),
    severity: toStringQuery(req.query.severity),
    search: toStringQuery(req.query.search),
  });
  res.json(rows.map(mapListRow));
}

export async function getAlertById(req: Request, res: Response): Promise<void> {
  const id = toAlertId(req.params.id);
  if (!id) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }
  const doc = await alertsService.getById(id);
  if (!doc) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }
  res.json(mapDetail(doc));
}

export async function ingestAlert(req: Request, res: Response): Promise<void> {
  const body = (req.body ?? {}) as IngestBody;

  if (typeof body.title !== 'string' || !body.title.trim()) {
    res.status(400).json({ error: 'title is required' });
    return;
  }
  if (typeof body.environment !== 'string' || !body.environment.trim()) {
    res.status(400).json({ error: 'environment is required' });
    return;
  }
  const project = typeof body.project === 'string' && body.project.trim() ? body.project.trim() : 'Launchpad';

  const status: AlertStatus = isAlertStatus(body.status) ? body.status : 'active';
  const severity: AlertSeverity = isAlertSeverity(body.severity) ? body.severity : 'error';
  const totalCount = asNumber(body.totalCount) ?? 1;
  const lastSeenAt = asDate(body.lastSeenAt) ?? new Date();
  const trend = asNumberArray(body.trend) ?? [];
  const ips = asNumber(body.ips) ?? undefined;
  const people = asNumber(body.people) ?? undefined;
  const rcaStatus: RcaStatus = isRcaStatus(body.rcaStatus) ? body.rcaStatus : 'pending';
  const rcaConfidence: RcaConfidenceBand = isRcaConfidence(body.rcaConfidence) ? body.rcaConfidence : 'low';

  const recentEvents = asEventArray(body.recentEvents);
  if (recentEvents === null) {
    res.status(400).json({ error: 'recentEvents must be an array of {message,timestamp,level?}' });
    return;
  }
  const timeline = asEventArray(body.timeline);
  if (timeline === null) {
    res.status(400).json({ error: 'timeline must be an array of {message,timestamp,level?}' });
    return;
  }

  const source = asSource(body.source) ?? { sourceType: 'manual' as const };

  const doc = await createAlertFromExternalSource({
    title: body.title.trim(),
    environment: body.environment.trim(),
    project,
    status,
    severity,
    totalCount,
    lastSeenAt,
    trend,
    ips,
    people,
    rcaStatus,
    rcaConfidence,
    evidenceText: typeof body.evidenceText === 'string' ? body.evidenceText : undefined,
    rootCause: typeof body.rootCause === 'string' ? body.rootCause : undefined,
    recommendedFix: typeof body.recommendedFix === 'string' ? body.recommendedFix : undefined,
    recentEvents: recentEvents ?? [],
    timeline: (timeline ?? []) as any,
    source,
  });

  res.status(201).json(mapDetail(doc));
}

export async function seedAlerts(_req: Request, res: Response): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ error: 'Not Found' });
    return;
  }

  const now = Date.now();

  const seeds = [
    {
      title: 'TypeError: Cannot read property "config" of undefined',
      severity: 'error' as const,
      status: 'active' as const,
      environment: 'production',
      project: 'Launchpad',
      totalCount: 142,
      lastSeenAt: new Date(now - 60 * 60 * 1000),
      trend: [2, 5, 12, 8, 20, 35, 40, 20],
      ips: 12,
      people: 8,
      rcaStatus: 'validated' as const,
      rcaConfidence: 'high' as const,
      recentEvents: [
        {
          message: 'TypeError: Cannot read property "config" of undefined at Module.run (app.js:42)',
          timestamp: new Date(now - 55 * 60 * 1000),
          level: 'error',
        },
        {
          message: 'Same error at Component.mount (Component.js:18)',
          timestamp: new Date(now - 58 * 60 * 1000),
          level: 'error',
        },
        {
          message: 'Stack trace: at Object.getConfig (utils.js:102)',
          timestamp: new Date(now - 60 * 60 * 1000),
          level: 'error',
        },
      ],
      source: { sourceType: 'seed' as const, sourceRef: 'alert-1' },
    },
    {
      title: 'Unhandled promise rejection in async handler',
      severity: 'critical' as const,
      status: 'active' as const,
      environment: 'production',
      project: 'Launchpad',
      totalCount: 89,
      lastSeenAt: new Date(now - 3 * 60 * 60 * 1000),
      trend: [0, 1, 3, 10, 25, 30, 15, 5],
      ips: 5,
      people: 4,
      rcaStatus: 'analyzing' as const,
      rcaConfidence: 'medium' as const,
      recentEvents: [
        {
          message: 'UnhandledPromiseRejectionWarning: Error: Connection timeout',
          timestamp: new Date(now - 2 * 60 * 60 * 1000),
          level: 'critical',
        },
        {
          message: 'at async fetchData (api.js:77)',
          timestamp: new Date(now - 3 * 60 * 60 * 1000),
          level: 'critical',
        },
      ],
      source: { sourceType: 'seed' as const, sourceRef: 'alert-2' },
    },
    {
      title: 'DeprecationWarning: Buffer() is deprecated',
      severity: 'warning' as const,
      status: 'resolved' as const,
      environment: 'development',
      project: 'Launchpad',
      totalCount: 1203,
      lastSeenAt: new Date(now - 24 * 60 * 60 * 1000),
      trend: [100, 120, 110, 90, 80, 70, 60, 50],
      ips: 3,
      people: 2,
      rcaStatus: 'validated' as const,
      rcaConfidence: 'high' as const,
      recentEvents: [
        {
          message: 'DeprecationWarning: Buffer() is deprecated, use Buffer.alloc()',
          timestamp: new Date(now - 24 * 60 * 60 * 1000),
          level: 'warning',
        },
      ],
      source: { sourceType: 'seed' as const, sourceRef: 'alert-3' },
    },
    {
      title: 'ECONNREFUSED connecting to Redis',
      severity: 'error' as const,
      status: 'active' as const,
      environment: 'staging',
      project: 'Launchpad',
      totalCount: 34,
      lastSeenAt: new Date(now - 30 * 60 * 1000),
      trend: [0, 0, 2, 5, 8, 10, 6, 3],
      ips: 2,
      people: 2,
      rcaStatus: 'needs_review' as const,
      rcaConfidence: 'medium' as const,
      recentEvents: [
        {
          message: 'Redis connection refused at 127.0.0.1:6379',
          timestamp: new Date(now - 25 * 60 * 1000),
          level: 'error',
        },
        {
          message: 'Retry attempt 3 failed',
          timestamp: new Date(now - 30 * 60 * 1000),
          level: 'error',
        },
      ],
      source: { sourceType: 'seed' as const, sourceRef: 'alert-4' },
    },
    {
      title: 'Slow query detected (>2s): SELECT * FROM users',
      severity: 'info' as const,
      status: 'muted' as const,
      environment: 'production',
      project: 'Launchpad',
      totalCount: 56,
      lastSeenAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
      trend: [5, 8, 6, 4, 3, 2, 2, 1],
      ips: 4,
      people: 3,
      rcaStatus: 'pending' as const,
      rcaConfidence: 'low' as const,
      recentEvents: [
        {
          message: 'Slow query detected (>2s): SELECT * FROM users',
          timestamp: new Date(now - 2 * 24 * 60 * 60 * 1000),
          level: 'info',
        },
      ],
      source: { sourceType: 'seed' as const, sourceRef: 'alert-5' },
    },
  ];

  const inserted = await Promise.all(
    seeds.map((s) =>
      createAlertFromExternalSource({
        ...s,
        timeline: s.recentEvents,
        source: {
          ...s.source,
          labels: { seeded: 'true' },
          tags: ['seed'],
          service: 'launchpad-api',
          namespace: s.environment === 'production' ? 'prod' : s.environment === 'staging' ? 'staging' : 'dev',
        },
      })
    )
  );

  res.json({ ok: true, count: inserted.length });
}

