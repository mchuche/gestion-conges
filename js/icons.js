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
    if (typeof lucide === 'undefined') {
        console.warn(`[Icons] Lucide n'est pas disponible`);
        // Retourner un span vide en fallback
        const span = document.createElement('span');
        span.className = className;
        return span;
    }
    
    console.log(`[Icons] Création de l'icône "${iconName}"`);
    console.log(`[Icons] lucide disponible:`, typeof lucide);
    console.log(`[Icons] lucide.icons:`, typeof lucide.icons);
    console.log(`[Icons] lucide[${iconName}]:`, typeof lucide[iconName]);
    
    // Lucide via CDN UMD expose les icônes directement
    let IconComponent = null;
    
    // Essayer différentes façons d'accéder aux icônes
    if (lucide[iconName] && typeof lucide[iconName] === 'function') {
        IconComponent = lucide[iconName];
    } else if (lucide.icons && lucide.icons[iconName]) {
        IconComponent = lucide.icons[iconName];
    } else if (window.lucide && window.lucide[iconName]) {
        IconComponent = window.lucide[iconName];
    }
    
    if (!IconComponent) {
        console.warn(`[Icons] Icône "${iconName}" non trouvée dans Lucide. Icônes disponibles:`, Object.keys(lucide).slice(0, 10));
        // Retourner un span vide en fallback
        const span = document.createElement('span');
        span.className = className;
        span.textContent = '?'; // Afficher un ? pour voir qu'il y a un problème
        return span;
    }
    
    try {
        // Créer l'icône avec Lucide
        // Lucide via CDN UMD retourne un élément SVG directement
        const icon = IconComponent({
            size: size,
            color: color,
            strokeWidth: strokeWidth
        });
        
        // S'assurer que c'est un élément SVG
        if (!icon || !(icon instanceof SVGElement)) {
            console.warn(`[Icons] L'icône "${iconName}" n'a pas retourné un SVG valide:`, icon);
            const span = document.createElement('span');
            span.className = className;
            span.textContent = '?';
            return span;
        }
        
        // Ajouter la classe si fournie
        if (className) {
            icon.classList.add(className);
        }
        
        console.log(`[Icons] Icône "${iconName}" créée avec succès`);
        return icon;
    } catch (error) {
        console.error(`[Icons] Erreur lors de la création de l'icône "${iconName}":`, error);
        const span = document.createElement('span');
        span.className = className;
        span.textContent = '?';
        return span;
    }
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
    // Vérifier que Lucide est disponible
    if (typeof lucide === 'undefined') {
        console.warn('[Icons] Lucide Icons non disponible, réessai dans 100ms...');
        setTimeout(initIcons, 100);
        return;
    }
    
    console.log('[Icons] Initialisation des icônes...');
    
    // Remplacer les emojis par des icônes Lucide
    // Header
    const headerTitle = document.querySelector('h1');
    if (headerTitle) {
        const text = headerTitle.textContent || headerTitle.innerText || '';
        if (text.includes('📆') || (!headerTitle.querySelector('svg') && text.includes('Gestionnaire'))) {
            headerTitle.innerHTML = '';
            const icon = createIcon('calendar', { size: 24, class: 'header-icon' });
            headerTitle.appendChild(icon);
            headerTitle.appendChild(document.createTextNode(' Gestionnaire de Congés'));
        }
    }
    
    // Boutons de navigation
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');
    if (prevBtn && (prevBtn.textContent.includes('◀') || !prevBtn.querySelector('svg'))) {
        prevBtn.innerHTML = '';
        prevBtn.appendChild(createIcon('chevron-left', { size: 20 }));
    }
    if (nextBtn && (nextBtn.textContent.includes('▶') || !nextBtn.querySelector('svg'))) {
        nextBtn.innerHTML = '';
        nextBtn.appendChild(createIcon('chevron-right', { size: 20 }));
    }
    
    // Bouton de vue
    const viewToggle = document.getElementById('viewToggle');
    if (viewToggle && (viewToggle.textContent.includes('📆') || !viewToggle.querySelector('svg'))) {
        viewToggle.innerHTML = '';
        viewToggle.appendChild(createIcon('calendar', { size: 18 }));
    }
    
    // Bouton thème - sera mis à jour dynamiquement par updateThemeToggleButton
    // On ne le modifie pas ici car il change selon le thème actif
    
    // Bouton plein écran
    const fullWidthToggle = document.getElementById('fullWidthToggle');
    if (fullWidthToggle && (fullWidthToggle.textContent.includes('⛶') || !fullWidthToggle.querySelector('svg'))) {
        fullWidthToggle.innerHTML = '';
        fullWidthToggle.appendChild(createIcon('maximize', { size: 18 }));
    }
    
    // Bouton menu
    const menuBtn = document.getElementById('menuBtn');
    if (menuBtn && (menuBtn.textContent.includes('☰') || !menuBtn.querySelector('svg'))) {
        menuBtn.innerHTML = '';
        menuBtn.appendChild(createIcon('menu', { size: 18 }));
    }
    
    // Bouton déconnexion
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn && (logoutBtn.textContent.includes('⏻') || !logoutBtn.querySelector('svg'))) {
        logoutBtn.innerHTML = '';
        logoutBtn.appendChild(createIcon('log-out', { size: 18 }));
    }
    
    // Badge invitations
    const invitationsBadge = document.getElementById('invitationsBadge');
    if (invitationsBadge && (invitationsBadge.textContent.includes('✉') || !invitationsBadge.querySelector('svg'))) {
        invitationsBadge.innerHTML = '';
        invitationsBadge.appendChild(createIcon('mail', { size: 16 }));
    }
    
    // Bouton minimiser
    const minimizeBtn = document.getElementById('minimizeHeaderBtn');
    if (minimizeBtn && (minimizeBtn.textContent.includes('⬇') || !minimizeBtn.querySelector('svg'))) {
        minimizeBtn.innerHTML = '';
        minimizeBtn.appendChild(createIcon('chevron-down', { size: 18 }));
    }
    
    // Menu items
    const configMenu = document.querySelector('[data-action="config"]');
    if (configMenu && (configMenu.textContent.includes('⚙') || !configMenu.querySelector('svg'))) {
        configMenu.innerHTML = '';
        configMenu.appendChild(createIcon('settings', { size: 16 }));
        configMenu.appendChild(document.createTextNode(' Configuration'));
    }
    
    const teamsMenu = document.querySelector('[data-action="teams"]');
    if (teamsMenu && (teamsMenu.textContent.includes('👥') || !teamsMenu.querySelector('svg'))) {
        teamsMenu.innerHTML = '';
        teamsMenu.appendChild(createIcon('users', { size: 16 }));
        teamsMenu.appendChild(document.createTextNode(' Gérer les équipes'));
    }
    
    const helpMenu = document.querySelector('[data-action="help"]');
    if (helpMenu && (helpMenu.textContent.includes('?') || !helpMenu.querySelector('svg'))) {
        helpMenu.innerHTML = '';
        helpMenu.appendChild(createIcon('help-circle', { size: 16 }));
        helpMenu.appendChild(document.createTextNode(' Aide'));
    }
    
    const adminMenu = document.querySelector('[data-action="admin"]');
    if (adminMenu && (adminMenu.textContent.includes('⚙') || !adminMenu.querySelector('svg'))) {
        adminMenu.innerHTML = '';
        adminMenu.appendChild(createIcon('shield', { size: 16 }));
        adminMenu.appendChild(document.createTextNode(' Administration'));
    }
    
    // Modales
    const authModalTitle = document.querySelector('#authModal h3');
    if (authModalTitle && (authModalTitle.textContent.includes('🔒') || !authModalTitle.querySelector('svg'))) {
        authModalTitle.innerHTML = '';
        authModalTitle.appendChild(createIcon('lock', { size: 20 }));
        authModalTitle.appendChild(document.createTextNode(' Connexion'));
    }
    
    const configModalTitle = document.querySelector('#configModal h3');
    if (configModalTitle && (configModalTitle.textContent.includes('⚙') || !configModalTitle.querySelector('svg'))) {
        configModalTitle.innerHTML = '';
        configModalTitle.appendChild(createIcon('settings', { size: 20 }));
        configModalTitle.appendChild(document.createTextNode(' Configuration des Congés'));
    }
    
    const teamsModalTitle = document.querySelector('#teamsModal h3');
    if (teamsModalTitle && (teamsModalTitle.textContent.includes('👥') || !teamsModalTitle.querySelector('svg'))) {
        teamsModalTitle.innerHTML = '';
        teamsModalTitle.appendChild(createIcon('users', { size: 20 }));
        teamsModalTitle.appendChild(document.createTextNode(' Gestion des Équipes'));
    }
    
    const adminModalTitle = document.querySelector('#adminModal h3');
    if (adminModalTitle && (adminModalTitle.textContent.includes('⚙') || !adminModalTitle.querySelector('svg'))) {
        adminModalTitle.innerHTML = '';
        adminModalTitle.appendChild(createIcon('shield', { size: 20 }));
        adminModalTitle.appendChild(document.createTextNode(' Administration'));
    }
    
    // Bouton nettoyer les données
    const clearDataBtn = document.getElementById('clearAuthDataBtn');
    if (clearDataBtn && (clearDataBtn.textContent.includes('⌧') || !clearDataBtn.querySelector('svg'))) {
        clearDataBtn.innerHTML = '';
        clearDataBtn.appendChild(createIcon('trash-2', { size: 14 }));
        clearDataBtn.appendChild(document.createTextNode(' Nettoyer les données'));
    }
    
    // Admin tabs
    const adminTabs = document.querySelectorAll('.admin-tab');
    adminTabs.forEach(tab => {
        const hasIcon = tab.querySelector('svg');
        if (tab.textContent.includes('👥') || (!hasIcon && tab.getAttribute('data-tab') === 'users')) {
            tab.innerHTML = '';
            tab.appendChild(createIcon('users', { size: 16 }));
            tab.appendChild(document.createTextNode(' Utilisateurs'));
        } else if (tab.textContent.includes('⚙') || (!hasIcon && (tab.getAttribute('data-tab') === 'settings' || tab.getAttribute('data-tab') === 'audit'))) {
            const isSettings = tab.getAttribute('data-tab') === 'settings';
            const isAudit = tab.getAttribute('data-tab') === 'audit';
            tab.innerHTML = '';
            if (isAudit) {
                tab.appendChild(createIcon('file-text', { size: 16 }));
                tab.appendChild(document.createTextNode(' Logs d\'audit'));
            } else {
                tab.appendChild(createIcon('settings', { size: 16 }));
                tab.appendChild(document.createTextNode(isSettings ? ' Paramètres' : ' Administration'));
            }
        }
    });
    
    // Aide - sections
    const helpSections = document.querySelectorAll('.help-section h4');
    helpSections.forEach(section => {
        if (!section.querySelector('svg')) {
            if (section.textContent.includes('📆') || section.textContent.includes('Utilisation du calendrier')) {
                section.innerHTML = '';
                section.appendChild(createIcon('calendar', { size: 18 }));
                section.appendChild(document.createTextNode(' Utilisation du calendrier'));
            } else if (section.textContent.includes('⚙') || section.textContent.includes('Configuration')) {
                section.innerHTML = '';
                section.appendChild(createIcon('settings', { size: 18 }));
                section.appendChild(document.createTextNode(' Configuration'));
            }
        }
    });
    
    // Info hint
    const helpHint = document.getElementById('helpHint');
    if (helpHint && (!helpHint.querySelector('svg') || helpHint.textContent.includes('ℹ'))) {
        const existingText = helpHint.textContent.replace('ℹ', '').trim();
        helpHint.innerHTML = '';
        const icon = createIcon('info', { size: 16, class: 'help-hint-icon' });
        helpHint.appendChild(icon);
        helpHint.appendChild(document.createTextNode(' ' + existingText));
    }
    
    console.log('[Icons] Initialisation des icônes terminée');
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

