import { useState, useEffect } from 'react'
import { LoginForm } from './components/LoginForm'
import { ExpenseList } from './components/ExpenseList'
import { ExpenseForm } from './components/ExpenseForm'
import { DataExport } from './components/DataExport'
import { DataImport } from './components/DataImport'
import { authService } from './services/authService'
import './App.css'

interface User {
  username: string
  is_readonly: boolean
}

type Page = 'home' | 'export' | 'import'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState<Page>('home')

  useEffect(() => {
    const path = window.location.pathname
    if (path === '/export') {
      setCurrentPage('export')
    } else if (path === '/import') {
      setCurrentPage('import')
    } else {
      setCurrentPage('home')
    }

    const token = localStorage.getItem('token')
    if (token) {
      authService.getCurrentUser(token)
        .then(userData => setUser(userData))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const handleLogin = async (username: string, password: string) => {
    try {
      const { token, user: userData } = await authService.login(username, password)
      localStorage.setItem('token', token)
      setUser(userData)
    } catch (error) {
      throw error
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const navigateTo = (page: Page) => {
    setCurrentPage(page)
    window.history.pushState({}, '', page === 'home' ? '/' : `/${page}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    )
  }

  if (currentPage === 'export') {
    return <DataExport />
  }

  if (currentPage === 'import') {
    return <DataImport />
  }

  if (!user) {
    return <LoginForm onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">家計簿アプリ</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateTo('export')}
              className="px-4 py-2 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded-md transition-colors"
            >
              データエクスポート
            </button>
            {!user.is_readonly && (
              <button
                onClick={() => navigateTo('import')}
                className="px-4 py-2 text-sm bg-green-500 text-white hover:bg-green-600 rounded-md transition-colors"
              >
                データインポート
              </button>
            )}
            <span className="text-sm text-gray-600">
              {user.username} ({user.is_readonly ? '閲覧のみ' : '閲覧編集可能'})
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <ExpenseList />
          </div>
          {!user.is_readonly && (
            <div>
              <ExpenseForm />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
