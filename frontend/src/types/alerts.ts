export type AlertSeverity = 'critical' | 'error' | 'warning' | 'info' | 'debug';
export type AlertStatus = 'active' | 'resolved' | 'muted';

export interface AlertItem {
  id: string;
  title: string;
  severity: AlertSeverity;
  status: AlertStatus;
  environment: string;
  project: string;
  total: number;
  lastSeen: string; // ISO date string
  trend: number[]; // sparkline values (e.g. last 24h buckets)
  ips?: number;
  people?: number;
}

export interface AlertEvent {
  id: string;
  alertId: string;
  message: string;
  timestamp: string; // ISO date string
  level?: string;
}

export type TimeRangeKey = '1h' | '24h' | '7d';
