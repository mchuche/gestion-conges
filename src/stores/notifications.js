import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../services/supabase'
import logger from '../services/logger'
import { useAuthStore } from './auth'

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref([])
  const loading = ref(false)
  const realtimeSubscription = ref(null)

  // Compteur de notifications non lues
  const unreadCount = computed(() => {
    return notifications.value.filter(n => !n.read).length
  })

  // Charger les notifications de l'utilisateur
  async function loadNotifications() {
    const authStore = useAuthStore()
    if (!authStore.user) {
      logger.warn('[NotificationsStore] Aucun utilisateur connecté')
      return
    }

    loading.value = true
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', authStore.user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      notifications.value = data || []
      logger.log(`[NotificationsStore] ${notifications.value.length} notifications chargées`)
    } catch (error) {
      logger.error('[NotificationsStore] Erreur lors du chargement des notifications:', error)
    } finally {
      loading.value = false
    }
  }

  // Créer une notification
  async function createNotification(targetUserId, type, title, message, data = null) {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: targetUserId,
          type,
          title,
          message,
          data,
          read: false
        })

      if (error) throw error

      logger.log('[NotificationsStore] Notification créée pour:', targetUserId)
    } catch (error) {
      logger.error('[NotificationsStore] Erreur lors de la création de notification:', error)
      throw error
    }
  }

  // Marquer une notification comme lue
  async function markAsRead(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)

      if (error) throw error

      // Mettre à jour localement
      const notification = notifications.value.find(n => n.id === notificationId)
      if (notification) {
        notification.read = true
        notification.read_at = new Date().toISOString()
      }

      logger.debug('[NotificationsStore] Notification marquée comme lue:', notificationId)
    } catch (error) {
      logger.error('[NotificationsStore] Erreur lors du marquage comme lu:', error)
    }
  }

  // Marquer toutes les notifications comme lues
  async function markAllAsRead() {
    const authStore = useAuthStore()
    if (!authStore.user) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', authStore.user.id)
        .eq('read', false)

      if (error) throw error

      // Mettre à jour localement
      notifications.value.forEach(n => {
        if (!n.read) {
          n.read = true
          n.read_at = new Date().toISOString()
        }
      })

      logger.log('[NotificationsStore] Toutes les notifications marquées comme lues')
    } catch (error) {
      logger.error('[NotificationsStore] Erreur lors du marquage global:', error)
    }
  }

  // Supprimer une notification
  async function deleteNotification(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error

      // Retirer localement
      notifications.value = notifications.value.filter(n => n.id !== notificationId)

      logger.debug('[NotificationsStore] Notification supprimée:', notificationId)
    } catch (error) {
      logger.error('[NotificationsStore] Erreur lors de la suppression:', error)
    }
  }

  // Supprimer toutes les notifications lues
  async function deleteAllRead() {
    const authStore = useAuthStore()
    if (!authStore.user) return

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', authStore.user.id)
        .eq('read', true)

      if (error) throw error

      // Retirer localement
      notifications.value = notifications.value.filter(n => !n.read)

      logger.log('[NotificationsStore] Notifications lues supprimées')
    } catch (error) {
      logger.error('[NotificationsStore] Erreur lors de la suppression des notifications lues:', error)
    }
  }

  // S'abonner aux mises à jour en temps réel
  function subscribeToNotifications() {
    const authStore = useAuthStore()
    if (!authStore.user) {
      logger.warn('[NotificationsStore] Aucun utilisateur pour s\'abonner aux notifications')
      return
    }

    // Désabonner si déjà abonné
    if (realtimeSubscription.value) {
      supabase.removeChannel(realtimeSubscription.value)
    }

    // S'abonner aux nouvelles notifications
    realtimeSubscription.value = supabase
      .channel(`notifications:user_id=eq.${authStore.user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${authStore.user.id}`
        },
        (payload) => {
          logger.log('[NotificationsStore] Nouvelle notification reçue:', payload.new)
          notifications.value.unshift(payload.new)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${authStore.user.id}`
        },
        (payload) => {
          logger.debug('[NotificationsStore] Notification mise à jour:', payload.new)
          const index = notifications.value.findIndex(n => n.id === payload.new.id)
          if (index !== -1) {
            notifications.value[index] = payload.new
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${authStore.user.id}`
        },
        (payload) => {
          logger.debug('[NotificationsStore] Notification supprimée:', payload.old)
          notifications.value = notifications.value.filter(n => n.id !== payload.old.id)
        }
      )
      .subscribe()

    logger.log('[NotificationsStore] Abonnement Realtime activé')
  }

  // Se désabonner des mises à jour en temps réel
  function unsubscribeFromNotifications() {
    if (realtimeSubscription.value) {
      supabase.removeChannel(realtimeSubscription.value)
      realtimeSubscription.value = null
      logger.log('[NotificationsStore] Désabonnement Realtime')
    }
  }

  // Réinitialiser le store
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
    resetNotifications
  }
})

