// Icons - Gestion des icônes Lucide
// Fonction helper pour créer des icônes Lucide facilement

/**
 * Crée une icône Lucide et la retourne comme élément SVG
 * @param {string} iconName - Nom de l'icône Lucide (ex: 'calendar', 'settings')
 * @param {Object} options - Options pour l'icône (size, color, class, etc.)
 * @returns {HTMLElement} - Élément SVG de l'icône
 */
function createIcon(iconName, options = {}) {
    const {
        size = 20,
        color = 'currentColor',
        class: className = '',
        strokeWidth = 2
    } = options;
    
    // Vérifier que Lucide est disponible
    if (typeof lucide === 'undefined' || !lucide[iconName]) {
        console.warn(`[Icons] Icône "${iconName}" non trouvée dans Lucide`);
        // Retourner un span vide en fallback
        const span = document.createElement('span');
        span.className = className;
        return span;
    }
    
    // Créer l'icône avec Lucide
    const icon = lucide[iconName]({
        size: size,
        color: color,
        strokeWidth: strokeWidth
    });
    
    // Ajouter la classe si fournie
    if (className) {
        icon.classList.add(className);
    }
    
    return icon;
}

/**
 * Remplace un emoji ou texte par une icône Lucide
 * @param {HTMLElement} element - Élément à modifier
 * @param {string} iconName - Nom de l'icône Lucide
 * @param {Object} options - Options pour l'icône
 */
function replaceWithIcon(element, iconName, options = {}) {
    if (!element) return;
    
    const icon = createIcon(iconName, options);
    
    // Si l'élément contient seulement du texte/emoji, le remplacer
    if (element.childNodes.length === 1 && element.childNodes[0].nodeType === Node.TEXT_NODE) {
        element.innerHTML = '';
        element.appendChild(icon);
    } else {
        // Sinon, ajouter l'icône au début
        element.insertBefore(icon, element.firstChild);
    }
}

/**
 * Initialise les icônes dans l'interface
 */
