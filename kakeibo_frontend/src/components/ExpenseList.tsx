import { useState, useEffect } from 'react'
import { expenseService, type Expense } from '../services/expenseService'

export function ExpenseList() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadExpenses = async () => {
    try {
      setIsLoading(true)
      const data = await expenseService.getExpenses()
      setExpenses(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
      setError('')
    } catch (error) {
      setError('支出データの読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadExpenses()
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('この支出を削除しますか？')) return

    try {
      await expenseService.deleteExpense(id)
      setExpenses(expenses.filter(expense => expense.id !== id))
    } catch (error) {
      setError('削除に失敗しました')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP')
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">支出一覧</h2>
        <div className="text-center py-8">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">支出一覧</h2>
        <button
          onClick={loadExpenses}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          更新
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {expenses.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          まだ支出データがありません
        </div>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <div key={expense.id} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-lg">{formatAmount(expense.amount)}</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                      {expense.category}
                    </span>
                  </div>
                  {expense.description && (
                    <p className="text-gray-600 mb-2">{expense.description}</p>
                  )}
                  <p className="text-sm text-gray-500">{formatDate(expense.date)}</p>
                </div>
                <button
                  onClick={() => handleDelete(expense.id)}
                  className="ml-4 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
