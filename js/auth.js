/**
 * Auth - Gestion de l'authentification (login, signup, logout, deleteAccount)
 * 
 * Ce module gère toute l'authentification de l'application :
 * - Initialisation et vérification de session
 * - Connexion et inscription
 * - Déconnexion
 * - Suppression de compte
 * - Gestion des tokens de confirmation d'email
 * 
 * Ces fonctions seront ajoutées au prototype de LeaveManager.
 */

/**
 * Initialise le système d'authentification
 * 
 * Cette fonction :
 * 1. Vérifie que Supabase est initialisé
 * 2. Gère les tokens de confirmation d'email dans l'URL
 * 3. Vérifie si l'utilisateur est déjà connecté
 * 4. Configure les listeners pour les changements d'état d'authentification
 * 5. Configure les event listeners pour les formulaires de connexion/inscription
 */
// Protection contre les initialisations multiples
let authInitialized = false;

async function initAuth() {
    // Éviter les initialisations multiples
    if (authInitialized) {
        console.log('[Auth] initAuth déjà appelé, ignoré pour éviter les doublons');
        return;
    }
    authInitialized = true;
    
    // Vérifier que Supabase est correctement initialisé
    if (!supabase) {
        authInitialized = false; // Réinitialiser en cas d'erreur
        await swalError(
            'Erreur de configuration',
            'Supabase n\'est pas initialisé. Vérifiez que config.js est correctement configuré.'
        );
        return;
    }

    // Gérer le cas où l'utilisateur arrive avec un token de confirmation dans l'URL
    // Cela se produit quand l'utilisateur clique sur le lien dans l'email de confirmation
    // Format de l'URL: #access_token=...&refresh_token=...&type=signup
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const type = hashParams.get('type');
    
    if (accessToken && type === 'signup') {
        // L'utilisateur a cliqué sur le lien de confirmation d'email
        try {
            // Échanger le token contre une session Supabase valide
            const { data: { session }, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || ''
            });
            
            if (error) throw error;
            
            if (session) {
                // Nettoyer l'URL (retirer le hash avec les tokens)
                // Cela évite que les tokens restent visibles dans l'URL
                window.history.replaceState(null, '', window.location.pathname);
                
                // Charger les données utilisateur depuis Supabase
                this.user = session.user;
                await this.loadUserData();
                
                // Afficher un message de succès pour confirmer la confirmation
                await swalSuccess(
                    '✅ Email confirmé !',
                    'Votre compte a été activé avec succès. Vous êtes maintenant connecté.',
                    3000
                );
                
                // Afficher l'application principale
                this.showMainApp();
                return;
            }
        } catch (error) {
            console.error('Erreur lors de la confirmation de l\'email:', error);
            // Nettoyer l'URL même en cas d'erreur pour éviter les problèmes
            window.history.replaceState(null, '', window.location.pathname);
            await swalError(
                '❌ Erreur de confirmation',
                'Une erreur est survenue lors de la confirmation de votre email. Veuillez réessayer de vous connecter.'
            );
        }
    }

    // Vérifier si l'utilisateur est déjà connecté (session existante)
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
        console.error('Erreur lors de la vérification de session:', error);
        // Nettoyer la session en cas d'erreur et afficher la modale de connexion
        await this.clearInvalidSession();
        this.showAuthModal();
        this.setupAuthListeners();
        return;
    }
    
    if (session) {
        // Vérifier que la session est vraiment valide en testant une requête à la base de données
        // Parfois les sessions peuvent être expirées ou invalides
        const isValid = await this.validateSession(session);
        if (isValid) {
            this.user = session.user;
            try {
                // Charger toutes les données utilisateur (congés, types, quotas, etc.)
                await this.loadUserData();
                this.showMainApp();
            } catch (error) {
                console.error('Erreur lors du chargement des données utilisateur:', error);
                // Ne pas bloquer la connexion si le chargement échoue
                // L'utilisateur peut toujours utiliser l'app, les données seront rechargées plus tard
                this.showMainApp();
            }
        } else {
            // Session invalide, nettoyer et afficher la modale de connexion
            await this.clearInvalidSession();
            this.showAuthModal();
        }
    } else {
        // Pas de session, afficher la modale de connexion
        this.showAuthModal();
    }
    
    // Écouter les changements d'état d'authentification en temps réel
    // Cela permet de réagir automatiquement aux connexions/déconnexions
    supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
            this.user = session.user;
            try {
                await this.loadUserData();
                this.showMainApp();
            } catch (error) {
                console.error('Erreur lors du chargement des données utilisateur:', error);
                // Ne pas bloquer la connexion si le chargement échoue
                // L'utilisateur peut toujours utiliser l'app
                this.showMainApp();
            }
        } else if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
            if (event === 'SIGNED_OUT') {
                this.user = null;
                this.leaves = {};
                this.leaveTypesConfig = [];
                this.leaveQuotasByYear = {};
                this.selectedCountry = 'FR';
                this.showAuthModal();
            } else if (event === 'TOKEN_REFRESHED' && !session) {
                // Token refresh a échoué, nettoyer
                await this.clearInvalidSession();
                this.showAuthModal();
            }
        }
    });

    // Event listeners pour l'authentification
    this.setupAuthListeners();
}

