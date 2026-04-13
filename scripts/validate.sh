#!/bin/bash
set -e
echo "Validating apiservice..."
sleep 5

# Check PM2 process is running
if ! pm2 list | grep -q "apiservice"; then
  echo "ERROR: apiservice is not running in PM2"
  exit 1
fi

# Check health endpoint
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/health || echo "000")
if [ "$HTTP_STATUS" != "200" ]; then
  echo "ERROR: Health check returned HTTP $HTTP_STATUS"
  exit 1
fi

echo "✓ apiservice is healthy (HTTP $HTTP_STATUS)"
