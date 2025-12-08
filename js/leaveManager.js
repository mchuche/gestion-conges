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
        this.configYear = this.currentYear; // Année sélectionnée dans la configuration
        this.viewMode = 'semester'; // 'semester' (vue mensuelle temporairement désactivée)
        
        // Initialiser l'authentification
        this.initAuth();
    }
}

// Ajouter toutes les méthodes au prototype de LeaveManager
// Utils
Object.assign(LeaveManager.prototype, {
    formatNumber,
    getDateKey,
    getDateKeyWithPeriod,
    getDateKeys
});

// Holidays
Object.assign(LeaveManager.prototype, {
    getPublicHolidays
});

// Database
Object.assign(LeaveManager.prototype, {
    loadLeaves,
    saveLeaves,
    loadLeaveTypesConfig,
    saveLeaveTypesConfig,
    loadLeaveQuotasByYear,
    saveLeaveQuotasByYear,
    loadSelectedCountry,
    saveSelectedCountry
});

// Auth
Object.assign(LeaveManager.prototype, {
    initAuth,
    showAuthModal,
    showMainApp,
    setupAuthListeners,
    login,
    signup,
    logout,
    deleteAccount,
    loadUserData
});

// Calendar
Object.assign(LeaveManager.prototype, {
    getLeaveForDate,
    renderCalendar,
    renderMonthView,
    renderSemesterView,
    createYearDayElement,
    createDayElement,
    getLeaveTypeLabel,
    getLeaveTypeConfig,
    toggleDateSelection,
    updateModalForSelection,
    updateDateSelectionVisual,
    openModal,
    updateLeaveButtonsHighlight,
    getLeaveColor,
    renderLeaveTypeButtons,
    closeModal,
    setLeave,
    removeLeave,
    switchView
});

// Stats
Object.assign(LeaveManager.prototype, {
    getQuotaForYear,
    hasValidQuota,
    updateStats,
    updateLeaveQuotas
});

// Modals
Object.assign(LeaveManager.prototype, {
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

// Config
Object.assign(LeaveManager.prototype, {
    init,
    setupEventListeners
});

// Initialiser l'application quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM chargé, initialisation du gestionnaire de congés...');
    try {
        const manager = new LeaveManager();
        console.log('Gestionnaire de congés initialisé avec succès', manager);
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        alert('Erreur lors du chargement de l\'application. Veuillez vérifier la console pour plus de détails.');
    }
});

