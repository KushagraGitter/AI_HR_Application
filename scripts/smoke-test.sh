#!/bin/bash
# Smoke test for all API routes.
# Run this AFTER starting `npm run dev` in another terminal.
# Usage: bash scripts/smoke-test.sh

set -e
BASE="http://localhost:3000"

echo "=== 1. POST /api/jobs (create job + generate JD) ==="
JOB_RESPONSE=$(curl -s -X POST "$BASE/api/jobs" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Senior Frontend Engineer",
    "requirements": "React, TypeScript, 4+ years experience, system design knowledge"
  }')
echo "$JOB_RESPONSE" | head -c 500
echo ""
JOB_ID=$(echo "$JOB_RESPONSE" | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")
echo "→ Job ID: $JOB_ID"
echo ""

echo "=== 2. POST /api/candidates (submit candidate #1) ==="
C1=$(curl -s -X POST "$BASE/api/candidates" \
  -H "Content-Type: application/json" \
  -d "{
    \"jobId\": \"$JOB_ID\",
    \"name\": \"Vikram Singh\",
    \"email\": \"vikram@example.com\",
    \"resume\": \"6 years building React and TypeScript applications. Led frontend team at a Series B SaaS startup. Migrated monolith to micro-frontends, 40% load time improvement. Regular contributor to open source React libraries. Spoke at JSConf India 2024.\",
    \"linkedinUrl\": \"https://linkedin.com/in/vikramsingh\",
    \"githubUrl\": \"https://github.com/vikramsingh\"
  }")
echo "$C1" | head -c 400
echo ""
C1_ID=$(echo "$C1" | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")
C1_SCORE=$(echo "$C1" | python3 -c "import sys,json;print(json.load(sys.stdin)['score'])")
echo "→ Candidate 1: $C1_ID (score: $C1_SCORE)"
echo ""

echo "=== 3. POST /api/candidates (submit candidate #2) ==="
C2=$(curl -s -X POST "$BASE/api/candidates" \
  -H "Content-Type: application/json" \
  -d "{
    \"jobId\": \"$JOB_ID\",
    \"name\": \"Neha Patel\",
    \"email\": \"neha@example.com\",
    \"resume\": \"2 years React experience. Some TypeScript exposure. Worked at a small startup on internal tools. Knows basic CSS animations.\"
  }")
C2_ID=$(echo "$C2" | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")
C2_SCORE=$(echo "$C2" | python3 -c "import sys,json;print(json.load(sys.stdin)['score'])")
echo "→ Candidate 2: $C2_ID (score: $C2_SCORE)"
echo ""

echo "=== 4. GET /api/candidates?jobId=... (ranked list) ==="
curl -s "$BASE/api/candidates?jobId=$JOB_ID" | python3 -c "
import sys, json
cands = json.load(sys.stdin)
for c in cands:
    print(f'  [{c[\"score\"]}] {c[\"name\"]} — {c[\"reasoning\"][:80]}...')
"
echo ""

echo "=== 5. POST /api/outreach/draft (draft emails for top candidate) ==="
DRAFT=$(curl -s -X POST "$BASE/api/outreach/draft" \
  -H "Content-Type: application/json" \
  -d "{
    \"jobId\": \"$JOB_ID\",
    \"candidateIds\": [\"$C1_ID\"]
  }")
echo "$DRAFT" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for draft in d['drafts']:
    print(f'Candidate: {draft[\"candidateId\"]}')
    print(f'Token: {draft[\"availabilityToken\"]}')
    print(f'Draft:\\n{draft[\"emailDraft\"][:400]}...')
"
TOKEN=$(echo "$DRAFT" | python3 -c "import sys,json;print(json.load(sys.stdin)['drafts'][0]['availabilityToken'])")
echo ""

echo "=== 6. GET /api/availability/[token] (candidate opens form) ==="
curl -s "$BASE/api/availability/$TOKEN" | python3 -m json.tool
echo ""

echo "=== 7. POST /api/availability (candidate submits slots) ==="
curl -s -X POST "$BASE/api/availability" \
  -H "Content-Type: application/json" \
  -d "{
    \"token\": \"$TOKEN\",
    \"slots\": [\"2026-04-22T10:00:00\", \"2026-04-22T14:00:00\", \"2026-04-23T11:00:00\"]
  }" | python3 -m json.tool
echo ""

echo "=== 8. POST /api/schedule (assign slots, generate .ics) ==="
curl -s -X POST "$BASE/api/schedule" \
  -H "Content-Type: application/json" \
  -d "{\"jobId\": \"$JOB_ID\"}" | python3 -c "
import sys, json
r = json.load(sys.stdin)
for s in r['scheduledSlots']:
    print(f'  {s[\"candidateName\"]} → {s[\"panelMember\"]} @ {s[\"slot\"]}')
    print(f'  .ics file preview:')
    print('  ' + s['icsFile'].replace('\\r\\n', '\\n  ')[:300])
"
echo ""

echo "=== 9. GET /api/trace/[jobId] (LangGraph execution trace) ==="
curl -s "$BASE/api/trace/$JOB_ID" | python3 -c "
import sys, json
t = json.load(sys.stdin)
for node in t['nodes']:
    print(f'  [{node[\"durationMs\"]}ms] {node[\"nodeName\"]}')
    print(f'    in:  {node[\"inputSummary\"][:100]}')
    print(f'    out: {node[\"outputSummary\"][:100]}')
"
echo ""

echo "=== ✓ All routes working ==="
echo "Job ID for manual testing: $JOB_ID"
