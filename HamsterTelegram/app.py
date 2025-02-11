from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from config import Config
from routes import register_routes

app = Flask(__name__)
app.config.from_object(Config)

db = SQLAlchemy(app)

# Register routes
register_routes(app)

# Run the app
if __name__ == "__main__":
    app.run(debug=True)
