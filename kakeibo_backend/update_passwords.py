from sqlalchemy.orm import Session
from app import database, auth

def update_user_passwords():
    db = database.SessionLocal()
    try:
        readonly_user = db.query(database.User).filter(database.User.username == 'readonly').first()
        if readonly_user:
            readonly_user.hashed_password = auth.get_password_hash('0317')
            print("Updated readonly user password")
        
        readwrite_user = db.query(database.User).filter(database.User.username == 'readwrite').first()
        if readwrite_user:
            readwrite_user.hashed_password = auth.get_password_hash('r246')
            print("Updated readwrite user password")
        
        db.commit()
        print('All passwords updated successfully')
    except Exception as e:
        print(f'Error updating passwords: {e}')
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_user_passwords()
