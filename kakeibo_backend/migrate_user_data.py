import json
import sys
from datetime import datetime
from sqlalchemy.orm import Session
from app import database, auth

def parse_user_data(json_file_path: str):
    with open(json_file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    expenses = []
    budgets = []
    
    if 'expenses' in data:
        for item in data['expenses']:
            if 'amount' in item and 'date' in item:
                try:
                    expense_date = datetime.fromisoformat(item['date'] + 'T00:00:00')
                    
                    category = '未分類'
                    if 'item' in item:
                        if '医療費' in item['item']:
                            category = '医療費'
                        elif 'タクシー' in item['item']:
                            category = '交通費'
                        elif any(food in item['item'] for food in ['おにぎり', 'そば', 'コーヒー', 'ナタデココ']):
                            category = '食費'
                        elif any(med in item['item'] for med in ['ボラギノール', '葛根湯', 'パイロンPL']):
                            category = '医薬品'
                        else:
                            category = 'その他'
                    
                    description = f"{item.get('item', '')} - {item.get('store', '')}"
                    if description == ' - ':
                        description = ''
                    
                    expense = {
                        'amount': float(item['amount']),
                        'category': category,
                        'description': description.strip(),
                        'date': expense_date
                    }
                    expenses.append(expense)
                except (ValueError, TypeError) as e:
                    print(f"スキップした支出データ: {item} - エラー: {e}")
                    continue
    
    budget = {
        'year': 2025,
        'month': 7,
        'budget_amount': 70000.0
    }
    budgets.append(budget)
    
    return expenses, budgets

def migrate_data(json_file_path: str, username: str = 'readwrite'):
    db = database.SessionLocal()
    try:
        user = db.query(database.User).filter(database.User.username == username).first()
        if not user:
            print(f"ユーザー '{username}' が見つかりません")
            return
        
        expenses, budgets = parse_user_data(json_file_path)
        
        print(f"移行予定: {len(expenses)} 件の支出データ, {len(budgets)} 件の予算データ")
        
        imported_expenses = 0
        for expense_data in expenses:
            db_expense = database.Expense(**expense_data, owner_id=user.id)
            db.add(db_expense)
            imported_expenses += 1
        
        imported_budgets = 0
        for budget_data in budgets:
            existing_budget = db.query(database.MonthlyBudget).filter(
                database.MonthlyBudget.year == budget_data['year'],
                database.MonthlyBudget.month == budget_data['month'],
                database.MonthlyBudget.owner_id == user.id
            ).first()
            
            if existing_budget:
                existing_budget.budget_amount = budget_data['budget_amount']
                print(f"更新: {budget_data['year']}年{budget_data['month']}月の予算")
            else:
                db_budget = database.MonthlyBudget(**budget_data, owner_id=user.id)
                db.add(db_budget)
                imported_budgets += 1
                print(f"追加: {budget_data['year']}年{budget_data['month']}月の予算 ¥{budget_data['budget_amount']:,.0f}")
        
        db.commit()
        print(f"移行完了: {imported_expenses} 件の支出データ, {imported_budgets} 件の予算データ")
        
    except Exception as e:
        db.rollback()
        print(f"移行エラー: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("使用方法: python migrate_user_data.py <json_file_path> [username]")
        sys.exit(1)
    
    json_file = sys.argv[1]
    username = sys.argv[2] if len(sys.argv) > 2 else 'readwrite'
    
    migrate_data(json_file, username)
