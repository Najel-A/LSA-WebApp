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
      providesTags: (result) =>
        result
          ? [
              { type: 'Alerts' as const, id: 'LIST' },
              ...result.map((a) => ({ type: 'Alert' as const, id: a.id })),
            ]
          : [{ type: 'Alerts' as const, id: 'LIST' }],
    }),

    alertById: builder.query<AlertDetailDto, string>({
      query: (id) => `/api/alerts/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Alert' as const, id }],
    }),

    createAlert: builder.mutation<
      AlertDetailDto,
      {
        title: string;
        environment: string;
        project?: string;
        status?: AlertItem['status'];
        severity?: AlertItem['severity'];
        evidenceText?: string;
      }
    >({
      query: (body) => ({
        url: '/api/alerts',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Alerts', id: 'LIST' }],
    }),
  }),
});

export const { useAlertsQuery, useAlertByIdQuery, useCreateAlertMutation } = alertsApi;

