"""Convenience entrypoint for local development.

Usage:
    source .venv/bin/activate && python main.py
    # or
    python3 main.py
    # or
    uvicorn app.main:app --reload --port 8000
"""

import sys
import uvicorn

if __name__ == "__main__":
    print("🚀 Starting OmniChat CRM API on http://localhost:8000 ...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
