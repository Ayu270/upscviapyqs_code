# 07 — System Architecture (full-stack HLD)

**Goal:** a high-level design for the production application — frontend, backend, database, auth,
payments, analytics/visualization, security, and deployment. Optimized for **cheap + open-source
first**, **privacy/security critical**, **UI-heavy + modern + scalable**, run as **Docker Compose
in Phase 1** and **Kubernetes later**.

This is **HLD only** — component responsibilities, tech choices, data flow, deployment topology.
No LLD (no schemas/endpoints). Pairs with `06-ui-architecture.md` (UI) and `03-rag-engine.md` (RAG).

---

## 0. Decisions (locked)

| Area | Decision |
|------|----------|
| Hosting | **Self-hosted OSS** on a cheap VPS; Docker Compose (P1) → Kubernetes (P2) |
| Backend + DB | **PostgreSQL** + dedicated **NestJS (Node/TypeScript)** API + **open-source auth** |
| Analytics/Viz | **OSS web analytics** + **embedded BI** for admins + **React charts** for students |
| Payments | **Razorpay** (hosted checkout → webhook → entitlement) |

> **Open-source first, with two pragmatic exceptions:** (1) **payments** always need a third-party
> provider (Razorpay); (2) a **free CDN/WAF in front (Cloudflare free tier)** for caching, TLS, and
> DDoS protection. Everything else self-hosted and open-source.

---

## 1. Tech stack

| Layer | Choice (OSS unless noted) | Why |
|------|----------------------------|-----|
| Frontend | **Next.js (App Router) + TypeScript + MUI** | SEO (SSG/ISR), modern UI-heavy app, one language with backend. See `06-ui-architecture.md`. |
| Backend API | **NestJS (Node/TypeScript)** | Structured, secure, same language as UI; clean modules for auth/payments/content. |
| Database | **PostgreSQL** (+ **pgvector**) | Battle-tested, relational, free; pgvector powers search/related-Qs. |
| Cache / queue | **Redis** + **BullMQ** | Caching hot data, sessions, rate-limit counters; async jobs (webhooks, emails, exports). |
| Object storage | **MinIO** (S3-compatible) | Self-hosted assets/exports/backups; S3 API → easy cloud move later. |
| Auth / IdP | **Authentik** (or Keycloak) | OSS OIDC/OAuth2, RBAC, MFA, audit. Authentik = lighter footprint; Keycloak = heavier but very mature. |
| Reverse proxy / TLS | **Traefik** (or Caddy) | Docker-native routing + auto Let's Encrypt TLS; maps cleanly to k8s ingress later. |
| Web analytics | **Umami** (privacy-first) | Cookieless, lightweight traffic analytics; aligns with privacy goal. PostHog optional for deep funnels later. |
| Admin BI | **Metabase** (+ **Grafana** for infra) | No-build admin dashboards over Postgres; embed signed dashboards into the admin UI. |
| Student charts | **MUI X Charts** (+ **Apache ECharts** for rich/interactive) | Consistent with MUI; ECharts for heavier visualizations. |
| Payments | **Razorpay** (SaaS) | India/UPI; ₹ annual pass. Hosted checkout keeps us out of PCI scope. |
| Email | Cheap transactional provider (SES/Brevo) | Magic links + receipts. **Don't self-host SMTP** (deliverability pain). |
| CDN / WAF | **Cloudflare** (free tier) | Edge cache, TLS, DDoS/WAF — free and improves scale + security. |
| RAG/content (later) | **Python FastAPI** worker + pgvector + Claude API | Separate service; Python for the ML/embedding ecosystem. See `03-rag-engine.md`. |
| Observability | **Prometheus + Grafana + Loki** | Metrics, dashboards, logs — the OSS "LGTM-lite" stack. |
| CI/CD | **GitHub Actions** + **GHCR** | Free build/registry; deploy via compose pull (P1) → Argo/Helm (P2). |

---

## 2. Architecture (container view)

