import { AlertModel, type AlertDoc, type AlertSourceMetadata } from './alerts.model';

export type ListAlertsQuery = {
  environment?: string;
  status?: string;
  severity?: string;
  search?: string;
};

export type ExternalAlertInput = {
  title: string;
  environment: string;
  project: string;
  status: AlertDoc['status'];
  severity: AlertDoc['severity'];
  totalCount: number;
  lastSeenAt: Date;
  trend: number[];
  ips?: number;
  people?: number;
  rcaStatus: AlertDoc['rcaStatus'];
  rcaConfidence: AlertDoc['rcaConfidence'];
  evidenceText?: string;
  rootCause?: string;
  recommendedFix?: string;
  recentEvents?: AlertDoc['recentEvents'];
  timeline?: AlertDoc['timeline'];
  source: AlertSourceMetadata;
};

function buildListFilter(q: ListAlertsQuery) {
  const filter: Record<string, unknown> = {};
  if (q.environment) filter.environment = q.environment;
  if (q.status) filter.status = q.status;
  if (q.severity) filter.severity = q.severity;
  if (q.search) {
    filter.title = { $regex: q.search, $options: 'i' };
  }
  return filter;
}

/**
 * Future ingestion can call this function with source metadata to upsert.
 * Dedupe key is (sourceType, sourceRef) when provided; otherwise insert new.
 */
export async function createAlertFromExternalSource(input: ExternalAlertInput): Promise<AlertDoc> {
  const canUpsert = Boolean(input.source?.sourceType && input.source?.sourceRef);
  const update = {
    $set: {
      title: input.title,
      environment: input.environment,
      project: input.project,
      status: input.status,
      severity: input.severity,
      totalCount: input.totalCount,
      lastSeenAt: input.lastSeenAt,
      trend: input.trend,
      ips: input.ips,
      people: input.people,
      rcaStatus: input.rcaStatus,
      rcaConfidence: input.rcaConfidence,
      evidenceText: input.evidenceText,
      rootCause: input.rootCause,
      recommendedFix: input.recommendedFix,
      recentEvents: input.recentEvents ?? [],
      timeline: input.timeline ?? [],
      source: input.source,
    },
  };

  if (canUpsert) {
    const doc = await AlertModel.findOneAndUpdate(
      { 'source.sourceType': input.source.sourceType, 'source.sourceRef': input.source.sourceRef },
      update,
      { upsert: true, new: true }
    );
    return doc;
  }

  return await AlertModel.create({
    ...input,
    recentEvents: input.recentEvents ?? [],
    timeline: input.timeline ?? [],
  });
}

export const alertsService = {
  async list(q: ListAlertsQuery) {
    const filter = buildListFilter(q);
    return await AlertModel.find(filter).sort({ lastSeenAt: -1 }).limit(200).lean();
  },

  async getById(id: string) {
    return await AlertModel.findById(id).lean();
  },
};

