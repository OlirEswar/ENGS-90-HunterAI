# AI Job Matching Algorithm

## Overview

This script matches job seekers to job postings using OpenAI's GPT-4o-mini model. It evaluates each candidate-job pair and assigns a compatibility score from 0-100.

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                        MATCHING ALGORITHM                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐     ┌──────────────────┐
│ matching_jobs    │     │matching_candidates│
│                  │     │                   │
│ • Location       │     │ • Location        │
│ • AI Summary     │     │ • Commute Distance│
└────────┬─────────┘     │ • AI Summary      │
         │               └─────────┬─────────┘
         │                         │
         └───────────┬─────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   For each pair:      │
         │   Job × Candidate     │
         │   (30 × 100 = 3000)   │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   OpenAI GPT-4o-mini  │
         │                       │
         │   Prompt includes:    │
         │   • Job location      │
         │   • Job AI summary    │
         │   • Candidate location│
         │   • Commute willing   │
         │   • Candidate summary │
         │                       │
         │   Returns: 0-100 score│
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  matches_duplicates   │
         │                       │
         │  • candidate_id       │
         │  • job_id             │
         │  • score (0-100)      │
         └───────────────────────┘
```

## Data Flow

1. **Fetch** all jobs from `matching_jobs` table
2. **Fetch** all candidates from `matching_candidates` table
3. **Loop** through every job × candidate combination
4. **Send** prompt to OpenAI with:
   - Job: location + AI summary
   - Candidate: location + commute willingness + AI summary
5. **Receive** a 0-100 compatibility score
6. **Save** result to `matches_duplicates` table

## Scoring Criteria

The AI evaluates:
- **Location compatibility**: Is the candidate within commuting distance?
- **Profile alignment**: Does the candidate's background/interests match the job?

## Files

| File | Description |
|------|-------------|
| `matcher.py` | Main matching script |
| `.env` | API keys (OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY) |
| `requirements.txt` | Python dependencies |

## Usage

```bash
# Install dependencies
pip install -r requirements.txt

# Run matching
python matcher.py
```

## Cost Estimate

- **Model**: gpt-4o-mini (~$0.15/1M input tokens, ~$0.60/1M output tokens)
- **Per match**: ~200 tokens input, 5 tokens output = ~$0.00003
- **3,000 matches**: ~$0.10 - $0.50 total

## Output

Results are saved to `matches_duplicates` with:
- `candidate_id`: Integer from `matching_candidates.Number`
- `job_id`: Integer from `matching_jobs.Job ID`
- `score`: 0-100 compatibility score
