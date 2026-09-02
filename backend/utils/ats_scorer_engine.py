"""
ats_scorer_engine.py — Multi-Factor ATS Resume Scoring & Job Matching Engine

Deterministic, multi-factor scoring engine using spaCy, scikit-learn (TF-IDF),
RapidFuzz, regex section parsing, and weighted sub-scores.
No arbitrary LLM numerical scoring — 100% repeatable and consistent.
"""

import re
import math
from rapidfuzz import fuzz, process
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from utils.resume_parser import normalize_text, TECH_SKILLS, parse_resume
from utils.job_recommender import JOB_SKILLS, TOOL_SKILLS
from utils.canonical_map import CANONICAL_MAP

# -------------------------------------------------------------
# MASTER VOCABULARY & NORMALIZATION DICTIONARY
# -------------------------------------------------------------
MASTER_SKILLS = sorted(set(TECH_SKILLS) | set(JOB_SKILLS) | set(TOOL_SKILLS) | set(CANONICAL_MAP.values()))

# Skill synonyms & canonical normalization
SYNONYM_MAP = {
    "rest api": "rest api", "rest apis": "rest api", "restful api": "rest api", "restful apis": "rest api",
    "js": "javascript", "javascript": "javascript", "react js": "react", "react.js": "react", "reactjs": "react", "react": "react",
    "node": "node.js", "node.js": "node.js", "nodejs": "node.js", "node js": "node.js",
    "express": "express.js", "express.js": "express.js", "expressjs": "express.js", "express js": "express.js",
    "postgres": "postgresql", "postgresql": "postgresql", "postgres sql": "postgresql",
    "mongo": "mongodb", "mongodb": "mongodb",
    "py": "python", "python": "python",
    "ts": "typescript", "typescript": "typescript",
    "ml": "machine learning", "machine learning": "machine learning",
    "docker": "docker", "containerization": "docker", "containers": "docker",
    "aws": "aws", "amazon web services": "aws",
    "git": "git", "github": "git", "gitlab": "git",
    "flask": "flask", "django": "django",
    "sql": "sql", "mysql": "mysql",
    "java": "java", "c++": "c++", "cpp": "c++"
}

EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
PHONE_RE = re.compile(r"(\+?\d{1,3}[-.\s]?)?\(?\d{3,5}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}")

SECTION_PATTERNS = {
    "summary": r"\b(summary|objective|about\s+me|profile)\b",
    "skills": r"\b(skills|technical\s+skills|core\s+competencies|technologies|tools)\b",
    "experience": r"\b(experience|work\s+experience|employment\s+history|work\s+history|professional\s+experience)\b",
    "education": r"\b(education|academic\s+background|qualifications|academic\s+history)\b",
    "projects": r"\b(projects|academic\s+projects|personal\s+projects|key\s+projects)\b",
    "certifications": r"\b(certifications|licenses|achievements|awards|publications)\b"
}

DEFAULT_WEIGHTS = {
    "required_skills": 0.20,
    "skills_match": 0.20,
    "semantic_relevance": 0.15,
    "experience_match": 0.15,
    "project_relevance": 0.10,
    "education_match": 0.05,
    "structure_score": 0.05,
    "formatting_score": 0.05,
    "completeness_score": 0.05
}

# -------------------------------------------------------------
# HELPER FUNCTIONS
# -------------------------------------------------------------
def canonicalize_skill(skill_name):
    """Normalize skill string using synonym map and canonical map."""
    s = skill_name.lower().strip()
    s = CANONICAL_MAP.get(s, s)
    return SYNONYM_MAP.get(s, s)

def extract_sections(raw_text):
    """Detect presence of standard resume sections."""
    text = (raw_text or "").lower()
    sections_found = {}
    for sec_name, pattern in SECTION_PATTERNS.items():
        sections_found[sec_name] = bool(re.search(pattern, text))
    return sections_found

