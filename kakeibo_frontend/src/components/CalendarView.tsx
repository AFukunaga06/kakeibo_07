import { useState, useEffect } from 'react'
import { expenseService, type Expense } from '../services/expenseService'

interface MonthlyBudget {
  id: number
  year: number
  month: number
  budget_amount: number
  owner_id: number
  created_at: string
}

interface DayExpenses {
  [key: string]: Expense[]
}

export function CalendarView() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [monthlyBudgets, setMonthlyBudgets] = useState<MonthlyBudget[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [expenseData, budgetData] = await Promise.all([
        expenseService.getExpenses(),
        expenseService.getMonthlyBudgets()
      ])
      setExpenses(expenseData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
      setMonthlyBudgets(budgetData)
      setError('')
    } catch (error) {
      console.error('Data loading error:', error)
      setError('データの読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount)
  }

  const getCurrentMonthBudget = () => {
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1
    const budget = monthlyBudgets.find(b => b.year === currentYear && b.month === currentMonth)
    return budget?.budget_amount || 0
  }

  const getCurrentMonthExpenses = () => {
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      return expenseDate.getFullYear() === currentYear && expenseDate.getMonth() + 1 === currentMonth
    })
  }

  const getTodayExpenses = () => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      return expenseDate.toISOString().split('T')[0] === todayStr
    })
  }

  const getMonthlyTotal = () => {
    return getCurrentMonthExpenses().reduce((total, expense) => total + expense.amount, 0)
  }

  const getTodayTotal = () => {
    return getTodayExpenses().reduce((total, expense) => total + expense.amount, 0)
  }

  const getDailyBudget = () => {
    const budget = getCurrentMonthBudget()
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
    return budget / daysInMonth
  }

  const groupExpensesByDay = (): DayExpenses => {
    const grouped: DayExpenses = {}
    getCurrentMonthExpenses().forEach(expense => {
      const day = new Date(expense.date).getDate().toString()
      if (!grouped[day]) {
        grouped[day] = []
      }
      grouped[day].push(expense)
    })
    return grouped
  }

  const getDayTotal = (day: string): number => {
    const dayExpenses = groupExpensesByDay()[day] || []
    return dayExpenses.reduce((total, expense) => total + expense.amount, 0)
  }

  const getDayColor = (day: string): string => {
    const dayTotal = getDayTotal(day)
    const dailyBudget = getDailyBudget()
    if (dayTotal === 0) return 'text-gray-400'
    return dayTotal > dailyBudget ? 'text-red-500' : 'text-green-600'
  }

  const generateCalendarDays = (): Date[] => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days: Date[] = []
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      days.push(date)
    }
    return days
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const formatMonthYear = (date: Date) => {
    return `${date.getFullYear()}年${date.getMonth() + 1}月`
  }

  const dayHeaders = ['日', '月', '火', '水', '木', '金', '土']
  const calendarDays = generateCalendarDays()
  const expensesByDay = groupExpensesByDay()

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">今月の予算</h3>
          <div className="text-2xl font-bold text-blue-600">{formatAmount(getCurrentMonthBudget())}</div>
          <div className="text-sm text-gray-500 mt-1">
            1日あたり: {formatAmount(getDailyBudget())}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">今月の支出</h3>
          <div className="text-2xl font-bold text-orange-600">{formatAmount(getMonthlyTotal())}</div>
          <div className="text-sm text-gray-500 mt-1">
            残り: {formatAmount(getCurrentMonthBudget() - getMonthlyTotal())}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">今日の支出</h3>
          <div className="text-2xl font-bold text-green-600">{formatAmount(getTodayTotal())}</div>
          <div className="text-sm text-gray-500 mt-1">合格</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">カレンダー表示</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              ←
            </button>
            <span className="text-lg font-semibold min-w-[120px] text-center">
              {formatMonthYear(currentDate)}
            </span>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayHeaders.map((day, index) => (
            <div key={index} className="p-3 text-center font-semibold text-gray-600 bg-gray-50">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const dayNumber = day.getDate()
            const isCurrentMonth = day.getMonth() === currentDate.getMonth()
            const dayKey = dayNumber.toString()
            const dayExpenses = expensesByDay[dayKey] || []
            const dayTotal = getDayTotal(dayKey)
            const dayColor = getDayColor(dayKey)

            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border border-gray-200 ${
                  isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <div className={`text-sm font-semibold mb-1 ${
                  isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {dayNumber}
                </div>
                
                {isCurrentMonth && dayExpenses.length > 0 && (
                  <div className="space-y-1">
                    <div className={`text-xs font-bold ${dayColor}`}>
                      {formatAmount(dayTotal)}
                    </div>
                    {dayExpenses.slice(0, 3).map((expense) => (
                      <div key={expense.id} className="text-xs">
                        <div className={`font-medium ${dayColor}`}>
                          {expense.category}
                        </div>
                        <div className="text-gray-600 truncate">
                          {expense.description || ''}
                        </div>
                      </div>
                    ))}
                    {dayExpenses.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{dayExpenses.length - 3}件
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center gap-2 text-blue-700">
          <span className="text-sm">📅</span>
          <span className="text-sm font-medium">
            {formatMonthYear(new Date())} の支出明細
          </span>
          <span className="ml-auto text-sm font-bold">
            合計: {formatAmount(getTodayTotal())}
          </span>
          <span className="text-xs text-green-600">合格</span>
        </div>
      </div>
    </div>
  )
}
