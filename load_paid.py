#!/usr/bin/env python3
# One-time loader: pushes data/paid/*.json into the Supabase paid_* tables.
# Run from the project folder with your SECRET key in an env var (it never gets written anywhere):
#   SUPABASE_SECRET_KEY="sb_secret_xxx" python3 load_paid.py
# Safe to re-run (upserts on id).

import json, os, sys, urllib.request, urllib.error

SUPABASE_URL = "https://oystoxffvxlsbesisxym.supabase.co"
KEY = os.environ.get("SUPABASE_SECRET_KEY")
if not KEY:
    sys.exit("ERROR: set SUPABASE_SECRET_KEY env var to your Supabase secret key (sb_secret_...).")

def post(table, rows):
    url = f"{SUPABASE_URL}/rest/v1/{table}?on_conflict=id"
    body = json.dumps(rows).encode("utf-8")
    req = urllib.request.Request(url, data=body, method="POST", headers={
        "apikey": KEY,
        "Authorization": f"Bearer {KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    })
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return r.status
    except urllib.error.HTTPError as e:
        print("HTTP", e.code, e.read().decode("utf-8")[:600])
        raise

def load(table, path, with_year, batch):
    data = json.load(open(path))
    rows = []
    for rec in data:
        row = {"id": str(rec["id"]), "data": rec}
        if with_year:
            row["year"] = int(rec["year"])
        rows.append(row)
    for i in range(0, len(rows), batch):
        post(table, rows[i:i+batch])
        print(f"  {table}: {min(i+batch, len(rows))}/{len(rows)}")
    print(f"✓ {table}: {len(rows)} rows")

load("paid_prelims",    "data/paid/prelims.json",    True,  300)
load("paid_mains",      "data/paid/mains.json",      True,  150)
load("paid_optional",   "data/paid/optional.json",   True,  150)
load("paid_frameworks", "data/paid/frameworks.json", False, 3)
print("\nALL DONE — check the row counts in Supabase Table Editor.")
