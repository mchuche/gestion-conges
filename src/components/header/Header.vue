<template>
  <header class="app-header">
    <div class="header-top">
      <button
        id="minimizeHeaderBtn"
        class="minimize-header-btn"
        :class="{ active: minimizeHeader }"
        @click="toggleMinimizeHeader"
        :title="minimizeHeader ? 'Afficher les éléments du header' : 'Masquer les éléments du header'"
      >
        <Icon :name="minimizeHeader ? 'chevrons-down' : 'chevrons-up'" />
      </button>
      <h1>Gestionnaire de Congés</h1>
      <div class="header-right">
        <button
          class="theme-toggle"
          @click="toggleTheme"
          :title="theme === 'dark' ? 'Mode clair' : 'Mode sombre'"
        >
          {{ theme === 'dark' ? '☀️' : '🌙' }}
        </button>
        <button
          class="full-width-toggle"
          :class="{ active: fullWidth }"
          @click="toggleFullWidth"
          title="Pleine largeur"
        >
          ⛶
        </button>
        <div class="menu-dropdown">
          <button class="menu-btn" @click="toggleMenu" title="Menu">
            ☰
          </button>
          <div class="menu-dropdown-content" :class="{ show: showMenu }">
            <button class="menu-item" @click="openConfig">
              ⚙️ Configuration
            </button>
            <button class="menu-item" @click="openHelp">
              ❓ Aide
            </button>
            <div class="menu-divider"></div>
            <button class="menu-item" @click="logout">
              🚪 Déconnexion
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useUIStore } from '../../stores/ui'
import { useAuthStore } from '../../stores/auth'
import Icon from '../common/Icon.vue'

const uiStore = useUIStore()
const authStore = useAuthStore()

const showMenu = ref(false)
const theme = computed(() => uiStore.theme)
const fullWidth = computed(() => uiStore.fullWidth)
const minimizeHeader = computed(() => uiStore.minimizeHeader)

function toggleMenu() {
  showMenu.value = !showMenu.value
}

function closeMenu() {
  showMenu.value = false
}

function toggleTheme() {
  uiStore.toggleTheme()
}

function toggleFullWidth() {
  uiStore.toggleFullWidth()
}

function toggleMinimizeHeader() {
  uiStore.toggleMinimizeHeader()
}

function openConfig() {
  uiStore.openConfigModal()
  closeMenu()
}

function openHelp() {
  uiStore.openHelpModal()
  closeMenu()
}

async function logout() {
  try {
    const result = await authStore.signOut()
    if (result.success) {
      closeMenu()
      // La réactivité de Vue devrait automatiquement afficher la modale d'auth
      // car isAuthenticated devient false
    } else {
      console.error('Erreur lors de la déconnexion:', result.error)
      alert('Erreur lors de la déconnexion: ' + result.error)
    }
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error)
    alert('Erreur lors de la déconnexion')
  }
}

// Fermer le menu quand on clique ailleurs
function handleClickOutside(event) {
  if (!event.target.closest('.menu-dropdown')) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  if (typeof uiStore.loadMinimizeHeader === 'function') {
    uiStore.loadMinimizeHeader()
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.app-header {
  margin-bottom: 30px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  position: relative;
}

.minimize-header-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 4px;
  font-size: 1.2em;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(74, 144, 226, 0.3);
  flex-shrink: 0;
}

.minimize-header-btn:hover {
  background: #357abd;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4);
}

.minimize-header-btn.active {
  background: var(--secondary-color);
}

.header-top h1 {
  flex: 1;
  text-align: center;
  font-size: 2em;
  color: var(--text-color);
  margin: 0;
  padding-left: 50px; /* Espace pour le bouton minimize */
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.theme-toggle,
.full-width-toggle {
  background: var(--primary-color);
  color: white;
  border: none;
  width: 45px;
  height: 45px;
  border-radius: 4px;
  font-size: 1.3em;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(74, 144, 226, 0.3);
}

.theme-toggle:hover,
.full-width-toggle:hover {
  background: #357abd;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4);
}

.full-width-toggle.active {
  background: var(--secondary-color);
}

.menu-dropdown {
  position: relative;
  display: inline-block;
}

.menu-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  width: 45px;
  height: 45px;
  border-radius: 4px;
  font-size: 1.3em;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(74, 144, 226, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.menu-btn:hover {
  background: #357abd;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4);
}

.menu-dropdown-content {
  display: none;
  position: absolute;
  right: 0;
  top: calc(100% + 5px);
  background: var(--card-bg);
  min-width: 200px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  z-index: 10000;
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.menu-dropdown-content.show {
  display: block;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.menu-item {
  display: block;
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  color: var(--text-color);
  font-size: 1em;
  transition: background 0.2s;
}

.menu-item:hover {
  background: var(--hover-color);
}

.menu-divider {
  height: 1px;
  background: var(--border-color);
  margin: 5px 0;
}

@media (max-width: 768px) {
  .header-top {
    flex-direction: column;
    gap: 15px;
  }
  
  .header-top h1 {
    font-size: 1.5em;
  }
  
  .header-right {
    width: 100%;
    justify-content: center;
  }
  
  .menu-dropdown-content {
    right: auto;
    left: 0;
    min-width: 180px;
  }
}
</style>

