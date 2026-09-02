import requests
import os
import json
import uuid

BASE_URL = "http://localhost:5000"

def run_tests():
    print("Testing Endpoints...")
    results = {}

    # 1. GET /
    try:
        r = requests.get(f"{BASE_URL}/")
        results["1. GET /"] = {"status": r.status_code, "body": r.json(), "passed": r.status_code == 200}
    except Exception as e:
        results["1. GET /"] = {"error": str(e), "passed": False}

    # 2. POST /api/auth/signup
    test_user = f"testuser_{uuid.uuid4().hex[:8]}"
    test_email = f"{test_user}@example.com"
    test_password = "password123"
    try:
        r = requests.post(f"{BASE_URL}/api/auth/signup", json={"name": test_user, "email": test_email, "password": test_password})
        results["2. POST /api/auth/signup"] = {"status": r.status_code, "body": r.json(), "passed": r.status_code in [200, 201] and "token" in r.json()}
    except Exception as e:
        results["2. POST /api/auth/signup"] = {"error": str(e), "passed": False}

    # 3. POST /api/auth/login
    jwt_token = None
    try:
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": test_email, "password": test_password})
        body = r.json()
        jwt_token = body.get("token")
        results["3. POST /api/auth/login"] = {"status": r.status_code, "body": body, "passed": r.status_code == 200 and "token" in body}
    except Exception as e:
        results["3. POST /api/auth/login"] = {"error": str(e), "passed": False}

    # Helper: Create a dummy resume PDF
    with open("dummy_resume.pdf", "wb") as f:
        f.write(b"%PDF-1.4 dummy pdf content")

    # 4. POST /api/resume/analyze
    try:
        files = {'resume': ('dummy_resume.pdf', open('dummy_resume.pdf', 'rb'), 'application/pdf')}
        data = {'location': 'New York'}
        r = requests.post(f"{BASE_URL}/api/resume/analyze", files=files, data=data)
        body = r.json()
        passed = r.status_code == 200 and all(k in body for k in ["skills", "experience_level", "feedback", "jobs"])
        results["4. POST /api/resume/analyze"] = {"status": r.status_code, "body": body, "passed": passed}
    except Exception as e:
        results["4. POST /api/resume/analyze"] = {"error": str(e), "passed": False}

    # 5. POST /api/resume/ats-score
    try:
        files = {'resume': ('dummy_resume.pdf', open('dummy_resume.pdf', 'rb'), 'application/pdf')}
        data = {'job_description': 'Looking for Python and SQL skills.'}
        r = requests.post(f"{BASE_URL}/api/resume/ats-score", files=files, data=data)
        body = r.json()
        passed = r.status_code == 200 and all(k in body for k in ["overall_score", "keyword_match_pct", "matched_keywords", "missing_keywords"])
        results["5. POST /api/resume/ats-score"] = {"status": r.status_code, "body": body, "passed": passed}
    except Exception as e:
        results["5. POST /api/resume/ats-score"] = {"error": str(e), "passed": False}

    headers = {"Authorization": f"Bearer {jwt_token}"} if jwt_token else {}

    # 6. POST /api/chat/general
    try:
        r = requests.post(f"{BASE_URL}/api/chat/general", json={"message": "How do I improve my resume?"}, headers=headers)
        body = r.json()
        passed = r.status_code == 200 and ("reply" in body or "error" in body)
        results["6. POST /api/chat/general"] = {"status": r.status_code, "body": body, "passed": passed}
    except Exception as e:
        results["6. POST /api/chat/general"] = {"error": str(e), "passed": False}

    # 7. POST /api/chat/career
    try:
        payload = {
            "message": "What should I learn next?",
            "target_role": "Data Analyst",
            "resume_context": {"skills": ["python", "sql"], "experience_level": "Fresher", "feedback": []}
        }
        r = requests.post(f"{BASE_URL}/api/chat/career", json=payload, headers=headers)
        body = r.json()
        passed = r.status_code == 200 and ("reply" in body or "error" in body)
        results["7. POST /api/chat/career"] = {"status": r.status_code, "body": body, "passed": passed}
    except Exception as e:
        results["7. POST /api/chat/career"] = {"error": str(e), "passed": False}

    print("\n--- Test Results ---")
    for test, res in results.items():
        status_icon = "[PASS]" if res.get("passed") else "[FAIL]"
        print(f"{status_icon} {test}")
        if "status" in res:
            print(f"    Status: {res['status']}")
        if "error" in res:
            print(f"    Error: {res['error']}")
        if "body" in res:
            print(f"    Body: {json.dumps(res['body'])[:200]}...")
            
    with open("test_report.json", "w") as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    run_tests()
