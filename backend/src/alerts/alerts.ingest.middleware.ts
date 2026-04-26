import type { Request, Response, NextFunction } from 'express';

function extractApiKey(req: Request): string | null {
  const headerKey = req.header('x-api-key');
  if (headerKey && headerKey.trim()) return headerKey.trim();

  const auth = req.header('authorization');
  if (auth && auth.toLowerCase().startsWith('bearer ')) {
    const token = auth.slice('bearer '.length).trim();
    if (token) return token;
  }

  return null;
}

/**
 * Simple API-key protection for external ingestion (Prometheus/CloudWatch/etc).
 * Configure with ALERT_INGEST_API_KEY env var.
 */
export function requireIngestApiKey(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env.ALERT_INGEST_API_KEY;
  if (!expected) {
    res.status(503).json({ error: 'Alert ingest not configured' });
    return;
  }

  const provided = extractApiKey(req);
  if (!provided || provided !== expected) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}

