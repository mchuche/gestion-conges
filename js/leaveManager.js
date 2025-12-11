// LeaveManager - Classe principale du gestionnaire de congés
// Cette classe coordonne tous les modules

class LeaveManager {
    constructor() {
        this.currentDate = today();
        this.currentYear = getYear(this.currentDate);
        this.user = null;
        this.leaves = {};
        this.leaveTypesConfig = [];
        this.leaveQuotasByYear = {};
        this.selectedCountry = 'FR';
        this.selectedDate = null;
        this.selectedDates = []; // Pour la sélection multiple
        this.multiSelectMode = false; // Mode sélection multiple activé par long press
        this.configYear = this.currentYear; // Année sélectionnée dans la configuration
        this.viewMode = 'year'; // Vue annuelle par défaut
        this.yearViewFormat = 'semester'; // Format de la vue annuelle : 'semester' (vue semestrielle) ou 'presence' (matrice de présence)
        this.ctrlKeyPressed = false; // État de la touche Ctrl/Cmd
        this.userTeams = []; // Liste des équipes de l'utilisateur
        this.currentTeamId = null; // ID de l'équipe actuellement sélectionnée
        this.presenceUsers = []; // Utilisateurs pour la vue présence
        
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
        getDateKeys,
        calculateWorkingDays,
        calculateWorkingDaysFromDates
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
        saveLeaveQuotasByYear,
        loadSelectedCountry,
        saveSelectedCountry
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
        renderYearView,
        renderYearViewPresence,
        renderYearViewPresenceVertical,
        renderYearViewSemester,
        createPresenceDayCell,
        createYearDayElement,
        createYearViewDayElement,
        getLeaveTypeLabel,
        getLeaveTypeConfig,
        updateDateSelectionVisual,
        updateWorkingDaysInfo,
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

// Teams
if (typeof loadUserTeams !== 'undefined') {
    safeAssign(LeaveManager.prototype, {
        loadUserTeams,
        createTeam,
        loadTeamMembers,
        inviteUserToTeam,
        addMemberToTeam,
        removeMemberFromTeam,
        loadTeamLeaves,
        loadTeamLeaveTypes,
        deleteTeam,
        loadTeamInvitations,
        loadUserPendingInvitations,
        acceptTeamInvitation,
        declineTeamInvitation,
        deleteTeamInvitation
    });
}

// TeamsUI
if (typeof updateTeamSelectorVisibility !== 'undefined') {
    safeAssign(LeaveManager.prototype, {
        updateTeamSelectorVisibility,
        populateTeamSelector,
        openTeamsModal,
        closeTeamsModal,
        renderTeamsList,
        showTeamDetails,
        showCreateTeamForm,
        handleCreateTeam,
        showAddMemberDialog,
        handleRemoveMember,
        handleDeleteTeam,
        handleTeamSelectChange,
        setupTeamsEventListeners,
        handleDeleteInvitation
    });
}

// InvitationsUI
if (typeof updateInvitationsBadge !== 'undefined') {
    safeAssign(LeaveManager.prototype, {
        updateInvitationsBadge,
        openInvitationsModal,
        closeInvitationsModal,
        renderInvitationsList,
        handleAcceptInvitation,
        handleDeclineInvitation,
        setupInvitationsEventListeners
    });
}

// Admin
if (typeof checkIsAdmin !== 'undefined') {
    safeAssign(LeaveManager.prototype, {
        checkIsAdmin,
        checkIsSuperAdmin,
        loadAllUsers,
        deleteUser,
        loadAllTeams,
        deleteTeamAsAdmin,
        loadDefaultSettings,
        saveDefaultSettings,
        loadAdminStats,
        logAuditEvent,
        loadAuditLogs
    });
}

// AdminUI
if (typeof updateAdminButtonVisibility !== 'undefined') {
    safeAssign(LeaveManager.prototype, {
        updateAdminButtonVisibility,
        openAdminModal,
        closeAdminModal,
        switchAdminTab,
        renderAdminUsersList,
        handleDeleteUser,
        renderAdminTeamsList,
        handleDeleteTeamAsAdmin,
        renderAdminSettings,
        handleSaveDefaultSettings,
        renderAdminStats,
        renderAuditLogs,
        setupAdminEventListeners
    });
}

// Config
if (typeof init !== 'undefined' && typeof setupEventListeners !== 'undefined') {
    LeaveManager.prototype.init = init;
    LeaveManager.prototype.setupEventListeners = setupEventListeners;
    
    // Ajouter les fonctions de sélecteur de format si elles existent
    if (typeof setupYearViewFormatSelector !== 'undefined') {
        LeaveManager.prototype.setupYearViewFormatSelector = setupYearViewFormatSelector;
    }
    if (typeof updateYearViewFormatSelector !== 'undefined') {
        LeaveManager.prototype.updateYearViewFormatSelector = updateYearViewFormatSelector;
    }
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

// FullWidth
if (typeof initFullWidth !== 'undefined') {
    safeAssign(LeaveManager.prototype, {
        initFullWidth,
        setFullWidth,
        toggleFullWidth,
        setupFullWidthListeners
    });
}

// ScrollManager
if (typeof initScrollManager !== 'undefined') {
    safeAssign(LeaveManager.prototype, {
        initScrollManager,
        checkScrollbarVisibility
    });
}

// MinimizeHeader
if (typeof initMinimizeHeader !== 'undefined') {
    safeAssign(LeaveManager.prototype, {
        initMinimizeHeader,
        setMinimizeHeader,
        toggleMinimizeHeader,
        setupMinimizeHeaderListeners
    });
}

// Protection contre les initialisations multiples
let managerInitialized = false;

// Initialiser l'application quand le DOM est chargé
document.addEventListener('DOMContentLoaded', async () => {
    // Éviter les initialisations multiples (peut arriver avec certains navigateurs ou extensions)
    if (managerInitialized) {
        logger.warn('[LeaveManager] Initialisation déjà effectuée, ignorée pour éviter les doublons');
        return;
    }
    managerInitialized = true;
    
    logger.debug('[LeaveManager] DOM chargé, initialisation du gestionnaire de congés...');
    
    // Vérifier que toutes les fonctions nécessaires sont disponibles
    if (typeof init === 'undefined' || typeof setupEventListeners === 'undefined') {
        logger.error('[LeaveManager] Erreur: js/config.js n\'a pas été chargé correctement');
        logger.debug('[LeaveManager] Fonctions disponibles:', {
            init: typeof init,
            setupEventListeners: typeof setupEventListeners
        });
        managerInitialized = false; // Réinitialiser en cas d'erreur
        return;
    }
    
    try {
        const manager = new LeaveManager();
        logger.debug('[LeaveManager] Gestionnaire de congés initialisé avec succès', manager);
        
        // Vérifier que init est bien une fonction
        if (typeof manager.init !== 'function') {
            logger.error('[LeaveManager] ERREUR: manager.init n\'est pas une fonction', typeof manager.init);
            logger.debug('[LeaveManager] Prototype LeaveManager:', Object.getOwnPropertyNames(LeaveManager.prototype));
        }
    } catch (error) {
        logger.error('[LeaveManager] Erreur lors de l\'initialisation:', error);
        // Utiliser SweetAlert2 pour afficher l'erreur d'initialisation
        // Vérifier que swalError est disponible avant de l'utiliser
        if (typeof swalError === 'function') {
            await swalError(
                'Erreur d\'initialisation',
                'Erreur lors du chargement de l\'application. Veuillez vérifier la console pour plus de détails.'
            );
        } else {
            // Fallback si SweetAlert2 n'est pas disponible
            alert('Erreur lors du chargement de l\'application. Veuillez vérifier la console pour plus de détails.');
        }
    }
});

