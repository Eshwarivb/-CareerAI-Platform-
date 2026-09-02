from flask import Blueprint, request, jsonify
import os

from utils.resume_parser import extract_text_from_file, parse_resume 
from utils.job_recommender import get_jobs
from utils.feedback_generator import generate_feedback
from utils.ats_scorer import compute_ats_score

resume_bp = Blueprint("resume", __name__)
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@resume_bp.route("/analyze", methods=["POST"])
def analyze_resume():
    if 'resume' not in request.files:
        return jsonify({"error": "No resume file provided"}), 400

    file = request.files["resume"]
    location = request.form.get("location", "")

    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(path)

    try:
        text = extract_text_from_file(path)
        if not text:
            return jsonify({"error": "Could not read text from file"}), 400

        parsed_data = parse_resume(text)
        skills = parsed_data.get("skills", [])
        experience_level = parsed_data.get("experience_level", "Fresher")

        # SAFE FEEDBACK (never break)
        try:
            feedback = generate_feedback(skills)
        except:
            feedback = ["Could not generate feedback."]

        # JOB RECOMMENDATION WITH FALLBACK IF skills empty
        if not skills:
            jobs = []
        else:
            jobs = get_jobs(skills, location, experience_level)

        # If still no jobs found → fallback search
        if len(jobs) == 0 and len(skills) > 0:
            fallback_skills = skills[:1]  # only first skill
            jobs = get_jobs(fallback_skills, location, experience_level)

        return jsonify({
            "skills": skills,
            "experience_level": experience_level,
            "feedback": feedback,
            "jobs": jobs
        })

    except Exception as e:
        print("Resume Analysis Error:", e)
        return jsonify({"error": "Internal server error"}), 500

    finally:
        if os.path.exists(path):
            os.remove(path)


@resume_bp.route("/ats-score", methods=["POST"])
def ats_score():
    """
    ATS Score endpoint — fully rule-based, no LLM calls.
    Expects multipart/form-data:
      - resume: file (pdf/docx/txt)
      - job_description: text (the target JD to score against)
    """
    if 'resume' not in request.files:
        return jsonify({"error": "No resume file provided"}), 400

    file = request.files["resume"]
    job_description = request.form.get("job_description", "").strip()

    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    if not job_description:
        return jsonify({"error": "job_description is required to compute an ATS score"}), 400

    path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(path)

    try:
        text = extract_text_from_file(path)
        if not text:
            return jsonify({"error": "Could not read text from file"}), 400

        parsed_data = parse_resume(text)
        skills = parsed_data.get("skills", [])

        result = compute_ats_score(text, skills, job_description)

        return jsonify(result)

    except Exception as e:
        print("ATS Score Error:", e)
        return jsonify({"error": "Internal server error"}), 500

    finally:
        if os.path.exists(path):
            os.remove(path)