/**
 * Valide qu'une session Supabase est vraiment fonctionnelle
 * 
 * Parfois, Supabase peut retourner une session qui semble valide mais qui est en fait expirée.
 * Cette fonction teste la session en effectuant une requête simple à la base de données.
 * 
 * @param {Object} session - La session Supabase à valider
 * @returns {boolean} - true si la session est valide, false sinon
 */
async function validateSession(session) {
    if (!session || !session.user) return false;
    
    try {
        // Tester une requête simple pour vérifier que la session est valide
        // On utilise maybeSingle() pour éviter une erreur si aucune donnée n'existe
        const { error } = await supabase
            .from('leaves')
            .select('id')
            .limit(1)
            .maybeSingle();
        
        // Si l'erreur est une erreur d'authentification, la session est invalide
        if (error) {
            const errorCode = error.code || '';
            const errorMessage = error.message || '';
            // Seulement considérer comme invalide si c'est vraiment une erreur d'auth
            if (errorCode === 'PGRST301' || 
                errorCode === '42501' || // Permission denied
                errorMessage.includes('JWT') || 
                errorMessage.includes('token') || 
                errorMessage.includes('session') ||
                errorMessage.includes('authentication')) {
                console.warn('Session invalide détectée:', error);
                return false;
            }
            // Pour les autres erreurs (réseau, table inexistante, etc.), 
            // considérer la session comme valide car l'erreur n'est pas liée à l'auth
            console.warn('Erreur lors de la validation de session (non bloquante):', error);
            return true;
        }
        return true;
    } catch (error) {
        // En cas d'exception, ne pas bloquer la connexion
        // La session pourrait être valide malgré l'erreur
        console.warn('Exception lors de la validation de session (non bloquante):', error);
        return true; // Donner le bénéfice du doute
    }
}

/**
 * Nettoie une session invalide ou expirée
 * 
 * Cette fonction :
 * 1. Déconnecte l'utilisateur de Supabase
 * 2. Réinitialise toutes les données locales
 * 3. Nettoie le localStorage de Supabase
 * 
 * Utilisée quand une session est détectée comme invalide ou expirée.
 */
async function clearInvalidSession() {
    try {
        // Déconnecter proprement de Supabase
        await supabase.auth.signOut();
    } catch (error) {
        // Ignorer les erreurs de déconnexion (peut échouer si pas de session)
        console.warn('Erreur lors du nettoyage de session:', error);
    }
    
    // Nettoyer l'état local de l'application
    this.user = null;
    this.leaves = {};
    this.leaveTypesConfig = [];
    this.leaveQuotasByYear = {};
    this.selectedCountry = 'FR';
    
    // Nettoyer le localStorage de Supabase (optionnel, mais peut aider)
    // Cela supprime les tokens et données de session stockées localement
    try {
        const supabaseKeys = Object.keys(localStorage).filter(key => key.startsWith('sb-'));
        supabaseKeys.forEach(key => localStorage.removeItem(key));
    } catch (e) {
        console.warn('Impossible de nettoyer le localStorage:', e);
    }
}

// Protection contre les appels multiples à showAuthModal
let authModalShown = false;

function showAuthModal() {
    const authModal = document.getElementById('authModal');
    const mainContainer = document.getElementById('mainContainer');
    
    // Éviter d'afficher la modale si elle est déjà affichée
    if (authModalShown && authModal && authModal.style.display === 'block') {
        console.log('[Auth] showAuthModal déjà appelé, ignoré pour éviter les doublons');
        return;
    }
    
    if (authModal) {
        authModal.style.display = 'block';
        authModal.classList.add('active');
        authModalShown = true;
    }
    if (mainContainer) mainContainer.style.display = 'none';
}

