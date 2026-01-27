"""
Healthcare Job Matching Algorithm

This module implements a matching algorithm that:
1. Uses OpenAI GPT-4o to generate an "ideal resume" based on job descriptions
2. Uses sentence transformers to compute embeddings for resumes
3. Calculates cosine similarity between candidate resumes and ideal resumes
4. Stores match scores in the Supabase database
"""

import os
import numpy as np
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from dotenv import load_dotenv
from openai import OpenAI
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from supabase import create_client, Client
import json

# Load environment variables
load_dotenv()

# Initialize clients
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
supabase: Client = create_client(
    os.getenv("SUPABASE_URL", ""),
    os.getenv("SUPABASE_SERVICE_KEY", "")
)

# Initialize sentence transformer model
# Using multilingual-e5-large as suggested by professor's code
print("Loading SentenceTransformer model...")
embedding_model = SentenceTransformer("intfloat/multilingual-e5-large")
print("Model loaded successfully!")


@dataclass
class Job:
    """Represents a job listing"""
    job_id: str
    job_name: str
    company_name: str
    city: str
    state: str
    hourly_wage_minimum: float
    hourly_wage_maximum: float
    job_description: str
    job_requirements: List[str]


@dataclass
class Candidate:
    """Represents a job candidate"""
    user_id: str
    name: str
    email: str
    resume_text: str
    preferences: Optional[Dict] = None


@dataclass
class MatchResult:
    """Represents a match between a job and candidate"""
    job_id: str
    user_id: str
    similarity_score: float
    ideal_resume_embedding: np.ndarray
    candidate_embedding: np.ndarray


def generate_ideal_resume(job: Job) -> str:
    """
    Use GPT-4o to generate an ideal resume/candidate profile based on job description.
    This serves as the "ground truth" for what a perfect candidate would look like.
    """
    prompt = f"""Based on the following job posting, generate an ideal candidate resume/profile 
that would be a perfect match for this position. Include relevant skills, experience, 
education, and qualifications that would make someone an ideal candidate.

Job Title: {job.job_name}
Company: {job.company_name}
Location: {job.city}, {job.state}
Salary Range: ${job.hourly_wage_minimum}/hr - ${job.hourly_wage_maximum}/hr

Job Description:
{job.job_description}

Requirements:
{chr(10).join(f"- {req}" for req in job.job_requirements)}

Generate a comprehensive ideal candidate profile that includes:
1. Professional Summary
2. Key Skills and Competencies
3. Relevant Work Experience
4. Education and Certifications
5. Soft Skills and Work Style

Write this as if it were the text content of an actual resume, focusing on healthcare-specific 
qualifications and experience that would make someone perfect for this role."""

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert healthcare recruiter who knows exactly what makes an ideal candidate for healthcare positions. Generate realistic and detailed candidate profiles."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=2000
        )
        return response.choices[0].message.content or ""
    except Exception as e:
        print(f"Error generating ideal resume: {e}")
        raise


def compute_embeddings(texts: List[str], batch_size: int = 16) -> np.ndarray:
    """
    Compute embeddings for a list of texts using SentenceTransformer.
    Uses the multilingual-e5-large model as recommended.
    """
    # For e5 models, we need to add instruction prefix for better results
    prefixed_texts = [f"query: {text}" for text in texts]
    embeddings = embedding_model.encode(
        prefixed_texts, 
        batch_size=batch_size, 
        show_progress_bar=True,
        normalize_embeddings=True  # Normalize for cosine similarity
    )
    return np.array(embeddings)


def compute_similarity(embedding1: np.ndarray, embedding2: np.ndarray) -> float:
    """
    Compute cosine similarity between two embeddings.
    Returns a score between 0 and 1 (higher = more similar).
    """
    # Reshape if needed
    if embedding1.ndim == 1:
        embedding1 = embedding1.reshape(1, -1)
    if embedding2.ndim == 1:
        embedding2 = embedding2.reshape(1, -1)
    
    similarity = cosine_similarity(embedding1, embedding2)[0][0]
    # Convert from [-1, 1] to [0, 1] range
    normalized_score = (similarity + 1) / 2
    return float(normalized_score)


def compute_distance(embedding1: np.ndarray, embedding2: np.ndarray) -> float:
    """
    Compute Euclidean distance between two embeddings.
    Lower distance = more similar.
    """
    return float(np.linalg.norm(embedding1 - embedding2))


def match_candidate_to_job(
    job: Job, 
    candidate: Candidate,
    ideal_resume: Optional[str] = None,
    ideal_embedding: Optional[np.ndarray] = None
) -> MatchResult:
    """
    Match a single candidate to a job by comparing their resume 
    to the ideal resume generated by GPT-4o.
    """
    # Generate ideal resume if not provided
    if ideal_resume is None:
        ideal_resume = generate_ideal_resume(job)
    
    # Compute embeddings if not provided
    if ideal_embedding is None:
        ideal_embedding = compute_embeddings([ideal_resume])[0]
    
    # Compute candidate embedding
    candidate_embedding = compute_embeddings([candidate.resume_text])[0]
    
    # Compute similarity score
    similarity_score = compute_similarity(ideal_embedding, candidate_embedding)
    
    return MatchResult(
        job_id=job.job_id,
        user_id=candidate.user_id,
        similarity_score=similarity_score,
        ideal_resume_embedding=ideal_embedding,
        candidate_embedding=candidate_embedding
    )


