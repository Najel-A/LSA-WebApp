# Backend

In the backend each component will be a controller (HTTP Responses) and a service (Business Logic). Allows for each integration of new features
Example:
users/
user.controller.ts
user.model.ts
user.routes.ts

## Alerts ingestion

- `POST /api/alerts/ingest` inserts/upserts an alert into MongoDB (future Prometheus/CloudWatch/etc).
- Requires `ALERT_INGEST_API_KEY` to be set in the backend environment.
  - Send via `X-API-Key: <key>` or `Authorization: Bearer <key>`
- Dedupe/upsert uses `source.sourceType + source.sourceRef` when `sourceRef` is provided.