function showMainApp() {
    const authModal = document.getElementById('authModal');
    const mainContainer = document.getElementById('mainContainer');
    if (authModal) {
        authModal.style.display = 'none';
        authModal.classList.remove('active');
        authModalShown = false; // Réinitialiser le flag
    }
    if (mainContainer) mainContainer.style.display = 'block';
    const userNameEl = document.getElementById('userName');
    if (userNameEl && this.user) {
        userNameEl.textContent = this.user.email || 'Utilisateur';
    }
    this.init();
    
    // Mettre à jour la visibilité du sélecteur d'équipe après l'affichage de l'app
    setTimeout(() => {
        if (typeof this.updateTeamSelectorVisibility === 'function') {
            this.updateTeamSelectorVisibility();
        }
        if (typeof this.populateTeamSelector === 'function') {
            this.populateTeamSelector();
        }
    }, 200);
}

function setupAuthListeners() {
    // Connexion
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn && !loginBtn.hasAttribute('data-listener-added')) {
        loginBtn.setAttribute('data-listener-added', 'true');
        loginBtn.addEventListener('click', async () => {
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            await this.login(email, password);
        });
    }

    // Inscription
    const signupBtn = document.getElementById('signupBtn');
    if (signupBtn && !signupBtn.hasAttribute('data-listener-added')) {
        signupBtn.setAttribute('data-listener-added', 'true');
        signupBtn.addEventListener('click', async () => {
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const name = document.getElementById('signupName').value;
            await this.signup(email, password, name);
        });
    }

    // Déconnexion
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn && !logoutBtn.hasAttribute('data-listener-added')) {
        logoutBtn.setAttribute('data-listener-added', 'true');
        logoutBtn.addEventListener('click', async () => {
            console.log('Bouton de déconnexion cliqué');
            await this.logout();
        });
    } else if (!logoutBtn) {
        console.warn('Bouton logoutBtn non trouvé dans le DOM');
    }

    // Suppression de compte
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', async () => {
            await this.deleteAccount();
        });
    }

    // Basculer entre connexion et inscription
    const showSignup = document.getElementById('showSignup');
    const showLogin = document.getElementById('showLogin');
    if (showSignup) {
        showSignup.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('signupForm').style.display = 'block';
        });
    }
    if (showLogin) {
        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('signupForm').style.display = 'none';
            document.getElementById('loginForm').style.display = 'block';
        });
    }

    // Permettre la connexion avec Enter
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    if (loginEmail && loginPassword) {
        [loginEmail, loginPassword].forEach(input => {
            input.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter') {
                    await this.login(loginEmail.value, loginPassword.value);
                }
            });
        });
    }

    // Bouton de nettoyage des données (pour résoudre les problèmes de session)
    const clearAuthDataBtn = document.getElementById('clearAuthDataBtn');
    if (clearAuthDataBtn && !clearAuthDataBtn.hasAttribute('data-listener-added')) {
        clearAuthDataBtn.setAttribute('data-listener-added', 'true');
        clearAuthDataBtn.addEventListener('click', async () => {
            // Utiliser SweetAlert2 pour la confirmation
            const confirmed = await swalConfirm(
                'Nettoyer les données locales',
                'Voulez-vous vraiment nettoyer toutes les données locales ?<br><br>Cela vous déconnectera et supprimera les données en cache. Vous pourrez ensuite vous reconnecter normalement.',
                'warning'
            );
            
            if (confirmed) {
                await this.clearInvalidSession();
                await swalSuccess(
                    '✅ Données nettoyées',
                    'Les données locales ont été supprimées. Vous pouvez maintenant vous reconnecter.',
                    2000
                );
                // Recharger la page pour s'assurer que tout est propre
                window.location.reload();
            }
        });
    }

    // Bouton de bascule de thème dans la modale d'authentification
    const themeToggleAuth = document.getElementById('themeToggleAuth');
    if (themeToggleAuth && !themeToggleAuth.hasAttribute('data-listener-added')) {
        themeToggleAuth.setAttribute('data-listener-added', 'true');
        themeToggleAuth.addEventListener('click', () => {
            if (typeof this.toggleTheme === 'function') {
                this.toggleTheme();
            }
        });
    }
}

