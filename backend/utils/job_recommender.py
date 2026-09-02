import requests
from utils.canonical_map import CANONICAL_MAP

# Load API Key
try:
    from config import RAPIDAPI_KEY
except:
    RAPIDAPI_KEY = None
    print("⚠ RAPIDAPI_KEY missing. Check .env + config.py")


# ----------------------------------------------------------
# PRIORITY SKILL LISTS
# ----------------------------------------------------------
JOB_SKILLS = [
    "python", "javascript", "react", "node js", "express js",
    "java", "c", "c++", "html", "css", "typescript",
    "angular", "vue", "django", "flask", "sql", "mysql",
    "postgresql", "mongodb", "machine learning", "data science"
]

TOOL_SKILLS = [
    "git", "github", "vscode", "linux", "aws",
    "excel", "docker", "jira"
]


# ----------------------------------------------------------
# NORMALIZATION
# ----------------------------------------------------------
def normalize_skills(skills):
    return [CANONICAL_MAP.get(s, s) for s in skills]


# ----------------------------------------------------------
# MAIN JOB FETCHING FUNCTION
# ----------------------------------------------------------
def get_jobs(skills, location, experience_level):

    if not RAPIDAPI_KEY:
        print("❌ Missing API Key")
        return []

    # 1. Normalize
    skills = normalize_skills(skills)
    user_skill_set = set(skills)

    # 2. Categorize
    core = [s for s in skills if s in JOB_SKILLS]
    tools = [s for s in skills if s in TOOL_SKILLS]
    others = [s for s in skills if s not in JOB_SKILLS and s not in TOOL_SKILLS]

    # ⭐ Sort core skills based on real priority
    core = sorted(core, key=lambda s: JOB_SKILLS.index(s))

    # 3. Build TOP-3 skills
    top_skills = []

    for s in core:
        if len(top_skills) < 3:
            top_skills.append(s)

    for s in tools:
        if len(top_skills) < 3:
            top_skills.append(s)

    for s in others:
        if len(top_skills) < 3:
            top_skills.append(s)

    if not top_skills and skills:
        top_skills = skills[:3]

    # Final experience label
    exp_query = "entry level" if experience_level.lower() == "fresher" else experience_level


    # -----------------------------------------------------------------
    # MAIN QUERY (uses top 3 skills)
    # -----------------------------------------------------------------
    main_query = f"{', '.join(top_skills)} developer {exp_query} jobs in {location}"
    print("\n🔍 FINAL JOB QUERY:", main_query)

    jobs = fetch_jobs(main_query, location)


    # -----------------------------------------------------------------
    # ⭐ FALLBACK LOGIC — OPTION C (Based on top 3)
    # -----------------------------------------------------------------
    if not jobs:
        fallback1 = f"{top_skills[0]} developer {exp_query} jobs in {location}"
        print("🔁 FALLBACK 1:", fallback1)
        jobs = fetch_jobs(fallback1, location)

    if not jobs and len(top_skills) > 1:
        fallback2 = f"{top_skills[1]} developer {exp_query} jobs in {location}"
        print("🔁 FALLBACK 2:", fallback2)
        jobs = fetch_jobs(fallback2, location)

    # Guaranteed fallback
    if not jobs:
        fallback3 = f"software developer {exp_query} jobs in {location}"
        print("🔁 FALLBACK 3 (Guaranteed):", fallback3)
        jobs = fetch_jobs(fallback3, location)

    # 4. Score + sort by how well each job matches the user's skill set
    jobs = attach_match_scores(jobs, user_skill_set)
    jobs.sort(key=lambda j: j["match_pct"], reverse=True)

    return jobs


# ----------------------------------------------------------
# MATCH SCORING (rule-based, no LLM calls)
# ----------------------------------------------------------
def attach_match_scores(jobs, user_skill_set):
    """
    Adds a 'match_pct' field to each job by comparing the user's skill
    set against skill keywords found in the job title + description.
    Pure keyword overlap — no external calls, no extra cost.
    """
    all_known_skills = set(JOB_SKILLS) | set(TOOL_SKILLS)

    for job in jobs:
        haystack = f"{job.get('title', '')} {job.get('description', '')}".lower()
        job_skills_found = {s for s in all_known_skills if s in haystack}

        if not job_skills_found:
            job["match_pct"] = 0
            continue

        overlap = job_skills_found & user_skill_set
        job["match_pct"] = round((len(overlap) / len(job_skills_found)) * 100)

    return jobs



# ----------------------------------------------------------
# API CALL FUNCTION
# ----------------------------------------------------------
def fetch_jobs(query, location):

    url = "https://jsearch.p.rapidapi.com/search"

    headers = {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
    }

    params = {
        "query": query,
        "page": "1",
        "num_pages": "1"
    }

    jobs = []
    seen = set()

    try:
        response = requests.get(url, headers=headers, params=params)
        print("API STATUS:", response.status_code)

        if response.status_code != 200:
            return []

        data = response.json().get("data", [])

        for job in data:
            link = job.get("job_apply_link")
            if not link or link in seen:
                continue

            seen.add(link)
            jobs.append({
                "title": job.get("job_title"),
                "company": job.get("employer_name"),
                "location": job.get("job_city") or location,
                "url": link,
                "description": (job.get("job_description") or "")[:200] + "..."
            })

    except Exception as e:
        print("❌ Error fetching jobs:", e)

    return jobs
