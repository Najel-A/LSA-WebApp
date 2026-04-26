import mongoose from 'mongoose';

export type AlertStatus = 'active' | 'resolved' | 'muted';
export type AlertSeverity = 'critical' | 'error' | 'warning' | 'info' | 'debug';
export type RcaStatus = 'pending' | 'analyzing' | 'validated' | 'needs_review';
export type RcaConfidenceBand = 'low' | 'medium' | 'high';

export type AlertSourceType = 'seed' | 'prometheus' | 'cloudwatch' | 'manual' | 'system';

export interface AlertEvent {
  message: string;
  timestamp: Date;
  level?: string;
}

export interface AlertSourceMetadata {
  sourceType: AlertSourceType;
  sourceRef?: string;
  labels?: Record<string, string>;
  tags?: string[];
  service?: string;
  namespace?: string;
  cluster?: string;
}

export interface AlertDoc extends mongoose.Document {
  title: string;
  environment: string;
  project: string;
  status: AlertStatus;
  severity: AlertSeverity;
  totalCount: number;
  lastSeenAt: Date;
  trend: number[];
  ips?: number;
  people?: number;
  rcaStatus: RcaStatus;
  rcaConfidence: RcaConfidenceBand;
  evidenceText?: string;
  rootCause?: string;
  recommendedFix?: string;
  recentEvents?: AlertEvent[];
  timeline?: AlertEvent[];
  source?: AlertSourceMetadata;
  watcherUserIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const AlertEventSchema = new mongoose.Schema<AlertEvent>(
  {
    message: { type: String, required: true },
    timestamp: { type: Date, required: true },
    level: { type: String, required: false },
  },
  { _id: false }
);

const AlertSourceSchema = new mongoose.Schema<AlertSourceMetadata>(
  {
    sourceType: {
      type: String,
      required: true,
      enum: ['seed', 'prometheus', 'cloudwatch', 'manual', 'system'],
      index: true,
    },
    sourceRef: { type: String, required: false, index: true },
    labels: { type: Object, required: false },
    tags: { type: [String], required: false },
    service: { type: String, required: false, index: true },
    namespace: { type: String, required: false, index: true },
    cluster: { type: String, required: false, index: true },
  },
  { _id: false }
);

const AlertSchema = new mongoose.Schema<AlertDoc>(
  {
    title: { type: String, required: true, index: true },
    environment: { type: String, required: true, index: true },
    project: { type: String, required: true, index: true },
    status: { type: String, required: true, enum: ['active', 'resolved', 'muted'], index: true },
    severity: { type: String, required: true, enum: ['critical', 'error', 'warning', 'info', 'debug'], index: true },
    totalCount: { type: Number, required: true, default: 0 },
    lastSeenAt: { type: Date, required: true, index: true },
    trend: { type: [Number], required: true, default: [] },
    ips: { type: Number, required: false },
    people: { type: Number, required: false },
    rcaStatus: { type: String, required: true, enum: ['pending', 'analyzing', 'validated', 'needs_review'], index: true },
    rcaConfidence: { type: String, required: true, enum: ['low', 'medium', 'high'] },
    evidenceText: { type: String, required: false },
    rootCause: { type: String, required: false },
    recommendedFix: { type: String, required: false },
    recentEvents: { type: [AlertEventSchema], required: false, default: [] },
    timeline: { type: [AlertEventSchema], required: false, default: [] },
    source: { type: AlertSourceSchema, required: false },
    watcherUserIds: { type: [String], required: false, default: [] },
  },
  {
    collection: 'alerts',
    timestamps: true,
  }
);

AlertSchema.index({ 'source.sourceType': 1, 'source.sourceRef': 1 });

export const AlertModel =
  (mongoose.models.Alert as mongoose.Model<AlertDoc>) ||
  mongoose.model<AlertDoc>('Alert', AlertSchema);

