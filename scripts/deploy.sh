#!/usr/bin/env bash
set -e

# Run the Node.js deployment script passing all arguments
node "$(dirname "$0")/deploy.mjs" "$@"
