import api from './client'

export interface TicketSummary {
  id: string
  subject: string
  senderEmail: string
  senderName: string
  category: string
  aiSummary: string
  createdAt: string
}

export interface TicketDetail {
  id: string
  subject: string
  senderEmail: string
  senderName: string
  body: string
  receivedAt: string
  category: string
  status: string
  aiSummary: string
  aiDraft: string
  finalReply: string | null
  createdAt: string
  sentAt: string | null
}

export async function fetchQueue(): Promise<TicketSummary[]> {
  const { data } = await api.get<TicketSummary[]>('/api/tickets')
  return data
}

export async function fetchTicket(id: string): Promise<TicketDetail> {
  const { data } = await api.get<TicketDetail>(`/api/tickets/${id}`)
  return data
}

export async function saveDraft(id: string, finalReply: string): Promise<void> {
  await api.patch(`/api/tickets/${id}/draft`, { finalReply })
}

export async function sendTicket(id: string): Promise<void> {
  await api.post(`/api/tickets/${id}/send`)
}
