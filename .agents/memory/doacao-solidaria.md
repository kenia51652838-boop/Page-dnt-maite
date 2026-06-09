---
name: Doacao Solidaria project
description: Key architectural decisions and constraints for the Doacao Solidaria donation app
---

## Stack
- Frontend: React+Vite (`artifacts/doacao-solidaria`)
- Backend: Express (`artifacts/api-server`)
- Payment: Lumina Pagamentos — PIX-only, webhook-only (no status query endpoint)
- DB: PostgreSQL (Railway)
- Deploy: GitHub → Railway auto-deploy (service "Francis")

## Facebook Pixels
- Oitavo: `1507785031003753` (token: `FB_TOKEN_OITAVO`)
- Décimo: `1308311710742436` (token: `FB_TOKEN_DECIMO`)
- Onze: `2382122502268128` (token: `FB_TOKEN_ONZE`)
- UTMify pixel IDs: `["6a1a42664ab0aa7b96fc07a7", "6a1a42cb7171a791c254717e", "6a21a4785442ef354e657b3b"]`

## CAPI Deduplication Strategy
- Purchase: eventID = Lumina txId (e.g. `lum_abc123`) — used by browser fbq, CAPI direct, and UTMify
- InitiateCheckout: eventID = `checkout_${txId}` — browser + CAPI direct
- PageView: eventID = `pv_${Date.now()}_${random}` — browser fbq + UTMify server-side

## CAPI Field Rules
- CPF → `external_id: sha256(cpf)` (NEVER use `db` field — that means date of birth)
- `country: sha256("br")` always included
- `fbp`/`fbc` sent raw (not hashed)
- `custom_data`: contents, content_ids, content_type, num_items, order_id on Purchase

## Known Issues / Fixes Applied
- `trust proxy: true` on Express app — use `req.ip` not manual x-forwarded-for parsing
- Webhook retry (1s + 2s) before falling back to webhook-only data — fixes fbp missing on fast webhooks
- `ENOTFOUND base` on startup = non-critical secondary DB error, ignore
