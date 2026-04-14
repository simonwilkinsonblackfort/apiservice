#!/bin/bash
set -e
cd /app/apiservice
echo "Starting apiservice with PM2..."
if pm2 list | grep -q "apiservice"; then
  pm2 reload apiservice --update-env
else
  pm2 start dist/server.js \
    --name apiservice \
    --no-autorestart=false
fi
pm2 save
echo "Done."
