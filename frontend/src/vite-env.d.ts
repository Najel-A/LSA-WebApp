/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  /** Full URL to POST body (e.g. http://127.0.0.1:8000/query). Overrides default /query + Vite proxy. */
  readonly VITE_NEXUSTRACE_ANALYZE_URL?: string;
  /** Client fetch timeout (ms) for model inference. If unset, derived from request max_time + buffer. */
  readonly VITE_NEXUSTRACE_ANALYZE_TIMEOUT_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
