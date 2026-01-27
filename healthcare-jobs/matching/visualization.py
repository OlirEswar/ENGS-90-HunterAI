"""
Visualization utilities for analyzing matching algorithm results.
Based on professor's t-SNE and clustering code.
"""

import numpy as np
import matplotlib.pyplot as plt
from sklearn.manifold import TSNE
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer
from typing import List, Dict, Optional, Tuple
from matching_algorithm import compute_embeddings


def visualize_embeddings_tsne(
    embeddings: np.ndarray,
    labels: List[int],
    label_names: Dict[int, str],
    save_path: str = "tsne_visualization.png"
) -> None:
    """
    Create t-SNE visualization of embeddings with labeled clusters.
    Based on professor's visualization code.
    """
    n_samples = embeddings.shape[0]
    perplexity = min(30, n_samples - 1)
    
    print(f"Computing t-SNE (perplexity={perplexity})...")
    tsne = TSNE(n_components=2, perplexity=perplexity, learning_rate=200, random_state=42)
    X_embedded = tsne.fit_transform(embeddings)
    
    # Define markers for different sources
    markers = {0: "o", 1: "^", 2: "s", 3: "D", 4: "v", 5: "p", 6: "*", 7: "h"}
    
    plt.figure(figsize=(12, 10))
    
    for source in np.unique(labels):
        indices = [i for i, label in enumerate(labels) if label == source]
        marker = markers.get(source % len(markers), "o")
        plt.scatter(
            X_embedded[indices, 0], 
            X_embedded[indices, 1],
            marker=marker,
            label=label_names.get(source, f"Source {source}"),
            alpha=0.7,
            s=100
        )
    
    plt.title("t-SNE Visualization of Job Matching Embeddings")
    plt.xlabel("Component 1")
    plt.ylabel("Component 2")
    plt.legend(loc='best')
    plt.tight_layout()
    plt.savefig(save_path, dpi=150, bbox_inches='tight')
    plt.show()
    print(f"Visualization saved to {save_path}")
    
    return X_embedded


def cluster_and_visualize(
    embeddings: np.ndarray,
    texts: List[str],
    n_clusters: int = 5,
    save_path: str = "cluster_visualization.png"
) -> Tuple[np.ndarray, Dict[int, List[str]]]:
    """
    Cluster embeddings and visualize with cluster centers.
    Based on professor's KMeans clustering code.
    """
    # Compute t-SNE first
    n_samples = embeddings.shape[0]
    perplexity = min(30, n_samples - 1)
    
    print("Computing t-SNE...")
    tsne = TSNE(n_components=2, perplexity=perplexity, learning_rate=200, random_state=42)
    X_embedded = tsne.fit_transform(embeddings)
    
    # Cluster the t-SNE output
    print(f"Clustering into {n_clusters} clusters...")
    kmeans = KMeans(n_clusters=n_clusters, random_state=42)
    cluster_labels = kmeans.fit_predict(X_embedded)
    
    # Group texts by cluster
    clustered_texts = {}
    for i, label in enumerate(cluster_labels):
        if label not in clustered_texts:
            clustered_texts[label] = []
        clustered_texts[label].append(texts[i])
    
    # Get top keywords for each cluster using TF-IDF
    cluster_keywords = get_cluster_keywords(clustered_texts)
    
    # Compute cluster centers
    cluster_centers = {}
    for label in np.unique(cluster_labels):
        indices = [i for i, lab in enumerate(cluster_labels) if lab == label]
        center = np.mean(X_embedded[indices], axis=0)
        cluster_centers[label] = center
    
    # Plot
    plt.figure(figsize=(14, 12))
    scatter = plt.scatter(
        X_embedded[:, 0], 
        X_embedded[:, 1], 
        c=cluster_labels, 
        cmap='viridis', 
        alpha=0.7,
        s=100
    )
    
    # Annotate cluster centers with keywords
    for label, center in cluster_centers.items():
        keyword = cluster_keywords.get(label, f"Cluster {label}")
        plt.annotate(
            keyword, 
            center, 
            fontsize=12, 
            fontweight='bold', 
            color='red',
            ha='center', 
            va='center',
            bbox=dict(boxstyle='round,pad=0.3', facecolor='white', alpha=0.8)
        )
    
    plt.title("Cluster Visualization of Resume/Job Embeddings")
    plt.xlabel("t-SNE Component 1")
    plt.ylabel("t-SNE Component 2")
    plt.colorbar(scatter, label='Cluster')
    plt.tight_layout()
    plt.savefig(save_path, dpi=150, bbox_inches='tight')
    plt.show()
    print(f"Cluster visualization saved to {save_path}")
    
    return cluster_labels, clustered_texts


