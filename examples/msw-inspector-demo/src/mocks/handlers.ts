import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/user', () => {
    return HttpResponse.json({ id: 'user-1', name: 'Ada' })
  }),

  // This is intentionally stale: app code no longer calls /api/stale.
  http.get('/api/stale', () => {
    return HttpResponse.json({ ok: true })
  }),
]
