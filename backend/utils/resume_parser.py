import re
import docx2txt
import nltk
import spacy
from pdfminer.high_level import extract_text
from pathlib import Path
from rapidfuzz import process, fuzz

# -------------------------------------------------------------
# INITIAL SETUP
# -------------------------------------------------------------
try:
    nltk.data.find("tokenizers/punkt")
except LookupError:
    nltk.download("punkt")

try:
    nlp = spacy.load("en_core_web_sm")
except:
    print("❌ spaCy model missing. Run: python -m spacy download en_core_web_sm")
    raise SystemExit

BASE_DIR = Path(__file__).resolve().parent
SKILLS_FILE_PATH = BASE_DIR / "skills.jsonl"
FUZZY_SKILLS_FILE = BASE_DIR / "fuzzy_skills.txt"

# -------------------------------------------------------------
# TECH SKILLS WHITELIST
# -------------------------------------------------------------
TECH_SKILLS = [
    "c", "c++", "python", "javascript", "html", "css",
    "bootstrap", "react", "node js", "express js", "ejs",
    "rest api", "sql", "mysql", "mongodb", "git", "github",
    "vscode"
]

# -------------------------------------------------------------
# LOAD FUZZY WORD LIST
# -------------------------------------------------------------
FUZZY_WORDS = []
try:
    with open(FUZZY_SKILLS_FILE, "r", encoding="utf-8") as f:
        FUZZY_WORDS = [word.strip().lower() for word in f.readlines() if word.strip()]
    print(f"✅ Loaded {len(FUZZY_WORDS)} fuzzy skills")
except:
    print("⚠ fuzzy_skills.txt missing")


# -------------------------------------------------------------
# FILE TEXT EXTRACTION
# -------------------------------------------------------------
def extract_text_from_file(file_path):
    file_path = str(file_path)

    if file_path.endswith(".pdf"):
        try:
            return extract_text(file_path)
        except:
            return ""

    if file_path.endswith(".docx"):
        try:
            return docx2txt.process(file_path)
        except:
            return ""

    if file_path.endswith(".txt"):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read()
        except:
            return ""

    return ""
    

# -------------------------------------------------------------
# CLEAN & NORMALIZE TEXT
# -------------------------------------------------------------
def normalize_text(text):
    clean = text.lower()
    clean = re.sub(r"[\n\r\t]+", " ", clean)
    clean = re.sub(r"[•●❖■–—_\-/(){}\[\].,]", " ", clean)
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean


# -------------------------------------------------------------
# FUZZY CORRECTION BEFORE ENTITY RULER
# -------------------------------------------------------------
def fuzzy_correct(text):
    tokens = text.split()
    corrected = []

    for tok in tokens:
        match, score, _ = process.extractOne(tok, FUZZY_WORDS)
        if score >= 85:
            corrected.append(match)
        else:
            corrected.append(tok)

    return " ".join(corrected)


# -------------------------------------------------------------
# LOAD ENTITY RULER
# -------------------------------------------------------------
def load_entity_ruler():
    if "entity_ruler" not in nlp.pipe_names:
        ruler = nlp.add_pipe("entity_ruler", config={"overwrite_ents": True}, before="ner")
        try:
            ruler.from_disk(SKILLS_FILE_PATH)
            print("✅ Loaded skills.jsonl into EntityRuler")
        except:
            print("⚠ skills.jsonl missing")
    return nlp


# -------------------------------------------------------------
# REGEX BACKUP MATCH
# -------------------------------------------------------------
def regex_skill_search(text):
    found = set()
    for skill in TECH_SKILLS:
        pattern = r"\b" + re.escape(skill).replace(r"\ ", r"\s+") + r"\b"
        if re.search(pattern, text):
            found.add(skill)
    return found


# -------------------------------------------------------------
# EXPERIENCE EXTRACTION
# -------------------------------------------------------------
def extract_experience(text):
    text = text.lower()

    if "fresher" in text or "entry level" in text:
        return "Fresher"

    years = re.findall(r"(\d+)\s*(year|years|yr|yrs)", text)
    months = re.findall(r"(\d+)\s*(month|months)", text)

    total_years = sum(int(y[0]) for y in years)
    total_months = sum(int(m[0]) for m in months)

    total_years += total_months // 12

    return "Fresher" if total_years == 0 else f"{total_years}+ years"


# -------------------------------------------------------------
# MAIN PARSER
# -------------------------------------------------------------
def parse_resume(raw_text):

    # 1. Normalize
    clean = normalize_text(raw_text)

    # 2. Fuzzy correction
    fuzzy_text = fuzzy_correct(clean)

    # 3. EntityRuler (exact match)
    nlp_model = load_entity_ruler()
    doc = nlp_model(fuzzy_text)

    exact_skills = {ent.text.lower() for ent in doc.ents if ent.label_ == "SKILL"}

    # 4. Regex skills
    regex_skills = regex_skill_search(fuzzy_text)

    # 5. Combine & filter
    all_skills = exact_skills.union(regex_skills)
    final_skills = sorted({s for s in all_skills if s in TECH_SKILLS})

    print("🔍 FINAL EXTRACTED SKILLS:", final_skills)

    return {
        "skills": final_skills,
        "experience_level": extract_experience(fuzzy_text),
        "clean_text": fuzzy_text
    }
