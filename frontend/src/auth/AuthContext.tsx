import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import api from '../api/client'

interface AuthUser {
  id: string
  email: string
  name: string
  role: string
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function decodeJwtPayload(token: string): AuthUser {
  const payload = JSON.parse(atob(token.split('.')[1]))
  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name ?? payload.email,
    role: payload.role,
  }
}

function loadStoredAuth(): { user: AuthUser; token: string } | null {
  const token = localStorage.getItem('token')
  if (!token) return null
  try {
    return { token, user: decodeJwtPayload(token) }
  } catch {
    localStorage.removeItem('token')
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = loadStoredAuth()
  const [token, setToken] = useState<string | null>(stored?.token ?? null)
  const [user, setUser] = useState<AuthUser | null>(stored?.user ?? null)

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{ token: string }>('/api/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    setToken(data.token)
    setUser(decodeJwtPayload(data.token))
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
