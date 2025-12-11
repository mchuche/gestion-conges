/**
 * Config - Configuration des événements et initialisation
 * 
 * Ce module gère :
 * - L'initialisation de l'application (rendu du calendrier, statistiques, quotas)
 * - La configuration de tous les event listeners (navigation, modales, thème, etc.)
 * - La gestion des interactions utilisateur (clics, clavier, etc.)
 * 
 * Ces fonctions seront ajoutées au prototype de LeaveManager.
 */

/**
 * Initialise l'application après la connexion de l'utilisateur
 * 
 * Cette fonction :
 * 1. Initialise le bouton de bascule de vue (semestrielle/annuelle)
 * 2. Rend le calendrier avec les données de l'utilisateur
 * 3. Met à jour les statistiques et quotas
 * 4. Configure tous les event listeners nécessaires
 * 5. Met à jour la visibilité des éléments (sélecteur d'équipe, bouton admin, etc.)
 */
async function init() {
    // Masquer le bouton viewToggle (remplacé par le sélecteur)
    const viewToggle = document.getElementById('viewToggle');
    if (viewToggle) {
        viewToggle.style.display = 'none';
    }
    
    // Mettre à jour le sélecteur de format
    if (typeof this.updateYearViewFormatSelector === 'function') {
        this.updateYearViewFormatSelector();
    }
    
    // Rendre le calendrier
    this.renderCalendar();
    
    // Mettre à jour les statistiques
    this.updateStats();
    
    // Mettre à jour les quotas
    this.updateLeaveQuotas();
    
    // Mettre à jour le sélecteur d'équipe
    if (typeof this.updateTeamSelectorVisibility === 'function') {
        this.updateTeamSelectorVisibility();
    }
    if (typeof this.populateTeamSelector === 'function') {
        this.populateTeamSelector();
    }
    
    // Configurer les événements
    this.setupEventListeners();
    // Configurer les event listeners pour les équipes
    if (typeof this.setupTeamsEventListeners === 'function') {
        this.setupTeamsEventListeners();
    }
    // Configurer le mode pleine largeur
    if (typeof this.initFullWidth === 'function') {
        this.initFullWidth();
    }
    if (typeof this.setupFullWidthListeners === 'function') {
        this.setupFullWidthListeners();
    }
    // Configurer le mode header minimal
    if (typeof this.initMinimizeHeader === 'function') {
        this.initMinimizeHeader();
    }
    if (typeof this.setupMinimizeHeaderListeners === 'function') {
        this.setupMinimizeHeaderListeners();
    }
    
    // Configurer les event listeners pour les invitations
    if (typeof this.setupInvitationsEventListeners === 'function') {
        this.setupInvitationsEventListeners();
    }
    
    // Configurer les event listeners pour l'admin
    if (typeof this.setupAdminEventListeners === 'function') {
        this.setupAdminEventListeners();
    }
    
    // Mettre à jour la visibilité du bouton admin
    if (typeof this.updateAdminButtonVisibility === 'function') {
        this.updateAdminButtonVisibility();
    }
    
    // S'assurer que le bouton de thème est bien initialisé
    if (typeof this.updateThemeToggleButton === 'function') {
        const currentTheme = this.getCurrentTheme ? this.getCurrentTheme() : 'light';
        this.updateThemeToggleButton(currentTheme);
    }
}

/**
 * Configure tous les event listeners de l'application
 * 
 * Cette fonction configure les listeners pour :
 * - Navigation entre semestres/années
 * - Bascule entre vue semestrielle et annuelle
 * - Sélection de période (matin/après-midi/journée complète)
 * - Sélection de type de congé
 * - Suppression de congé
 * - Ouverture/fermeture des modales
 * - Bascule de thème (clair/sombre)
 * - Navigation au clavier (Escape pour fermer les modales)
 * - Configuration (types de congés, quotas)
 * 
 * Les listeners sont protégés contre les doublons avec des vérifications.
 */