def match_all_candidates_to_job(
    job: Job,
    candidates: List[Candidate],
    similarity_threshold: float = 0.5
) -> List[MatchResult]:
    """
    Match all candidates to a single job.
    Only returns matches above the similarity threshold.
    """
    print(f"\nMatching candidates to job: {job.job_name}")
    
    # Generate ideal resume once for efficiency
    print("Generating ideal resume with GPT-4o...")
    ideal_resume = generate_ideal_resume(job)
    print(f"Ideal resume generated ({len(ideal_resume)} characters)")
    
    # Compute ideal resume embedding
    print("Computing ideal resume embedding...")
    ideal_embedding = compute_embeddings([ideal_resume])[0]
    
    # Compute all candidate embeddings at once for efficiency
    print(f"Computing embeddings for {len(candidates)} candidates...")
    candidate_texts = [c.resume_text for c in candidates]
    candidate_embeddings = compute_embeddings(candidate_texts)
    
    # Calculate similarities
    matches = []
    for i, candidate in enumerate(candidates):
        similarity = compute_similarity(ideal_embedding, candidate_embeddings[i])
        
        if similarity >= similarity_threshold:
            matches.append(MatchResult(
                job_id=job.job_id,
                user_id=candidate.user_id,
                similarity_score=similarity,
                ideal_resume_embedding=ideal_embedding,
                candidate_embedding=candidate_embeddings[i]
            ))
            print(f"  ✓ {candidate.name}: {similarity:.2%} match")
        else:
            print(f"  ✗ {candidate.name}: {similarity:.2%} (below threshold)")
    
    # Sort by similarity score (highest first)
    matches.sort(key=lambda m: m.similarity_score, reverse=True)
    
    return matches


def fetch_jobs_from_db() -> List[Job]:
    """Fetch all active jobs from the database."""
    response = supabase.table("jobs").select("*").execute()
    
    jobs = []
    for row in response.data:
        jobs.append(Job(
            job_id=row["job_id"],
            job_name=row["job_name"],
            company_name=row.get("company_name", ""),
            city=row.get("city", ""),
            state=row.get("state", ""),
            hourly_wage_minimum=float(row.get("hourly_wage_minimum", 0)),
            hourly_wage_maximum=float(row.get("hourly_wage_maximum", 0)),
            job_description=row.get("job_description", ""),
            job_requirements=row.get("job_requirements", [])
        ))
    
    return jobs


def fetch_candidates_from_db() -> List[Candidate]:
    """Fetch all candidates with resumes from the database."""
    response = supabase.table("u_candidates").select("*").execute()
    
    candidates = []
    for row in response.data:
        if row.get("resume_text"):  # Only include candidates with resume text
            candidates.append(Candidate(
                user_id=row["user_id"],
                name=row.get("name", ""),
                email=row.get("email", ""),
                resume_text=row.get("resume_text", ""),
                preferences=row.get("preferences")
            ))
    
    return candidates


def save_matches_to_db(matches: List[MatchResult]) -> None:
    """Save match results to the database."""
    for match in matches:
        # Check if match already exists
        existing = supabase.table("matches").select("match_id").eq(
            "job_id", match.job_id
        ).eq("user_id", match.user_id).execute()
        
        if existing.data:
            # Update existing match
            supabase.table("matches").update({
                "similarity_score": match.similarity_score,
                "updated_at": "now()"
            }).eq("job_id", match.job_id).eq("user_id", match.user_id).execute()
        else:
            # Insert new match
            supabase.table("matches").insert({
                "job_id": match.job_id,
                "user_id": match.user_id,
                "similarity_score": match.similarity_score,
                "questionnaire_sent": False,
                "match_failed": False
            }).execute()
    
    print(f"Saved {len(matches)} matches to database")


def run_matching_pipeline(similarity_threshold: float = 0.5) -> Dict:
    """
    Run the complete matching pipeline:
    1. Fetch all jobs and candidates
    2. Generate ideal resumes for each job
    3. Compute matches for all candidate-job pairs
    4. Save results to database
    """
    print("=" * 60)
    print("HEALTHCARE JOB MATCHING PIPELINE")
    print("=" * 60)
    
    # Fetch data
    print("\n📋 Fetching jobs from database...")
    jobs = fetch_jobs_from_db()
    print(f"   Found {len(jobs)} jobs")
    
    print("\n👤 Fetching candidates from database...")
    candidates = fetch_candidates_from_db()
    print(f"   Found {len(candidates)} candidates with resumes")
    
    if not jobs or not candidates:
        print("\n⚠️ No jobs or candidates found. Exiting.")
        return {"jobs": 0, "candidates": 0, "matches": 0}
    
    # Run matching for each job
    all_matches = []
    for job in jobs:
        matches = match_all_candidates_to_job(job, candidates, similarity_threshold)
        all_matches.extend(matches)
    
    # Save to database
    print("\n💾 Saving matches to database...")
    save_matches_to_db(all_matches)
    
    # Summary
    print("\n" + "=" * 60)
    print("MATCHING COMPLETE")
    print("=" * 60)
    print(f"Jobs processed: {len(jobs)}")
    print(f"Candidates evaluated: {len(candidates)}")
    print(f"Total matches created: {len(all_matches)}")
    
    if all_matches:
        avg_score = np.mean([m.similarity_score for m in all_matches])
        print(f"Average match score: {avg_score:.2%}")
    
    return {
        "jobs": len(jobs),
        "candidates": len(candidates),
        "matches": len(all_matches)
    }


