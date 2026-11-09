# FRIDAY Phase 2 — authenticated API

Worker: `friday`  
URL: https://friday.rkanashik.workers.dev  
Supabase project: `friday-production` (`sohpyxrftoylivxdvfgk`), Mumbai region.

## Routes
- `GET /health` — health/configuration status.
- `POST /v1/auth/verify` — validates a Supabase access token through Supabase Auth.
- `POST /v1/chat` — authenticated chat; Ollama primary, Gemini fallback.

This is chat-only. It does not execute tools, send messages, place calls, or control devices.
Chat history is not persisted yet. The current database policy permits user-message
inserts but blocks ordinary clients from inserting assistant messages; preserve that
protection and implement a narrowly scoped server-side write path next.

## Cloudflare configuration
In Workers & Pages → `friday` → Settings → Variables and Secrets:

Plaintext variables:
- `SUPABASE_URL` = `https://sohpyxrftoylivxdvfgk.supabase.co`
- `OLLAMA_MODEL` = `minimax-m3:cloud`
- `GEMINI_MODEL` = leave blank until a model is selected
- `OLLAMA_FREE_CREDITS_CONFIRMED` = `false`
- `GEMINI_FREE_TIER_CONFIRMED` = `false`

Secrets:
- `SUPABASE_PUBLISHABLE_KEY` = the project's publishable key
- `OLLAMA_API_KEY` = your Ollama API key
- `GEMINI_API_KEY` = your Gemini API key

Do not paste credentials into chat or commit them to source control. Use Cloudflare's
Secret type for provider keys. Keep both allowance flags false until the exact
provider account/model confirms zero-charge usage. Free signup does not guarantee
all model inference is free.

## Deploy
Replace the source in the existing `friday` Worker with `worker.js`, save, and deploy.
Add the variables and secrets above. Do not enable either free-allowance flag until
verified. This Worker has no npm runtime dependencies.

## API test examples
Use a real access token from a signed-in Supabase Auth session:

```bash
curl -X POST https://friday.rkanashik.workers.dev/v1/auth/verify \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN"
```

```bash
curl -X POST https://friday.rkanashik.workers.dev/v1/chat \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello Friday"}'
```
