// LeaveManager - Classe principale du gestionnaire de congés
// Cette classe coordonne tous les modules

class LeaveManager {
    constructor() {
        this.currentDate = new Date();
        this.currentYear = this.currentDate.getFullYear();
        this.user = null;
        this.leaves = {};
        this.leaveTypesConfig = [];
        this.leaveQuotasByYear = {};
        this.selectedCountry = 'FR';
        this.selectedDate = null;
        this.selectedDates = []; // Pour la sélection multiple
        this.multiSelectMode = false; // Mode sélection multiple activé par long press
        this.configYear = this.currentYear; // Année sélectionnée dans la configuration
        this.viewMode = 'semester'; // Vue semestrielle uniquement
        this.ctrlKeyPressed = false; // État de la touche Ctrl/Cmd
        
        // Suivre l'état de la touche Ctrl/Cmd
        this.setupCtrlTracking();
        
        // Initialiser le thème (doit être fait avant initAuth pour l'appliquer immédiatement)
        if (typeof this.initTheme === 'function') {
            this.initTheme();
        }
        
        // Initialiser l'authentification
        this.initAuth();
    }
    
    setupCtrlTracking() {
        // Suivre l'état de Ctrl/Cmd via les événements clavier
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Control' || e.key === 'Meta') {
                this.ctrlKeyPressed = true;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.key === 'Control' || e.key === 'Meta') {
                this.ctrlKeyPressed = false;
            }
        });
        
        // Réinitialiser si la fenêtre perd le focus
        window.addEventListener('blur', () => {
            this.ctrlKeyPressed = false;
        });
    }
}

// Ajouter toutes les méthodes au prototype de LeaveManager
// Fonction helper pour assigner seulement si les fonctions existent
function safeAssign(target, source) {
    const filtered = {};
    for (const key in source) {
        if (typeof source[key] === 'function') {
            filtered[key] = source[key];
        } else {
            console.warn(`Fonction ${key} non définie, ignorée`);
        }
    }
    Object.assign(target, filtered);
}

// Utils
if (typeof formatNumber !== 'undefined') {
    safeAssign(LeaveManager.prototype, {
        formatNumber,
        getDateKey,
        getDateKeyWithPeriod,
        getDateKeys
    });
}

// Holidays
if (typeof getPublicHolidays !== 'undefined') {
    safeAssign(LeaveManager.prototype, {
        getPublicHolidays
    });
}

// Database
if (typeof loadLeaves !== 'undefined') {
    safeAssign(LeaveManager.prototype, {
        loadLeaves,
        saveLeaves,
        loadLeaveTypesConfig,
        saveLeaveTypesConfig,
        loadLeaveQuotasByYear,
        saveLeaveQuotasByYear
    });
}

// Auth
if (typeof initAuth !== 'undefined') {
    safeAssign(LeaveManager.prototype, {
        initAuth,
        showAuthModal,
        showMainApp,
        setupAuthListeners,
        login,
        signup,
        logout,
        deleteAccount,
        loadUserData,
        validateSession,
        clearInvalidSession
    });
}

// Theme
if (typeof initTheme !== 'undefined') {
    safeAssign(LeaveManager.prototype, {
        initTheme,
        setTheme,
        toggleTheme,
        updateThemeToggleButton,
        getCurrentTheme,
        isDarkMode
    });
}

// Calendar
if (typeof getLeaveForDate !== 'undefined') {
    safeAssign(LeaveManager.prototype, {
        getLeaveForDate,
        renderCalendar,
        renderSemesterView,
        renderYearView,
        enterYearViewFullscreen,
        exitYearViewFullscreen,
        createYearDayElement,
        createYearViewDayElement,
        getLeaveTypeLabel,
        getLeaveTypeConfig,
        updateDateSelectionVisual,
        openModal,
        updateLeaveButtonsHighlight,
        getLeaveColor,
        renderLeaveTypeButtons,
        closeModal,
        setLeave,
        removeLeave
    });
}

// Stats
if (typeof getQuotaForYear !== 'undefined') {
    safeAssign(LeaveManager.prototype, {
        getQuotaForYear,
        hasValidQuota,
        updateStats,
        updateLeaveQuotas
    });
}

// Modals
if (typeof openHelpModal !== 'undefined') {
    safeAssign(LeaveManager.prototype, {
        openHelpModal,
        closeHelpModal,
        openConfigModal,
        closeConfigModal,
        renderConfigModal,
        isLeaveTypeUsed,
        countLeaveTypeUsage,
        removeLeavesOfType,
        resetAllLeaves,
        addLeaveType,
        saveConfig
    });
}

// Config
if (typeof init !== 'undefined' && typeof setupEventListeners !== 'undefined') {
    LeaveManager.prototype.init = init;
    LeaveManager.prototype.setupEventListeners = setupEventListeners;
} else {
    console.error('Erreur: init ou setupEventListeners non définis. Vérifiez que js/config.js est chargé.');
    // Définir des fonctions par défaut pour éviter les erreurs
    LeaveManager.prototype.init = async function() {
        console.warn('init non disponible - js/config.js non chargé');
    };
    LeaveManager.prototype.setupEventListeners = function() {
        console.warn('setupEventListeners non disponible - js/config.js non chargé');
    };
}

// Initialiser l'application quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM chargé, initialisation du gestionnaire de congés...');
    
    // Vérifier que toutes les fonctions nécessaires sont disponibles
    if (typeof init === 'undefined' || typeof setupEventListeners === 'undefined') {
        console.error('Erreur: js/config.js n\'a pas été chargé correctement');
        console.log('Fonctions disponibles:', {
            init: typeof init,
            setupEventListeners: typeof setupEventListeners
        });
    }
    
    try {
        const manager = new LeaveManager();
        console.log('Gestionnaire de congés initialisé avec succès', manager);
        
        // Vérifier que init est bien une fonction
        if (typeof manager.init !== 'function') {
            console.error('ERREUR: manager.init n\'est pas une fonction', typeof manager.init);
            console.log('Prototype LeaveManager:', Object.getOwnPropertyNames(LeaveManager.prototype));
        }
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        alert('Erreur lors du chargement de l\'application. Veuillez vérifier la console pour plus de détails.');
    }
});