async function login(email, password) {
    const errorEl = document.getElementById('authError');
    try {
        // Afficher un indicateur de chargement
        if (errorEl) {
            errorEl.style.display = 'none';
            errorEl.textContent = '';
        }
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        // Vérifier que la connexion a réussi
        if (data && data.session) {
            // La connexion a réussi, onAuthStateChange devrait être déclenché
            // Mais on peut aussi vérifier explicitement pour être sûr
            this.user = data.user;
            try {
                await this.loadUserData();
                this.showMainApp();
            } catch (loadError) {
                console.error('Erreur lors du chargement des données utilisateur:', loadError);
                // Ne pas bloquer la connexion si le chargement échoue
                // L'utilisateur peut toujours utiliser l'app
                this.showMainApp();
            }
        }
        
        if (errorEl) {
            errorEl.style.display = 'none';
            errorEl.textContent = '';
        }
    } catch (error) {
        console.error('Erreur de connexion:', error);
        if (errorEl) {
            errorEl.textContent = error.message || 'Erreur de connexion';
            errorEl.style.display = 'block';
        }
    }
}

async function signup(email, password, name) {
    const errorEl = document.getElementById('authError');
    try {
        // Déterminer l'URL de redirection pour l'email de confirmation
        // Utiliser l'URL actuelle (production ou localhost)
        const redirectUrl = window.location.origin + window.location.pathname;
        
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: redirectUrl,
                data: {
                    name: name
                }
            }
        });
        
        if (error) throw error;
        
        // L'email sera automatiquement ajouté à user_emails via le trigger
        // Mais on peut aussi l'ajouter manuellement pour être sûr
        if (data && data.user) {
            try {
                await supabase
                    .from('user_emails')
                    .upsert({
                        user_id: data.user.id,
                        email: email.toLowerCase().trim()
                    }, {
                        onConflict: 'user_id'
                    });
            } catch (emailError) {
                // Ignorer l'erreur si l'email existe déjà (le trigger l'a peut-être déjà ajouté)
                console.warn('Erreur lors de l\'ajout de l\'email (peut être ignorée):', emailError);
            }
        }
        
        if (errorEl) {
            errorEl.textContent = 'Inscription réussie ! Vous pouvez maintenant vous connecter.';
            errorEl.style.display = 'block';
            errorEl.style.color = 'green';
            // Basculer vers le formulaire de connexion
            document.getElementById('signupForm').style.display = 'none';
            document.getElementById('loginForm').style.display = 'block';
        }
    } catch (error) {
        console.error('Erreur d\'inscription:', error);
        if (errorEl) {
            errorEl.textContent = error.message || 'Erreur d\'inscription';
            errorEl.style.display = 'block';
            errorEl.style.color = '';
        }
    }
}

async function logout() {
    try {
        // Essayer de se déconnecter (peut échouer si pas de session, c'est OK)
        const { error } = await supabase.auth.signOut();
        
        // Ignorer l'erreur si c'est juste une session manquante (déjà déconnecté)
        if (error) {
            const errorMsg = error.message || error.toString() || '';
            const isSessionMissing = errorMsg.includes('session missing') || 
                                   errorMsg.includes('Auth session missing') ||
                                   error.name === 'AuthSessionMissingError';
            
            if (!isSessionMissing) {
                console.warn('Erreur de déconnexion:', error);
            }
        }
    } catch (error) {
        // Ignorer les erreurs de session manquante
        const errorMsg = error.message || error.toString() || '';
        const isSessionMissing = errorMsg.includes('session missing') || 
                               errorMsg.includes('Auth session missing') ||
                               error.name === 'AuthSessionMissingError';
        
        if (!isSessionMissing) {
            console.warn('Erreur lors de la déconnexion:', error);
        }
    } finally {
        // Toujours nettoyer l'état local, même en cas d'erreur
        this.user = null;
        this.leaves = {};
        this.leaveTypesConfig = [];
        this.leaveQuotasByYear = {};
        this.selectedCountry = 'FR';
        this.showAuthModal();
    }
}

/**
 * Supprime définitivement le compte utilisateur et toutes ses données
 * 
 * ⚠️ ATTENTION : Cette action est IRRÉVERSIBLE !
 * 
 * Cette fonction :
 * 1. Demande une double confirmation à l'utilisateur
 * 2. Supprime toutes les données de l'utilisateur dans Supabase :
 *    - Tous les congés (table leaves)
 *    - Tous les types de congés (table leave_types)
 *    - Tous les quotas (table leave_quotas)
 *    - Toutes les préférences (table user_preferences)
 * 3. Déconnecte l'utilisateur
 * 4. Réinitialise l'état local
 * 5. Affiche la modale de connexion
 */
