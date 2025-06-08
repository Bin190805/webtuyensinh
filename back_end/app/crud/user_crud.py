from app.database.database import db

def get_user_by_username(username: str):
    return db.users.find_one({"username": username})

def create_user(user_data: dict):
    return db.users.insert_one(user_data)

def get_user_by_email(email: str):
    return db.users.find_one({"email": email})

def update_user_verified(token: str):
    return db.users.update_one({"verification_token": token}, {"$set": {"isVerified": True}})

def update_user_reset_token(email: str, token: str, expired: int):
    return db.users.update_one(
        {"email": email},
        {"$set": {"reset_token": token, "reset_token_expired": expired}}
    )

def get_user_by_reset_token(token: str):
    return db.users.find_one({"reset_token": token})

def reset_user_password(email: str, new_password_hash: str):
    return db.users.update_one(
        {"email": email},
        {"$set": {"password_hash": new_password_hash}, "$unset": {"reset_token": "", "reset_token_expired": ""}}
    )

def update_user_reset_token(email: str, token: str, expired: int):
    return db.users.update_one(
        {"email": email},
        {"$set": {"reset_token": token, "reset_token_expired": expired}}
    )
    
def update_user_info_by_username(username, update_fields: dict):
    return db.users.update_one({"username": username}, {"$set": update_fields})