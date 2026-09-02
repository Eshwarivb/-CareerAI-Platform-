"""
ATS (Applicant Tracking System) scoring module.

Fully rule-based — no LLM calls, no external API cost. Reuses the same
normalization + skill-matching approach as resume_parser.py so results
stay consistent with what /api/resume/analyze already extracts.
"""

import re
from utils.resume_parser import normalize_text, TECH_SKILLS
from utils.job_recommender import JOB_SKILLS, TOOL_SKILLS
from utils.canonical_map import CANONICAL_MAP

# Master skill vocabulary used to scan a job description for keywords.
MASTER_SKILLS = sorted(set(TECH_SKILLS) | set(JOB_SKILLS) | set(TOOL_SKILLS) | set(CANONICAL_MAP.values()))

EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
PHONE_RE = re.compile(r"(\+?\d{1,3}[-.\s]?)?\(?\d{3,5}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}")

REQUIRED_SECTIONS = ["experience", "education", "skills", "project"]

FORMATTING_CHECKS_TOTAL = 6  # keep in sync with checks below


def extract_jd_skills(jd_text):
    """Scan a job description for known skill keywords."""
    if not jd_text:
        return []
    clean = normalize_text(jd_text)
    found = set()
    for skill in MASTER_SKILLS:
        pattern = r"\b" + re.escape(skill).replace(r"\ ", r"\s+") + r"\b"
        if re.search(pattern, clean):
            found.add(skill)
    return sorted(found)


def check_formatting(raw_text):
    """
    Heuristic ATS-formatting red flags based on the RAW extracted text
    (before normalization) — mirrors what a real ATS parser would see.
    Returns a list of human-readable issue strings.
    """
    issues = []
    text = raw_text or ""
    lower = text.lower()

    if not EMAIL_RE.search(text):
        issues.append("No email address detected — ATS systems often reject resumes with no contact email.")

    if not PHONE_RE.search(text):
        issues.append("No phone number detected in a standard format.")

    for section in REQUIRED_SECTIONS:
        if section not in lower:
            issues.append(f"Missing a clearly labeled '{section.title()}' section header.")

    # Very short extracted text usually means the PDF used images, columns,
    # or graphics that text-based ATS parsers can't read at all.
    if len(text.strip()) < 200:
        issues.append("Very little text could be extracted — the resume may use images, icons, or a multi-column layout that ATS parsers can't read.")

    return issues


def compute_ats_score(resume_raw_text, resume_skills, jd_text):
    """
    Returns a structured ATS score breakdown:
    {
        "overall_score": int (0-100),
        "keyword_match_pct": int (0-100),
        "matched_keywords": [...],
        "missing_keywords": [...],
        "formatting_issues": [...],
        "formatting_score": int (0-100),
    }
    """
    jd_skills = extract_jd_skills(jd_text)
    resume_skills_set = set(resume_skills or [])

    matched = sorted(resume_skills_set & set(jd_skills))
    missing = sorted(set(jd_skills) - resume_skills_set)

    keyword_match_pct = round((len(matched) / len(jd_skills)) * 100) if jd_skills else 0

    formatting_issues = check_formatting(resume_raw_text)
    formatting_score = round(
        ((FORMATTING_CHECKS_TOTAL - len(formatting_issues)) / FORMATTING_CHECKS_TOTAL) * 100
    )
    formatting_score = max(0, formatting_score)

    # Weighted: keyword relevance matters most for ATS ranking, formatting
    # determines whether the resume gets parsed correctly at all.
    overall_score = round(0.7 * keyword_match_pct + 0.3 * formatting_score)
    overall_score = max(0, min(100, overall_score))

    return {
        "overall_score": overall_score,
        "keyword_match_pct": keyword_match_pct,
        "matched_keywords": matched,
        "missing_keywords": missing,
        "formatting_issues": formatting_issues,
        "formatting_score": formatting_score,
    }
