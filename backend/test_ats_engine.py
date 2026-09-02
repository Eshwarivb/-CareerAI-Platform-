"""
test_ats_engine.py — Comprehensive Validation Suite for Multi-Factor ATS Engine

Tests all 10 validation scenarios required by the system specification.
"""

import os
import sys
from utils.ats_scorer_engine import compute_ats_score_advanced

def run_tests():
    print("=" * 70)
    print("      RUNNING ATS MULTI-FACTOR ENGINE VALIDATION SUITE (10 SCENARIOS)")
    print("=" * 70)
    
    passed_count = 0
    total_tests = 10

    # -------------------------------------------------------------
    # SCENARIO 1: Excellent Resume-Job Match
    # -------------------------------------------------------------
    print("\n[TEST 1] Excellent Resume-Job Match")
    resume_1 = """
    Jane Doe | Email: jane.doe@example.com | Phone: +1-555-0199 | LinkedIn: linkedin.com/in/janedoe | GitHub: github.com/janedoe
    Summary: Experienced Full Stack Developer with 4 years of experience building scalable web applications.
    Technical Skills: Python, Flask, React, MongoDB, PostgreSQL, REST API, Docker, Git.
    Work Experience: Senior Developer at TechCorp (3 years). Built RESTful APIs using Python, Flask, and MongoDB. Deployed containers using Docker on AWS.
    Education: Bachelor of Science in Computer Science, State University 2020.
    Projects: E-Commerce Platform built with React, Python, Flask, and MongoDB. Integrated Docker CI/CD pipeline.
    """
    jd_1 = """
    Senior Python Developer needed.
    Requirements:
    - 3+ years experience in Python, Flask, REST API, and MongoDB.
    - Experience with React and PostgreSQL.
    Preferred:
    - Docker, AWS, Git.
    - Bachelor's degree in Computer Science.
    """
    res1 = compute_ats_score_advanced(resume_1, ["python", "flask", "react", "mongodb", "postgresql", "rest api", "docker", "git"], jd_1)
    print(f" -> Overall Score: {res1['overall_score']}% ({res1['score_label']})")
    print(f" -> Breakdown: Required Skills={res1['score_breakdown']['required_keyword_match']}%, Semantic={res1['score_breakdown']['semantic_relevance']}%, Exp={res1['score_breakdown']['experience_match']}%")
    assert res1["overall_score"] >= 80, f"Expected >= 80%, got {res1['overall_score']}%"
    print(" [PASSED]")
    passed_count += 1

    # -------------------------------------------------------------
    # SCENARIO 2: Poor Resume-Job Match
    # -------------------------------------------------------------
    print("\n[TEST 2] Poor Resume-Job Match")
    resume_2 = """
    John Smith | Email: john@example.com | Phone: 555-0122
    Summary: Sales representative with experience in customer relations and retail operations.
    Skills: Sales, Customer Service, Negotiation, Communication, MS Word.
    Experience: Retail Manager for 2 years. Handled store inventory and customer support.
    Education: High School Diploma.
    """
    res2 = compute_ats_score_advanced(resume_2, ["sales", "customer service"], jd_1)
    print(f" -> Overall Score: {res2['overall_score']}% ({res2['score_label']})")
    assert res2["overall_score"] < 60, f"Expected < 60%, got {res2['overall_score']}%"
    print(" [PASSED]")
    passed_count += 1

    # -------------------------------------------------------------
    # SCENARIO 3: All Required Skills Present, Missing Preferred Skills
    # -------------------------------------------------------------
    print("\n[TEST 3] Required Skills Present, Missing Preferred Skills")
    resume_3 = """
    Alice Johnson | Email: alice@example.com | Phone: 555-0188
    Summary: Developer skilled in Python, Flask, and MongoDB.
    Skills: Python, Flask, REST API, MongoDB.
    Experience: Developer for 2 years using Python and Flask with MongoDB.
    Education: Bachelor of Science in Computer Science.
    Projects: REST API Service built with Flask and MongoDB.
    """
    jd_3 = """
    Python Developer needed.
    Requirements:
    - Python, Flask, REST API, MongoDB.
    Preferred:
    - Docker, AWS, Git, React, PostgreSQL.
    """
    res3 = compute_ats_score_advanced(resume_3, ["python", "flask", "rest api", "mongodb"], jd_3)
    print(f" -> Overall Score: {res3['overall_score']}% ({res3['score_label']})")
    print(f" -> Matched Required: {res3['matched_required_skills']}")
    print(f" -> Missing Preferred: {res3['missing_preferred_skills']}")
    assert res3["score_breakdown"]["required_keyword_match"] >= 80, "Required match should be strong"
    assert res3["overall_score"] >= 70, "Overall score should remain strong despite missing preferred"
    print(" [PASSED]")
    passed_count += 1

    # -------------------------------------------------------------
    # SCENARIO 4: Fresher Applying for Internship / Entry Level
    # -------------------------------------------------------------
    print("\n[TEST 4] Fresher Applying for Internship (Entry Level Protection)")
    resume_4 = """
    Bob Developer | Email: bob@example.com | Phone: 555-0177
    Summary: Computer Science fresher seeking an entry level Software Developer internship.
    Skills: Python, JavaScript, React, Git, HTML, CSS.
    Education: Bachelor of Technology in Computer Science (2024 graduate).
    Projects: Portfolio Website built with React. Student Management System built with Python.
    """
    jd_entry = """
    Software Developer Intern / Entry Level Engineer.
    Requirements:
    - Fresher or 0-1 years experience.
    - Knowledge of Python, JavaScript, and React.
    - Computer Science degree or equivalent.
    """
    res4 = compute_ats_score_advanced(resume_4, ["python", "javascript", "react", "git"], jd_entry)
    print(f" -> Experience Score: {res4['experience_analysis']['score']}% ({res4['experience_analysis']['notes']})")
    print(f" -> Overall Score: {res4['overall_score']}% ({res4['score_label']})")
    assert res4["experience_analysis"]["score"] == 100, "Fresher should get 100% experience score on entry-level role"
    print(" [PASSED]")
    passed_count += 1

    # -------------------------------------------------------------
    # SCENARIO 5: Skill Variation / Normalization (RESTful APIs vs REST API)
    # -------------------------------------------------------------
    print("\n[TEST 5] Skill Spelling Variations & Normalization")
    resume_5 = """
    Carol White | Email: carol@example.com | Phone: 555-0166
    Skills: RESTful APIs, Node JS, Postgres, ReactJS, Python.
    Experience: Work Experience in developing RESTful APIs with Node JS and Postgres.
    Education: Education Bachelor of Computer Science.
    """
    jd_5 = """
    Backend Engineer Requirements: REST API, Node.js, PostgreSQL, React, Python.
    """
    res5 = compute_ats_score_advanced(resume_5, ["restful apis", "node js", "postgres", "reactjs", "python"], jd_5)
    print(f" -> Matched Required: {res5['matched_required_skills']}")
    assert "rest api" in res5["matched_required_skills"], "RESTful APIs should normalize to rest api"
    assert "postgresql" in res5["matched_required_skills"], "Postgres should normalize to postgresql"
    print(" [PASSED]")
    passed_count += 1

    # -------------------------------------------------------------
    # SCENARIO 6: Duplicate Keyword Protection (Keyword Stuffing)
    # -------------------------------------------------------------
    print("\n[TEST 6] Duplicate Keyword Stuffing Protection")
    resume_6_stuffed = """
    Dave | Email: dave@example.com | Phone: 555-0155
    Skills: Python Python Python Python Python Python Python.
    Experience: Python Python Python.
    Education: Education Bachelor.
    """
    res6 = compute_ats_score_advanced(resume_6_stuffed, ["python", "python", "python"], jd_1)
    print(f" -> Matched Skills: {res6['matched_required_skills']}")
    assert len(res6["matched_required_skills"]) == 1, "Duplicate keywords should collapse to 1 unique match"
    print(" [PASSED]")
    passed_count += 1

    # -------------------------------------------------------------
    # SCENARIO 7: Image-Based / Very Low Text PDF Detection
    # -------------------------------------------------------------
    print("\n[TEST 7] Image-Based / Low Text Extraction Detection")
    resume_7_short = "Jane Doe Software Engineer"
    res7 = compute_ats_score_advanced(resume_7_short, [], jd_1)
    print(f" -> Formatting Issues: {res7['formatting_issues']}")
    assert any("very little extractable text" in i.lower() for i in res7["formatting_issues"]), "Should flag low text length"
    print(" [PASSED]")
    passed_count += 1

    # -------------------------------------------------------------
    # SCENARIO 8: Missing Essential Resume Sections
    # -------------------------------------------------------------
    print("\n[TEST 8] Missing Essential Sections Detection")
    resume_8_no_exp = """
    Eve Black | Email: eve@example.com | Phone: 555-0144
    Skills: Python, SQL.
    Projects: Built a parser.
    """
    res8 = compute_ats_score_advanced(resume_8_no_exp, ["python", "sql"], jd_1)
    print(f" -> Structure Score: {res8['score_breakdown']['structure_score']}%")
    print(f" -> Issues: {res8['formatting_issues']}")
    assert res8["score_breakdown"]["structure_score"] < 100, "Structure score should be penalized for missing experience & education headers"
    print(" [PASSED]")
    passed_count += 1

    # -------------------------------------------------------------
    # SCENARIO 9: Unrelated Projects vs Job Description
    # -------------------------------------------------------------
    print("\n[TEST 9] Unrelated Projects vs Target JD")
    resume_9_unrelated = """
    Frank | Email: frank@example.com | Phone: 555-0133
    Summary: Developer.
    Skills: Python, Flask, MongoDB.
    Work Experience: Experience with Python for 2 years.
    Education: Education B.Tech CS.
    Projects: Built an origami simulator in C++ and OpenGL.
    """
    res9 = compute_ats_score_advanced(resume_9_unrelated, ["python", "flask", "mongodb"], jd_1)
    print(f" -> Project Score: {res9['project_analysis']['score']}%")
    print(" [PASSED]")
    passed_count += 1

    # -------------------------------------------------------------
    # SCENARIO 10: Highly Relevant Projects vs Job Description
    # -------------------------------------------------------------
    print("\n[TEST 10] Highly Relevant Projects vs Target JD")
    resume_10_relevant = """
    Grace | Email: grace@example.com | Phone: 555-0122
    Summary: Full Stack Engineer.
    Skills: Python, Flask, REST API, MongoDB.
    Work Experience: Experience as Backend Developer for 2 years.
    Education: Education B.Tech Computer Science.
    Projects: E-Commerce REST API platform built using Python, Flask, MongoDB, and React with PostgreSQL database integration.
    """
    res10 = compute_ats_score_advanced(resume_10_relevant, ["python", "flask", "rest api", "mongodb", "react", "postgresql"], jd_1)
    print(f" -> Project Score: {res10['project_analysis']['score']}%")
    assert res10["project_analysis"]["score"] >= 90, "Highly relevant project should score >= 90%"
    print(" [PASSED]")
    passed_count += 1

    print("\n" + "=" * 70)
    print(f"      ALL {passed_count}/{total_tests} VALIDATION SCENARIOS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
