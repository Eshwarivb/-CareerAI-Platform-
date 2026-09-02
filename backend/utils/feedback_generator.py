def generate_feedback(skills):
    feedback = []
    if len(skills) < 3:
        feedback.append("⚠ Add more technical or domain-specific skills.")
    elif len(skills) > 10:
        feedback.append(" * Focus on the most relevant skills.")
    else:
        feedback.append(" * Balanced technical coverage detected.")

    skill_text = " ".join(skills)
    if "python" in skill_text:
        feedback.append(" * Strong in Python – highlight projects or results.")
    if "aws" not in skill_text:
        feedback.append("*  Add cloud skills like AWS or Azure for DevOps roles.")
    feedback.append(" * Include measurable results (e.g., 'Improved accuracy by 15%').")
    return feedback
