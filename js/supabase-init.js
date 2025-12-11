// Initialisation Supabase
// Ce fichier initialise la connexion à Supabase

let supabase;
try {
    if (typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
        supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        logger.log('Supabase initialisé');
    } else {
        logger.warn('Configuration Supabase manquante. Vérifiez config.js (sera généré par GitHub Actions lors du déploiement)');
        // Créer un objet supabase vide pour éviter les erreurs
        supabase = null;
    }
} catch (e) {
    logger.error('Erreur initialisation Supabase:', e);
    supabase = null;
}

