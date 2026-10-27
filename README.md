# OmniChat CRM (ChhlatAI)

AI social-commerce CRM for Cambodian online shops, built from the Figma file
**AI Social Commerce CRM — UX/UI Flow**: one inbox for Telegram, Messenger, Instagram and TikTok, AI
auto-replies with sentiment priority and human takeover, KHQR invoices, payment-slip checking, bank
confirmation, stock deduction, courier hand-off and marketing broadcasts.

| Layer    | Stack |
|----------|-------|
| Backend  | Python 3.12+ · FastAPI · SQLAlchemy 2 · Alembic · Claude API (`anthropic`) |
| Database | PostgreSQL (SQL migrations in `backend/alembic/versions`) |
| Frontend | TypeScript · React 19 · Vite · Tailwind CSS v4 (Figma tokens in `src/index.css`) · TanStack Query |

## The three panels (from the Figma cover)

| Panel | URL | Who | What's in it |
|---|---|---|---|
| 1 · Super Admin | `/admin` | You & your team | Dashboard, shops management, subscriptions & billing, global AI model & prompts, announcements, error logs |
| 2 · Owner Dashboard | `/owner` | Shop owners | Overview/analytics, unified inbox, products & knowledge base, orders/invoices/ABA slips, marketing broadcast, channels · staff · shop settings |
| 3 · Staff Panel | `/staff` | Chat staff | Live chat (AI Auto-Pilot, Take over / Resume AI, AI Copilot, quick replies), quick products & prices, my orders & commission, profile |

The landing page (`/`) is the Figma landing page. Its product shots are the real Staff Panel components
rendered with demo data (ST-01 live chat, ST-02 human takeover, payment providers, send-to-delivery).

## Run with Docker (Recommended)

Run the entire stack (PostgreSQL, Redis, FastAPI backend, and Nginx frontend) with one command:

```bash
docker compose up --build -d
```

