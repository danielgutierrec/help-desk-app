import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import NavBar from '../components/NavBar'
import { fetchTicket, saveDraft, sendTicket, type TicketDetail } from '../api/tickets'

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function TicketReviewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [reply, setReply] = useState('')
  const [saveLabel, setSaveLabel] = useState('Save draft')
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!id) return
    fetchTicket(id)
      .then((t) => {
        setTicket(t)
        setReply(t.finalReply ?? t.aiDraft ?? '')
      })
      .catch(() => setError('Failed to load ticket.'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSaveDraft() {
    if (!id || saving) return
    setSaving(true)
    try {
      await saveDraft(id, reply)
      setSaveLabel('Saved')
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => setSaveLabel('Save draft'), 1500)
    } finally {
      setSaving(false)
    }
  }

  async function handleSend() {
    if (!id || sending) return
    setSendError(null)
    setSending(true)
    try {
      await sendTicket(id)
      navigate('/tickets')
    } catch {
      setSendError('Failed to send. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const isSent = ticket?.status === 'Sent'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-8">
        <Link to="/tickets" className="text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6 inline-block">
          ← Back to queue
        </Link>

        {loading && (
          <div className="text-sm text-gray-400 py-10 text-center">Loading…</div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {ticket && (
          <div className="flex flex-col gap-6">
            {/* Original email */}
            <section className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h2 className="text-base font-semibold text-gray-900">{ticket.subject}</h2>
                {isSent && (
                  <span className="shrink-0 inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    Sent
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-1">
                From: {ticket.senderName} &lt;{ticket.senderEmail}&gt;
              </p>
              <p className="text-xs text-gray-400 mb-4">
                Received: {formatDate(ticket.receivedAt)}
              </p>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                {ticket.body}
              </pre>
            </section>

            {/* AI Analysis */}
            <section className="bg-indigo-50 rounded-lg border border-indigo-100 p-5">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-indigo-900">AI Analysis</h3>
                <span className="text-xs text-indigo-400">(powered by AI — review before sending)</span>
              </div>
              <div className="flex items-center gap-2 mt-3 mb-2">
                <span className="text-xs text-indigo-700 font-medium">Category:</span>
                {categoryBadge(ticket.category)}
              </div>
              <div>
                <span className="text-xs text-indigo-700 font-medium">Summary:</span>
                {ticket.aiSummary ? (
                  <p className="text-sm text-indigo-900 mt-1">{ticket.aiSummary}</p>
                ) : (
                  <p className="text-sm text-indigo-300 mt-1 italic">AI analysis pending</p>
                )}
              </div>
            </section>

            {/* Reply */}
            <section className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Reply</h3>

              {isSent && ticket.sentAt && (
                <p className="text-xs text-gray-400 mb-3">Sent on {formatDate(ticket.sentAt)}</p>
              )}

              <textarea
                className="w-full h-40 px-3 py-2 text-sm rounded-md border border-gray-300 text-gray-800 resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-400"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                disabled={isSent}
                placeholder="Write your reply here…"
              />

              {sendError && (
                <p className="text-xs text-red-600 mt-2">{sendError}</p>
              )}

              <div className="flex items-center justify-between mt-3">
                <button
                  onClick={handleSaveDraft}
                  disabled={isSent || saving}
                  className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saveLabel}
                </button>
                <button
                  onClick={handleSend}
                  disabled={isSent || sending}
                  className="px-4 py-1.5 text-sm rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {sending ? 'Sending…' : 'Send reply'}
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
