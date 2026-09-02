from pymongo import MongoClient
from config import MONGO_URI

client = MongoClient(MONGO_URI)
db = client["resume_recommender"]
users = db["users"]

def create_user(name, email, password_hash):
    if users.find_one({"email": email}):
        return None
    user = {"name": name, "email": email, "password": password_hash}
    users.insert_one(user)
    return user

def get_user(email):
    return users.find_one({"email": email})
