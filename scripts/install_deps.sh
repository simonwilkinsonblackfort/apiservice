#!/bin/bash
set -e
cd /app/apiservice
echo "Installing production dependencies..."
npm ci --omit=dev
echo "Done."
