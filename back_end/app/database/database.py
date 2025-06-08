from pymongo import MongoClient
from app.core.config import MONGO_URI

client = MongoClient(MONGO_URI)
# db = client.get_database()  # Hoặc db = client['admission_portal']
db = client['admission_portal']
