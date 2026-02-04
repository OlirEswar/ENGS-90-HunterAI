#!/usr/bin/env python3
"""
AI Job Matching Script
Fetches candidates and jobs from Supabase, uses OpenAI to score each pair,
and saves results to matches_duplicates table.
"""

import os
import time
from datetime import datetime, timezone
from dotenv import load_dotenv
from supabase import create_client
from openai import OpenAI

# Load environment variables
load_dotenv()

# Initialize clients
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)
openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# Standard prompt template
MATCHING_PROMPT = """You are an expert healthcare job recruiter. Evaluate how well this candidate matches this job posting.

=== JOB ===
Location: {job_location}, {job_state}
Description: {job_summary}

=== CANDIDATE ===
Location: {candidate_location}
Willing to Commute: {commute_distance}
Profile: {candidate_summary}

=== TASK ===
Rate how well this candidate matches this job from 0 to 100.
Consider: location/commute compatibility and overall profile alignment based on the summaries.

Respond with ONLY a single integer between 0 and 100. No other text."""


def fetch_all_jobs():
    """Fetch all jobs from matching_jobs table."""
    response = supabase.table('matching_jobs').select('*').execute()
    return response.data


def fetch_all_candidates():
    """Fetch all candidates from matching_candidates table."""
    response = supabase.table('matching_candidates').select('*').execute()
    return response.data


def get_match_score(job: dict, candidate: dict) -> int:
    """Call OpenAI to get a match score for a candidate-job pair."""
    
    prompt = MATCHING_PROMPT.format(
        # Job fields
        job_location=job.get('Location (City/Town)', ''),
        job_state=job.get('State', ''),
        job_summary=job.get('AI Summary / Read', ''),
        
        # Candidate fields
        candidate_location=candidate.get('Location (Town/City)', ''),
        commute_distance=candidate.get('How far are you willing to commute (<5 miles, 5-10, 10-20, 20+)', ''),
        candidate_summary=candidate.get('Person AI Chatbot Summary', '')
    )
    
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=10,
            temperature=0.1
        )
        
        score_text = response.choices[0].message.content.strip()
        score = int(score_text)
        return max(0, min(100, score))  # Clamp between 0-100
        
    except Exception as e:
        print(f"  Error getting score: {e}")
        return None


def save_match(candidate_id: int, job_id: int, score: int):
    """Save a match result to matches_duplicates table."""
    
    data = {
        'candidate_id': candidate_id,
        'job_id': job_id,
        'score': score
    }
    
    supabase.table('matches_duplicates').insert(data).execute()


def run_matching():
    """Main function to run the matching algorithm."""
    
    print("=" * 60)
    print("AI Job Matching Algorithm")
    print("=" * 60)
    
    # Fetch all data
    print("\nFetching jobs...")
    jobs = fetch_all_jobs()
    print(f"  Found {len(jobs)} jobs")
    
    print("\nFetching candidates...")
    candidates = fetch_all_candidates()
    print(f"  Found {len(candidates)} candidates")
    
    total_pairs = len(jobs) * len(candidates)
    print(f"\nTotal pairs to evaluate: {total_pairs}")
    print("-" * 60)
    
    # Process each pair
    processed = 0
    successful = 0
    failed = 0
    
    for job in jobs:
        job_id = job.get('Job ID')
        job_title = job.get('Job Title', 'Unknown')
        
        print(f"\nProcessing Job {job_id}: {job_title}")
        
        for candidate in candidates:
            candidate_id = candidate.get('Number')
            candidate_name = candidate.get('Person', 'Unknown')
            
            processed += 1
            print(f"  [{processed}/{total_pairs}] Candidate {candidate_id} ({candidate_name})...", end=" ")
            
            # Get match score from OpenAI
            score = get_match_score(job, candidate)
            
            if score is not None:
                print(f"Score: {score}")
                save_match(candidate_id, job_id, score)
                successful += 1
            else:
                print("FAILED")
                failed += 1
            
            # Small delay to avoid rate limiting
            time.sleep(0.1)
    
    # Summary
    print("\n" + "=" * 60)
    print("MATCHING COMPLETE")
    print("=" * 60)
    print(f"Total pairs processed: {processed}")
    print(f"Successful matches: {successful}")
    print(f"Failed matches: {failed}")


if __name__ == "__main__":
    run_matching()
