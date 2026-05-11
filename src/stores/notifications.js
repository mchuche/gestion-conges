/**
 * Store des notifications — API Nest (`/notifications`)
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiJson } from '../services/api'
import logger from '../services/logger'
import { useAuthStore } from './auth'

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref([])
  const loading = ref(false)
  const realtimeSubscription = ref(null)

  const unreadCount = computed(() => {
    return notifications.value.filter((n) => !n.read).length
  })

  /**
   * Normalise la réponse API vers le format attendu par l’UI (champs proches PocketBase).
   */
  function mapItem(n) {
    const created = n.created ?? n.createdAt
    return {
      id: n.id,
      user_id: n.user_id ?? n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      read_at: n.read_at ?? n.readAt,
      data: n.data,
      created,
      created_at: created,
    }
  }

  async function loadNotifications() {
    const authStore = useAuthStore()
    if (!authStore.user) {
      logger.warn('[NotificationsStore] Aucun utilisateur connecté')
      return
    }

    loading.value = true
    try {
      const data = await apiJson('/notifications', { method: 'GET' })
      const items = data.items || []
      notifications.value = items.map(mapItem)
      logger.log(`[NotificationsStore] ${notifications.value.length} notifications chargées`)
    } catch (error) {
      logger.error('[NotificationsStore] Erreur lors du chargement des notifications:', error)
    } finally {
      loading.value = false
    }
  }

  async function createNotification(targetUserId, type, title, message, data = null) {
    await apiJson('/notifications', {
      method: 'POST',
      body: JSON.stringify({
        targetUserId,
        type,
        title,
        message,
        ...(data != null ? { data } : {}),
      }),
    })
    logger.log('[NotificationsStore] Notification créée pour:', targetUserId)
  }

  async function markAsRead(notificationId) {
    const patch = {
      read: true,
      read_at: new Date().toISOString(),
    }
    await apiJson(`/notifications/${encodeURIComponent(notificationId)}/read`, {
      method: 'PATCH',
    })

    const notification = notifications.value.find((n) => n.id === notificationId)
    if (notification) {
      notification.read = true
      notification.read_at = patch.read_at
    }
    logger.debug('[NotificationsStore] Notification marquée comme lue:', notificationId)
    return true
  }

  async function markAllAsRead() {
    const authStore = useAuthStore()
    if (!authStore.user) return

    await apiJson('/notifications/read-all', { method: 'POST' })

    const t = new Date().toISOString()
    notifications.value.forEach((n) => {
      if (!n.read) {
        n.read = true
        n.read_at = t
      }
    })
    logger.log('[NotificationsStore] Toutes les notifications marquées comme lues')
    return true
  }

  async function deleteNotification(notificationId) {
    await apiJson(`/notifications/${encodeURIComponent(notificationId)}`, {
      method: 'DELETE',
    })
    notifications.value = notifications.value.filter((n) => n.id !== notificationId)
    logger.debug('[NotificationsStore] Notification supprimée:', notificationId)
    return true
  }

  async function deleteAllRead() {
    const authStore = useAuthStore()
    if (!authStore.user) return

    await apiJson('/notifications/read/all', {
      method: 'DELETE',
    })
    notifications.value = notifications.value.filter((n) => !n.read)
    logger.log('[NotificationsStore] Notifications lues supprimées')
    return true
  }

  function subscribeToNotifications() {
    logger.debug('[NotificationsStore] Realtime désactivé (API Nest)')
    realtimeSubscription.value = null
  }

  function unsubscribeFromNotifications() {
    realtimeSubscription.value = null
  }

  function resetNotifications() {
    notifications.value = []
    loading.value = false
    unsubscribeFromNotifications()
  }

  return {
    notifications,
    loading,
    unreadCount,
    loadNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    subscribeToNotifications,
    unsubscribeFromNotifications,
    resetNotifications,
  }
})
