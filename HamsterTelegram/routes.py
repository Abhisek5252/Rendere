from flask import request, jsonify
from app import app, db
from models import User
from datetime import datetime

@app.route('/api/daily-login', methods=['POST'])
def daily_login():
    data = request.json
    address = data.get('address')

    if not address:
        return jsonify({'error': 'Missing address'}), 400

    user = User.query.filter_by(address=address).first()
    if not user:
        user = User(address=address)
        db.session.add(user)

    user.last_login = datetime.utcnow()
    user.login_streak += 1
    db.session.commit()

    return jsonify({'message': 'Login successful', 'streak': user.login_streak})