```
                        Internet
                           │
                 Cloudflare (CDN · WAF · TLS · DDoS)        [free tier]
                           │
                  ┌──────────────────┐
                  │  Traefik (proxy) │  TLS termination, routing, rate-limit
                  └─────────┬────────┘
        ┌─────────────┬─────────────┬──────────────┬───────────────┐
   Next.js (UI)   NestJS (API)   Authentik      Umami         Metabase
   SSG/ISR+SSR    REST/BFF       (auth/OIDC)   (analytics)    (admin BI)
        │             │              │
        │       ┌─────┴──────┬───────┴────────┐
        │   PostgreSQL     Redis            MinIO            Python RAG
        │   (+pgvector)  (cache/queue)   (S3 assets)         worker (later)
        │
   (only the proxy is public; DB/Redis/MinIO live on a private Docker network)

   Razorpay (external)  ⇄  NestJS  (checkout order + signed webhook → entitlement)
   Observability: Prometheus scrapes all · Grafana dashboards · Loki logs
```

---

## 3. Component responsibilities

- **Next.js (UI)** — renders all pages; SSG/ISR for public/free content (SEO + CDN cache), SSR/client
  for the signed-in app. Acts as a thin BFF (calls the API server-side, holds no business rules).
- **NestJS (API)** — the single source of business logic: content access rules (free vs paid),
  user progress, payments/entitlements, admin queries, RAG proxy. Enforces **all** authorization.
- **PostgreSQL** — content, users/profiles, entitlements, orders, progress, embeddings (pgvector).
- **Redis** — cache (hot content, session/JWT denylist, rate limits) + BullMQ job queue.
- **Authentik** — identity provider: email sign-in (magic link/OTP), OAuth, **RBAC** (student/admin),
  **MFA for admins**, session + audit. API trusts its OIDC tokens.
- **MinIO** — images, generated exports, encrypted backups (S3 API).
- **Umami / Metabase / Grafana** — analytics & dashboards (see § 5).
- **Razorpay** — payment processing (see § 6).
- **Python RAG worker** — *later*; embeddings + Claude generation, gated by founder review.

---

## 4. Data model (high level)

```
users/profiles ─┬─ entitlements (plan, status, valid_until)     ← paid access
                ├─ orders (razorpay ids, amount, status)         ← payments
                └─ user_progress (attempts, bookmarks, revise, streaks)

content: prelims · mains · optional · frameworks   (each row: free|paid flag)
embeddings (pgvector)  → related-questions / semantic search
admin_audit_log        → every admin action (who/what/when)
```
Analytics events live in **Umami/PostHog**, not the app DB, to keep PII minimal and the core DB lean.

---

## 5. Analytics & visualization

**Two audiences, two toolchains:**

| Audience | Need | Tool |
|----------|------|------|
| **Students** | Progress rings, accuracy trends, subject heatmaps, streaks | **MUI X Charts** (simple) + **Apache ECharts** (rich/interactive), fed by the API |
| **Admins** | Traffic, sources, devices, geography | **Umami** (privacy-first web analytics) |
| **Admins** | Learning trends, popular questions, weak topics, conversion funnel, revenue | **Metabase** dashboards over Postgres, **embedded** (signed) into the admin UI |
| **Ops** | System metrics, errors, latency | **Grafana** + Prometheus + Loki |

Student charts are server-fed (no raw data dumps to the client). Admin BI is **embedded read-only**
and **role-gated** — Metabase signed embedding so admins never get direct DB access.

---

## 6. Payments (Razorpay) — critical path

```
UI "Get Pass" → API creates Razorpay order → Razorpay Checkout (hosted)
→ user pays (UPI/card) → Razorpay webhook → API verifies signature
→ writes entitlement (Postgres) → paid content unlocks
```
- **Hosted checkout** = card data never touches our servers → **out of PCI-DSS scope**.
- Webhook **signature verification** is mandatory; process idempotently (dedupe by payment id).
- Entitlement is the **server-side gate** for paid content (never trust the client).
- Refunds (7-day policy) + reconciliation handled via Razorpay APIs; all transitions audit-logged.

---

## 7. Security & data privacy (critical)

**Network & isolation**
- Only **Traefik** is publicly exposed; DB/Redis/MinIO/Authentik on a **private Docker network**.
- **Cloudflare** in front: WAF, DDoS, bot mitigation, TLS. VPS firewall: allow 80/443 + SSH only.

**Identity & access**
- OIDC via **Authentik**; **RBAC** (student vs admin); **MFA enforced for admins**.
- Short-lived **JWT access tokens** + rotating refresh; tokens in **httpOnly, Secure, SameSite** cookies.
- **Authorization enforced in the API** (least privilege), not the UI; paid content gated server-side.

