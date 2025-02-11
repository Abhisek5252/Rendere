from flask import request, jsonify
from models import db, User

def register_routes(app):
    @app.route('/')
    def home():
        return "Welcome to Metaverse API!", 200  # Ensure this works

    @app.route('/api/daily-login', methods=['POST'])
    def daily_login():
        try:
            data = request.json
            user = User.query.filter_by(username=data['username']).first()
            if user:
                return jsonify({"message": f"Welcome back, {user.username}!"}), 200
            else:
                return jsonify({"error": "User not found"}), 404
        except Exception as e:
            return jsonify({"error": str(e)}), 500
