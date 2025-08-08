from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List
import psycopg

from . import database, schemas, auth
from .init_db import init_database

app = FastAPI()

database.Base.metadata.create_all(bind=database.engine)

@app.on_event("startup")
async def startup_event():
    init_database()

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
async def get_expenses(request: Request, db: Session = Depends(database.get_db)):
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.startswith("Bearer "):
        try:
            token = auth_header.split(" ")[1]
            current_user = auth.get_current_user_sync(token, db)
            expenses = db.query(database.Expense).all()
            return expenses
        except:
            pass
    
    expenses = db.query(database.Expense).all()
    return expenses

@app.post("/api/expenses", response_model=schemas.Expense)
async def create_expense(expense: schemas.ExpenseCreate, request: Request, db: Session = Depends(database.get_db)):
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    
    try:
        token = auth_header.split(" ")[1]
        print(f"Token received: {token[:10]}...")  # Print first 10 chars of token for debugging
        
        try:
            current_user = auth.get_current_user_sync(token, db)
            print(f"User authenticated: {current_user.username}, readonly: {current_user.is_readonly}")
            
            if current_user.is_readonly:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Read-only user cannot create expenses")
            
            db_expense = database.Expense(**expense.dict(), owner_id=current_user.id)
            db.add(db_expense)
            db.commit()
            db.refresh(db_expense)
            return db_expense
        except Exception as e:
            print(f"Authentication error: {str(e)}")
            import traceback
            print(traceback.format_exc())
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid authentication token: {str(e)}")
    except Exception as e:
        print(f"General error: {str(e)}")
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Error processing request: {str(e)}")

@app.put("/api/expenses/{expense_id}", response_model=schemas.Expense)
async def update_expense(expense_id: int, expense: schemas.ExpenseUpdate, request: Request, db: Session = Depends(database.get_db)):
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    
    try:
        token = auth_header.split(" ")[1]
        current_user = auth.get_current_user_sync(token, db)
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
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token")

@app.delete("/api/expenses/{expense_id}")
async def delete_expense(expense_id: int, request: Request, db: Session = Depends(database.get_db)):
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    
    try:
        token = auth_header.split(" ")[1]
        current_user = auth.get_current_user_sync(token, db)
        if current_user.is_readonly:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Read-only user cannot delete expenses")
        
        db_expense = db.query(database.Expense).filter(database.Expense.id == expense_id).first()
        if not db_expense:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
        
        db.delete(db_expense)
        db.commit()
        return {"message": "Expense deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token")

@app.get("/api/monthly-budgets", response_model=List[schemas.MonthlyBudget])
async def get_monthly_budgets(request: Request, db: Session = Depends(database.get_db)):
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.startswith("Bearer "):
        try:
            token = auth_header.split(" ")[1]
            current_user = auth.get_current_user_sync(token, db)
            budgets = db.query(database.MonthlyBudget).all()
            return budgets
        except:
            pass
    
    budgets = db.query(database.MonthlyBudget).all()
    return budgets

@app.post("/api/monthly-budgets", response_model=schemas.MonthlyBudget)
async def create_monthly_budget(budget: schemas.MonthlyBudgetCreate, request: Request, db: Session = Depends(database.get_db)):
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    
    try:
        token = auth_header.split(" ")[1]
        current_user = auth.get_current_user_sync(token, db)
        if current_user.is_readonly:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Read-only user cannot create budgets")
        
        existing_budget = db.query(database.MonthlyBudget).filter(
            database.MonthlyBudget.year == budget.year,
            database.MonthlyBudget.month == budget.month,
            database.MonthlyBudget.owner_id == current_user.id
        ).first()
        
        if existing_budget:
            existing_budget.budget_amount = budget.budget_amount
            db.commit()
            db.refresh(existing_budget)
            return existing_budget
        
        db_budget = database.MonthlyBudget(**budget.dict(), owner_id=current_user.id)
        db.add(db_budget)
        db.commit()
        db.refresh(db_budget)
        return db_budget
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token")

