import NavBar from '../components/NavBar'

export default function UsersPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />
      <main className="flex-1 flex flex-col items-center justify-center gap-2">
        <h1 className="text-2xl font-semibold text-gray-800">Users</h1>
        <p className="text-gray-500 text-sm">User management coming soon.</p>
      </main>
    </div>
  )
}
