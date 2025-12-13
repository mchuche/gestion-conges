/**
 * Utilitaires - Fonctions helper pour le gestionnaire de congés
 * 
 * Ce module contient :
 * - Fonctions de formatage (nombres, dates)
 * - Système de logging conditionnel pour la production
 * - Types de congés par défaut
 */

/**
 * Système de logging conditionnel
 * 
 * En production, les console.log sont désactivés pour améliorer les performances.
 * Les erreurs sont toujours affichées car elles sont importantes pour le débogage.
 * 
 * Pour activer les logs en développement, définir DEBUG = true dans config.js
 * ou dans la console : window.DEBUG = true
 */
const DEBUG = (typeof window !== 'undefined' && window.DEBUG) || false;

const logger = {
    /**
     * Log d'information (désactivé en production)
     * @param {...any} args - Arguments à logger
     */
    log: (...args) => {
        if (DEBUG) {
            console.log(...args);
        }
    },
    
    /**
     * Log d'erreur (toujours affiché)
     * @param {...any} args - Arguments à logger
     */
    error: (...args) => {
        console.error(...args);
    },
    
    /**
     * Log d'avertissement (désactivé en production)
     * @param {...any} args - Arguments à logger
     */
    warn: (...args) => {
        if (DEBUG) {
            console.warn(...args);
        }
    },
    
    /**
     * Log de debug avec préfixe (désactivé en production)
     * @param {string} prefix - Préfixe du log (ex: '[Module]')
     * @param {...any} args - Arguments à logger
     */
    debug: (prefix, ...args) => {
        if (DEBUG) {
            console.log(prefix, ...args);
        }
    },
    
    /**
     * Log de groupe (désactivé en production)
     * @param {string} label - Label du groupe
     */
    group: (label) => {
        if (DEBUG) {
            console.group(label);
        }
    },
    
    /**
     * Fermer un groupe de logs (désactivé en production)
     */
    groupEnd: () => {
        if (DEBUG) {
            console.groupEnd();
        }
    }
};

// Formater un nombre (afficher les décimales seulement si nécessaire)
function formatNumber(num) {
    if (num % 1 === 0) {
        return num.toString();
    }
    return num.toFixed(1);
}

// Obtenir la clé de date au format YYYY-MM-DD
function getDateKey(date) {
    // Vérifier que la date est valide
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        logger.error('[Utils] Date invalide dans getDateKey:', date);
        throw new Error('Invalid date');
    }
    // Utiliser formatDateKey si disponible, sinon fallback sur toISOString
    if (typeof formatDateKey !== 'undefined') {
        return formatDateKey(date);
    }
    return date.toISOString().split('T')[0];
}

// Obtenir la clé de date avec période (pour demi-journées)
function getDateKeyWithPeriod(date, period) {
    const baseKey = getDateKey(date);
    if (period === 'full') {
        return baseKey;
    }
    return `${baseKey}-${period}`;
}

// Obtenir toutes les clés possibles pour une date (journée complète, matin, après-midi)
function getDateKeys(date) {
    const baseKey = getDateKey(date);
    return {
        full: baseKey,
        morning: `${baseKey}-morning`,
        afternoon: `${baseKey}-afternoon`
    };
}

/**
 * Calcule le nombre de jours ouvrés entre deux dates
 * 
 * Les jours ouvrés excluent :
 * - Les weekends (samedi et dimanche)
 * - Les jours fériés du pays sélectionné
 * 
 * @param {Date} startDate - Date de début (incluse)
 * @param {Date} endDate - Date de fin (incluse)
 * @param {string} country - Code pays pour les jours fériés (ex: 'FR', 'BE')
 * @param {Object} holidays - Objet contenant les jours fériés (optionnel, sera calculé si non fourni)
 * @returns {number} - Nombre de jours ouvrés
 */
function calculateWorkingDays(startDate, endDate, country = 'FR', holidays = null) {
    if (!startDate || !endDate || !(startDate instanceof Date) || !(endDate instanceof Date)) {
        logger.error('[calculateWorkingDays] Dates invalides:', startDate, endDate);
        return 0;
    }
    
    // S'assurer que startDate est avant endDate
    if (startDate > endDate) {
        const temp = startDate;
        startDate = endDate;
        endDate = temp;
    }
    
    // Obtenir les jours fériés si non fournis
    if (!holidays) {
        const year = startDate.getFullYear();
        // Vérifier si on a besoin des jours fériés de plusieurs années
        const endYear = endDate.getFullYear();
        
        holidays = {};
        for (let y = year; y <= endYear; y++) {
            if (typeof getPublicHolidays === 'function') {
                const yearHolidays = getPublicHolidays(country, y);
                Object.assign(holidays, yearHolidays);
            }
        }
    }
    
    let workingDays = 0;
    const currentDate = new Date(startDate);
    
    // Parcourir chaque jour entre startDate et endDate (inclus)
    while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay(); // 0 = dimanche, 6 = samedi
        const dateKey = getDateKey(currentDate);
        
        // Vérifier si c'est un jour ouvré (pas un weekend et pas un jour férié)
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Pas dimanche (0) ni samedi (6)
            if (!holidays[dateKey]) { // Pas un jour férié
                workingDays++;
            }
        }
        
        // Passer au jour suivant
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return workingDays;
}

/**
 * Calcule le nombre de jours ouvrés dans une liste de dates
 * 
 * @param {Array<Date>} dates - Liste de dates
 * @param {string} country - Code pays pour les jours fériés
 * @returns {number} - Nombre de jours ouvrés
 */
function calculateWorkingDaysFromDates(dates, country = 'FR') {
    if (!dates || dates.length === 0) {
        return 0;
    }
    
    // Obtenir les jours fériés pour toutes les années concernées
    const years = new Set(dates.map(d => d.getFullYear()));
    const holidays = {};
    
    years.forEach(year => {
        if (typeof getPublicHolidays === 'function') {
            const yearHolidays = getPublicHolidays(country, year);
            Object.assign(holidays, yearHolidays);
        }
    });
    
    let workingDays = 0;
    
    dates.forEach(date => {
        const dayOfWeek = date.getDay(); // 0 = dimanche, 6 = samedi
        const dateKey = getDateKey(date);
        
        // Vérifier si c'est un jour ouvré
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Pas weekend
            if (!holidays[dateKey]) { // Pas un jour férié
                workingDays++;
            }
        }
    });
    
    return workingDays;
}

// Types de congés par défaut
function getDefaultLeaveTypes() {
    return [
        { id: 'congé-payé', name: 'Congé Payé', label: 'P', color: '#4a90e2', category: 'leave' },
        { id: 'rtt', name: 'RTT', label: 'RTT', color: '#50c878', category: 'leave' },
        { id: 'jours-hiver', name: 'Jours Hiver', label: 'JH', color: '#95a5a6', category: 'leave' },
        { id: 'maladie', name: 'Maladie', label: 'Maladie', color: '#e74c3c', category: 'event' },
        { id: 'télétravail', name: 'Télétravail', label: 'T', color: '#9b59b6', category: 'event' },
        { id: 'formation', name: 'Formation', label: 'Form', color: '#f39c12', category: 'event' },
        { id: 'grève', name: 'Grève', label: 'Grève', color: '#c0392b', category: 'event' }
    ];
}



