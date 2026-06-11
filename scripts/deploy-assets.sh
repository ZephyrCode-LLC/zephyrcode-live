#!/usr/bin/env bash
# zephyrcode.live assets → S3 + CloudFront (BRIEF §5). AWS_PROFILE=lokam.
set -euo pipefail
CF_DIST_ID="${CF_DIST_ID:-E1OQXM5YAS7O9O}"
aws --profile lokam s3 sync ./assets "s3://zephyrcode-assets" \
  --cache-control 'public,max-age=31536000,immutable' --delete
aws --profile lokam cloudfront create-invalidation \
  --distribution-id "$CF_DIST_ID" --paths '/*'
