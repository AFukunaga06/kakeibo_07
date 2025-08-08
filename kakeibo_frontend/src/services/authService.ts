const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'


interface User {
  username: string
  is_readonly: boolean
}

class AuthService {
  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    if (username === 'readonly' && password === '0317') {
      const user: User = {
        username: 'readonly',
        is_readonly: true
      }

      return {
        token: 'readonly-token',
        user
      }
    }

    throw new Error('ログインに失敗しました')
  }

  async getCurrentUser(token: string): Promise<User> {
    if (token === 'readonly-token') {
      return {
        username: 'readonly',
        is_readonly: true
      }
    }

    try {
      const response = await fetch(`${API_URL}/api/expenses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('認証に失敗しました')
      }

      const username = this.getUsernameFromToken(token)
      return {
        username,
        is_readonly: username === 'readonly'
      }
    } catch (error) {
      throw new Error('認証に失敗しました')
    }
  }

  private getUsernameFromToken(token: string): string {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.sub || 'unknown'
    } catch {
      return 'unknown'
    }
  }
}

export const authService = new AuthService()
