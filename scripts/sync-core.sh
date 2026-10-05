#!/usr/bin/env bash
# Edge Function 런타임은 supabase/ 밖을 볼 수 없어서 core 소스를 복사해 둔다.
# --check: 복사본이 원본과 다르면 실패 (CI·테스트용)
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=packages/core/src
DEST=supabase/functions/_shared/core
if [ "${1:-}" = "--check" ]; then
  diff -r "$SRC" "$DEST" > /dev/null || { echo "core copy is stale: run scripts/sync-core.sh" >&2; exit 1; }
  exit 0
fi
rm -rf "$DEST"
cp -R "$SRC" "$DEST"
