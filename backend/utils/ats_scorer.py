"""
ats_scorer.py — Main ATS Scoring Facade

Wraps the multi-factor ats_scorer_engine.py to ensure complete backwards
compatibility with all existing routes and models.
"""

from utils.ats_scorer_engine import (
    compute_ats_score_advanced,
    extract_sections,
    parse_jd_requirements,
    match_skills_fuzzy,
    compute_tfidf_similarity,
    MASTER_SKILLS
)

def compute_ats_score(resume_raw_text, resume_skills, jd_text):
    """
    Computes a comprehensive multi-factor ATS Compatibility Score.
    Preserves all existing response keys while providing detailed sub-scores.
    """
    return compute_ats_score_advanced(resume_raw_text, resume_skills, jd_text)
