from flask import Blueprint, request, jsonify
from utils.auth_helper import verify_token
from utils.llm_client import generate_reply, GEMINI_MODEL, GEMINI_CAREER_MODEL
from models.chat_model import save_message, get_recent_history

chat_bp = Blueprint("chat", __name__)

GENERAL_SYSTEM_PROMPT = (
    "You are the RAJR assistant, a helpful support bot for the Smart Resume "
    "Analyzer & Job Recommender platform. Help users understand how to use "
    "the site (uploading a resume, reading their ATS score, job matches) and "
    "give general, practical resume-writing tips. Keep answers concise "
    "(a few sentences, use short bullet points for lists). If asked something "
    "unrelated to resumes, careers, or the platform, politely redirect."
)

CAREER_SYSTEM_PROMPT_TEMPLATE = (
    "You are a career guidance coach embedded in the RAJR platform. You must "
    "ground every answer in the specific user's parsed resume data below — "
    "do not give generic advice that ignores it.\n\n"
    "User's extracted skills: {skills}\n"
    "User's experience level: {experience_level}\n"
    "Recent resume feedback given to the user: {feedback}\n"
    "Target role the user is interested in: {target_role}\n\n"
    "Give specific, actionable career guidance referencing their actual "
    "skills and gaps. Keep answers concise (a few sentences, short bullets "
    "for lists)."
)


def _get_authenticated_email():
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()
    if not token:
        return None
    return verify_token(token)


@chat_bp.route("/general", methods=["POST"])
def general_chat():
    email = _get_authenticated_email()
    if not email:
        return jsonify({"error": "Unauthorized. Please log in again."}), 401

    data = request.json or {}
    message = (data.get("message") or "").strip()
    if not message:
        return jsonify({"error": "message is required"}), 400

    history = get_recent_history(email, "general")
    reply, error = generate_reply(GENERAL_SYSTEM_PROMPT, history, message, model=GEMINI_MODEL)

    if error:
        return jsonify({"error": error}), 503

    save_message(email, "general", "user", message)
    save_message(email, "general", "model", reply)

    return jsonify({"reply": reply})


@chat_bp.route("/career", methods=["POST"])
def career_chat():
    email = _get_authenticated_email()
    if not email:
        return jsonify({"error": "Unauthorized. Please log in again."}), 401

    data = request.json or {}
    message = (data.get("message") or "").strip()
    target_role = (data.get("target_role") or "not specified").strip()
    resume_context = data.get("resume_context") or {}

    if not message:
        return jsonify({"error": "message is required"}), 400

    skills = ", ".join(resume_context.get("skills", [])) or "none provided yet"
    experience_level = resume_context.get("experience_level", "unknown")
    feedback_list = resume_context.get("feedback", [])
    feedback = "; ".join(feedback_list) if feedback_list else "none yet"

    system_prompt = CAREER_SYSTEM_PROMPT_TEMPLATE.format(
        skills=skills,
        experience_level=experience_level,
        feedback=feedback,
        target_role=target_role,
    )

    history = get_recent_history(email, "career")
    reply, error = generate_reply(system_prompt, history, message, model=GEMINI_CAREER_MODEL)

    if error:
        return jsonify({"error": error}), 503

    save_message(email, "career", "user", message)
    save_message(email, "career", "model", reply)

    return jsonify({"reply": reply})
