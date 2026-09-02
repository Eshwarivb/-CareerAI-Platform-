import jwt, datetime
from config import JWT_SECRET

def generate_token(email):
    payload = {"email": email, "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=5)}
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def verify_token(token):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload["email"]
    except Exception:
        return None
