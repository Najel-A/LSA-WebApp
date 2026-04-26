import { api } from '@/services/api';
import type { AlertItem } from '@/types/alerts';

export type AlertEventDto = {
  message: string;
  timestamp: string;
  level?: string;
};

export type AlertDetailDto = AlertItem & {
  evidenceText?: string;
  rootCause?: string;
  recommendedFix?: string;
  recentEvents?: AlertEventDto[];
  timeline?: AlertEventDto[];
  source?: unknown;
  createdAt?: string;
  updatedAt?: string;
};

export type ListAlertsArgs = {
  environment?: string;
  status?: string;
  severity?: string;
  search?: string;
};

export const alertsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    alerts: builder.query<AlertItem[], ListAlertsArgs | void>({
      query: (args) => {
        const params = new URLSearchParams();
        if (args?.environment) params.set('environment', args.environment);
        if (args?.status) params.set('status', args.status);
        if (args?.severity) params.set('severity', args.severity);
        if (args?.search) params.set('search', args.search);
        const qs = params.toString();
        return `/api/alerts${qs ? `?${qs}` : ''}`;
      },
    }),

    alertById: builder.query<AlertDetailDto, string>({
      query: (id) => `/api/alerts/${id}`,
    }),
  }),
});

export const { useAlertsQuery, useAlertByIdQuery } = alertsApi;