def get_cluster_keywords(
    clustered_texts: Dict[int, List[str]], 
    top_n: int = 3
) -> Dict[int, str]:
    """
    Get representative keywords for each cluster using TF-IDF.
    Based on professor's TF-IDF keyword extraction.
    """
    # Custom stopwords for healthcare/resume context
    custom_stopwords = [
        "the", "to", "and", "of", "at", "my", "a", "an", "in", "is", "for", "with",
        "i", "we", "this", "about", "by", "your", "as", "be", "that", "can",
        "have", "has", "will", "would", "should", "may", "must", "could",
        "it", "on", "or", "are", "was", "were", "been", "being", "do", "does",
        "did", "but", "if", "so", "such", "no", "not", "only", "than", "too",
        "very", "just", "also", "more", "most", "some", "any", "each", "all",
        "both", "few", "own", "other", "same", "different", "new", "old",
        "work", "working", "experience", "years", "year", "patient", "patients"
    ]
    
    cluster_keywords = {}
    
    for label, docs in clustered_texts.items():
        if not docs:
            cluster_keywords[label] = f"Cluster {label}"
            continue
            
        try:
            vectorizer = TfidfVectorizer(
                stop_words=custom_stopwords,
                ngram_range=(1, 2),
                max_features=1000
            )
            X = vectorizer.fit_transform(docs)
            
            # Sum TF-IDF scores for each term
            scores = X.sum(axis=0).A1
            terms = vectorizer.get_feature_names_out()
            top_indices = scores.argsort()[::-1][:top_n]
            
            top_terms = [terms[i] for i in top_indices]
            cluster_keywords[label] = ", ".join(top_terms[:2])  # Top 2 for label
        except Exception as e:
            cluster_keywords[label] = f"Cluster {label}"
    
    return cluster_keywords


def compare_candidates_to_ideal(
    ideal_resume_text: str,
    candidate_texts: List[str],
    candidate_names: List[str],
    save_path: str = "candidate_comparison.png"
) -> None:
    """
    Visualize how candidates compare to the ideal resume.
    """
    # Combine texts
    all_texts = [ideal_resume_text] + candidate_texts
    labels = [0] + [1] * len(candidate_texts)  # 0 = ideal, 1 = candidates
    
    # Compute embeddings
    print("Computing embeddings...")
    embeddings = compute_embeddings(all_texts)
    
    # t-SNE
    n_samples = len(all_texts)
    perplexity = min(30, n_samples - 1)
    
    tsne = TSNE(n_components=2, perplexity=perplexity, learning_rate=200, random_state=42)
    X_embedded = tsne.fit_transform(embeddings)
    
    plt.figure(figsize=(12, 10))
    
    # Plot ideal resume
    plt.scatter(
        X_embedded[0, 0], 
        X_embedded[0, 1], 
        marker='*', 
        s=500, 
        c='gold', 
        edgecolors='black',
        label='Ideal Candidate',
        zorder=5
    )
    
    # Plot candidates
    for i, name in enumerate(candidate_names):
        idx = i + 1  # Skip ideal at index 0
        plt.scatter(
            X_embedded[idx, 0], 
            X_embedded[idx, 1], 
            marker='o', 
            s=200, 
            alpha=0.7
        )
        plt.annotate(
            name, 
            (X_embedded[idx, 0], X_embedded[idx, 1]),
            xytext=(5, 5),
            textcoords='offset points',
            fontsize=10
        )
    
    plt.title("Candidate Positions Relative to Ideal Resume")
    plt.xlabel("t-SNE Component 1")
    plt.ylabel("t-SNE Component 2")
    plt.legend(loc='best')
    plt.tight_layout()
    plt.savefig(save_path, dpi=150, bbox_inches='tight')
    plt.show()
    print(f"Comparison visualization saved to {save_path}")


def plot_similarity_distribution(
    similarity_scores: List[float],
    threshold: float = 0.5,
    save_path: str = "similarity_distribution.png"
) -> None:
    """
    Plot histogram of similarity scores with threshold line.
    """
    plt.figure(figsize=(10, 6))
    
    plt.hist(similarity_scores, bins=20, edgecolor='black', alpha=0.7, color='steelblue')
    plt.axvline(x=threshold, color='red', linestyle='--', linewidth=2, label=f'Threshold ({threshold})')
    
    plt.xlabel('Similarity Score')
    plt.ylabel('Number of Matches')
    plt.title('Distribution of Match Similarity Scores')
    plt.legend()
    plt.tight_layout()
    plt.savefig(save_path, dpi=150)
    plt.show()
    print(f"Distribution plot saved to {save_path}")


if __name__ == "__main__":
    # Example usage
    print("Visualization utilities loaded.")
    print("Use visualize_embeddings_tsne(), cluster_and_visualize(), etc.")
