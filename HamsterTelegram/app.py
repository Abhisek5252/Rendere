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

# Import db after Flask is set up
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

# Import models AFTER defining `app`
try:
    from models import db, User, SpinHistory
except ModuleNotFoundError:
    print("ERROR: models.py not found! Make sure it's in the same directory as app.py.")

# Initialize db with app
db.init_app(app)

# Store active game sessions
active_games = {}

# Create tables inside app context
with app.app_context():
    db.create_all()

@app.route('/')
def index():
    return render_template('index.html')


# Initialize db with app
db.init_app(app)

# Store active game sessions
active_games = {}

# Create tables inside app context
with app.app_context():
    db.create_all()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/wallet')
def wallet():
    user = User.query.first()
    if not user:
        user = User(address='demo_address')
        db.session.add(user)
        db.session.commit()
    return render_template('wallet.html', user=user)
