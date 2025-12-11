/**
 * ScrollManager - Gestion de l'affichage des ascenseurs
 * 
 * Ce module gère :
 * - La détection de la taille de la fenêtre
 * - Le masquage de l'ascenseur horizontal quand la fenêtre est assez large
 * - L'application automatique de la classe no-scroll
 */

/**
 * Vérifie si l'ascenseur horizontal est nécessaire et ajuste la classe
 */
function checkScrollbarVisibility() {
    const semesterView = document.getElementById('semesterView');
    if (!semesterView) return;
    
    // Vérifier si on est en vue annuelle
    const semesterCalendar = document.getElementById('semesterCalendar');
    if (!semesterCalendar || !semesterCalendar.classList.contains('year-semester-view')) {
        return;
    }
    
    // Obtenir la largeur du conteneur et du contenu
    const containerWidth = semesterView.clientWidth;
    const contentWidth = semesterCalendar.scrollWidth;
    
    // Si le contenu tient dans le conteneur, masquer l'ascenseur
    if (contentWidth <= containerWidth) {
        semesterView.classList.add('no-scroll');
    } else {
        semesterView.classList.remove('no-scroll');
    }
}

/**
 * Initialise le gestionnaire de scroll
 * Ajoute un listener sur le redimensionnement de la fenêtre
 */
function initScrollManager() {
    // Vérifier immédiatement
    setTimeout(() => {
        this.checkScrollbarVisibility();
    }, 100);
    
    // Vérifier lors du redimensionnement de la fenêtre
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            this.checkScrollbarVisibility();
        }, 150);
    });
    
    // Vérifier aussi après le rendu du calendrier
    // Cette fonction sera appelée après chaque rendu
}

