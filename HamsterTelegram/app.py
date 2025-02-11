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

@app.route('/wallet')
def wallet():
    user = User.query.first()
    if not user:
        user = User(address='demo_address')
        db.session.add(user)
        db.session.commit()
    return render_template('wallet.html', user=user)

@app.route('/games')
def games():
    user = User.query.first()
    if not user:
        user = User(address='demo_address')
        db.session.add(user)
        db.session.commit()
    return render_template('games.html', user=user)

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

@app.route('/api/game/join', methods=['POST'])
def join_game():
    user = User.query.first()
    game_id = request.json.get('game_id')

    if game_id not in active_games:
        active_games[game_id] = {
            'players': [],
            'state': 'waiting'
        }

    if len(active_games[game_id]['players']) < 4:  # Max 4 players per game
        active_games[game_id]['players'].append({
            'id': user.id,
            'address': user.address,
            'score': 0
        })
        return jsonify({
            'game_id': game_id,
            'players': active_games[game_id]['players']
        })

    return jsonify({'error': 'Game is full'}), 400

@app.route('/api/game/state', methods=['GET'])
def get_game_state():
    game_id = request.args.get('game_id')
    if game_id in active_games:
        return jsonify(active_games[game_id])
    return jsonify({'error': 'Game not found'}), 404

@app.route('/api/convert', methods=['POST'])
def convert_tokens():
    amount = request.json.get('amount', 0)
    user = User.query.first()

    if amount < 100 or user.metarush_balance < amount:
        return jsonify({'error': 'Invalid amount'}), 400

    metaverse_tokens = amount // 100
    user.metarush_balance -= amount
    user.metaverse_balance += metaverse_tokens
    db.session.commit()

    return jsonify({
        'metarush_balance': user.metarush_balance,
        'metaverse_balance': user.metaverse_balance
    })

@app.route('/api/spin', methods=['POST'])
def spin_wheel():
    import random
    user = User.query.first()

    if random.random() < 0.01:
        prize = random.randint(100, 300)
        token_type = 'verse'
        user.metaverse_balance += prize
    else:
        prize = random.randint(10, 50)
        token_type = 'rush'
        user.metarush_balance += prize

    spin = SpinHistory(
        user_id=user.id,
        prize_amount=prize,
        token_type=token_type
    )
    db.session.add(spin)
    db.session.commit()

    return jsonify({
        'prize': prize,
        'token_type': token_type,
        'metarush_balance': user.metarush_balance,
        'metaverse_balance': user.metaverse_balance
    })

if __name__ == "__main__":
    app.run(debug=True)
