/**
 * FullWidth - Gestion du mode pleine largeur
 * 
 * Ce module gère :
 * - Le toggle pour activer/désactiver le mode pleine largeur
 * - La sauvegarde de la préférence dans localStorage
 * - L'application du style au chargement
 * 
 * Ces fonctions seront ajoutées au prototype de LeaveManager.
 */

/**
 * Initialise le mode pleine largeur
 * Charge la préférence depuis localStorage et applique le style
 */
function initFullWidth() {
    const fullWidth = localStorage.getItem('fullWidth') === 'true';
    this.setFullWidth(fullWidth);
}

/**
 * Active ou désactive le mode pleine largeur
 * @param {boolean} enabled - true pour activer, false pour désactiver
 */
function setFullWidth(enabled) {
    const container = document.getElementById('mainContainer');
    const body = document.body;
    const toggleBtn = document.getElementById('fullWidthToggle');
    
    if (!container || !body) return;
    
    if (enabled) {
        container.classList.add('full-width');
        body.classList.add('full-width');
        if (toggleBtn) {
            toggleBtn.classList.add('active');
            toggleBtn.title = 'Largeur limitée';
        }
    } else {
        container.classList.remove('full-width');
        body.classList.remove('full-width');
        if (toggleBtn) {
            toggleBtn.classList.remove('active');
            toggleBtn.title = 'Largeur pleine écran';
        }
    }
    
    // Sauvegarder la préférence
    localStorage.setItem('fullWidth', enabled.toString());
}

/**
 * Bascule le mode pleine largeur
 */
function toggleFullWidth() {
    const container = document.getElementById('mainContainer');
    if (!container) return;
    
    const isFullWidth = container.classList.contains('full-width');
    this.setFullWidth(!isFullWidth);
}

/**
 * Configure les event listeners pour le bouton de toggle
 */
function setupFullWidthListeners() {
    const toggleBtn = document.getElementById('fullWidthToggle');
    if (toggleBtn && !toggleBtn.hasAttribute('data-listener-added')) {
        toggleBtn.setAttribute('data-listener-added', 'true');
        toggleBtn.addEventListener('click', () => {
            this.toggleFullWidth();
        });
    }
}

