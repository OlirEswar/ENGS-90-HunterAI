"""
FastAPI endpoint for the matching algorithm.
This can be deployed as a separate microservice or integrated with the Next.js app.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os

from matching_algorithm import (
    Job, Candidate, MatchResult,
    match_candidate_to_job,
    match_all_candidates_to_job,
    generate_ideal_resume,
    compute_embeddings,
    compute_similarity,
    fetch_jobs_from_db,
    fetch_candidates_from_db,
    save_matches_to_db,
    run_matching_pipeline
)

app = FastAPI(
    title="Healthcare Job Matching API",
    description="AI-powered job matching using GPT-4o and sentence transformers",
    version="1.0.0"
)

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Request/Response Models
# ============================================================================

class JobInput(BaseModel):
    job_id: str
    job_name: str
    company_name: str
    city: str
    state: str
    hourly_wage_minimum: float
    hourly_wage_maximum: float
    job_description: str
    job_requirements: List[str]


class CandidateInput(BaseModel):
    user_id: str
    name: str
    email: str
    resume_text: str


class MatchResponse(BaseModel):
    job_id: str
    user_id: str
    similarity_score: float
    match_percentage: str


class IdealResumeResponse(BaseModel):
    job_id: str
    ideal_resume: str


class PipelineResponse(BaseModel):
    status: str
    jobs_processed: int
    candidates_evaluated: int
    matches_created: int


# ============================================================================
# Endpoints
# ============================================================================

@app.get("/")
async def root():
    return {"message": "Healthcare Job Matching API", "status": "healthy"}


@app.post("/match/single", response_model=MatchResponse)
async def match_single_candidate(job: JobInput, candidate: CandidateInput):
    """Match a single candidate to a single job."""
    try:
        job_obj = Job(
            job_id=job.job_id,
            job_name=job.job_name,
            company_name=job.company_name,
            city=job.city,
            state=job.state,
            hourly_wage_minimum=job.hourly_wage_minimum,
            hourly_wage_maximum=job.hourly_wage_maximum,
            job_description=job.job_description,
            job_requirements=job.job_requirements
        )
        
        candidate_obj = Candidate(
            user_id=candidate.user_id,
            name=candidate.name,
            email=candidate.email,
            resume_text=candidate.resume_text
        )
        
        result = match_candidate_to_job(job_obj, candidate_obj)
        
        return MatchResponse(
            job_id=result.job_id,
            user_id=result.user_id,
            similarity_score=result.similarity_score,
            match_percentage=f"{result.similarity_score:.1%}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/match/job/{job_id}", response_model=List[MatchResponse])
async def match_all_candidates_for_job(
    job_id: str,
    threshold: float = 0.5
):
    """Match all candidates in the database to a specific job."""
    try:
        # Fetch job from database
        jobs = fetch_jobs_from_db()
        job = next((j for j in jobs if j.job_id == job_id), None)
        
        if not job:
            raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
        
        # Fetch candidates
        candidates = fetch_candidates_from_db()
        
        if not candidates:
            return []
        
        # Run matching
        matches = match_all_candidates_to_job(job, candidates, threshold)
        
        return [
            MatchResponse(
                job_id=m.job_id,
                user_id=m.user_id,
                similarity_score=m.similarity_score,
                match_percentage=f"{m.similarity_score:.1%}"
            )
            for m in matches
        ]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-ideal-resume", response_model=IdealResumeResponse)
async def generate_ideal_resume_endpoint(job: JobInput):
    """Generate an ideal resume for a job posting using GPT-4o."""
    try:
        job_obj = Job(
            job_id=job.job_id,
            job_name=job.job_name,
            company_name=job.company_name,
            city=job.city,
            state=job.state,
            hourly_wage_minimum=job.hourly_wage_minimum,
            hourly_wage_maximum=job.hourly_wage_maximum,
            job_description=job.job_description,
            job_requirements=job.job_requirements
        )
        
        ideal_resume = generate_ideal_resume(job_obj)
        
        return IdealResumeResponse(
            job_id=job.job_id,
            ideal_resume=ideal_resume
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/run-pipeline", response_model=PipelineResponse)
async def run_full_pipeline(
    background_tasks: BackgroundTasks,
    threshold: float = 0.5,
    async_mode: bool = False
):
    """
    Run the complete matching pipeline for all jobs and candidates.
    Can be run synchronously or in the background.
    """
    if async_mode:
        background_tasks.add_task(run_matching_pipeline, threshold)
        return PipelineResponse(
            status="started",
            jobs_processed=0,
            candidates_evaluated=0,
            matches_created=0
        )
    else:
        try:
            results = run_matching_pipeline(threshold)
            return PipelineResponse(
                status="completed",
                jobs_processed=results["jobs"],
                candidates_evaluated=results["candidates"],
                matches_created=results["matches"]
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "openai_configured": bool(os.getenv("OPENAI_API_KEY")),
        "supabase_configured": bool(os.getenv("SUPABASE_URL"))
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
