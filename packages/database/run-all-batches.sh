#!/bin/bash
# Script to execute all seed-massive-batch files

export CLOUDFLARE_ACCOUNT_ID=6435a77d3ce17b7de468c6618e7b2b14

COUNT=0
TOTAL=$(ls seed-massive-batch-*.sql 2>/dev/null | wc -l)

for f in seed-massive-batch-*.sql; do
  COUNT=$((COUNT + 1))
  echo "[$COUNT/$TOTAL] Executing $f..."
  wrangler d1 execute perfex-db-staging --remote --file="$f" 2>&1 | tail -1
  if [ $? -ne 0 ]; then
    echo "ERROR on $f"
    exit 1
  fi
done

echo "Done! All $TOTAL batches executed successfully."
