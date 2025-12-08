// Config - Configuration des événements et initialisation
// Ces fonctions seront ajoutées au prototype de LeaveManager

// Initialiser l'application
async function init() {
    // Rendre le calendrier
    this.renderCalendar();
    
    // Mettre à jour les statistiques
    this.updateStats();
    
    // Mettre à jour les quotas
    this.updateLeaveQuotas();
    
    // Configurer les événements
    this.setupEventListeners();
}

// Configuration des événements
function setupEventListeners() {
    // Navigation semestrielle
    document.getElementById('prevMonth').addEventListener('click', () => {
        // Passer au semestre précédent
        const currentMonth = this.currentDate.getMonth();
        if (currentMonth < 6) {
            // On est au 1er semestre, aller au 2ème semestre de l'année précédente
            this.currentYear--;
            this.currentDate.setFullYear(this.currentYear);
            this.currentDate.setMonth(6);
        } else {
            // On est au 2ème semestre, aller au 1er semestre
            this.currentDate.setMonth(0);
        }
        this.renderCalendar();
        this.updateStats();
        this.updateLeaveQuotas();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        // Passer au semestre suivant
        const currentMonth = this.currentDate.getMonth();
        if (currentMonth < 6) {
            // On est au 1er semestre, aller au 2ème semestre
            this.currentDate.setMonth(6);
        } else {
            // On est au 2ème semestre, aller au 1er semestre de l'année suivante
            this.currentYear++;
            this.currentDate.setFullYear(this.currentYear);
            this.currentDate.setMonth(0);
        }
        this.renderCalendar();
        this.updateStats();
        this.updateLeaveQuotas();
    });

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
    document.getElementById('leaveTypes').addEventListener('click', async (e) => {
        if (e.target.classList.contains('leave-btn') && this.selectedDate) {
            await this.setLeave(this.selectedDate, e.target.dataset.type);
        }
    });

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