def parse_jd_requirements(jd_text):
    """
    Parses Job Description into Required vs Preferred Skills,
    Experience Required, and Education Required.
    """
    clean_jd = normalize_text(jd_text or "")
    lines = (jd_text or "").split("\n")
    
    required_keywords = set()
    preferred_keywords = set()
    
    current_mode = "required"
    
    for line in lines:
        l_lower = line.lower().strip()
        if not l_lower:
            continue
        if any(h in l_lower for h in ["preferred", "nice to have", "plus", "bonus", "desirable"]):
            current_mode = "preferred"
        elif any(h in l_lower for h in ["requirements", "required", "qualification", "must have"]):
            current_mode = "required"
            
        for master_skill in MASTER_SKILLS:
            pattern = r"\b" + re.escape(master_skill).replace(r"\ ", r"\s+") + r"\b"
            if re.search(pattern, l_lower):
                c_skill = canonicalize_skill(master_skill)
                if current_mode == "preferred":
                    preferred_keywords.add(c_skill)
                else:
                    required_keywords.add(c_skill)
                    
    # Ensure preferred keywords do not overlap with required
    preferred_keywords = preferred_keywords - required_keywords
    
    # Fallback if no sections explicitly found
    all_found = sorted(required_keywords | preferred_keywords)
    if not required_keywords and all_found:
        cutoff = math.ceil(len(all_found) * 0.6)
        required_keywords = set(all_found[:cutoff])
        preferred_keywords = set(all_found[cutoff:])
        
    # Extract experience requirements
    exp_years = 0
    is_fresher_friendly = False
    if any(k in clean_jd for k in ["fresher", "entry level", "intern", "0 year", "0-1 year"]):
        is_fresher_friendly = True
        
    exp_match = re.search(r"(\d+)\s*\+?\s*(?:-\s*\d+)?\s*(?:years?|yrs?)", clean_jd)
    if exp_match:
        exp_years = int(exp_match.group(1))
        
    # Extract education requirements
    edu_reqs = []
    if "bachelor" in clean_jd or "b.tech" in clean_jd or "b.e" in clean_jd or "bs" in clean_jd:
        edu_reqs.append("bachelor")
    if "master" in clean_jd or "m.tech" in clean_jd or "ms" in clean_jd:
        edu_reqs.append("master")
    if "computer science" in clean_jd or "information technology" in clean_jd or "engineering" in clean_jd:
        edu_reqs.append("cs_degree")
        
    return {
        "required_skills": sorted(required_keywords),
        "preferred_skills": sorted(preferred_keywords),
        "all_jd_skills": sorted(required_keywords | preferred_keywords),
        "exp_years_required": exp_years,
        "is_fresher_friendly": is_fresher_friendly,
        "education_requirements": edu_reqs
    }

def match_skills_fuzzy(resume_skills, target_skills, threshold=85):
    """
    Matches candidate skills against target skills using exact match
    followed by RapidFuzz token_sort_ratio.
    Returns (matched_list, missing_list).
    """
    norm_resume = {canonicalize_skill(s) for s in resume_skills}
    matched = set()
    missing = set()

    for target in target_skills:
        c_target = canonicalize_skill(target)
        if c_target in norm_resume:
            matched.add(c_target)
            continue
            
        # Try RapidFuzz
        found_fuzzy = False
        for res_skill in norm_resume:
            score = fuzz.token_sort_ratio(c_target, res_skill)
            if score >= threshold:
                matched.add(c_target)
                found_fuzzy = True
                break
                
        if not found_fuzzy:
            missing.add(c_target)
            
    return sorted(matched), sorted(missing)

def compute_tfidf_similarity(resume_text, jd_text):
    """
    Computes TF-IDF Cosine Similarity between resume text and job description.
    Returns score from 0 to 100.
    """
    c_resume = normalize_text(resume_text or "")
    c_jd = normalize_text(jd_text or "")
    
    if not c_resume or not c_jd:
        return 0
        
    try:
        vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
        tfidf_matrix = vectorizer.fit_transform([c_resume, c_jd])
        sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        # Normalize similarity (typically 0.1 to 0.6) to 0-100 range scale
        score = round(min(1.0, sim * 1.8) * 100)
        return max(0, min(100, score))
    except Exception:
        return 50

