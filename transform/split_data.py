#!/usr/bin/env python3
import os
import json

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
PAID_DIR = os.path.join(DATA_DIR, "paid")

def split_file(filename, output_name, split_fn, is_framework=False):
    input_path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(input_path):
        print(f"Skipping {filename}: File not found.")
        return

    with open(input_path, "r", encoding="utf-8") as f:
        records = json.load(f)

    free_list = []
    paid_list = []

    if is_framework:
        if len(records) > 0:
            free_list = records[:1]
            paid_list = records[1:]
    else:
        for r in records:
            if split_fn(r):
                free_list.append(r)
            else:
                paid_list.append(r)

    # Save paid content
    paid_path = os.path.join(PAID_DIR, output_name)
    with open(paid_path, "w", encoding="utf-8") as f:
        json.dump(paid_list, f, ensure_ascii=False, indent=2)

    # Save free content (overwriting original file)
    with open(input_path, "w", encoding="utf-8") as f:
        json.dump(free_list, f, ensure_ascii=False, indent=2)

    print(f"File {filename} split:")
    print(f"  Free: {len(free_list)} records (kept in {input_path})")
    print(f"  Paid: {len(paid_list)} records (written to {paid_path})")

def main():
    if not os.path.exists(PAID_DIR):
        os.makedirs(PAID_DIR)
        print(f"Created directory: {PAID_DIR}")

    # For Prelims, Mains, and Optional, keep 2025 and 2026 as free
    year_split = lambda r: r.get("year") in (2025, 2026)

    split_file("prelims_structured.json", "prelims.json", year_split)
    split_file("mains.json", "mains.json", year_split)
    split_file("optional.json", "optional.json", year_split)
    split_file("frameworks.json", "frameworks.json", None, is_framework=True)

if __name__ == "__main__":
    main()
