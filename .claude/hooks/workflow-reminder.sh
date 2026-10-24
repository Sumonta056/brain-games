#!/usr/bin/env bash
cat <<'MSG'
Brain Garden workflow: for any feature, bug fix, or requirement change, run the /feature skill loop (plan, approval, failing specs, implement, lint/typecheck/test, UI check, review).
Every source change under app/ ships with its spec: app/<path>/<Name>.<ext> -> test/nuxt/<path>/<Name>.spec.ts.
After any UI change, run the ui-verifier agent against docs/design.html.
Never commit or push without asking the user first.
MSG
exit 0
