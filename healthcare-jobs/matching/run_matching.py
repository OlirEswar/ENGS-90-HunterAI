#!/usr/bin/env python3
"""
Script to run the healthcare job matching pipeline.
This can be run as a cron job or manually triggered.
"""

import argparse
import sys
from matching_algorithm import run_matching_pipeline, fetch_jobs_from_db, fetch_candidates_from_db


def main():
    parser = argparse.ArgumentParser(
        description="Run the healthcare job matching algorithm"
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=0.5,
        help="Similarity threshold for matches (0-1). Default: 0.5"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be matched without saving to database"
    )
    
    args = parser.parse_args()
    
    if args.dry_run:
        print("🔍 DRY RUN MODE - No changes will be saved")
        jobs = fetch_jobs_from_db()
        candidates = fetch_candidates_from_db()
        print(f"Would process {len(jobs)} jobs and {len(candidates)} candidates")
        return
    
    results = run_matching_pipeline(similarity_threshold=args.threshold)
    
    print("\n📊 Results Summary:")
    print(f"   Jobs processed: {results['jobs']}")
    print(f"   Candidates evaluated: {results['candidates']}")
    print(f"   Matches created: {results['matches']}")
    
    return 0 if results['matches'] > 0 else 1


if __name__ == "__main__":
    sys.exit(main())