@app.post("/api/import-data")
async def import_data(
    import_data: schemas.DataImport, 
    request: Request,
    db: Session = Depends(database.get_db)
):
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    
    try:
        token = auth_header.split(" ")[1]
        current_user = auth.get_current_user_sync(token, db)
        
        if current_user.is_readonly:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Read-only user cannot import data")
        
        imported_expenses = 0
        imported_budgets = 0
        
        for expense_data in import_data.expenses:
            db_expense = database.Expense(**expense_data.dict(), owner_id=current_user.id)
            db.add(db_expense)
            imported_expenses += 1
        
        for budget_data in import_data.budgets:
            existing_budget = db.query(database.MonthlyBudget).filter(
                database.MonthlyBudget.year == budget_data.year,
                database.MonthlyBudget.month == budget_data.month,
                database.MonthlyBudget.owner_id == current_user.id
            ).first()
            
            if existing_budget:
                existing_budget.budget_amount = budget_data.budget_amount
            else:
                db_budget = database.MonthlyBudget(**budget_data.dict(), owner_id=current_user.id)
                db.add(db_budget)
                imported_budgets += 1
        
        db.commit()
        return {"message": f"Successfully imported {imported_expenses} expenses and {imported_budgets} budgets"}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Import failed: {str(e)}")

@app.delete("/api/clear-data")
async def clear_all_data(request: Request, db: Session = Depends(database.get_db)):
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    
    try:
        token = auth_header.split(" ")[1]
        current_user = auth.get_current_user_sync(token, db)
        
        if current_user.is_readonly:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Read-only user cannot clear data")
        
        deleted_expenses = db.query(database.Expense).filter(database.Expense.owner_id == current_user.id).delete()
        deleted_budgets = db.query(database.MonthlyBudget).filter(database.MonthlyBudget.owner_id == current_user.id).delete()
        
        db.commit()
        return {"message": f"Cleared {deleted_expenses} expenses and {deleted_budgets} budgets"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token")

@app.get("/admin", response_class=HTMLResponse)
async def admin_interface():
    html_content = """
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>家計簿管理者ページ</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .login-form { background: #f5f5f5; padding: 30px; border-radius: 8px; }
            .form-group { margin-bottom: 20px; }
            label { display: block; margin-bottom: 5px; font-weight: bold; }
            input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
            button { background: #007bff; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; }
            button:hover { background: #0056b3; }
            .error { color: red; margin-top: 10px; }
            .hidden { display: none; }
            .admin-panel { background: #e8f5e8; padding: 30px; border-radius: 8px; }
        </style>
    </head>
    <body>
        <h1>家計簿管理者ページ</h1>
        
        <div id="loginForm" class="login-form">
            <h2>管理者ログイン</h2>
            <div class="form-group">
                <label for="password">パスワード:</label>
                <input type="password" id="password" placeholder="管理者パスワードを入力">
            </div>
            <button onclick="login()">ログイン</button>
            <div id="error" class="error"></div>
        </div>

        <div id="adminPanel" class="admin-panel hidden">
            <h2>管理者機能</h2>
            <p>編集機能付きの家計簿アプリにアクセスできます。</p>
            <button onclick="openMainApp()">家計簿アプリを開く（編集モード）</button>
            <br><br>
            <button onclick="logout()">ログアウト</button>
        </div>

        <script>
            function login() {
                const password = document.getElementById('password').value;
                const errorDiv = document.getElementById('error');
                
                if (password === 'r246') {
                    fetch('/login?username=readwrite&password=' + encodeURIComponent(password), {
                        method: 'POST'
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.access_token) {
                            localStorage.setItem('admin_token', data.access_token);
                            document.getElementById('loginForm').classList.add('hidden');
                            document.getElementById('adminPanel').classList.remove('hidden');
                        } else {
                            errorDiv.textContent = 'ログインに失敗しました';
                        }
                    })
                    .catch(error => {
                        errorDiv.textContent = 'ログインに失敗しました';
                    });
                } else {
                    errorDiv.textContent = 'パスワードが正しくありません';
                }
            }
            
            function openMainApp() {
                const token = localStorage.getItem('admin_token');
                if (token) {
                    window.location.href = 'https://kakeibo-budget-app-yxnr5kpo.devinapps.com?admin_token=' + encodeURIComponent(token);
                }
            }
            
            function logout() {
                localStorage.removeItem('admin_token');
                document.getElementById('loginForm').classList.remove('hidden');
                document.getElementById('adminPanel').classList.add('hidden');
                document.getElementById('password').value = '';
                document.getElementById('error').textContent = '';
            }
            
            // Check if already logged in
            if (localStorage.getItem('admin_token')) {
                document.getElementById('loginForm').classList.add('hidden');
                document.getElementById('adminPanel').classList.remove('hidden');
            }
        </script>
    </body>
    </html>
    """
    return html_content
