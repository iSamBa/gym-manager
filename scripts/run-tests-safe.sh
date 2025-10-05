#!/bin/bash
# Safe test runner that prevents hanging processes
# Usage: ./scripts/run-tests-safe.sh [--full|--summary|--coverage]

set -e

MODE="${1:---summary}"
TEMP_FILE="/tmp/vitest-output-$$.txt"
MAX_TIMEOUT=180  # 3 minutes

# Check if gtimeout (GNU coreutils) is available, fallback to perl-based timeout
if command -v gtimeout &> /dev/null; then
  TIMEOUT_CMD="gtimeout"
elif command -v timeout &> /dev/null; then
  TIMEOUT_CMD="timeout"
else
  # macOS fallback: use perl-based timeout
  TIMEOUT_CMD="perl -e 'alarm shift @ARGV; exec @ARGV' --"
fi

# Cleanup function
cleanup() {
  # Remove temp file
  rm -f "$TEMP_FILE"

  # Check for hanging vitest processes
  if pgrep -f "vitest" > /dev/null 2>&1; then
    echo "⚠️  Warning: Cleaning up hanging vitest processes..."
    pkill -f "vitest" 2>/dev/null || true
  fi
}

# Set trap to cleanup on exit
trap cleanup EXIT INT TERM

echo "🧪 Running tests with process cleanup protection..."
echo "   Mode: $MODE"
echo "   Timeout: ${MAX_TIMEOUT}s"
echo ""

# Run tests based on mode
case "$MODE" in
  --full)
    # Run tests and show full output
    npm test 2>&1 | tee "$TEMP_FILE"
    EXIT_CODE=${PIPESTATUS[0]}
    ;;
  --coverage)
    # Run with coverage
    npm run test:coverage 2>&1 | tee "$TEMP_FILE"
    EXIT_CODE=${PIPESTATUS[0]}
    ;;
  --summary|*)
    # Default: Run tests, save to temp, show summary
    echo "Running tests (output will be shown after completion)..."
    npm test > "$TEMP_FILE" 2>&1
    EXIT_CODE=$?

    echo ""
    echo "📊 Test Summary:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Show relevant parts of output
    if [ $EXIT_CODE -eq 0 ]; then
      # Show last 30 lines (includes summary)
      tail -30 "$TEMP_FILE"
    else
      echo "❌ Tests failed! Showing error details..."
      echo ""
      # Show failures and summary
      grep -A 5 "FAIL\|Error\|✗" "$TEMP_FILE" | head -50 || tail -50 "$TEMP_FILE"
    fi
    ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verify cleanup
if pgrep -f "vitest" > /dev/null 2>&1; then
  echo "⚠️  Vitest processes detected, forcing cleanup..."
  pkill -f "vitest" || true
  sleep 1
fi

# Final verification
REMAINING=$(pgrep -f "vitest" | wc -l || echo "0")
if [ "$REMAINING" -gt 0 ]; then
  echo "❌ Warning: $REMAINING vitest process(es) still running"
  echo "   Run: pkill -9 -f vitest"
else
  echo "✅ All test processes cleaned up successfully"
fi

exit $EXIT_CODE