function setupEventListeners() {
    // Vérifier que les éléments existent avant d'ajouter les listeners
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    
    if (!prevMonthBtn || !nextMonthBtn) {
        logger.error('[Config] Boutons de navigation non trouvés dans le DOM');
        return;
    }
    
    // Retirer les anciens listeners pour éviter les doublons
    const newPrevBtn = prevMonthBtn.cloneNode(true);
    const newNextBtn = nextMonthBtn.cloneNode(true);
    prevMonthBtn.parentNode.replaceChild(newPrevBtn, prevMonthBtn);
    nextMonthBtn.parentNode.replaceChild(newNextBtn, nextMonthBtn);
    
    // Navigation (semestrielle ou annuelle selon la vue)
    newPrevBtn.addEventListener('click', () => {
        // Vue annuelle : passer à l'année précédente
        const prevYear = getYear(this.currentDate) - 1;
        this.currentDate = startOfYear(setYear(this.currentDate, prevYear));
        this.currentYear = prevYear;
        this.renderCalendar();
        this.updateStats();
        this.updateLeaveQuotas();
    });

    newNextBtn.addEventListener('click', () => {
        // Vue annuelle : passer à l'année suivante
        const nextYear = getYear(this.currentDate) + 1;
        this.currentDate = startOfYear(setYear(this.currentDate, nextYear));
        this.currentYear = nextYear;
        // Forcer le rendu immédiatement après la mise à jour
        this.renderCalendar();
        this.updateStats();
        this.updateLeaveQuotas();
    });

    // Le bouton viewToggle est maintenant remplacé par le sélecteur de vues
    // Plus besoin de gérer le clic sur viewToggle

    // Créer et gérer le sélecteur de vues (remplace le bouton viewToggle)
    this.setupYearViewFormatSelector();

    // Boutons de période (matin/après-midi/journée complète)
    // Utiliser la délégation d'événements pour s'assurer que ça fonctionne même si les boutons sont recréés
    const periodButtonsContainer = document.querySelector('.period-buttons');
    if (periodButtonsContainer) {
        if (!periodButtonsContainer.hasAttribute('data-listener-added')) {
            periodButtonsContainer.setAttribute('data-listener-added', 'true');
            periodButtonsContainer.addEventListener('click', (e) => {
                const periodBtn = e.target.closest('.period-btn');
                if (periodBtn) {
                    e.preventDefault();
                    e.stopPropagation();
                    document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                    periodBtn.classList.add('active');
                    this.selectedPeriod = periodBtn.dataset.period;
                    
                    // Mettre à jour la mise en évidence des boutons
                    if (this.selectedDate) {
                        const leaveInfo = this.getLeaveForDate(this.selectedDate);
                        this.updateLeaveButtonsHighlight(leaveInfo);
                    }
                }
            });
        }
    } else {
        logger.warn('[Config] Conteneur .period-buttons non trouvé lors de setupEventListeners');
    }

    // Boutons de type de congé (déléguation d'événement pour les boutons dynamiques)
    const leaveTypesContainer = document.getElementById('leaveTypes');
    if (leaveTypesContainer) {
        // Vérifier si l'event listener est déjà attaché pour éviter les doublons
        if (!leaveTypesContainer.hasAttribute('data-listener-added')) {
            leaveTypesContainer.setAttribute('data-listener-added', 'true');
            leaveTypesContainer.addEventListener('click', async (e) => {
                logger.debug('Clic détecté dans #leaveTypes, target:', e.target, 'closest:', e.target.closest('.leave-btn'));
                // Utiliser closest pour trouver le bouton même si on clique sur un élément enfant
                const leaveBtn = e.target.closest('.leave-btn');
                if (leaveBtn) {
                    const leaveType = leaveBtn.dataset.type;
                    logger.debug('Bouton trouvé, type:', leaveType, 'selectedDate:', this.selectedDate);
                    if (this.selectedDate) {
                        logger.debug('Appel de setLeave avec date:', this.selectedDate, 'type:', leaveType);
                        e.preventDefault();
                        e.stopPropagation();
                        await this.setLeave(this.selectedDate, leaveType);
                    } else {
                        logger.warn('Clic sur bouton de congé mais selectedDate n\'est pas défini');
                    }
                } else {
                    logger.debug('Clic en dehors d\'un bouton de congé');
                }
            });
        }
    } else {
        logger.error('Conteneur #leaveTypes non trouvé lors de setupEventListeners');
    }

    // Bouton supprimer
    const removeLeaveBtn = document.getElementById('removeLeave');
    if (removeLeaveBtn) {
        if (!removeLeaveBtn.hasAttribute('data-listener-added')) {
            removeLeaveBtn.setAttribute('data-listener-added', 'true');
            removeLeaveBtn.addEventListener('click', async () => {
                if (this.selectedDate) {
                    await this.removeLeave(this.selectedDate);
                }
            });
        }
    } else {
        logger.warn('[Config] Bouton removeLeave non trouvé lors de setupEventListeners');
    }

    // Bouton "Appliquer aux jours sélectionnés"
    const openSelectionBtn = document.getElementById('openSelectionBtn');
    if (openSelectionBtn) {
        if (!openSelectionBtn.hasAttribute('data-listener-added')) {
            openSelectionBtn.setAttribute('data-listener-added', 'true');
            openSelectionBtn.addEventListener('click', async () => {
                if (this.selectedDates.length > 1 && this.selectedDate) {
                    const leaveInfo = this.getLeaveForDate(this.selectedDate);
                    const currentType = leaveInfo[this.selectedPeriod || 'full'];
                    
                    if (currentType) {
                        // Appliquer le congé à tous les jours sélectionnés
                        for (const date of this.selectedDates) {
                            await this.setLeave(date, currentType);
                        }
                        // Fermer la modale après application
                        this.closeModal();
                    } else {
                        await swalError('Aucun type sélectionné', 'Veuillez d\'abord sélectionner un type de congé.');
                    }
                }
            });
        }
    }

    // Fermer la modal principale (pas celle de config)
    const modalCloseBtn = document.querySelector('#modal .close');
    if (modalCloseBtn) {
        // Retirer les anciens listeners pour éviter les doublons
        const newCloseBtn = modalCloseBtn.cloneNode(true);
        modalCloseBtn.parentNode.replaceChild(newCloseBtn, modalCloseBtn);
        newCloseBtn.addEventListener('click', () => {
            this.closeModal();
        });
    }

    // Fermer la modal en cliquant en dehors
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('modal');
        if (event.target === modal) {
            this.closeModal();
        }
        const configModal = document.getElementById('configModal');
        if (event.target === configModal) {
            this.closeConfigModal();
        }
        const helpModal = document.getElementById('helpModal');
        if (event.target === helpModal) {
            this.closeHelpModal();
        }
    });

    // Navigation au clavier
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            this.closeModal();
            this.closeConfigModal();
            this.closeHelpModal();
        }
    });

    // Bouton de bascule de thème
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        // Retirer les anciens listeners pour éviter les doublons
        const newThemeToggle = themeToggle.cloneNode(true);
        themeToggle.parentNode.replaceChild(newThemeToggle, themeToggle);
        
        // Utiliser bind pour s'assurer que 'this' est correctement lié
        const manager = this;
        newThemeToggle.addEventListener('click', function() {
            logger.debug('[Theme] Bouton de thème cliqué');
            if (typeof manager.toggleTheme === 'function') {
                manager.toggleTheme();
            } else {
                logger.error('[Theme] toggleTheme n\'est pas une fonction', typeof manager.toggleTheme);
                logger.debug('[Theme] Méthodes disponibles:', Object.getOwnPropertyNames(Object.getPrototypeOf(manager)));
            }
        });
        
        // Mettre à jour l'icône du bouton avec le thème actuel
        if (typeof this.updateThemeToggleButton === 'function') {
            const currentTheme = this.getCurrentTheme ? this.getCurrentTheme() : 'light';
            this.updateThemeToggleButton(currentTheme);
        }
    } else {
        logger.warn('[Theme] Bouton themeToggle non trouvé dans le DOM');
    }

    // Menu déroulant
    const menuBtn = document.getElementById('menuBtn');
    const menuDropdown = document.getElementById('menuDropdown');
    
    if (menuBtn && menuDropdown) {
        // Toggle du menu au clic sur le bouton
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menuDropdown.classList.toggle('show');
        });
        
        // Fermer le menu si on clique ailleurs
        document.addEventListener('click', (e) => {
            if (!menuBtn.contains(e.target) && !menuDropdown.contains(e.target)) {
                menuDropdown.classList.remove('show');
            }
        });
        
        // Gérer les actions du menu
        const menuItems = menuDropdown.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = item.getAttribute('data-action');
                menuDropdown.classList.remove('show');
                
                switch(action) {
                    case 'config':
                        logger.debug('Menu: Configuration sélectionnée');
                        this.openConfigModal();
                        break;
                    case 'teams':
                        logger.debug('Menu: Gérer les équipes sélectionnée');
                        if (typeof this.openTeamsModal === 'function') {
                            this.openTeamsModal();
                        }
                        break;
                    case 'help':
                        logger.debug('Menu: Aide sélectionnée');
                        this.openHelpModal();
                        break;
                    case 'admin':
                        logger.debug('Menu: Administration sélectionnée');
                        if (typeof this.openAdminModal === 'function') {
                            this.openAdminModal();
                        }
                        break;
                }
            });
        });
    }

    const closeHelpBtn = document.getElementById('closeHelpBtn');
    if (closeHelpBtn) {
        closeHelpBtn.addEventListener('click', () => {
            this.closeHelpModal();
        });
    }

    const helpClose = document.querySelector('.help-close');
    if (helpClose) {
        helpClose.addEventListener('click', () => {
            this.closeHelpModal();
        });
    }

    document.querySelector('.config-close').addEventListener('click', () => {
        this.closeConfigModal();
    });

    document.getElementById('saveConfigBtn').addEventListener('click', async () => {
        await this.saveConfig();
    });

    document.getElementById('cancelConfigBtn').addEventListener('click', () => {
        this.closeConfigModal();
    });

    document.getElementById('addLeaveTypeBtn').addEventListener('click', () => {
        this.addLeaveType();
    });

    // Bouton de réinitialisation des congés (débogage)
    // Note: Ce bouton est masqué en production mais l'event listener est conservé
    // pour éviter les erreurs si le bouton est réactivé
    const resetLeavesBtn = document.getElementById('resetLeavesBtn');
    if (resetLeavesBtn) {
        resetLeavesBtn.addEventListener('click', async () => {
            await this.resetAllLeaves();
        });
    }
}

