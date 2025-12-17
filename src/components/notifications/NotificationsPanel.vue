<template>
  <div class="notifications-panel">
    <!-- Header -->
    <div class="notifications-header">
      <h3>Notifications</h3>
      <div class="notifications-actions">
        <button 
          v-if="unreadCount > 0"
          @click="markAllAsRead"
          class="btn-mark-all"
          title="Tout marquer comme lu"
        >
          <Icon name="check-double" />
        </button>
        <button 
          @click="deleteAllRead"
          class="btn-delete-read"
          title="Supprimer les notifications lues"
        >
          <Icon name="trash" />
        </button>
        <button 
          @click="$emit('close')"
          class="btn-close"
          title="Fermer"
        >
          <Icon name="close" />
        </button>
      </div>
    </div>

    <!-- Liste des notifications -->
    <div class="notifications-list">
      <div v-if="loading" class="notifications-loading">
        Chargement...
      </div>
      
      <div v-else-if="notifications.length === 0" class="notifications-empty">
        <Icon name="bell" class="empty-icon" />
        <p>Aucune notification</p>
      </div>

      <div 
        v-else
        v-for="notification in notifications"
        :key="notification.id"
        class="notification-item"
        :class="{ 'unread': !notification.read }"
        @click="handleNotificationClick(notification)"
      >
        <div class="notification-icon">
          <Icon :name="getNotificationIcon(notification.type)" />
        </div>
        
        <div class="notification-content">
          <h4 class="notification-title">{{ notification.title }}</h4>
          <p class="notification-message">{{ notification.message }}</p>
          <span class="notification-time">{{ formatTime(notification.created_at) }}</span>
        </div>

        <div class="notification-actions">
          <button 
            v-if="!notification.read"
            @click.stop="markAsRead(notification.id)"
            class="btn-mark-read"
            title="Marquer comme lu"
          >
            <Icon name="check" />
          </button>
          <button 
            @click.stop="deleteNotification(notification.id)"
            class="btn-delete"
            title="Supprimer"
          >
            <Icon name="close" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useNotificationsStore } from '../../stores/notifications'
import Icon from '../common/Icon.vue'
import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

const notificationsStore = useNotificationsStore()
const { notifications, loading, unreadCount } = storeToRefs(notificationsStore)

const emit = defineEmits(['close'])

onMounted(() => {
  notificationsStore.loadNotifications()
})

function getNotificationIcon(type) {
  switch (type) {
    case 'leave_modified':
    case 'event_modified':
      return 'calendar'
    case 'team_invite':
      return 'users'
    default:
      return 'bell'
  }
}

function formatTime(dateString) {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return formatDistanceToNow(date, { addSuffix: true, locale: fr })
    } else {
      return format(date, 'dd/MM/yyyy à HH:mm', { locale: fr })
    }
  } catch (error) {
    return dateString
  }
}

function handleNotificationClick(notification) {
  if (!notification.read) {
    notificationsStore.markAsRead(notification.id)
  }
}

function markAsRead(id) {
  notificationsStore.markAsRead(id)
}

function markAllAsRead() {
  notificationsStore.markAllAsRead()
}

function deleteNotification(id) {
  notificationsStore.deleteNotification(id)
}

function deleteAllRead() {
  notificationsStore.deleteAllRead()
}
</script>

<style scoped>
.notifications-panel {
  position: fixed;
  top: 60px;
  right: 20px;
  width: 400px;
  max-height: 600px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.notifications-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.notifications-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.notifications-actions {
  display: flex;
  gap: 8px;
}

.notifications-actions button {
  background: transparent;
  border: none;
  padding: 6px;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.notifications-actions button:hover {
  background-color: #f5f5f5;
}

.btn-close {
  color: #666;
}

.btn-mark-all {
  color: #4caf50;
}

.btn-delete-read {
  color: #f44336;
}

.notifications-list {
  overflow-y: auto;
  max-height: 520px;
  flex: 1;
}

.notifications-loading,
.notifications-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #999;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.3;
}

.notification-item {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}

.notification-item:hover {
  background-color: #f9f9f9;
}

.notification-item.unread {
  background-color: #f0f7ff;
}

.notification-item.unread::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background-color: #2196f3;
}

.notification-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #e3f2fd;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2196f3;
  font-size: 18px;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.notification-message {
  margin: 0 0 6px 0;
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.notification-time {
  font-size: 12px;
  color: #999;
}

.notification-actions {
  display: flex;
  gap: 4px;
  align-items: flex-start;
  opacity: 0;
  transition: opacity 0.2s;
}

.notification-item:hover .notification-actions {
  opacity: 1;
}

.notification-actions button {
  background: transparent;
  border: none;
  padding: 4px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  font-size: 14px;
}

.notification-actions button:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.btn-mark-read {
  color: #4caf50;
}

.btn-delete {
  color: #f44336;
}

/* Mode sombre */
:global(.dark-mode) .notifications-panel {
  background: #2c2c2c;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

:global(.dark-mode) .notifications-header {
  border-bottom-color: #444;
}

:global(.dark-mode) .notifications-header h3 {
  color: #e0e0e0;
}

:global(.dark-mode) .notifications-actions button:hover {
  background-color: #3a3a3a;
}

:global(.dark-mode) .notification-item {
  border-bottom-color: #3a3a3a;
}

:global(.dark-mode) .notification-item:hover {
  background-color: #333;
}

:global(.dark-mode) .notification-item.unread {
  background-color: #1e3a5f;
}

:global(.dark-mode) .notification-title {
  color: #e0e0e0;
}

:global(.dark-mode) .notification-message {
  color: #b0b0b0;
}

:global(.dark-mode) .notification-icon {
  background-color: #1e3a5f;
  color: #64b5f6;
}

/* Responsive */
@media (max-width: 768px) {
  .notifications-panel {
    right: 10px;
    left: 10px;
    width: auto;
    max-height: 500px;
  }
}
</style>

