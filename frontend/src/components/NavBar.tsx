import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function NavBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleSignOut() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <nav className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
      <span className="font-semibold text-gray-800 text-lg">HelpDesk</span>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-800">{user?.email}</p>
          <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}
