// Initialisation Supabase
// Ce fichier initialise la connexion à Supabase

let supabase;
try {
    if (typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
        supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        if (typeof logger !== 'undefined') {
            logger.log('Supabase initialisé');
        } else {
            console.log('[Supabase] Supabase initialisé');
        }
    } else {
        if (typeof logger !== 'undefined') {
            logger.warn('Configuration Supabase manquante. Vérifiez config.js (sera généré par GitHub Actions lors du déploiement)');
        } else {
            console.warn('[Supabase] Configuration Supabase manquante. Vérifiez config.js');
        }
        // Créer un objet supabase vide pour éviter les erreurs
        supabase = null;
    }
} catch (e) {
    if (typeof logger !== 'undefined') {
        logger.error('Erreur initialisation Supabase:', e);
    } else {
        console.error('[Supabase] Erreur initialisation Supabase:', e);
    }
    supabase = null;
}

