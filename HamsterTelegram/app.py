from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import os

# Initialize SQLAlchemy
db = SQLAlchemy()

def create_app():
    app = Flask(__name__)

    # Load configuration from config.py
    from config import Config
    app.config.from_object(Config)

    # Initialize database
    db.init_app(app)

    # Import models AFTER initializing db
    from models import User, SpinHistory

    with app.app_context():
        db.create_all()  # Create tables if they don't exist

    return app

# Create app instance
app = create_app()

# Import routes AFTER app is created
from routes import *
