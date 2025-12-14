import { ref } from 'vue'
import { supabase } from '../services/supabase'
import logger from '../services/logger'

/**
 * Composable pour gérer les subscriptions Realtime Supabase
 * 
 * @param {string} table - Nom de la table à écouter
 * @param {object} options - Options de configuration
 * @param {string} options.filter - Filtre pour la subscription (ex: "user_id=eq.xxx")
 * @param {Function} options.onInsert - Callback pour les insertions
 * @param {Function} options.onUpdate - Callback pour les mises à jour
 * @param {Function} options.onDelete - Callback pour les suppressions
 * @param {boolean} options.enabled - Activer/désactiver la subscription
 */
export function useRealtime(table, options = {}) {
  const channel = ref(null)
  const connected = ref(false)
  const error = ref(null)

  const {
    filter = null,
    onInsert = null,
    onUpdate = null,
    onDelete = null,
    enabled = true
  } = options

  /**
   * Créer une subscription Realtime
   */
  function subscribe() {
    if (!enabled || !table || !supabase) {
      logger.warn('[useRealtime] Subscription désactivée ou Supabase non disponible')
      return
    }

    try {
      // Nettoyer la subscription existante si elle existe
      unsubscribe()

      // Créer un channel unique pour cette subscription
      const channelName = `realtime:${table}${filter ? `:${filter.replace(/[^a-zA-Z0-9]/g, '_')}` : ''}:${Date.now()}`
      
      // Construire les options de filtrage pour postgres_changes
      const postgresOptions = {
        event: '*',
        schema: 'public',
        table: table
      }
      
      // Ajouter le filtre si fourni (format: "user_id=eq.xxx")
      if (filter) {
        // Parser le filtre: "user_id=eq.xxx" -> { column: "user_id", operator: "eq", value: "xxx" }
        const match = filter.match(/^([^=]+)=([^.]+)\.(.+)$/)
        if (match) {
          const [, column, operator, value] = match
          // Construire le filtre au format Supabase: "column=operator.value"
          postgresOptions.filter = `${column}=${operator}.${value}`
        } else {
          // Si le format n'est pas correct, logger un avertissement
          logger.warn(`[useRealtime] Format de filtre incorrect: ${filter}. Attendu: "column=operator.value"`)
        }
      }
      
      channel.value = supabase
        .channel(channelName)
        .on('postgres_changes', postgresOptions,
          (payload) => {
            logger.debug(`[useRealtime] Événement sur ${table}:`, payload.eventType, payload)

            switch (payload.eventType) {
              case 'INSERT':
                if (onInsert) {
                  onInsert(payload.new)
                }
                break
              case 'UPDATE':
                if (onUpdate) {
                  onUpdate(payload.new, payload.old)
                }
                break
              case 'DELETE':
                if (onDelete) {
                  logger.debug(`[useRealtime] Payload DELETE complet:`, payload)
                  onDelete(payload.old || payload.old_record || payload)
                }
                break
              default:
                logger.warn(`[useRealtime] Type d'événement non géré: ${payload.eventType}`)
            }
          }
        )
        .subscribe((status) => {
          connected.value = status === 'SUBSCRIBED'
          error.value = status === 'CHANNEL_ERROR' ? 'Erreur de connexion Realtime' : null
          
          if (status === 'SUBSCRIBED') {
            logger.log(`[useRealtime] Subscription active sur ${table}`)
          } else if (status === 'CHANNEL_ERROR') {
            logger.error(`[useRealtime] Erreur de subscription sur ${table}`)
          } else if (status === 'TIMED_OUT') {
            logger.warn(`[useRealtime] Timeout de subscription sur ${table}`)
          }
        })

      logger.log(`[useRealtime] Subscription créée pour ${table}`)
    } catch (err) {
      error.value = err.message
      logger.error(`[useRealtime] Erreur lors de la création de la subscription:`, err)
    }
  }

  /**
   * Supprimer la subscription
   */
  function unsubscribe() {
    if (channel.value) {
      supabase.removeChannel(channel.value)
      channel.value = null
      connected.value = false
      logger.log(`[useRealtime] Subscription supprimée pour ${table}`)
    }
  }

  // S'abonner automatiquement si enabled
  if (enabled) {
    subscribe()
  }

  // NOTE: onUnmounted n'est pas utilisé car useRealtime peut être appelé depuis un store Pinia
  // Le nettoyage doit être fait manuellement via unsubscribe() dans les stores (voir disableRealtime())

  return {
    channel,
    connected,
    error,
    subscribe,
    unsubscribe
  }
}

/**
 * Hook spécifique pour écouter les changements de congés d'un utilisateur
 */
export function useLeavesRealtime(userId, callbacks = {}) {
  return useRealtime('leaves', {
    filter: userId ? `user_id=eq.${userId}` : null,
    onInsert: callbacks.onInsert,
    onUpdate: callbacks.onUpdate,
    onDelete: callbacks.onDelete,
    enabled: !!userId
  })
}

/**
 * Hook spécifique pour écouter les changements de types de congés d'un utilisateur
 */
export function useLeaveTypesRealtime(userId, callbacks = {}) {
  return useRealtime('leave_types', {
    filter: userId ? `user_id=eq.${userId}` : null,
    onInsert: callbacks.onInsert,
    onUpdate: callbacks.onUpdate,
    onDelete: callbacks.onDelete,
    enabled: !!userId
  })
}

/**
 * Hook spécifique pour écouter les changements de quotas d'un utilisateur
 */
export function useQuotasRealtime(userId, callbacks = {}) {
  return useRealtime('leave_quotas', {
    filter: userId ? `user_id=eq.${userId}` : null,
    onInsert: callbacks.onInsert,
    onUpdate: callbacks.onUpdate,
    onDelete: callbacks.onDelete,
    enabled: !!userId
  })
}

/**
 * Hook pour écouter les congés d'une équipe (pour les vues de présence)
 */
export function useTeamLeavesRealtime(teamId, callbacks = {}) {
  // Pour les équipes, on doit écouter tous les utilisateurs de l'équipe
  // On utilisera un channel broadcast ou on filtrera côté client
  // Pour l'instant, on retourne null car cela nécessite une logique plus complexe
  logger.warn('[useRealtime] useTeamLeavesRealtime pas encore implémenté')
  return {
    channel: ref(null),
    connected: ref(false),
    error: ref(null),
    subscribe: () => {},
    unsubscribe: () => {}
  }
}

