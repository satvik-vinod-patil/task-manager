
#!/bin/bash
set -e

BRANCH="${1:?Usage: ./deploy.sh develop|main}"

APP_DIR="/var/www/app"

echo "Deploying branch: $BRANCH"
cd "$APP_DIR"

# Update the server's checkout
git fetch origin
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

# Install backend production dependencies
cd "$APP_DIR/server"
npm ci --omit=dev

# Build the React frontend
cd "$APP_DIR/client"
npm ci
npm run build

# Restart the backend with PM2
cd "$APP_DIR/server"
pm2 restart task-manager-api --update-env || pm2 start npm --name task-manager-api -- start

# Save PM2's process list
pm2 save

echo "Deployment of $BRANCH completed successfully."
