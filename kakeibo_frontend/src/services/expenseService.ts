const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface Expense {
  id: number
  amount: number
  category: string
  description?: string
  date: string
  owner_id: number
}

export interface ExpenseCreate {
  amount: number
  category: string
  description?: string
  date?: string
}

class ExpenseService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  }

  async getExpenses(): Promise<Expense[]> {
    const response = await fetch(`${API_URL}/api/expenses`, {
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error('支出データの取得に失敗しました')
    }

    return response.json()
  }

  async createExpense(expense: ExpenseCreate): Promise<Expense> {
    const response = await fetch(`${API_URL}/api/expenses`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(expense),
    })

    if (!response.ok) {
      throw new Error('支出の追加に失敗しました')
    }

    return response.json()
  }

  async updateExpense(id: number, expense: Partial<ExpenseCreate>): Promise<Expense> {
    const response = await fetch(`${API_URL}/api/expenses/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(expense),
    })

    if (!response.ok) {
      throw new Error('支出の更新に失敗しました')
    }

    return response.json()
  }

  async deleteExpense(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/expenses/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error('支出の削除に失敗しました')
    }
  }
}

export const expenseService = new ExpenseService()
