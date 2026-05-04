# LSA-WebApp — local setup

End-to-end setup for someone cloning the repo on a fresh Mac or Linux box. The stack is four containers (`mongo`, `backend`, `analyzer`, `frontend`) wired together by `docker-compose.yml`. The analyzer is a FastAPI service that runs a 4-agent inference pipeline against [Ollama](https://ollama.com) on the host.

## Prerequisites

- **Docker Desktop** (Mac/Windows) or Docker Engine + Compose plugin (Linux)
- **~16 GB RAM free** — three 7B-class models stay resident in Ollama
- **Ollama** running on the host (the stack reaches it via `host.docker.internal`)
- **Git**

You do **not** need Node, Python, or Mongo installed on the host — everything runs in containers.

## Setup

### 1. Clone and check out the working branch

```bash
git clone https://github.com/Najel-A/LSA-WebApp.git
cd LSA-WebApp
git checkout deploy/cloud-setup
```

### 2. Install Ollama and pull models

Mac:

```bash
brew install ollama
```

Linux:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Then start it and pull the three required models (one-time, ~5 min total):

```bash
ollama serve &
ollama pull qwen2.5:7b
ollama pull mistral:7b
ollama pull llama3.2:3b
```

Optional fourth model — a reasoning model used by `agent_2`. Skip it on RAM-constrained machines; `agent_2` will fall back to a stub diagnosis and the rest of the pipeline still runs end-to-end:

```bash
# ollama pull deepseek-r1:7b
```

### 3. Create the root `.env`

`.env` lives at the repo root and is gitignored. Compose substitutes its values into `docker-compose.yml`. Minimal working set:

```bash
cat > .env <<'EOF'
MODEL_TIMEOUT_S=600

RCA_QWEN_URL=http://host.docker.internal:11434
RCA_QWEN_MODEL=qwen2.5:7b

EXECUTOR_URL=http://host.docker.internal:11434
EXECUTOR_MODEL=mistral:7b

VALIDATOR_URL=http://host.docker.internal:11434
VALIDATOR_MODEL=llama3.2:3b

# Uncomment if your host already has mongod listening on 27017:
# MONGO_BIND=127.0.0.1:27018
EOF
```

`compose.env.example` in the repo has a fuller commented template if you want to see every knob.

### 4. Bring up the stack

```bash
docker compose up -d --build
```

After ~60 s, all four services should be healthy:

```bash
docker compose ps                       # every row should say (healthy)
curl http://localhost:8080/health       # backend, through nginx
curl http://localhost:8080/api/alerts   # [] until you seed
```

## Open the app

Visit **<http://localhost:8080/>**, sign up (Mongo starts empty so any email works), and you'll land on the dashboard.

## Populate the dashboard

The DB starts empty. Two ways to add incidents:

**Manual (one alert at a time):**

```bash
curl -X POST http://localhost:8080/api/alerts \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Test alert",
    "severity": "error",
    "status": "active",
    "environment": "staging",
    "evidenceText": "namespace: prod\nworkload: deployment/foo\n..."
  }'
```

**Seed script** *(not yet committed — see "Open work" below)*: a future `scripts/seed-dashboard.py` will POST a curated set of K8s + app-level incidents in one command.

## Run an analysis

Click any incident in the dashboard, then **Re-run analysis**. Expect **~50–80 s on first run** (qwen + mistral + llama3.2 are called sequentially through Ollama). Cold-start the first time; warm afterwards because Ollama keeps weights in RAM.

The five sections rendered in the UI come from the analyzer's `/query` response:

- **Diagnosis** — synthesized by `mistral` (reconciler), drawing on `qwen` and `deepseek` (or `qwen` + agent_2 stub) RCAs
- **Fix Plan / Commands / Verification / Rollback** — `mistral` and `llama3.2` JSON outputs, parsed by `agents/reconciler.py` and `agents/validator.py`

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `analyzer` container `unhealthy` | Ollama not running on host | `ollama serve &` |
| Mongo container fails to start, port conflict | Host has its own `mongod` on 27017 | Set `MONGO_BIND=127.0.0.1:27018` in `.env`, then `docker compose up -d` |
| `host.docker.internal` doesn't resolve from analyzer | Linux without Docker Desktop | Compose file already adds `extra_hosts: host-gateway` for `analyzer` — should work. If not, set the four `*_URL` to your host's LAN IP. |
| All agents report `stub` in notes | `*_URL` env vars not picked up | `.env` must be at the **repo root** (not inside `fastapi/`); then `docker compose up -d --force-recreate analyzer` |
| Analysis hits `TimeoutError` at 180s | Default `MODEL_TIMEOUT_S` too low for large evidence | Set `MODEL_TIMEOUT_S=600` in `.env`, recreate analyzer |
| First analysis much slower than later ones | Ollama loading weights into RAM (cold start) | Normal — subsequent analyses are faster |
| `Sending evidence to the analyzer…` UI hint says "~10 min" | UI copy is conservative; server cap is `MODEL_TIMEOUT_S` | Real runs are ~50–80 s. Override the UI hint with `VITE_NEXUSTRACE_ANALYZE_TIMEOUT_MS` at frontend build time. |

## Stopping / starting

```bash
docker compose down          # stop and remove containers (keeps Mongo volume)
docker compose down -v       # also delete the Mongo volume (wipes alerts)
docker compose up -d         # start again
```

To recreate just the analyzer (e.g. after editing `.env`):

```bash
docker compose up -d --force-recreate analyzer
```

## Open work

- [ ] Commit `scripts/seed-dashboard.py` so the dashboard can be populated in one command after fresh clone.
- [ ] Decide whether to keep `deepseek-r1:7b` in the recommended set or drop it permanently for speed.
