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
    const headerControls = document.querySelector('.header-controls');
    const fullWidthToggle = document.getElementById('fullWidthToggle');
    const prevMonth = document.getElementById('prevMonth');
    const currentMonth = document.getElementById('currentMonth');
    const nextMonth = document.getElementById('nextMonth');
    
    if (!body || !headerControls) return;
    
    if (enabled) {
        body.classList.add('minimal-header');
        if (toggleBtn) {
            toggleBtn.classList.add('active');
            toggleBtn.title = 'Afficher les éléments du header';
            // Déplacer le bouton dans header-controls pour qu'il soit visible
            if (toggleBtn.parentElement !== headerControls) {
                headerControls.insertBefore(toggleBtn, headerControls.firstChild);
            }
        }
        
        // Créer un groupe pour centrer l'année et la navigation
        let navCenterGroup = headerControls.querySelector('.nav-center-group');
        if (!navCenterGroup) {
            navCenterGroup = document.createElement('div');
            navCenterGroup.className = 'nav-center-group';
            
            // Déplacer les éléments de navigation dans le groupe
            if (prevMonth && currentMonth && nextMonth) {
                navCenterGroup.appendChild(prevMonth);
                navCenterGroup.appendChild(currentMonth);
                navCenterGroup.appendChild(nextMonth);
            }
            headerControls.appendChild(navCenterGroup);
        }
        
        // Déplacer le bouton full-width dans header-controls
        if (fullWidthToggle && fullWidthToggle.parentElement !== headerControls) {
            headerControls.appendChild(fullWidthToggle);
        }
    } else {
        body.classList.remove('minimal-header');
        if (toggleBtn) {
            toggleBtn.classList.remove('active');
            toggleBtn.title = 'Masquer les éléments du header';
            // Remettre le bouton dans header-top
            const headerTop = document.querySelector('.header-top');
            if (headerTop && toggleBtn.parentElement !== headerTop) {
                headerTop.insertBefore(toggleBtn, headerTop.querySelector('h1'));
            }
        }
        
        // Restaurer la structure normale
        const navCenterGroup = headerControls.querySelector('.nav-center-group');
        if (navCenterGroup) {
            // Remettre les éléments à leur place
            if (prevMonth && prevMonth.parentElement === navCenterGroup) {
                headerControls.insertBefore(prevMonth, navCenterGroup);
            }
            if (currentMonth && currentMonth.parentElement === navCenterGroup) {
                headerControls.insertBefore(currentMonth, navCenterGroup);
            }
            if (nextMonth && nextMonth.parentElement === navCenterGroup) {
                headerControls.insertBefore(nextMonth, navCenterGroup);
            }
            navCenterGroup.remove();
        }
        
        // Remettre le bouton full-width dans header-right
        const headerRight = document.querySelector('.header-right');
        if (fullWidthToggle && headerRight && fullWidthToggle.parentElement !== headerRight) {
            const userInfo = headerRight.querySelector('.user-info');
            if (userInfo && userInfo.nextSibling) {
                headerRight.insertBefore(fullWidthToggle, userInfo.nextSibling);
            } else {
                headerRight.appendChild(fullWidthToggle);
            }
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

