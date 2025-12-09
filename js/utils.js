// Utilitaires - Fonctions helper pour le gestionnaire de congés

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
        console.error('[Utils] Date invalide dans getDateKey:', date);
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

// Types de congés par défaut
function getDefaultLeaveTypes() {
    return [
        { id: 'congé-payé', name: 'Congé Payé', label: 'P', color: '#4a90e2' },
        { id: 'rtt', name: 'RTT', label: 'RTT', color: '#50c878' },
        { id: 'jours-hiver', name: 'Jours Hiver', label: 'JH', color: '#95a5a6' },
        { id: 'maladie', name: 'Maladie', label: 'Maladie', color: '#e74c3c' },
        { id: 'télétravail', name: 'Télétravail', label: 'T', color: '#9b59b6' },
        { id: 'formation', name: 'Formation', label: 'Form', color: '#f39c12' },
        { id: 'grève', name: 'Grève', label: 'Grève', color: '#c0392b' }
    ];
}



