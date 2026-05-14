import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

/**
 * Chemin public Vite (préfixe des assets, manifest, service worker).
 * - Par défaut **`/`** → ex. `http://localhost:5173/`, Docker Nginx à la racine.
 * - Pour l’URL GitHub **`https://<user>.github.io/<repo>/`** sans domaine perso,
 *   définir au build **`VITE_BASE_PATH=/<repo>/`** (voir `docs/guides/DEPLOY_GITHUB_PAGES.md`).
 */
function vitePublicBase() {
  const raw = process.env.VITE_BASE_PATH
  if (raw == null || String(raw).trim() === '') return '/'
  let b = String(raw).trim()
  if (!b.startsWith('/')) b = `/${b}`
  if (!b.endsWith('/')) b = `${b}/`
  return b
}

const base = vitePublicBase()

export default defineConfig({
  base,
  // Ouvre la racine du dev server (cohérent avec `base` et Vue Router)
  server: {
    port: 5173,
    strictPort: false,
    open: true,
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'Gestionnaire de Congés',
        short_name: 'Congés',
        description: 'Gestionnaire de jours de congé - Calendrier interactif',
        theme_color: '#4a90e2',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    include: ['@vuepic/vue-datepicker', 'date-fns'],
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
})
