import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

interface Props {
  role?: string
}

export default function ProtectedRoute({ role }: Props) {
  const { token, user } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (role && user?.role !== role) return <Navigate to="/" replace />
  return <Outlet />
}
