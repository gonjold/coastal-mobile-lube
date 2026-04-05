#!/bin/bash
# Coastal Mobile Lube -- Overnight Pipeline
# Run AFTER WO-04 finishes in the interactive session
# Expected total time: 30-50 minutes

cd ~/coastal-mobile-lube

WORK_ORDERS=(
  "05-HERO-POLISH"
  "06-BOOKING-SEARCH"
  "07-RV-BUILD"
  "08-FLEET-VISUAL"
  "09-ADMIN-SIDEBAR"
  "10-SEO"
  "11-COPY-CLEANUP"
  "12-SECURITY"
)

echo "=== COASTAL OVERNIGHT PIPELINE STARTING at $(date) ==="
echo "=== ${#WORK_ORDERS[@]} Work Orders queued ==="

for wo in "${WORK_ORDERS[@]}"; do
  echo ""
  echo "============================================"
  echo "=== Starting WO-COASTAL-$wo at $(date) ==="
  echo "============================================"
  
  claude -p "Read and execute WO-COASTAL-$wo.md. Follow it exactly. Do NOT skip any steps. Do NOT rewrite entire files. After making changes, verify with grep or cat that your edits are actually in the source files before building. If a build fails, read the error and fix it before retrying the build." --dangerously-skip-permissions --max-turns 30 > "WO-$wo.log" 2>&1
  
  EXIT_CODE=$?
  echo "=== Finished WO-COASTAL-$wo at $(date) — exit code: $EXIT_CODE ==="
  
  if [ $EXIT_CODE -ne 0 ]; then
    echo "!!! WO-COASTAL-$wo FAILED with exit code $EXIT_CODE !!!"
  fi
  
  # Brief pause between WOs to avoid deploy collisions
  sleep 10
done

echo ""
echo "============================================"
echo "=== PIPELINE COMPLETE at $(date) ==="
echo "============================================"
echo ""
echo "Review logs:"
for wo in "${WORK_ORDERS[@]}"; do
  LINES=$(wc -l < "WO-$wo.log" 2>/dev/null || echo "0")
  echo "  WO-$wo.log — $LINES lines"
done
echo ""
echo "Quick check for no-ops:"
echo "  grep -l 'No changes\|no edits\|already done\|skipping' WO-*.log"
