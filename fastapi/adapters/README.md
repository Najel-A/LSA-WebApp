## LoRA adapters for the model containers

The four model images you selected:

- `deveshs18/rca-lora-qwen`
- `deveshs18/rca-lora-deepseek`
- `mrunalikatta/executor-mistral-24b`
- `mrunalikatta/validator-llama-3b`

start a FastAPI server that **requires** a LoRA adapter directory mounted at `ADAPTER_PATH`
(default `/adapters`) containing at minimum:

- `adapter_config.json`
- LoRA weight files (whatever the adapter produced)
- optionally `chat_template.jinja` (recommended by the image code if the tokenizer lacks a template)

### Expected local layout (for Docker Compose)

Create these folders and place the matching adapter artifacts inside:

- `fastapi/adapters/qwen/`
- `fastapi/adapters/deepseek/`
- `fastapi/adapters/executor-mistral/`
- `fastapi/adapters/validator-llama/`

Then bring up the model containers with:

```bash
docker compose --profile models up -d
```

and set analyzer URLs in your `.env` (repo root) as shown in `compose.env.example`.

### Kubernetes

In Kubernetes you’ll typically mount the same adapter directories from a PVC (or an object-store
sync sidecar) at `/adapters` in each model Pod.
