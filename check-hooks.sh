#!/bin/bash
echo "=== CURRENT HOOK COUNT BY FEATURE ==="
find src/features -type d -name hooks | while read dir; do
  feature=$(echo $dir | cut -d/ -f3)
  count=$(find "$dir" -name "use-*.ts" -type f -not -path "*__tests__*" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$count" -gt 0 ]; then
    printf "%-20s %2d hooks " "$feature:" "$count"
    if [ "$count" -le 4 ]; then
      echo "✅ Compliant"
    else
      over=$((count - 4))
      echo "❌ $over over limit"
    fi
  fi
done

echo ""
echo "=== TOTAL ==="
total=$(find src/features -name "use-*.ts" -type f -not -path "*__tests__*" 2>/dev/null | wc -l | tr -d ' ')
echo "$total total hooks"

echo ""
echo "=== TARGET ==="
echo "Current: $total hooks"
echo "Max per feature: 4 hooks"
features=$(find src/features -type d -name hooks | wc -l | tr -d ' ')
echo "Features with hooks: $features"
echo "Theoretical max: $((features * 4)) hooks"
