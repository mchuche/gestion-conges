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
          :title="themeTitle"
        >
          <span v-if="themeMode === 'auto'">🖥️</span>
          <span v-else-if="theme === 'dark'">☀️</span>
          <span v-else>🌙</span>
        </button>
        <button
          class="full-width-toggle"
          :class="{ active: fullWidth }"
          @click="toggleFullWidth"
          title="Pleine largeur"
        >
          ⛶
        </button>
        <Menu as="div" class="menu-dropdown">
          <MenuButton class="menu-btn" title="Menu">
            ☰
          </MenuButton>
          <MenuItems class="menu-dropdown-content">
            <MenuItem v-slot="{ active, close }">
              <button
                :class="['menu-item', { active }]"
                @click="() => { openConfig(); close(); }"
              >
                ⚙️ Configuration
              </button>
            </MenuItem>
            <MenuItem v-slot="{ active, close }">
              <button
                :class="['menu-item', { active }]"
                @click="() => { openHelp(); close(); }"
              >
                ❓ Aide
              </button>
            </MenuItem>
            <MenuItem v-slot="{ active, close }">
              <button
                :class="['menu-item', { active }]"
                @click="() => { openTeams(); close(); }"
              >
                👥 Équipes
              </button>
            </MenuItem>
            <MenuItem v-if="authStore.isAdmin" v-slot="{ active, close }">
              <button
                :class="['menu-item', { active }]"
                @click="() => { openAdmin(); close(); }"
              >
                ⚙️ Administration
              </button>
            </MenuItem>
            <MenuItem v-slot="{ active, close }">
              <button
                :class="['menu-item', { active }]"
                @click="() => { openLeaveRecap(); close(); }"
              >
                📅 Récapitulatif
              </button>
            </MenuItem>
            <div class="menu-divider"></div>
            <MenuItem v-slot="{ active }">
              <button
                :class="['menu-item', { active }]"
                @click="logout"
              >
                🚪 Déconnexion
              </button>
            </MenuItem>
          </MenuItems>
        </Menu>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import { useUIStore } from '../../stores/ui'
import { useAuthStore } from '../../stores/auth'
import { useToast } from '../../composables/useToast'
import logger from '../../services/logger'
import Icon from '../common/Icon.vue'

const router = useRouter()
const uiStore = useUIStore()
const authStore = useAuthStore()
const { error: showErrorToast } = useToast()

const theme = computed(() => uiStore.theme)
const themeMode = computed(() => uiStore.themeMode)
const fullWidth = computed(() => uiStore.fullWidth)
const minimizeHeader = computed(() => uiStore.minimizeHeader)

const themeTitle = computed(() => {
  if (themeMode.value === 'auto') {
    return `Mode automatique (actuellement: ${theme.value === 'dark' ? 'sombre' : 'clair'})`
  }
  return theme.value === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'
})

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
  console.log('[Header] openConfig appelé')
  try {
    uiStore.openConfigModal()
    console.log('[Header] showConfigModal après appel:', uiStore.showConfigModal)
  } catch (error) {
    console.error('[Header] Erreur dans openConfig:', error)
  }
}

function openHelp() {
  console.log('[Header] openHelp appelé')
  uiStore.openHelpModal()
}

function openTeams() {
  console.log('[Header] openTeams appelé')
  uiStore.openTeamsModal()
}

function openLeaveRecap() {
  console.log('[Header] openLeaveRecap appelé')
  uiStore.openLeaveRecapModal()
}

function openAdmin() {
  console.log('[Header] openAdmin appelé')
  try {
    router.push('/admin')
  } catch (error) {
    console.error('[Header] Erreur dans openAdmin:', error)
  }
}

async function logout() {
  try {
    const result = await authStore.signOut()
    if (!result.success) {
      logger.error('Erreur lors de la déconnexion:', result.error)
      showErrorToast('Erreur lors de la déconnexion: ' + result.error)
    }
    // La réactivité de Vue devrait automatiquement afficher la modale d'auth
    // car isAuthenticated devient false
  } catch (error) {
    logger.error('Erreur lors de la déconnexion:', error)
    showErrorToast('Erreur lors de la déconnexion')
  }
}

onMounted(() => {
  if (typeof uiStore.loadMinimizeHeader === 'function') {
    uiStore.loadMinimizeHeader()
  }
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
  outline: none;
  transform-origin: top right;
}

/* Headless UI masque le menu avec hidden, on le gère avec CSS */
.menu-dropdown-content[hidden] {
  display: none;
}

.menu-dropdown-content:not([hidden]) {
  display: block;
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

.menu-item:hover,
.menu-item.active {
  background: var(--hover-color);
}

.menu-item:focus {
  outline: none;
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

