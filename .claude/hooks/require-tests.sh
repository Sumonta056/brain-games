#!/usr/bin/env bash
set -u
ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$ROOT" || exit 0

is_exempt() {
  case "$1" in
    app/app.vue|app/components/games/registry.ts|app/layouts/*|app/data/*|app/assets/*|shared/types/*|*.d.ts) return 0 ;;
  esac
  return 1
}

spec_for() {
  local rel="${1#app/}"
  local dir name
  dir="$(dirname "$rel")"
  name="$(basename "$rel")"
  name="${name%.*}"
  if [ "$dir" = "." ]; then
    printf 'test/nuxt/%s.spec.ts' "$name"
  else
    printf 'test/nuxt/%s/%s.spec.ts' "$dir" "$name"
  fi
}

missing_specs() {
  local f
  for f in "$@"; do
    case "$f" in "$ROOT"/*) f="${f#"$ROOT"/}" ;; esac
    case "$f" in app/*.ts|app/*.vue) ;; *) continue ;; esac
    is_exempt "$f" && continue
    local spec
    spec="$(spec_for "$f")"
    [ -f "$spec" ] || printf '%s -> %s\n' "$f" "$spec"
  done
}

if [ "${1:-}" = "--dry-run" ]; then
  shift
  MISSING="$(missing_specs "$@")"
  if [ -n "$MISSING" ]; then
    printf 'Missing specs (source -> expected spec):\n%s\n' "$MISSING" >&2
    exit 2
  fi
  echo "Spec check passed for: $*"
  exit 0
fi

cat >/dev/null 2>&1 || true

CHANGED="$( { git diff --name-only HEAD 2>/dev/null; git ls-files -o --exclude-standard 2>/dev/null; } | sort -u )"
RELEVANT="$(printf '%s\n' "$CHANGED" | grep -E '^(app/|shared/|test/)|^(nuxt\.config\.ts|vitest\.config\.ts|eslint\.config\.mjs|tsconfig\.json|package\.json|package-lock\.json|\.lintstagedrc\.json|\.prettierrc)$' || true)"
[ -z "$RELEVANT" ] && exit 0

EXISTING=()
while IFS= read -r f; do
  [ -n "$f" ] && [ -f "$f" ] && EXISTING+=("$f")
done <<< "$RELEVANT"

MISSING="$(missing_specs "${EXISTING[@]+"${EXISTING[@]}"}")"
if [ -n "$MISSING" ]; then
  printf 'Blocked: every changed source file under app/ needs its spec (see write-unit-tests skill).\nMissing (source -> expected spec):\n%s\n' "$MISSING" >&2
  exit 2
fi

CACHE_DIR="$ROOT/.claude/.cache"
mkdir -p "$CACHE_DIR"
HASH="$( {
  printf '%s\n' "$RELEVANT"
  find test/nuxt -name '*.spec.ts' 2>/dev/null | sort
  for f in "${EXISTING[@]+"${EXISTING[@]}"}"; do shasum -a 256 "$f"; done
} | shasum -a 256 | cut -d' ' -f1 )"
if [ -f "$CACHE_DIR/last-green" ] && [ "$(cat "$CACHE_DIR/last-green")" = "$HASH" ]; then
  exit 0
fi

. "$ROOT/.husky/nvm.sh" >/dev/null 2>&1

LOG="$CACHE_DIR/last-run.log"
for script in lint typecheck test; do
  if ! npm run --silent "$script" >"$LOG" 2>&1; then
    printf 'Blocked: `npm run %s` failed. Fix it before finishing. Last lines:\n' "$script" >&2
    tail -n 40 "$LOG" >&2
    exit 2
  fi
done

printf '%s' "$HASH" > "$CACHE_DIR/last-green"
exit 0