function initIcons() {
    // Remplacer les emojis par des icônes Lucide
    // Header
    const headerTitle = document.querySelector('h1');
    if (headerTitle && headerTitle.textContent.includes('📆')) {
        headerTitle.innerHTML = '';
        const icon = createIcon('calendar', { size: 24, class: 'header-icon' });
        headerTitle.appendChild(icon);
        headerTitle.appendChild(document.createTextNode(' Gestionnaire de Congés'));
    }
    
    // Boutons de navigation
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');
    if (prevBtn && prevBtn.textContent === '◀') {
        prevBtn.innerHTML = '';
        prevBtn.appendChild(createIcon('chevron-left', { size: 20 }));
    }
    if (nextBtn && nextBtn.textContent === '▶') {
        nextBtn.innerHTML = '';
        nextBtn.appendChild(createIcon('chevron-right', { size: 20 }));
    }
    
    // Bouton de vue
    const viewToggle = document.getElementById('viewToggle');
    if (viewToggle && viewToggle.textContent.includes('📆')) {
        viewToggle.innerHTML = '';
        viewToggle.appendChild(createIcon('calendar', { size: 18 }));
    }
    
    // Bouton thème
    const themeToggles = document.querySelectorAll('.theme-toggle');
    themeToggles.forEach(btn => {
        if (btn.textContent.includes('☾')) {
            btn.innerHTML = '';
            btn.appendChild(createIcon('moon', { size: 18 }));
        }
    });
    
    // Bouton plein écran
    const fullWidthToggle = document.getElementById('fullWidthToggle');
    if (fullWidthToggle && fullWidthToggle.textContent.includes('⛶')) {
        fullWidthToggle.innerHTML = '';
        fullWidthToggle.appendChild(createIcon('maximize', { size: 18 }));
    }
    
    // Bouton menu
    const menuBtn = document.getElementById('menuBtn');
    if (menuBtn && menuBtn.textContent.includes('☰')) {
        menuBtn.innerHTML = '';
        menuBtn.appendChild(createIcon('menu', { size: 18 }));
    }
    
    // Bouton déconnexion
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn && logoutBtn.textContent.includes('⏻')) {
        logoutBtn.innerHTML = '';
        logoutBtn.appendChild(createIcon('log-out', { size: 18 }));
    }
    
    // Badge invitations
    const invitationsBadge = document.getElementById('invitationsBadge');
    if (invitationsBadge && invitationsBadge.textContent.includes('✉')) {
        invitationsBadge.innerHTML = '';
        invitationsBadge.appendChild(createIcon('mail', { size: 16 }));
    }
    
    // Bouton minimiser
    const minimizeBtn = document.getElementById('minimizeHeaderBtn');
    if (minimizeBtn && minimizeBtn.textContent.includes('⬇')) {
        minimizeBtn.innerHTML = '';
        minimizeBtn.appendChild(createIcon('chevron-down', { size: 18 }));
    }
    
    // Menu items
    const configMenu = document.querySelector('[data-action="config"]');
    if (configMenu && configMenu.textContent.includes('⚙')) {
        configMenu.innerHTML = '';
        configMenu.appendChild(createIcon('settings', { size: 16 }));
        configMenu.appendChild(document.createTextNode(' Configuration'));
    }
    
    const teamsMenu = document.querySelector('[data-action="teams"]');
    if (teamsMenu && teamsMenu.textContent.includes('👥')) {
        teamsMenu.innerHTML = '';
        teamsMenu.appendChild(createIcon('users', { size: 16 }));
        teamsMenu.appendChild(document.createTextNode(' Gérer les équipes'));
    }
    
    const helpMenu = document.querySelector('[data-action="help"]');
    if (helpMenu && helpMenu.textContent.includes('?')) {
        helpMenu.innerHTML = '';
        helpMenu.appendChild(createIcon('help-circle', { size: 16 }));
        helpMenu.appendChild(document.createTextNode(' Aide'));
    }
    
    const adminMenu = document.querySelector('[data-action="admin"]');
    if (adminMenu && adminMenu.textContent.includes('⚙')) {
        adminMenu.innerHTML = '';
        adminMenu.appendChild(createIcon('shield', { size: 16 }));
        adminMenu.appendChild(document.createTextNode(' Administration'));
    }
    
    // Modales
    const authModalTitle = document.querySelector('#authModal h3');
    if (authModalTitle && authModalTitle.textContent.includes('🔒')) {
        authModalTitle.innerHTML = '';
        authModalTitle.appendChild(createIcon('lock', { size: 20 }));
        authModalTitle.appendChild(document.createTextNode(' Connexion'));
    }
    
    const configModalTitle = document.querySelector('#configModal h3');
    if (configModalTitle && configModalTitle.textContent.includes('⚙')) {
        configModalTitle.innerHTML = '';
        configModalTitle.appendChild(createIcon('settings', { size: 20 }));
        configModalTitle.appendChild(document.createTextNode(' Configuration des Congés'));
    }
    
    const teamsModalTitle = document.querySelector('#teamsModal h3');
    if (teamsModalTitle && teamsModalTitle.textContent.includes('👥')) {
        teamsModalTitle.innerHTML = '';
        teamsModalTitle.appendChild(createIcon('users', { size: 20 }));
        teamsModalTitle.appendChild(document.createTextNode(' Gestion des Équipes'));
    }
    
    const adminModalTitle = document.querySelector('#adminModal h3');
    if (adminModalTitle && adminModalTitle.textContent.includes('⚙')) {
        adminModalTitle.innerHTML = '';
        adminModalTitle.appendChild(createIcon('shield', { size: 20 }));
        adminModalTitle.appendChild(document.createTextNode(' Administration'));
    }
    
    // Bouton nettoyer les données
    const clearDataBtn = document.getElementById('clearAuthDataBtn');
    if (clearDataBtn && clearDataBtn.textContent.includes('⌧')) {
        clearDataBtn.innerHTML = '';
        clearDataBtn.appendChild(createIcon('trash-2', { size: 14 }));
        clearDataBtn.appendChild(document.createTextNode(' Nettoyer les données'));
    }
    
    // Admin tabs
    const adminTabs = document.querySelectorAll('.admin-tab');
    adminTabs.forEach(tab => {
        if (tab.textContent.includes('👥')) {
            tab.innerHTML = '';
            tab.appendChild(createIcon('users', { size: 16 }));
            tab.appendChild(document.createTextNode(' Utilisateurs'));
        } else if (tab.textContent.includes('⚙')) {
            const isSettings = tab.getAttribute('data-tab') === 'settings';
            tab.innerHTML = '';
            tab.appendChild(createIcon('settings', { size: 16 }));
            tab.appendChild(document.createTextNode(isSettings ? ' Paramètres' : ' Administration'));
        }
    });
    
    // Aide - sections
    const helpSections = document.querySelectorAll('.help-section h4');
    helpSections.forEach(section => {
        if (section.textContent.includes('📆')) {
            section.innerHTML = '';
            section.appendChild(createIcon('calendar', { size: 18 }));
            section.appendChild(document.createTextNode(' Utilisation du calendrier'));
        } else if (section.textContent.includes('⚙')) {
            section.innerHTML = '';
            section.appendChild(createIcon('settings', { size: 18 }));
            section.appendChild(document.createTextNode(' Configuration'));
        }
    });
    
    // Info hint
    const helpHint = document.getElementById('helpHint');
    if (helpHint && helpHint.textContent.includes('ℹ')) {
        helpHint.innerHTML = '';
        const icon = createIcon('info', { size: 16, class: 'help-hint-icon' });
        helpHint.insertBefore(icon, helpHint.firstChild);
        helpHint.insertBefore(document.createTextNode(' Astuce : '), helpHint.childNodes[1]);
    }
}

// Attendre que le DOM soit chargé
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIcons);
} else {
    initIcons();
}

// Réinitialiser les icônes après le chargement de l'app principale
// (pour les éléments créés dynamiquement)
const originalShowMainApp = window.showMainApp;
if (typeof showMainApp === 'function') {
    window.showMainApp = function() {
        originalShowMainApp.apply(this, arguments);
        setTimeout(initIcons, 100);
    };
}

