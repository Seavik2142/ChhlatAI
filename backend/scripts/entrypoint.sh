#!/usr/bin/env bash
set -e

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
python - << 'EOF'
import os
import sys
import time
import psycopg

db_url = os.environ.get("DATABASE_URL", "")
if not db_url:
    print("⚠️ No DATABASE_URL provided, skipping DB ready check.")
    sys.exit(0)

raw_url = db_url.replace("postgresql+psycopg://", "postgresql://")

max_retries = 30
for attempt in range(1, max_retries + 1):
    try:
        with psycopg.connect(raw_url, connect_timeout=3) as conn:
            print("✅ PostgreSQL is reachable!")
            sys.exit(0)
    except Exception as exc:
        print(f"⏳ Waiting for PostgreSQL ({attempt}/{max_retries}): {exc}")
        time.sleep(1)

print("❌ Could not connect to PostgreSQL within 30 seconds.", file=sys.stderr)
sys.exit(1)
EOF

# Run database migrations unless explicitly disabled (e.g. in background workers)
if [ "${SKIP_MIGRATIONS:-false}" != "true" ]; then
    echo "🔄 Running Alembic database migrations..."
    alembic upgrade head
else
    echo "⏭️ Skipping Alembic migrations (SKIP_MIGRATIONS=true)"
fi

# Seed initial/demo data unless explicitly disabled
if [ "${SKIP_SEED:-false}" != "true" ]; then
    echo "🌱 Checking and seeding initial demo data..."
    python -m app.seed || echo "⚠️ Seeding skipped or encountered non-fatal error"
fi

echo "🚀 Starting OmniChat CRM API..."
exec "$@"
