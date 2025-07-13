from sqlalchemy.orm import Session
from . import database, auth

def create_default_users(db: Session):
    readonly_user = database.User(
        username="readonly",
        hashed_password=auth.get_password_hash("0317"),
        is_readonly=True
    )
    
    readwrite_user = database.User(
        username="readwrite",
        hashed_password=auth.get_password_hash("r246"),
        is_readonly=False
    )
    
    existing_readonly = db.query(database.User).filter(database.User.username == "readonly").first()
    existing_readwrite = db.query(database.User).filter(database.User.username == "readwrite").first()
    
    if not existing_readonly:
        db.add(readonly_user)
    if not existing_readwrite:
        db.add(readwrite_user)
    
    db.commit()

if __name__ == "__main__":
    db = database.SessionLocal()
    try:
        create_default_users(db)
        print("Default users created successfully")
    finally:
        db.close()
