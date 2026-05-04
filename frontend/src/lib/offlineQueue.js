const QUEUE_KEY = 'plos_offline_queue'
const MAX_SIZE  = 200

// Only queue safe, idempotent or append-only writes
const QUEUEABLE = [
  { method: 'POST',   pattern: /\/habits\/[^/]+\/complete$/ },
  { method: 'DELETE', pattern: /\/habits\/[^/]+\/complete$/ },
  { method: 'POST',   pattern: /\/journal\/pages$/ },
  { method: 'POST',   pattern: /\/budget\/entries$/ },
  { method: 'POST',   pattern: /\/schedule\/[^/]+\/complete$/ },
  { method: 'DELETE', pattern: /\/schedule\/[^/]+\/complete$/ },
]

export function isQueueable(method, url) {
  return QUEUEABLE.some(q =>
    q.method === method.toUpperCase() && q.pattern.test(url)
  )
}

export function getQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') } catch { return [] }
}

function saveQueue(q) {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)) } catch {}
}

export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY)
}

export function queueSize() {
  return getQueue().length
}

export function enqueue(method, url, body) {
  const queue = getQueue()
  const upperMethod = method.toUpperCase()

  // Dedup: if a DELETE arrives for a url that has a queued POST, cancel both
  if (upperMethod === 'DELETE') {
    const oppositeIdx = queue.findIndex(i => i.method === 'POST' && i.url === url)
    if (oppositeIdx !== -1) {
      queue.splice(oppositeIdx, 1)
      saveQueue(queue)
      return
    }
  }

  // Dedup: for journal pages, replace the previous queued save with the latest
  if (upperMethod === 'POST' && /\/journal\/pages$/.test(url)) {
    const existingIdx = queue.findIndex(i => i.method === 'POST' && i.url === url)
    if (existingIdx !== -1) {
      queue[existingIdx].body = body
      queue[existingIdx].timestamp = Date.now()
      saveQueue(queue)
      return
    }
  }

  queue.push({
    id: typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2),
    method: upperMethod,
    url,
    body,
    timestamp: Date.now(),
    retries: 0,
  })

  if (queue.length > MAX_SIZE) queue.shift()
  saveQueue(queue)
}

let flushing = false

export async function flushQueue(apiInstance) {
  if (flushing) return
  const queue = getQueue()
  if (!queue.length) return

  flushing = true
  const remaining = []

  for (const item of queue) {
    try {
      if (item.method === 'DELETE') {
        await apiInstance.delete(item.url)
      } else {
        await apiInstance.post(item.url, item.body)
      }
      // Successfully synced — don't add to remaining
    } catch (err) {
      // Network still down or server error — keep in queue
      item.retries = (item.retries || 0) + 1
      if (item.retries < 5) remaining.push(item)
      // After 5 retries, silently drop — can't recover
    }
  }

  saveQueue(remaining)
  flushing = false
}
