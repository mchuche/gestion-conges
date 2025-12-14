import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { autoAnimatePlugin } from '@formkit/auto-animate/vue'
import i18n from './i18n'
import './plugins/vee-validate'
import App from './App.vue'
import router from './router'
import './styles/main.css'
import './styles/year-view.css'
import './styles/year-semester.css'
import './styles/year-presence-vertical.css'

const app = createApp(App)
const pinia = createPinia()

// Configurer Vue pour ignorer les warnings liés aux portals de Headless UI
if (import.meta.env.DEV) {
  app.config.warnHandler = (msg, instance, trace) => {
    // Ignorer les warnings spécifiques aux slots de Headless UI
    try {
      const msgStr = String(msg || '')
      if (
        msgStr.includes('Slot "default" invoked outside of the render function') ||
        (msgStr.includes('Slot') && msgStr.includes('outside of the render function'))
      ) {
        return // Ignorer ce warning
      }
    } catch (e) {
      // Si la conversion échoue, continuer avec le comportement par défaut
    }
    // Pour tous les autres warnings, utiliser le comportement par défaut
    console.warn(msg, instance, trace)
  }
}

app.use(pinia)
app.use(router)
app.use(i18n)
app.use(autoAnimatePlugin)

// Gérer la redirection depuis 404.html (GitHub Pages)
// Le 404.html redirige vers index.html?/path, il faut extraire le chemin
if (window.location.search.includes('?/')) {
  const path = window.location.search.replace('?/', '')
  const cleanPath = path.split('&')[0].replace(/~and~/g, '&')
  const hash = window.location.hash
  const fullPath = cleanPath + hash
  
  // Nettoyer l'URL et naviguer vers le bon chemin
  router.isReady().then(() => {
    router.replace(fullPath).then(() => {
      // Nettoyer l'URL après la navigation
      const newUrl = window.location.origin + router.resolve(fullPath).href
      window.history.replaceState({}, '', newUrl)
    })
  })
}

app.mount('#app')