**Data protection**
- **TLS everywhere** (Cloudflare ↔ Traefik ↔ services). **Encryption at rest** via encrypted volumes
  + encrypted DB backups (stored in MinIO/off-box).
- **PII minimization** — collect only email + progress; **cookieless analytics** (Umami).
- **Secrets** — Docker secrets/`.env` (P1) → **Vault** or **Sealed Secrets** (P2). Never in git.

**App hardening**
- Input validation (DTOs), output encoding, **CSRF** protection, **security headers** (Helmet),
  rate limiting (Redis), audit log for admin actions.
- **Image scanning** (Trivy), dependency/secret scanning in CI.

**Compliance**
- Align to **India DPDP Act 2023** + GDPR basics: consent, data export, **right to delete**,
  retention limits, a clear privacy policy. Razorpay handles payment-data compliance.

**Backups & DR**
- Automated nightly Postgres backups (encrypted, off-box, tested restores) + MinIO versioning.

---

## 8. Scalability (toward millions)

- **Cloudflare + SSG/ISR** absorb the bulk of read traffic (free/public content) at the edge —
  ~zero origin load. (Same principle as `06-ui-architecture.md` § 5.)
- **Stateless NestJS** → scale horizontally (more replicas behind Traefik).
- **Postgres**: connection pooling (**PgBouncer**), **read replicas** for analytics/heavy reads.
- **Redis** caches hot content + de-loads the DB; heavy/slow work pushed to **BullMQ workers**.
- **pgvector** for search/related-Qs; promote to a dedicated index if it grows.
- Phase 2 **Kubernetes HPA** autoscales API/UI on CPU/RPS.

---

## 9. Deployment

### Phase 1 — Docker Compose (single VPS, cheap)
One `docker-compose.yml` with services: `traefik`, `web` (Next.js), `api` (NestJS), `postgres`,
`redis`, `minio`, `authentik`, `umami`, `metabase`, plus observability (`prometheus`, `grafana`,
`loki`). Cloudflare in front. **GitHub Actions** builds images → **GHCR**; deploy by `compose pull`
+ `up -d` over SSH. Nightly encrypted backups via cron.

Recommended VPS: a single 4–8 GB box (e.g. Hetzner) is plenty to start; scale vertically first.

### Phase 2 — Kubernetes (when traffic/ops demand)
- Each service → a **Deployment + Service**; **Traefik/Nginx Ingress**; **HPA** for `web`/`api`.
- Postgres via an **operator** (CloudNativePG) with replicas, or a managed Postgres if preferred.
- **Helm** charts + **ArgoCD** (GitOps); **Sealed Secrets/Vault**; persistent volumes for stateful
  services (or move MinIO/DB to managed equivalents).
- Start cheap with **k3s**; graduate to managed k8s (EKS/GKE) only if needed.

> The compose service list and k8s manifests map 1:1 — same containers, different orchestrator —
> so Phase 1 is not throwaway.

---

## 10. Cost posture (Phase 1)

Effectively **one VPS + free tiers**: Cloudflare (free), GHCR (free), email provider (free tier),
Claude API (usage-based, only when RAG ships). Razorpay charges per transaction. Everything else is
open-source running on the box → near-zero fixed software cost.

---

## 11. Out of scope (Phase 1)

Native mobile app (web is responsive; see `06-ui-architecture.md` § 1A) · self-hosted email/SMTP ·
managed cloud services · the RAG/generation engine (design exists in `03-rag-engine.md`, build later).

---

## 12. Build order

1. **Infra skeleton** — compose with Traefik + Postgres + Redis + Next.js + NestJS hello-world over TLS.
2. **Auth** — Authentik + email sign-in; RBAC (student/admin); protected API.
3. **Content + UI** — migrate JSON → Postgres; Prelims Explorer + `/q/[id]` (per `06-`).
4. **Progress + student charts** — attempts/bookmarks/streaks + MUI X Charts.
5. **Payments** — Razorpay checkout + webhook + entitlement + paywall.
6. **Admin + analytics** — Umami + Metabase embedded; admin console (`06-` § 5B).
7. **Observability + backups + CI/CD** — Prometheus/Grafana/Loki, automated encrypted backups.
8. **Hardening** — security headers, rate limits, scans, pen-test pass.
9. **(Later)** RAG worker; Kubernetes migration.
