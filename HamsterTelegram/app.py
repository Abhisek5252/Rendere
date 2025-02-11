import os
from datetime import datetime, timedelta
from flask import Flask, render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from config import Config  # Import Config file

app = Flask(__name__)
app.config.from_object(Config)  # Load configuration from config.py

# Initialize the database
db = SQLAlchemy(app)

# Import models after initializing db
from models import User, SpinHistory

with app.app_context():
    db.create_all()

# Store active game sessions
active_games = {}

@app.route('/')
def home():
    return "Welcome to Metaverse API! Your app is running.", 200  # Simple response

@app.route('/wallet')
def wallet():
    user = User.query.first()
    if not user:
        user = User(address='demo_address')
        db.session.add(user)
        db.session.commit()
    return render_template('wallet.html', user=user)

@app.route('/api/daily-login', methods=['POST'])
def daily_login():
    user = User.query.first()
    if not user:
        user = User(address='demo_address')
        db.session.add(user)

    now = datetime.utcnow()
    if user.last_login and (now - user.last_login) < timedelta(days=1):
        return jsonify({'error': 'Already claimed today'}), 400

    reward = 150 * (2 ** user.login_streak)
    user.metarush_balance += reward
    user.last_login = now
    user.login_streak = (user.login_streak + 1) % 7
    db.session.commit()

    return jsonify({
        'reward': reward,
        'streak': user.login_streak,
        'balance': user.metarush_balance
    })
