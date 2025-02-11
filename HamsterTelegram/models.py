from app import db
from datetime import datetime

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    address = db.Column(db.String(42), unique=True, nullable=False)
    metarush_balance = db.Column(db.Integer, default=0)
    metaverse_balance = db.Column(db.Integer, default=0)
    last_login = db.Column(db.DateTime, default=datetime.utcnow)
    login_streak = db.Column(db.Integer, default=0)
    
    def __repr__(self):
        return f'<User {self.address}>'

class SpinHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    prize_amount = db.Column(db.Integer, nullable=False)
    token_type = db.Column(db.String(10), nullable=False)  # 'rush' or 'verse'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Spin {self.token_type}: {self.prize_amount}>'
