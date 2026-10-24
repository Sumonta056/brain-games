#!/usr/bin/env bash
set -u
ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$ROOT" || exit 0
. "$ROOT/.husky/nvm.sh" >/dev/null 2>&1

FILE="$(node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write((j.tool_input&&j.tool_input.file_path)||(j.tool_response&&j.tool_response.filePath)||"")}catch{}})')"
[ -z "$FILE" ] && exit 0
case "$FILE" in /*) ;; *) FILE="$ROOT/$FILE" ;; esac
case "$FILE" in "$ROOT"/*) ;; *) exit 0 ;; esac
case "$FILE" in */node_modules/*|*/.nuxt/*|*/.output/*|*/coverage/*|*/.claude/.cache/*) exit 0 ;; esac
[ -f "$FILE" ] || exit 0
REL="${FILE#"$ROOT"/}"

case "$FILE" in
  *.ts|*.mts|*.js|*.mjs|*.vue)
    npx --no-install eslint --fix "$REL" >/dev/null 2>&1
    npx --no-install prettier --write --log-level warn "$REL" >/dev/null 2>&1
    OUT="$(npx --no-install eslint --quiet "$REL" 2>&1)"
    if [ $? -ne 0 ]; then
      printf 'ESLint errors remain in %s after --fix. Fix them:\n%s\n' "$REL" "$OUT" >&2
      exit 2
    fi
    ;;
  *.json|*.css|*.md)
    npx --no-install prettier --write --log-level warn "$REL" >/dev/null 2>&1
    ;;
esac
exit 0
