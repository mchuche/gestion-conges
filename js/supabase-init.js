// Initialisation Supabase
// Ce fichier initialise la connexion à Supabase

let supabase;
try {
    if (typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
        supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        console.log('Supabase initialisé');
    } else {
        console.error('Configuration Supabase manquante. Vérifiez config.js');
    }
} catch (e) {
    console.error('Erreur initialisation Supabase:', e);
}

