import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// `import.meta.env.BASE_URL` suit le `base` de Vite (`/` en local, ou `VITE_BASE_PATH` au build Pages)
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'calendar',
      component: () => import('../components/calendar/Calendar.vue')
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../components/admin/AdminView.vue'),
      meta: { requiresAdmin: true }
    }
  ]
})

// Garde d'authentification et admin
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // Si la route nécessite admin
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    // Rediriger vers la page principale
    next('/')
    return
  }
  
  next()
})

export default router

