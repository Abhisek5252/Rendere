import os
from datetime import datetime, timedelta
from flask import Flask, render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "games_secret_key")
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

# Initialize db BEFORE importing models
db = SQLAlchemy(app)

# Import models after db is initialized
from models import User, SpinHistory  

# Create tables inside app context
with app.app_context():
    db.create_all()

@app.route('/')
def index():
    return render_template('index.html')
