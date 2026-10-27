#!/usr/bin/env bash
# Quick helper to extract and print the active Cloudflare Tunnel URL from Docker logs.

URL=$(docker compose logs cloudflared 2>/dev/null | grep -o 'https://[^ ]*\.trycloudflare\.com' | tail -n 1)

if [ -n "$URL" ]; then
    echo "🌐 Cloudflare Public Tunnel URL:"
    echo "👉 $URL"
    echo ""
    echo "Useful links:"
    echo "  • Web App:       $URL"
    echo "  • API Docs:      $URL/api/docs"
    echo "  • Health Check:  $URL/api/health"
    echo "  • Meta Webhook:  $URL/api/v1/webhooks/meta"
    echo "  • Meta Callback: $URL/api/auth/facebook/callback"
    echo "  • TikTok CB:     $URL/api/auth/tiktok/callback"
else
    echo "⚠️ Cloudflare tunnel URL not found yet in container logs."
    echo "Check container status: docker compose logs cloudflared"
fi
