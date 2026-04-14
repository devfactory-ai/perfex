#!/bin/bash
# Temporary cleanup script - delete non-bakery pages
PAGES="/Users/yastec/devfactory/perfex/apps/web/src/pages"
COMPS="/Users/yastec/devfactory/perfex/apps/web/src/components"

for dir in cardiology crm dialyse imaging-ai integrations manufacturing ophthalmology patient-portal payroll population-health procurement projects rpm sales workflows; do
  if [ -d "$PAGES/$dir" ]; then
    for f in "$PAGES/$dir"/*; do
      rm "$f"
    done
    rmdir "$PAGES/$dir"
  fi
done

# Delete component dirs
for dir in ai healthcare; do
  if [ -d "$COMPS/$dir" ]; then
    for f in "$COMPS/$dir"/*; do
      rm "$f"
    done
    rmdir "$COMPS/$dir"
  fi
done

# Delete modal files
for f in CompanyModal.tsx ContactModal.tsx OpportunityModal.tsx ProjectModal.tsx; do
  rm "$COMPS/$f" 2>/dev/null
done

# Delete useHealthcare hook
rm "$PAGES/../hooks/useHealthcare.ts" 2>/dev/null

echo "Cleanup complete"
