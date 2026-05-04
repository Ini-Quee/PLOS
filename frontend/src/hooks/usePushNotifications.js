import { useState, useEffect } from 'react'
import api from '../lib/api'

export function usePushNotifications() {
  const [permission, setPermission] = useState(Notification?.permission || 'default')
  const [subscribed, setSubscribed] = useState(false)

  // Check if push is supported
  const supported = typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window

  async function subscribe() {
    if (!supported) return { error: 'Push not supported in this browser' }

    try {
      // Request notification permission
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') return { error: 'Permission denied' }

      // Get VAPID public key from server
      const keyRes = await api.get('/push/vapid-key')
      const vapidKey = keyRes.data.publicKey

      // Register SW and subscribe
      const reg = await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      if (existing) { await existing.unsubscribe() }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      await api.post('/push/subscribe', sub.toJSON())
      setSubscribed(true)
      return { success: true }
    } catch (err) {
      return { error: err.message }
    }
  }

  async function unsubscribe() {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await api.delete('/push/subscribe', { data: { endpoint: sub.endpoint } })
        await sub.unsubscribe()
      }
      setSubscribed(false)
    } catch {}
  }

  // Check subscription status on mount
  useEffect(() => {
    if (!supported) return
    navigator.serviceWorker.ready.then(reg =>
      reg.pushManager.getSubscription().then(sub => setSubscribed(!!sub))
    ).catch(() => {})
  }, [supported])

  return { supported, permission, subscribed, subscribe, unsubscribe }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = window.atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}