# -------------------------------------------------------------
# MAIN MULTI-FACTOR ATS ENGINE
# -------------------------------------------------------------
def compute_ats_score_advanced(resume_raw_text, resume_skills, jd_text, custom_weights=None):
    """
    Computes a deterministic, multi-factor ATS Compatibility Score.
    """
    weights = custom_weights or DEFAULT_WEIGHTS
    c_resume = normalize_text(resume_raw_text or "")
    parsed_jd = parse_jd_requirements(jd_text)
    
    # 1. Required Skills Match
    req_matched, req_missing = match_skills_fuzzy(resume_skills, parsed_jd["required_skills"])
    req_match_pct = round((len(req_matched) / len(parsed_jd["required_skills"])) * 100) if parsed_jd["required_skills"] else 100
    
    # 2. Preferred Skills Match
    pref_matched, pref_missing = match_skills_fuzzy(resume_skills, parsed_jd["preferred_skills"])
    
    # Overall Skills Match
    all_matched, all_missing = match_skills_fuzzy(resume_skills, parsed_jd["all_jd_skills"])
    all_skills_pct = round((len(all_matched) / len(parsed_jd["all_jd_skills"])) * 100) if parsed_jd["all_jd_skills"] else 100

    # 3. TF-IDF Cosine Content Similarity
    semantic_score = compute_tfidf_similarity(resume_raw_text, jd_text)

    # 4. Experience Match
    parsed_resume = parse_resume(resume_raw_text or "")
    candidate_exp_str = parsed_resume.get("experience_level", "Fresher")
    
    # Extract numerical years from candidate exp
    cand_years = 0
    cand_exp_match = re.search(r"(\d+)", candidate_exp_str)
    if cand_exp_match:
        cand_years = int(cand_exp_match.group(1))
        
    req_years = parsed_jd["exp_years_required"]
    
    if parsed_jd["is_fresher_friendly"] or req_years == 0:
        exp_score = 100
        exp_notes = "Job accepts entry level / freshers. Full credit awarded."
    elif cand_years >= req_years:
        exp_score = 100
        exp_notes = f"Candidate meets/exceeds requirement ({cand_years} years vs {req_years} required)."
    else:
        ratio = cand_years / max(1, req_years)
        exp_score = round(max(40, ratio * 100))
        exp_notes = f"Candidate has {cand_years} years experience vs {req_years} required."

    # 5. Project Relevance
    # Check if resume contains project keywords matching JD
    project_score = 70
    if "project" in c_resume:
        proj_keywords_found = [s for s in parsed_jd["all_jd_skills"] if s in c_resume]
        if len(proj_keywords_found) >= 3:
            project_score = 95
        elif len(proj_keywords_found) >= 1:
            project_score = 80
        else:
            project_score = 65

    # 6. Education Match
    edu_score = 100
    edu_reqs = parsed_jd["education_requirements"]
    if edu_reqs:
        found_edu = False
        for req in edu_reqs:
            if req in c_resume or "degree" in c_resume or "bachelor" in c_resume or "b.tech" in c_resume or "b.e" in c_resume or "university" in c_resume or "college" in c_resume:
                found_edu = True
                break
        edu_score = 100 if found_edu else 70
    else:
        edu_score = 100  # Not specified in JD -> no penalty

    # 7. Resume Structure Score
    sections = extract_sections(resume_raw_text)
    essential_sections = ["skills", "experience", "education"]
    structure_found_count = sum(1 for sec in essential_sections if sections.get(sec))
    structure_score = round((structure_found_count / len(essential_sections)) * 100)
    if sections.get("summary") or sections.get("projects"):
        structure_score = min(100, structure_score + 10)

    # 8. ATS Readability & Formatting
    formatting_issues = []
    text_len = len((resume_raw_text or "").strip())
    if text_len < 200:
        formatting_issues.append("Resume contains very little extractable text — may be an image-based PDF or complex graphic layout.")
    if not EMAIL_RE.search(resume_raw_text or ""):
        formatting_issues.append("No email address detected in standard format.")
    if not PHONE_RE.search(resume_raw_text or ""):
        formatting_issues.append("No phone number detected in standard format.")
        
    for sec in ["skills", "experience", "education"]:
        if not sections.get(sec):
            formatting_issues.append(f"Missing clearly labeled '{sec.capitalize()}' section header.")
            
    formatting_score = max(0, round(100 - (len(formatting_issues) * 15)))

    # 9. Contact / Completeness
    contact_count = 0
    if EMAIL_RE.search(resume_raw_text or ""): contact_count += 1
    if PHONE_RE.search(resume_raw_text or ""): contact_count += 1
    if "linkedin" in c_resume: contact_count += 1
    if "github" in c_resume: contact_count += 1
    completeness_score = min(100, round((contact_count / 3) * 100))

    # -------------------------------------------------------------
    # CALCULATE WEIGHTED OVERALL SCORE
    # -------------------------------------------------------------
    overall_raw = (
        req_match_pct * weights["required_skills"] +
        all_skills_pct * weights["skills_match"] +
        semantic_score * weights["semantic_relevance"] +
        exp_score * weights["experience_match"] +
        project_score * weights["project_relevance"] +
        edu_score * weights["education_match"] +
        structure_score * weights["structure_score"] +
        formatting_score * weights["formatting_score"] +
        completeness_score * weights["completeness_score"]
    )
    
    overall_score = max(0, min(100, round(overall_raw)))

    # Score interpretation label
    if overall_score >= 90:
        interpretation = "Excellent Match"
    elif overall_score >= 80:
        interpretation = "Strong Match"
    elif overall_score >= 70:
        interpretation = "Good Match"
    elif overall_score >= 60:
        interpretation = "Moderate Match"
    else:
        interpretation = "Needs Improvement"

    # Actionable strengths & recommendations
    strengths = []
    recommendations = []
    
    if req_match_pct >= 80:
        strengths.append(f"Strong match on required skills ({len(req_matched)}/{len(parsed_jd['required_skills'])} found).")
    if semantic_score >= 75:
        strengths.append("High overall content and keyword relevance to the job description.")
    if exp_score >= 90:
        strengths.append("Experience level aligns well with job requirements.")
    if structure_score >= 90:
        strengths.append("Clean resume section structure detected.")
        
    if req_missing:
        recommendations.append(f"Missing required skills: {', '.join(req_missing[:4])}. Add them only if you genuinely have experience with them.")
    if pref_missing:
        recommendations.append(f"Missing preferred skills: {', '.join(pref_missing[:4])}.")
    if formatting_issues:
        recommendations.append(f"Fix formatting issues: {formatting_issues[0]}")
    if semantic_score < 60:
        recommendations.append("Tailor your summary and project descriptions to mirror the phrasing of the job description.")

    return {
        "overall_score": overall_score,
        "score_label": interpretation,
        
        # Legacy compatibility keys
        "keyword_match_pct": all_skills_pct,
        "matched_keywords": all_matched,
        "missing_keywords": all_missing,
        "formatting_issues": formatting_issues,
        "formatting_score": formatting_score,
        
        # Multi-factor score breakdown
        "score_breakdown": {
            "required_keyword_match": req_match_pct,
            "skills_match": all_skills_pct,
            "semantic_relevance": semantic_score,
            "experience_match": exp_score,
            "project_relevance": project_score,
            "education_match": edu_score,
            "structure_score": structure_score,
            "formatting_score": formatting_score,
            "completeness_score": completeness_score
        },
        
        "matched_required_skills": req_matched,
        "missing_required_skills": req_missing,
        "matched_preferred_skills": pref_matched,
        "missing_preferred_skills": pref_missing,
        
        "strengths": strengths if strengths else ["Resume parsed successfully."],
        "recommendations": recommendations,
        
        "experience_analysis": {
            "candidate_exp": candidate_exp_str,
            "required_exp": f"{req_years} years" if req_years else "Entry Level / Not specified",
            "score": exp_score,
            "notes": exp_notes
        },
        "education_analysis": {
            "score": edu_score,
            "requirements": parsed_jd["education_requirements"]
        },
        "project_analysis": {
            "score": project_score
        }
    }