async function deleteAccount() {
    // Vérifier que l'utilisateur est connecté
    if (!this.user || !supabase) {
        await swalError(
            'Erreur',
            'Vous devez être connecté pour supprimer votre compte.'
        );
        return;
    }

    // Première confirmation avec SweetAlert2
    const confirmMessage = `⚠️ <strong>ATTENTION : Cette action est IRRÉVERSIBLE !</strong><br><br>Êtes-vous <strong>ABSOLUMENT sûr</strong> de vouloir supprimer votre compte ?<br><br>Cette action va :<br>• Supprimer tous vos jours de congé<br>• Supprimer tous vos types de congés personnalisés<br>• Supprimer tous vos quotas<br>• Supprimer toutes vos préférences<br>• Supprimer votre compte utilisateur<br><br><strong>Cette action ne peut PAS être annulée !</strong>`;
    
    const firstConfirm = await swalConfirmHTML(
        'Supprimer mon compte',
        confirmMessage,
        'error',
        'Oui, supprimer',
        'Annuler',
        true // Focus sur le bouton Annuler par défaut pour éviter les suppressions accidentelles
    );
    
    if (!firstConfirm) {
        return;
    }
    
    // Deuxième confirmation : demander à l'utilisateur de taper "SUPPRIMER"
    const userInput = await swalInput(
        'Confirmation finale',
        'text',
        'Tapez "SUPPRIMER" (en majuscules) pour confirmer la suppression :',
        'SUPPRIMER',
        '',
        (value) => {
            if (value !== 'SUPPRIMER') {
                return 'Vous devez taper exactement "SUPPRIMER" pour confirmer';
            }
        }
    );
    
    if (userInput !== 'SUPPRIMER') {
        return;
    }

    try {
        // Supprimer toutes les données utilisateur dans Supabase
        // L'ordre est important : d'abord les données dépendantes, puis les préférences
        
        // 1. Supprimer tous les congés (table leaves)
        const { error: leavesError } = await supabase
            .from('leaves')
            .delete()
            .eq('user_id', this.user.id);
        if (leavesError) throw leavesError;

        // 2. Supprimer tous les types de congés personnalisés (table leave_types)
        const { error: typesError } = await supabase
            .from('leave_types')
            .delete()
            .eq('user_id', this.user.id);
        if (typesError) throw typesError;

        // 3. Supprimer tous les quotas (table leave_quotas)
        const { error: quotasError } = await supabase
            .from('leave_quotas')
            .delete()
            .eq('user_id', this.user.id);
        if (quotasError) throw quotasError;

        // 4. Supprimer les préférences utilisateur (table user_preferences)
        const { error: prefsError } = await supabase
            .from('user_preferences')
            .delete()
            .eq('user_id', this.user.id);
        if (prefsError) throw prefsError;

        // 5. Déconnecter l'utilisateur de Supabase Auth
        // Note: Le compte utilisateur dans auth.users sera supprimé automatiquement
        // par les triggers CASCADE si configurés, sinon il faut le faire manuellement
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;

        await swalSuccess(
            '✅ Compte supprimé',
            'Votre compte et toutes vos données ont été supprimés avec succès.<br><br>Vous allez être redirigé vers la page de connexion.',
            3000
        );
        
        // Réinitialiser l'état local
        this.user = null;
        this.leaves = {};
        this.leaveTypesConfig = [];
        this.leaveQuotasByYear = {};
        this.selectedCountry = 'FR';
        
        // Afficher la modale de connexion
        this.showAuthModal();
    } catch (e) {
        console.error('Erreur lors de la suppression du compte:', e);
        await swalError('❌ Erreur', 'Erreur lors de la suppression du compte. Vérifiez la console pour plus de détails.');
    }
}

async function loadUserData() {
    if (!this.user) return;
    
    try {
        await Promise.all([
            this.loadLeaves(),
            this.loadLeaveTypesConfig(),
            this.loadLeaveQuotasByYear(),
            this.loadSelectedCountry()
        ]);
        // Charger les équipes de l'utilisateur
        if (typeof this.loadUserTeams === 'function') {
            await this.loadUserTeams();
        }
        
        // Mettre à jour l'interface des équipes après le chargement
        if (typeof this.updateTeamSelectorVisibility === 'function') {
            this.updateTeamSelectorVisibility();
        }
        if (typeof this.populateTeamSelector === 'function') {
            this.populateTeamSelector();
        }
        
        // Vérifier et mettre à jour le badge d'invitations (toujours, même s'il n'y en a pas)
        if (typeof this.updateInvitationsBadge === 'function') {
            await this.updateInvitationsBadge();
        }
        
        // Mettre à jour la visibilité du bouton admin
        if (typeof this.updateAdminButtonVisibility === 'function') {
            await this.updateAdminButtonVisibility();
        }
    } catch (error) {
        console.error('Erreur lors du chargement des données utilisateur:', error);
    }
}

