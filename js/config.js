// Config - Configuration des événements et initialisation
// Ces fonctions seront ajoutées au prototype de LeaveManager

// Initialiser l'application
async function init() {
    // Initialiser le bouton de bascule de vue
    const viewToggle = document.getElementById('viewToggle');
    if (viewToggle) {
        if (this.viewMode === 'year') {
            viewToggle.textContent = '📆';
            viewToggle.title = 'Vue semestrielle';
        } else {
            viewToggle.textContent = '📅';
            viewToggle.title = 'Vue annuelle';
        }
    }
    
    // Rendre le calendrier
    this.renderCalendar();
    
    // Mettre à jour les statistiques
    this.updateStats();
    
    // Mettre à jour les quotas
    this.updateLeaveQuotas();
    
    // Configurer les événements
    this.setupEventListeners();
    
    // S'assurer que le bouton de thème est bien initialisé
    if (typeof this.updateThemeToggleButton === 'function') {
        const currentTheme = this.getCurrentTheme ? this.getCurrentTheme() : 'light';
        this.updateThemeToggleButton(currentTheme);
    }
}

// Configuration des événements
function setupEventListeners() {
    // Navigation (semestrielle ou annuelle selon la vue)
    document.getElementById('prevMonth').addEventListener('click', () => {
        if (this.viewMode === 'year') {
            // Vue annuelle : passer à l'année précédente
            this.currentYear--;
            this.currentDate.setFullYear(this.currentYear);
            this.currentDate.setMonth(0); // Janvier pour éviter les problèmes
        } else {
            // Vue semestrielle : passer au semestre précédent
            const currentMonth = this.currentDate.getMonth();
            if (currentMonth < 6) {
                // On est au 1er semestre (janvier-juin), aller au 2ème semestre de l'année précédente
                this.currentDate.setFullYear(this.currentDate.getFullYear() - 1);
                this.currentDate.setMonth(6); // Juillet
            } else {
                // On est au 2ème semestre (juillet-décembre), aller au 1er semestre de la même année
                this.currentDate.setMonth(0); // Janvier
            }
            // Synchroniser currentYear avec currentDate
            this.currentYear = this.currentDate.getFullYear();
        }
        this.renderCalendar();
        this.updateStats();
        this.updateLeaveQuotas();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        if (this.viewMode === 'year') {
            // Vue annuelle : passer à l'année suivante
            this.currentYear++;
            this.currentDate.setFullYear(this.currentYear);
            this.currentDate.setMonth(0); // Janvier pour éviter les problèmes
        } else {
            // Vue semestrielle : passer au semestre suivant
            const currentMonth = this.currentDate.getMonth();
            console.log('[Navigation] Avant changement - Mois actuel:', currentMonth, 'Année:', this.currentDate.getFullYear());
            
            if (currentMonth < 6) {
                // On est au 1er semestre (janvier-juin), aller au 2ème semestre de la même année
                this.currentDate.setMonth(6); // Juillet
                console.log('[Navigation] Passage au 2ème semestre de', this.currentDate.getFullYear());
            } else {
                // On est au 2ème semestre (juillet-décembre), aller au 1er semestre de l'année suivante
                const nextYear = this.currentDate.getFullYear() + 1;
                this.currentDate.setFullYear(nextYear);
                this.currentDate.setMonth(0); // Janvier
                console.log('[Navigation] Passage au 1er semestre de', nextYear, '- Mois après changement:', this.currentDate.getMonth());
            }
            // Synchroniser currentYear avec currentDate
            this.currentYear = this.currentDate.getFullYear();
            console.log('[Navigation] Après changement - Mois:', this.currentDate.getMonth(), 'Année:', this.currentYear);
        }
        this.renderCalendar();
        this.updateStats();
        this.updateLeaveQuotas();
    });

    // Bouton de bascule entre vue semestrielle et annuelle
    const viewToggle = document.getElementById('viewToggle');
    if (viewToggle && !viewToggle.hasAttribute('data-listener-added')) {
        viewToggle.setAttribute('data-listener-added', 'true');
        
        // Utiliser bind pour s'assurer que 'this' est correctement lié
        const manager = this;
        viewToggle.addEventListener('click', function() {
            console.log('[ViewToggle] Bouton cliqué, vue actuelle:', manager.viewMode);
            
            // Basculer entre les vues
            if (manager.viewMode === 'semester') {
                console.log('[ViewToggle] Passage en vue annuelle');
                manager.viewMode = 'year';
                viewToggle.textContent = '📆';
                viewToggle.title = 'Vue semestrielle';
                // Activer le mode plein écran pour la vue annuelle
                if (typeof manager.enterYearViewFullscreen === 'function') {
                    manager.enterYearViewFullscreen();
                }
            } else {
                console.log('[ViewToggle] Passage en vue semestrielle');
                manager.viewMode = 'semester';
                viewToggle.textContent = '📅';
                viewToggle.title = 'Vue annuelle';
                // Désactiver le mode plein écran
                if (typeof manager.exitYearViewFullscreen === 'function') {
                    manager.exitYearViewFullscreen();
                }
            }
            // Re-rendre le calendrier avec la nouvelle vue
            console.log('[ViewToggle] Nouvelle vue:', manager.viewMode);
            manager.renderCalendar();
        });
    } else if (!viewToggle) {
        console.warn('[ViewToggle] Bouton viewToggle non trouvé dans le DOM');
    }

    // Boutons de période (matin/après-midi/journée complète)
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            this.selectedPeriod = e.target.dataset.period;
            
            // Mettre à jour la mise en évidence des boutons
            const leaveInfo = this.getLeaveForDate(this.selectedDate);
            this.updateLeaveButtonsHighlight(leaveInfo);
        });
    });

    // Boutons de type de congé (déléguation d'événement pour les boutons dynamiques)
    const leaveTypesContainer = document.getElementById('leaveTypes');
    if (leaveTypesContainer) {
        // Vérifier si l'event listener est déjà attaché pour éviter les doublons
        if (!leaveTypesContainer.hasAttribute('data-listener-added')) {
            leaveTypesContainer.setAttribute('data-listener-added', 'true');
            leaveTypesContainer.addEventListener('click', async (e) => {
                console.log('Clic détecté dans #leaveTypes, target:', e.target, 'closest:', e.target.closest('.leave-btn'));
                // Utiliser closest pour trouver le bouton même si on clique sur un élément enfant
                const leaveBtn = e.target.closest('.leave-btn');
                if (leaveBtn) {
                    const leaveType = leaveBtn.dataset.type;
                    console.log('Bouton trouvé, type:', leaveType, 'selectedDate:', this.selectedDate);
                    if (this.selectedDate) {
                        console.log('Appel de setLeave avec date:', this.selectedDate, 'type:', leaveType);
                        e.preventDefault();
                        e.stopPropagation();
                        await this.setLeave(this.selectedDate, leaveType);
                    } else {
                        console.warn('Clic sur bouton de congé mais selectedDate n\'est pas défini');
                    }
                } else {
                    console.log('Clic en dehors d\'un bouton de congé');
                }
            });
        }
    } else {
        console.error('Conteneur #leaveTypes non trouvé lors de setupEventListeners');
    }

    // Bouton supprimer
    document.getElementById('removeLeave').addEventListener('click', async () => {
        if (this.selectedDate) {
            await this.removeLeave(this.selectedDate);
        }
    });

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
            console.log('[Theme] Bouton de thème cliqué');
            if (typeof manager.toggleTheme === 'function') {
                manager.toggleTheme();
            } else {
                console.error('[Theme] toggleTheme n\'est pas une fonction', typeof manager.toggleTheme);
                console.log('[Theme] Méthodes disponibles:', Object.getOwnPropertyNames(Object.getPrototypeOf(manager)));
            }
        });
        
        // Mettre à jour l'icône du bouton avec le thème actuel
        if (typeof this.updateThemeToggleButton === 'function') {
            const currentTheme = this.getCurrentTheme ? this.getCurrentTheme() : 'light';
            this.updateThemeToggleButton(currentTheme);
        }
    } else {
        console.warn('[Theme] Bouton themeToggle non trouvé dans le DOM');
    }

    // Aide
    const helpBtn = document.getElementById('helpBtn');
    if (helpBtn) {
        helpBtn.addEventListener('click', () => {
            this.openHelpModal();
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

    // Configuration
    const configBtn = document.getElementById('configBtn');
    if (configBtn) {
        configBtn.addEventListener('click', () => {
            console.log('Bouton de configuration cliqué');
            this.openConfigModal();
        });
    } else {
        console.error('Bouton de configuration non trouvé');
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

    document.getElementById('resetLeavesBtn').addEventListener('click', async () => {
        await this.resetAllLeaves();
    });
}