# ============================================================================
# UTILITY FUNCTIONS FOR TESTING AND ANALYSIS
# ============================================================================

def analyze_embeddings(
    texts: List[str],
    labels: List[str],
    save_path: Optional[str] = None
) -> np.ndarray:
    """
    Generate embeddings for analysis and optional visualization.
    Based on professor's code structure.
    """
    print(f"Computing embeddings for {len(texts)} texts...")
    embeddings = compute_embeddings(texts)
    
    if save_path:
        np.save(save_path, embeddings)
        print(f"Embeddings saved to {save_path}")
    
    return embeddings


def visualize_matches_tsne(
    embeddings: np.ndarray,
    labels: List[int],
    label_names: Dict[int, str]
) -> None:
    """
    Create t-SNE visualization of embeddings.
    Based on professor's visualization code.
    """
    try:
        from sklearn.manifold import TSNE
        import matplotlib.pyplot as plt
        
        n_samples = embeddings.shape[0]
        perplexity = min(30, n_samples - 1)
        
        print("Computing t-SNE...")
        tsne = TSNE(n_components=2, perplexity=perplexity, learning_rate=200, random_state=42)
        X_embedded = tsne.fit_transform(embeddings)
        
        # Plot
        plt.figure(figsize=(12, 10))
        markers = {0: "o", 1: "^", 2: "s", 3: "D", 4: "v", 5: "p"}
        
        for label in np.unique(labels):
            indices = [i for i, l in enumerate(labels) if l == label]
            marker = markers.get(label % len(markers), "o")
            plt.scatter(
                X_embedded[indices, 0], 
                X_embedded[indices, 1],
                marker=marker,
                label=label_names.get(label, f"Label {label}"),
                alpha=0.7
            )
        
        plt.title("t-SNE Visualization of Job Matching Embeddings")
        plt.xlabel("Component 1")
        plt.ylabel("Component 2")
        plt.legend()
        plt.tight_layout()
        plt.savefig("matching_visualization.png", dpi=150)
        plt.show()
        print("Visualization saved to matching_visualization.png")
        
    except ImportError:
        print("matplotlib not available for visualization")


if __name__ == "__main__":
    # Example usage / test
    print("\n🏥 Healthcare Job Matching Algorithm")
    print("=" * 40)
    
    # Check environment variables
    if not os.getenv("OPENAI_API_KEY"):
        print("⚠️ OPENAI_API_KEY not set. Please create a .env file.")
        print("   Copy .env.example to .env and add your API key.")
        exit(1)
    
    # Run a simple test with dummy data
    test_job = Job(
        job_id="test-001",
        job_name="Registered Nurse - ICU",
        company_name="City General Hospital",
        city="New York",
        state="NY",
        hourly_wage_minimum=36.0,
        hourly_wage_maximum=46.0,
        job_description="We are seeking a compassionate and skilled Registered Nurse to join our Intensive Care Unit.",
        job_requirements=[
            "Active RN license",
            "2+ years ICU experience", 
            "BLS and ACLS certification",
            "Strong critical thinking skills"
        ]
    )
    
    test_candidate = Candidate(
        user_id="test-user-001",
        name="Jane Smith",
        email="jane@example.com",
        resume_text="""
        Jane Smith, RN, BSN
        Registered Nurse with 5 years of ICU experience
        
        EXPERIENCE:
        - ICU Nurse, Memorial Hospital (2020-2025)
        - Step-down Unit Nurse, City Medical (2018-2020)
        
        CERTIFICATIONS:
        - BLS, ACLS, PALS certified
        - Critical Care Registered Nurse (CCRN)
        
        EDUCATION:
        - BSN, State University School of Nursing
        
        SKILLS:
        - Patient assessment and monitoring
        - Ventilator management
        - Code response
        - Electronic health records (Epic, Cerner)
        """
    )
    
    print("\n🔄 Testing matching algorithm...")
    print(f"   Job: {test_job.job_name}")
    print(f"   Candidate: {test_candidate.name}")
    
    result = match_candidate_to_job(test_job, test_candidate)
    
    print(f"\n✅ Match Score: {result.similarity_score:.2%}")
    print(f"   Distance: {compute_distance(result.ideal_resume_embedding, result.candidate_embedding):.4f}")
