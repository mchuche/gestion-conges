/**
 * MinimizeHeader - Gestion du masquage des éléments du header
 * 
 * Ce module gère :
 * - Le toggle pour masquer/afficher les éléments au-dessus du calendrier
 * - La sauvegarde de la préférence dans localStorage
 * - L'application du style au chargement
 * 
 * Ces fonctions seront ajoutées au prototype de LeaveManager.
 */

/**
 * Initialise le mode header minimal
 * Charge la préférence depuis localStorage et applique le style
 */
function initMinimizeHeader() {
    const minimized = localStorage.getItem('minimizeHeader') === 'true';
    this.setMinimizeHeader(minimized);
}

/**
 * Active ou désactive le mode header minimal
 * @param {boolean} enabled - true pour masquer, false pour afficher
 */
function setMinimizeHeader(enabled) {
    const body = document.body;
    const toggleBtn = document.getElementById('minimizeHeaderBtn');
    
    if (!body) return;
    
    if (enabled) {
        body.classList.add('minimal-header');
        if (toggleBtn) {
            toggleBtn.classList.add('active');
            toggleBtn.title = 'Afficher les éléments du header';
        }
    } else {
        body.classList.remove('minimal-header');
        if (toggleBtn) {
            toggleBtn.classList.remove('active');
            toggleBtn.title = 'Masquer les éléments du header';
        }
    }
    
    // Sauvegarder la préférence
    localStorage.setItem('minimizeHeader', enabled.toString());
}

/**
 * Bascule le mode header minimal
 */
function toggleMinimizeHeader() {
    const body = document.body;
    if (!body) return;
    
    const isMinimized = body.classList.contains('minimal-header');
    this.setMinimizeHeader(!isMinimized);
}

/**
 * Configure les event listeners pour le bouton de toggle
 */
function setupMinimizeHeaderListeners() {
    const toggleBtn = document.getElementById('minimizeHeaderBtn');
    if (toggleBtn && !toggleBtn.hasAttribute('data-listener-added')) {
        toggleBtn.setAttribute('data-listener-added', 'true');
        toggleBtn.addEventListener('click', () => {
            this.toggleMinimizeHeader();
        });
    }
}

