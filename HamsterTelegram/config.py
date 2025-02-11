import os

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql://metaverse_user:M7YEsplvu1uRhUvpGo7wliNI3g2kp0jv@dpg-culo0h2n91rc73efttn0-a/metaverse')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'your_secret_key_here')
