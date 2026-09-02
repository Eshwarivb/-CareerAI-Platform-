import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# MongoDB connection
# NOTE: this previously passed the connection string itself as the env
# VAR NAME (a bug) instead of reading "MONGO_URI" — fixed so the value
# in .env is actually used. New chat history storage depends on this.
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/resume_recommender")

# JWT Secret key for authentication
JWT_SECRET = os.getenv("JWT_SECRET", "supersecretkey")

# JSearch API Key (from RapidAPI)
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")

# Gemini API Key (from https://aistudio.google.com/apikey) — used by the
# two chatbot features (general assistant + resume-aware career guidance).
# Free tier is available. Leave unset and the chat endpoints will return
# a friendly "not configured" message instead of crashing.
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Model for the general AI Assistant — fast, lightweight, good for Q&A.
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")

# Model for Career Guidance — reliable, fast model for deep, personalized
# resume-grounded career analysis and roadmap generation.
GEMINI_CAREER_MODEL = os.getenv("GEMINI_CAREER_MODEL", "gemini-3.5-flash")

