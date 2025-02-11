import os
import random
from datetime import datetime, timedelta
from flask import Flask, render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

# Initialize Flask App
app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "games_secret_key")

# Database Configuration with a Default SQLite Option
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///database.db")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

# Initialize Database
db = SQLAlchemy(model_class=Base)
db.init_app(app)

# Import models after db is initialized
with app.app_context():
    import models  # Ensure models.py defines User and SpinHistory
    db.create_all()

# Store active game sessions
active_games = {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/wallet')
def wallet():
    user = models.User.query.first()
    if not user:
        user = models.User(address='demo_address')
        db.session.add(user)
        db.session.commit()
    return render_template('wallet.html', user=user)

@app.route('/games')
def games():
    user = models.User.query.first()
    if not user:
        user = models.User(address='demo_address')
        db.session.add(user)
        db.session.commit()
    return render_template('games.html', user=user)

@app.route('/api/daily-login', methods=['POST'])
def daily_login():
    user = models.User.query.first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

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
    user = models.User.query.first()
    game_id = request.json.get('game_id')

    if game_id not in active_games:
        active_games[game_id] = {'players': [], 'state': 'waiting'}

    if len(active_games[game_id]['players']) < 4:  # Max 4 players per game
        active_games[game_id]['players'].append({
            'id': user.id,
            'address': user.address,
            'score': 0
        })
        return jsonify({'game_id': game_id, 'players': active_games[game_id]['players']})

    return jsonify({'error': 'Game is full'}), 400

@app.route('/api/game/state', methods=['GET'])
def get_game_state():
    game_id = request.args.get('game_id')
    return jsonify(active_games.get(game_id, {'error': 'Game not found'})), (200 if game_id in active_games else 404)

@app.route('/api/game/update', methods=['POST'])
def update_game_state():
    game_id = request.json.get('game_id')
    player_id = request.json.get('player_id')
    score = request.json.get('score', 0)

    if game_id in active_games:
        for player in active_games[game_id]['players']:
            if player['id'] == player_id:
                player['score'] = score
                return jsonify(active_games[game_id])

    return jsonify({'error': 'Game or player not found'}), 404

@app.route('/api/convert', methods=['POST'])
def convert_tokens():
    user = models.User.query.first()
    amount = request.json.get('amount', 0)

    if user is None or amount < 100 or user.metarush_balance < amount:
        return jsonify({'error': 'Invalid amount'}), 400

    metaverse_tokens = amount // 100
    user.metarush_balance -= amount
    user.metaverse_balance += metaverse_tokens
    db.session.commit()

    return jsonify({'metarush_balance': user.metarush_balance, 'metaverse_balance': user.metaverse_balance})

@app.route('/api/spin', methods=['POST'])
def spin_wheel():
    user = models.User.query.first()
    if user is None:
        return jsonify({'error': 'User not found'}), 404

    prize = random.randint(100, 300) if random.random() < 0.01 else random.randint(10, 50)
    token_type = 'verse' if prize >= 100 else 'rush'

    if token_type == 'verse':
        user.metaverse_balance += prize
    else:
        user.metarush_balance += prize

    spin = models.SpinHistory(user_id=user.id, prize_amount=prize, token_type=token_type)
    db.session.add(spin)
    db.session.commit()

    return jsonify({'prize': prize, 'token_type': token_type, 'metarush_balance': user.metarush_balance, 'metaverse_balance': user.metaverse_balance})

@app.route('/tasks')
def tasks():
    return render_template('tasks.html')

@app.route('/api/submit-quiz', methods=['POST'])
def submit_quiz():
    user = models.User.query.first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    answers = request.json
    correct_answers = {'q1': '2', 'q2': '2', 'q3': '2'}
    score = sum(1 for q, a in answers.items() if a == correct_answers.get(q, None))

    if score == 3:
        user.metaverse_balance += 20
        db.session.commit()
        return jsonify({'success': True, 'message': 'You earned 20 MetaVerse Tokens!'})
    
    return jsonify({'success': False, 'message': f'You got {score}/3 correct. Try again!'})

# Run the application
if __name__ == '__main__':
    app.run(debug=True)
