import { useState } from 'react'

interface LoginFormProps {
  onLogin: (username: string, password: string) => Promise<void>
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [readonlyPassword, setReadonlyPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (readonlyPassword !== '0317') {
      setError('パスワードが正しくありません')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await onLogin('readonly', readonlyPassword)
    } catch (error) {
      setError('ログインに失敗しました。パスワードを確認してください。')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">家計簿アプリ</h1>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-3">閲覧のみ</h3>
          <div className="space-y-3">
            <input
              type="password"
              placeholder="パスワードを入力"
              value={readonlyPassword}
              onChange={(e) => setReadonlyPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? '処理中...' : 'ログイン'}
            </button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-sm text-gray-600 mb-2">編集機能をご利用の場合は</p>
          <a 
            href="/admin" 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            管理者ページへ
          </a>
        </div>
      </div>
    </div>
  )
}
