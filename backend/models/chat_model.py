from pymongo import MongoClient
from config import MONGO_URI
import datetime

client = MongoClient(MONGO_URI)
db = client["resume_recommender"]
chats = db["chats"]

# Only the last N turns are ever sent to the LLM — keeps token cost flat
# no matter how long a conversation gets.
MAX_HISTORY_TURNS = 6


def save_message(email, chat_type, role, content):
    """chat_type: 'general' or 'career'"""
    chats.insert_one({
        "email": email,
        "chat_type": chat_type,
        "role": role,  # "user" or "model"
        "content": content,
        "created_at": datetime.datetime.utcnow(),
    })


def get_recent_history(email, chat_type, limit=MAX_HISTORY_TURNS):
    """Returns the last `limit` messages, oldest first, ready for the LLM."""
    cursor = (
        chats.find({"email": email, "chat_type": chat_type})
        .sort("created_at", -1)
        .limit(limit)
    )
    recent = list(cursor)[::-1]
    return [{"role": m["role"], "content": m["content"]} for m in recent]
