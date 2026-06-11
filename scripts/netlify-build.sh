#!/usr/bin/env bash
# TEMP: capture remote build failures into Supabase leads for diagnosis.
set -o pipefail
pnpm build 2>&1 | tee /tmp/build.log
code=$?
if [ $code -ne 0 ]; then
  tail -c 6000 /tmp/build.log | python3 -c '
import json, sys, urllib.request, os
body = json.dumps({"email": "buildlog@netlify.internal", "source": sys.stdin.read()}).encode()
req = urllib.request.Request(
    os.environ["NEXT_PUBLIC_SUPABASE_URL"] + "/rest/v1/leads",
    data=body, method="POST",
    headers={"apikey": os.environ["NEXT_PUBLIC_SUPABASE_ANON_KEY"], "Content-Type": "application/json"},
)
urllib.request.urlopen(req)
print("log shipped")
'
fi
exit $code
