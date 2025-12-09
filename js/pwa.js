// PWA - Enregistrement du Service Worker et gestion de l'installation

// Enregistrer le service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Vérifier si on doit forcer la mise à jour (paramètre URL ou localStorage)
    const forceUpdate = new URLSearchParams(window.location.search).get('forceUpdate') === 'true' ||
                         localStorage.getItem('forceSWUpdate') === 'true';
    
    if (forceUpdate) {
      console.log('[PWA] Mise à jour forcée du Service Worker');
      localStorage.removeItem('forceSWUpdate');
    }
    
    // Désinscrire tous les service workers existants si mise à jour forcée
    const unregisterPromise = forceUpdate 
      ? navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (let registration of registrations) {
            registration.unregister();
            console.log('[PWA] Service Worker désinscrit:', registration.scope);
          }
          return new Promise(resolve => setTimeout(resolve, 200));
        })
      : Promise.resolve();
    
    unregisterPromise.then(() => {
      // Enregistrer le nouveau service worker avec un paramètre de cache busting
      const swUrl = './sw.js?v=' + Date.now();
      return navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' });
    })
      .then((registration) => {
        console.log('[PWA] Service Worker enregistré avec succès:', registration.scope);

        // Forcer la mise à jour immédiatement
        registration.update();

        // Vérifier les mises à jour périodiquement (toutes les 30 secondes pour une détection plus rapide)
        setInterval(() => {
          registration.update();
        }, 30000);

        // Écouter les mises à jour du service worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('[PWA] Nouvelle version du Service Worker détectée');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // Nouvelle version disponible, forcer le rechargement pour Chrome
                console.log('[PWA] Nouvelle version installée, rechargement...');
                // Envoyer un message pour activer le nouveau worker
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                // Recharger la page après un court délai
                setTimeout(() => {
                  window.location.reload();
                }, 500);
              } else {
                // Première installation
                console.log('[PWA] Service Worker installé pour la première fois');
              }
            }
          });
        });
      })
      .catch((error) => {
        console.error('[PWA] Échec de l\'enregistrement du Service Worker:', error);
      });

    // Écouter les messages du service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('[PWA] Message reçu du Service Worker:', event.data);
      if (event.data && event.data.type === 'RELOAD') {
        window.location.reload();
      }
    });

    // Écouter les changements de contrôle du service worker
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWA] Nouveau Service Worker actif, rechargement...');
      // Recharger la page pour utiliser la nouvelle version (important pour Chrome)
      window.location.reload();
    });
  });
}

// Gérer l'événement d'installation PWA
let deferredPrompt;
const installButton = document.getElementById('installPWAButton');

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('[PWA] Événement beforeinstallprompt déclenché');
  // Empêcher l'affichage automatique du prompt
  e.preventDefault();
  // Sauvegarder l'événement pour l'utiliser plus tard
  deferredPrompt = e;
  // Afficher le bouton d'installation si disponible
  showInstallButton();
});

// Fonction pour afficher le bouton d'installation
function showInstallButton() {
  // Créer le bouton s'il n'existe pas déjà
  if (!installButton && deferredPrompt) {
    const button = document.createElement('button');
    button.id = 'installPWAButton';
    button.className = 'install-pwa-btn';
    button.innerHTML = '📱 Installer l\'app';
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 24px;
      background: #4a90e2;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    
    button.addEventListener('click', installPWA);
    document.body.appendChild(button);
  } else if (installButton) {
    installButton.style.display = 'block';
  }
}

// Fonction pour installer l'app
function installPWA() {
  if (!deferredPrompt) {
    return;
  }

  // Afficher le prompt d'installation
  deferredPrompt.prompt();

  // Attendre la réponse de l'utilisateur
  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('[PWA] L\'utilisateur a accepté l\'installation');
    } else {
      console.log('[PWA] L\'utilisateur a refusé l\'installation');
    }
    // Réinitialiser la variable
    deferredPrompt = null;
    // Masquer le bouton
    const button = document.getElementById('installPWAButton');
    if (button) {
      button.style.display = 'none';
    }
  });
}

// Détecter si l'app est déjà installée
window.addEventListener('appinstalled', () => {
  console.log('[PWA] Application installée avec succès');
  deferredPrompt = null;
  const button = document.getElementById('installPWAButton');
  if (button) {
    button.style.display = 'none';
  }
});

// Vérifier si l'app est déjà installée (mode standalone)
function isPWAInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true ||
         document.referrer.includes('android-app://');
}

// Fonction pour afficher une notification de mise à jour
function showUpdateNotification() {
  // Créer une notification simple
  const notification = document.createElement('div');
  notification.id = 'pwaUpdateNotification';
  notification.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      left: 20px;
      right: 20px;
      max-width: 400px;
      margin: 0 auto;
      padding: 16px;
      background: #4a90e2;
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    ">
      <span>🔄 Une nouvelle version est disponible</span>
      <button onclick="window.location.reload()" style="
        padding: 8px 16px;
        background: white;
        color: #4a90e2;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
      ">Mettre à jour</button>
    </div>
  `;
  document.body.appendChild(notification);

  // Supprimer la notification après 10 secondes
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 10000);
}

// Exporter les fonctions pour utilisation globale
window.installPWA = installPWA;
window.isPWAInstalled = isPWAInstalled;

