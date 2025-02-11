import os

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')  # Set this in Render
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'your_secret_key_here')
