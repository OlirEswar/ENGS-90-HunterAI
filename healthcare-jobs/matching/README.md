# Healthcare Job Matching Algorithm

This module implements an AI-powered job matching algorithm that connects healthcare job seekers with relevant positions.

## How It Works

1. **Ideal Resume Generation**: Uses OpenAI GPT-4o to generate an "ideal candidate profile" based on each job's description and requirements
2. **Embedding Computation**: Uses SentenceTransformer (`intfloat/multilingual-e5-large`) to convert resumes into embeddings
3. **Similarity Scoring**: Computes cosine similarity between candidate resumes and ideal resumes
4. **Match Storage**: Saves matches above the threshold to the database

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   Job Posting   │     │ Candidate Resume│
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       │
┌─────────────────┐              │
│   GPT-4o        │              │
│ Generate Ideal  │              │
│     Resume      │              │
└────────┬────────┘              │
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│ SentenceTransf. │     │ SentenceTransf. │
│   Embedding     │     │   Embedding     │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
         ┌─────────────────────┐
         │  Cosine Similarity  │
         │     Calculation     │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │   Match Score (%)   │
         └─────────────────────┘
```

## Setup

### 1. Install Dependencies

```bash
cd matching
pip install -r requirements.txt
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

### 3. Database Schema

Ensure your Supabase database has a `similarity_score` column in the `matches` table:

```sql
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS similarity_score FLOAT DEFAULT 0;
```

## Usage

### Run Matching Pipeline (CLI)

```bash
# Run with default threshold (0.5)
python run_matching.py

# Run with custom threshold
python run_matching.py --threshold 0.6

# Dry run (no database changes)
python run_matching.py --dry-run
```

### Run as API Server

```bash
# Start the FastAPI server
python api_endpoint.py

# Or with uvicorn directly
uvicorn api_endpoint:app --reload --port 8000
```

API Endpoints:
- `POST /match/single` - Match one candidate to one job
- `POST /match/job/{job_id}` - Match all candidates to a specific job
- `POST /generate-ideal-resume` - Generate ideal resume for a job
- `POST /run-pipeline` - Run full matching pipeline
- `GET /health` - Health check

### Python API

```python
from matching_algorithm import (
    Job, Candidate,
    match_candidate_to_job,
    match_all_candidates_to_job,
    generate_ideal_resume
)

# Create a job
job = Job(
    job_id="1",
    job_name="Registered Nurse - ICU",
    company_name="City Hospital",
    city="New York",
    state="NY",
    hourly_wage_minimum=36.0,
    hourly_wage_maximum=46.0,
    job_description="Seeking ICU nurse...",
    job_requirements=["RN license", "2+ years ICU experience"]
)

# Create a candidate
candidate = Candidate(
    user_id="user-123",
    name="Jane Smith",
    email="jane@example.com",
    resume_text="Jane Smith, RN with 5 years ICU experience..."
)

# Get match result
result = match_candidate_to_job(job, candidate)
print(f"Match score: {result.similarity_score:.1%}")
```

## Visualization (Optional)

Based on professor's code, you can visualize embeddings using t-SNE:

```python
from matching_algorithm import visualize_matches_tsne, compute_embeddings
import numpy as np

# Compute embeddings
texts = ["resume 1...", "resume 2...", "ideal resume..."]
embeddings = compute_embeddings(texts)

# Labels: 0=candidates, 1=ideal resumes
labels = [0, 0, 1]
label_names = {0: "Candidates", 1: "Ideal Resumes"}

# Generate visualization
visualize_matches_tsne(embeddings, labels, label_names)
```

## Model Details

- **LLM**: OpenAI GPT-4o for generating ideal candidate profiles
- **Embedding Model**: `intfloat/multilingual-e5-large` (1024 dimensions)
  - Multilingual support
  - Optimized for semantic similarity
  - Good performance on resume/job description text

## Tuning

### Similarity Threshold

The default threshold is 0.5 (50% match). Adjust based on your needs:
- **Lower (0.3-0.4)**: More matches, but potentially less relevant
- **Higher (0.6-0.7)**: Fewer but more qualified matches

### Model Selection

You can swap the embedding model by changing:

```python
embedding_model = SentenceTransformer("your-model-name")
```

Good alternatives:
- `all-MiniLM-L6-v2` - Faster, smaller
- `all-mpnet-base-v2` - Good balance
- `BAAI/bge-large-en-v1.5` - Strong performance
