#!/bin/bash
set -e
echo "Stopping apiservice..."
if command -v pm2 &>/dev/null && pm2 list | grep -q "apiservice"; then
  pm2 stop apiservice || true
  pm2 delete apiservice || true
fi
echo "Done."