/**
 * Configure le sélecteur de format de vue annuelle (Semestrielle / Présence)
 */
function setupYearViewFormatSelector() {
    // Vérifier si le sélecteur existe déjà
    let formatSelect = document.getElementById('yearViewFormatSelect');
    
    if (!formatSelect) {
        // Créer le sélecteur
        formatSelect = document.createElement('select');
        formatSelect.id = 'yearViewFormatSelect';
        formatSelect.className = 'year-view-format-select';
        formatSelect.innerHTML = `
            <option value="semester">Vue Annuelle</option>
            <option value="presence">Matrice de Présence</option>
            <option value="presence-vertical">Matrice de Présence (Verticale)</option>
        `;
        
        // Ajouter l'événement de changement
        const manager = this;
        formatSelect.addEventListener('change', function(e) {
            const selectedValue = e.target.value;
            // Toujours en vue annuelle, seul le format change
            manager.viewMode = 'year';
            manager.yearViewFormat = selectedValue;
            manager.renderCalendar();
        });
        
        // Insérer le sélecteur dans header-controls (après les boutons de navigation)
        const headerControls = document.querySelector('.header-controls');
        if (headerControls) {
            const nextMonthBtn = document.getElementById('nextMonth');
            if (nextMonthBtn && nextMonthBtn.nextSibling) {
                headerControls.insertBefore(formatSelect, nextMonthBtn.nextSibling);
            } else {
                headerControls.appendChild(formatSelect);
            }
        }
    }
    
    // Mettre à jour la visibilité et la valeur
    this.updateYearViewFormatSelector();
}

/**
 * Met à jour la visibilité et la valeur du sélecteur de format de vue annuelle
 */
function updateYearViewFormatSelector() {
    const formatSelect = document.getElementById('yearViewFormatSelect');
    if (!formatSelect) return;
    
    // Toujours afficher le sélecteur (toujours en vue annuelle maintenant)
    formatSelect.style.display = 'inline-block';
    
    // Mettre à jour la valeur
    formatSelect.value = this.yearViewFormat || 'semester';
}

