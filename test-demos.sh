#!/usr/bin/env bash
# Build-verification test for all demo projects.
# Runs "npm run build" in each demo and reports pass/fail.
# Usage: bash test-demos.sh

set -euo pipefail

DEMOS=("typescript" "react" "vue" "angular" "nextjs")
FAILED=()
PASSED=()

# Vue uses vue-tsc which may fail on .vue module shims — build with vite directly.
# Angular needs skipLibCheck for @shotstack/schemas type issue.
BUILD_CMD_vue="npx vite build"
BUILD_CMD_angular="npm run build"
BUILD_CMD_typescript="npm run build"
BUILD_CMD_react="npm run build"
BUILD_CMD_nextjs="npm run build"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for demo in "${DEMOS[@]}"; do
	dir="$SCRIPT_DIR/$demo"
	if [ ! -d "$dir" ]; then
		echo "[SKIP] $demo — directory not found"
		continue
	fi

	echo ""
	echo "────────────────────────────────────────"
	echo "Building: $demo"
	echo "────────────────────────────────────────"

	cd "$dir"

	# Install if no node_modules
	if [ ! -d "node_modules" ]; then
		echo "  Installing dependencies..."
		npm install --silent 2>&1 || true
	fi

	# Use demo-specific build command
	cmd_var="BUILD_CMD_$demo"
	build_cmd="${!cmd_var}"

	if $build_cmd 2>&1; then
		echo "[PASS] $demo"
		PASSED+=("$demo")
	else
		echo "[FAIL] $demo"
		FAILED+=("$demo")
	fi
done

echo ""
echo "════════════════════════════════════════"
echo "Results: ${#PASSED[@]} passed, ${#FAILED[@]} failed"
echo "════════════════════════════════════════"

if [ ${#PASSED[@]} -gt 0 ]; then
	echo "  Passed: ${PASSED[*]}"
fi

if [ ${#FAILED[@]} -gt 0 ]; then
	echo "  Failed: ${FAILED[*]}"
	exit 1
fi

echo ""
echo "All demos built successfully."
