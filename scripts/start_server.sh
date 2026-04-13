#!/bin/bash
set -e
cd /app/apiservice
echo "Starting apiservice with PM2..."
pm2 start dist/server.js \
  --name apiservice \
  --env production \
  --update-env \
  --no-autorestart=false
pm2 save
echo "Done."
