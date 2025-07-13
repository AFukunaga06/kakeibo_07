from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List
import psycopg

from . import database, schemas, auth

app = FastAPI()

database.Base.metadata.create_all(bind=database.engine)

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/login", response_model=schemas.Token)
async def login(username: str, password: str, db: Session = Depends(database.get_db)):
    user = auth.authenticate_user(db, username, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/expenses", response_model=List[schemas.Expense])
async def get_expenses(current_user: database.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    expenses = db.query(database.Expense).all()
    return expenses

@app.post("/api/expenses", response_model=schemas.Expense)
async def create_expense(expense: schemas.ExpenseCreate, current_user: database.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    if current_user.is_readonly:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Read-only user cannot create expenses")
    
    db_expense = database.Expense(**expense.dict(), owner_id=current_user.id)
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@app.put("/api/expenses/{expense_id}", response_model=schemas.Expense)
async def update_expense(expense_id: int, expense: schemas.ExpenseUpdate, current_user: database.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    if current_user.is_readonly:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Read-only user cannot update expenses")
    
    db_expense = db.query(database.Expense).filter(database.Expense.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    
    for key, value in expense.dict(exclude_unset=True).items():
        setattr(db_expense, key, value)
    
    db.commit()
    db.refresh(db_expense)
    return db_expense

@app.delete("/api/expenses/{expense_id}")
async def delete_expense(expense_id: int, current_user: database.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    if current_user.is_readonly:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Read-only user cannot delete expenses")
    
    db_expense = db.query(database.Expense).filter(database.Expense.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    
    db.delete(db_expense)
    db.commit()
    return {"message": "Expense deleted successfully"}
