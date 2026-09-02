from flask import Flask
from flask_cors import CORS
from routes.auth_routes import auth_bp
from routes.resume_routes import resume_bp
from routes.chat_routes import chat_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(resume_bp, url_prefix="/api/resume")
app.register_blueprint(chat_bp, url_prefix="/api/chat")

@app.route("/")
def home():
    return {"message": "Resume Analyzer & Job Recommender API running"}

if __name__ == "__main__":
    app.run(debug=True, port=5000)
    print("running app.py")
