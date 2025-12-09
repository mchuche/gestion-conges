// Theme - Gestion du thème sombre/clair
// Ces fonctions seront ajoutées au prototype de LeaveManager

// Initialiser le thème au chargement
function initTheme() {
    // Récupérer la préférence sauvegardée ou utiliser la préférence système
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    let theme = savedTheme || (prefersDark ? 'dark' : 'light');
    
    // Appliquer le thème
    this.setTheme(theme);
    
    // Écouter les changements de préférence système
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // Seulement si l'utilisateur n'a pas défini de préférence manuelle
        if (!localStorage.getItem('theme')) {
            this.setTheme(e.matches ? 'dark' : 'light');
        }
    });
}

// Définir le thème
function setTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') {
        theme = 'light';
    }
    
    // Appliquer l'attribut data-theme sur l'élément html
    document.documentElement.setAttribute('data-theme', theme);
    
    // Sauvegarder la préférence
    localStorage.setItem('theme', theme);
    
    // Mettre à jour le bouton de bascule
    this.updateThemeToggleButton(theme);
    
    // Mettre à jour la meta theme-color pour le navigateur
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        metaThemeColor.setAttribute('content', theme === 'dark' ? '#1a1a1a' : '#4a90e2');
    }
    
    console.log(`[Theme] Thème ${theme} appliqué`);
}

// Basculer entre les thèmes
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
}

// Mettre à jour le bouton de bascule
function updateThemeToggleButton(theme) {
    // Mettre à jour les deux boutons (dans le header et dans la modale d'auth)
    const toggleButtons = [
        document.getElementById('themeToggle'),
        document.getElementById('themeToggleAuth')
    ];
    
    toggleButtons.forEach(toggleButton => {
        if (toggleButton) {
            toggleButton.textContent = theme === 'dark' ? '☀️' : '🌙';
            toggleButton.setAttribute('title', theme === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre');
            toggleButton.setAttribute('aria-label', theme === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre');
        }
    });
}

// Obtenir le thème actuel
function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
}

// Vérifier si le thème sombre est actif
function isDarkMode() {
    return this.getCurrentTheme() === 'dark';
}