- **Frontend**: [http://localhost:5173](http://localhost:5173) (also on [http://localhost](http://localhost))
- **Backend API & Swagger Docs**: [http://localhost:8000/api/docs](http://localhost:8000/api/docs)
- **Database**: PostgreSQL on port `5434` (username: `chhlat`, password: `chhlat`, db: `chhlatai`)
- **Redis**: Port `6379`
- **Cloudflare Public Tunnel**: Automatically started in container (`chhlatai-cloudflared`).

To print your active public tunnel URL anytime:
```bash
./scripts/tunnel-url.sh
# or
docker compose logs cloudflared | grep -o 'https://.*\.trycloudflare\.com'
```

> The backend container automatically waits for PostgreSQL, applies Alembic migrations, and seeds initial demo data on first start.

### Live Development with Docker (Hot Reloading)

If you want code changes in `./backend` or `./frontend` to reload immediately inside containers:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

---

## Run manually without Docker

### 2. Backend — http://localhost:8000 (API docs at http://localhost:5173/api/docs)

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # set DATABASE_URL, JWT_SECRET, optional ANTHROPIC_API_KEY
alembic upgrade head            # creates all tables
python -m app.seed              # demo shop + logins (optional)
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend — http://localhost:5173

```bash
cd frontend
npm install
npm run dev
```

### Demo logins (after `python -m app.seed`)

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@omnichat.kh | Admin@12345 |
| Shop owner (Glow Skin Cambodia) | owner@glowskin.kh | Owner@12345 |
| Chat staff (Vanna) | vanna@glowskin.kh | Staff@12345 |

## How the flows work

**Response control** (`backend/app/services/inbox.py`): every customer message is classified 🟢 Normal /
🟡 Interested / 🔴 Angry-Urgent. Normal and Interested chats stay on **AI Auto-Pilot**. Angry, discount or
"can't answer" chats get a polite hand-off, are tagged **[Wait Staff 🔴]** (angry ones also **[High
Priority 🚨]**, pushed to the top, with a dashboard toast and a Telegram alert to the owner). Staff click **Take over**
(manual mode, AI paused), reply by text/photo/voice — replies go back through the customer's own app — then
**Resume AI**.

**Order → payment → delivery** (`backend/app/services/orders.py`): when the customer confirms, the AI
creates an invoice (`INV-…`) with a Bakong KHQR payload. A photo sent while an invoice is open is read as a
payment slip (Claude vision): amount, receiver, duplicate reference and confidence are checked. A match waits for
bank confirmation; a mismatch or low confidence goes to **human review** in Orders & Invoices. Once
paid, **Confirm & Print** deducts stock and fires low-stock alerts. **Send to delivery** books the courier, sends the
tracking link, and updates loyalty points and VIP status.

**Live updates**: the dashboards subscribe to `/api/v1/ws` (WebSocket) for new messages, conversation changes
and alerts.

## AI (Claude)

Set `ANTHROPIC_API_KEY` in `backend/.env`. Each inbound message is one structured-output call to
`claude-opus-5-5` (configurable in Super Admin → Global AI). It returns the sentiment, the hand-off decision, the reply,
product recommendations, order intent and customer facts. The shop catalogue and guides are prompt-cached. Payment slips use
Claude vision. Without a key, a built-in Khmer/English rule-based assistant runs, so everything still works
locally (slips then always go to human review).

## Connecting real channels and banks

| Integration | Status | What you need |
|---|---|---|
| Telegram bot | Implemented (webhook + replies + photos) | Bot token from @BotFather; `PUBLIC_BASE_URL` must be public HTTPS (e.g. ngrok/cloudflared). The webhook is registered automatically when you connect the channel. |
| Messenger + Instagram | Implemented (webhook verify, signature check, replies) | Meta app, page access token; webhook URL `…/api/v1/webhooks/meta`, verify token `META_VERIFY_TOKEN`, `META_APP_SECRET` |
| TikTok | Inbox only | TikTok messaging API is partner-gated; replies aren't sent automatically |
| Bakong KHQR | KHQR generation + `check_transaction_by_md5` for production accounts | Bakong developer token, account ID |
| ABA PayWay / ACLEDA | Generic signed callback `…/api/v1/webhooks/payments/{shop_id}?token=…` (shown in Settings → Payments) | Merchant credentials; map each provider's push-back payload to `{invoice_no, status, reference}` |
| J&T / VET / Grab | Booking interface with generated tracking numbers + printable QR slip | Courier partner API accounts to replace the stub in `send_to_delivery` |

In sandbox mode, use **"Sandbox: simulate bank confirmation"** on an order. In development you can also simulate
customers without any real channel: `POST /api/v1/conversations/simulate` (and `/simulate/image` for slips).

## Tests

```bash
cd backend && pytest        # uses the chhlatai_test database
cd frontend && npm run typecheck && npm run build
```

## Project layout

```
backend/app/
  models.py            SQLAlchemy models (shops, users, channels, customers, conversations, messages,
                       products, knowledge, orders, slips, deliveries, broadcasts, notifications…)
  routers/             auth, shop, catalog, conversations, orders, marketing, admin, webhooks, ws
  services/            ai (Claude + rules), inbox (response control), orders (payment → delivery),
                       payments (KHQR, slip checks, Bakong), channels (Telegram/Meta send), alerts
  seed.py              demo data matching the Figma screens
backend/alembic/       database migrations
frontend/src/
  components/ui/       Figma component board: Badge, Button, Channel, Avatar, Toggle, Input, StatCard, Nav/Rail item
  components/inbox/    Live chat: IconRail, InboxList, ChatWindow, MessageBubble, CopilotPanel, PriorityToast
  components/commerce/ Payment ProviderCard, SendToDelivery
  pages/landing/       Landing page (Figma) + demo fixtures
  pages/{admin,owner,staff,auth}/
frontend/public/figma/ SVG assets exported from the Figma file
```
