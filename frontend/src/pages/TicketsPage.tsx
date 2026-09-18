import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import NavBar from '../components/NavBar'
import { fetchQueue, fetchSentTickets, type TicketSummary } from '../api/tickets'

type Tab = 'queue' | 'sent'

const CATEGORY_STYLES: Record<string, string> = {
  AccountLogin: 'bg-blue-100 text-blue-700',
  Billing: 'bg-amber-100 text-amber-700',
  Academic: 'bg-green-100 text-green-700',
  Technical: 'bg-purple-100 text-purple-700',
  Other: 'bg-gray-100 text-gray-600',
}

function categoryBadge(category: string) {
  const cls = CATEGORY_STYLES[category] ?? CATEGORY_STYLES.Other
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {category}
    </span>
  )
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function TicketsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('queue')
  const [queueTickets, setQueueTickets] = useState<TicketSummary[]>([])
  const [sentTickets, setSentTickets] = useState<TicketSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    const fetcher = activeTab === 'queue' ? fetchQueue : fetchSentTickets
    const setter = activeTab === 'queue' ? setQueueTickets : setSentTickets
    fetcher()
      .then(setter)
      .catch(() => setError('Failed to load tickets. Please try again.'))
      .finally(() => setLoading(false))
  }, [activeTab])

  const tickets = activeTab === 'queue' ? queueTickets : sentTickets
  const emptyMessage =
    activeTab === 'queue' ? 'No tickets need review.' : 'No sent tickets yet.'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
        <h1 className="text-xl font-semibold text-gray-800 mb-4">Tickets</h1>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-6">
          {(['queue', 'sent'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'queue' ? 'Needs Review' : 'Sent'}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
            Loading…
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && tickets.length === 0 && (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
            {emptyMessage}
          </div>
        )}

        {!loading && !error && tickets.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {tickets.map((t) => (
              <Link
                key={t.id}
                to={`/tickets/${t.id}`}
                className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 text-sm truncate">{t.subject}</span>
                    {categoryBadge(t.category)}
                  </div>
                  <p className="text-xs text-gray-500 mb-1">
                    {t.senderName} &lt;{t.senderEmail}&gt;
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {t.aiSummary ? t.aiSummary.slice(0, 100) : 'AI analysis pending'}
                  </p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap mt-0.5">
                  {activeTab === 'sent' && t.sentAt
                    ? `Sent ${relativeTime(t.sentAt)}`
                    : relativeTime(t.createdAt)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
