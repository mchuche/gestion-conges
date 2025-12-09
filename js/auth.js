// Auth - Gestion de l'authentification (login, signup, logout, deleteAccount)
// Ces fonctions seront ajoutées au prototype de LeaveManager

async function initAuth() {
    if (!supabase) {
        alert('Erreur : Supabase n\'est pas initialisé. Vérifiez config.js');
        return;
    }

    // Vérifier si l'utilisateur est déjà connecté
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
        console.error('Erreur lors de la vérification de session:', error);
        // Nettoyer la session en cas d'erreur
        await this.clearInvalidSession();
        this.showAuthModal();
        this.setupAuthListeners();
        return;
    }
    
    if (session) {
        // Vérifier que la session est vraiment valide en testant une requête
        const isValid = await this.validateSession(session);
        if (isValid) {
            this.user = session.user;
            try {
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
        this.showAuthModal();
    }
    
    // Écouter les changements d'authentification
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

// Valider que la session fonctionne vraiment
async function validateSession(session) {
    if (!session || !session.user) return false;
    
    try {
        // Tester une requête simple pour vérifier que la session est valide
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

// Nettoyer une session invalide
async function clearInvalidSession() {
    try {
        // Déconnecter proprement
        await supabase.auth.signOut();
    } catch (error) {
        // Ignorer les erreurs de déconnexion
        console.warn('Erreur lors du nettoyage de session:', error);
    }
    
    // Nettoyer l'état local
    this.user = null;
    this.leaves = {};
    this.leaveTypesConfig = [];
    this.leaveQuotasByYear = {};
    this.selectedCountry = 'FR';
    
    // Nettoyer le localStorage de Supabase (optionnel, mais peut aider)
    try {
        const supabaseKeys = Object.keys(localStorage).filter(key => key.startsWith('sb-'));
        supabaseKeys.forEach(key => localStorage.removeItem(key));
    } catch (e) {
        console.warn('Impossible de nettoyer le localStorage:', e);
    }
}

function showAuthModal() {
    const authModal = document.getElementById('authModal');
    const mainContainer = document.getElementById('mainContainer');
    if (authModal) {
        authModal.style.display = 'block';
        authModal.classList.add('active');
    }
    if (mainContainer) mainContainer.style.display = 'none';
}

function showMainApp() {
    const authModal = document.getElementById('authModal');
    const mainContainer = document.getElementById('mainContainer');
    if (authModal) {
        authModal.style.display = 'none';
        authModal.classList.remove('active');
    }
    if (mainContainer) mainContainer.style.display = 'block';
    const userNameEl = document.getElementById('userName');
    if (userNameEl && this.user) {
        userNameEl.textContent = this.user.email || 'Utilisateur';
    }
    this.init();
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

    // Bouton de nettoyage des données
    const clearAuthDataBtn = document.getElementById('clearAuthDataBtn');
    if (clearAuthDataBtn && !clearAuthDataBtn.hasAttribute('data-listener-added')) {
        clearAuthDataBtn.setAttribute('data-listener-added', 'true');
        clearAuthDataBtn.addEventListener('click', async () => {
            if (confirm('Voulez-vous vraiment nettoyer toutes les données locales ? Cela vous déconnectera et supprimera les données en cache. Vous pourrez ensuite vous reconnecter normalement.')) {
                await this.clearInvalidSession();
                alert('✅ Données nettoyées ! Vous pouvez maintenant vous reconnecter.');
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
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: name
                }
            }
        });
        
        if (error) throw error;
        
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

async function deleteAccount() {
    if (!this.user || !supabase) {
        alert('Erreur : Vous devez être connecté pour supprimer votre compte.');
        return;
    }

    const confirmMessage = `⚠️ ATTENTION : Cette action est IRRÉVERSIBLE !\n\nÊtes-vous ABSOLUMENT sûr de vouloir supprimer votre compte ?\n\nCette action va :\n- Supprimer tous vos jours de congé\n- Supprimer tous vos types de congés personnalisés\n- Supprimer tous vos quotas\n- Supprimer toutes vos préférences\n- Supprimer votre compte utilisateur\n\nCette action ne peut PAS être annulée !\n\nTapez "SUPPRIMER" pour confirmer :`;
    
    const userInput = prompt(confirmMessage);
    if (userInput !== 'SUPPRIMER') {
        return;
    }

    try {
        // Supprimer toutes les données utilisateur dans Supabase
        // 1. Supprimer tous les congés
        const { error: leavesError } = await supabase
            .from('leaves')
            .delete()
            .eq('user_id', this.user.id);
        if (leavesError) throw leavesError;

        // 2. Supprimer tous les types de congés
        const { error: typesError } = await supabase
            .from('leave_types')
            .delete()
            .eq('user_id', this.user.id);
        if (typesError) throw typesError;

        // 3. Supprimer tous les quotas
        const { error: quotasError } = await supabase
            .from('leave_quotas')
            .delete()
            .eq('user_id', this.user.id);
        if (quotasError) throw quotasError;

        // 4. Supprimer les préférences
        const { error: prefsError } = await supabase
            .from('user_preferences')
            .delete()
            .eq('user_id', this.user.id);
        if (prefsError) throw prefsError;

        // 5. Déconnecter l'utilisateur
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;

        alert('✅ Votre compte et toutes vos données ont été supprimés avec succès.\n\nVous allez être redirigé vers la page de connexion.');
        
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
        alert('❌ Erreur lors de la suppression du compte. Vérifiez la console pour plus de détails.');
    }
}

async function loadUserData() {
    if (!this.user) return;
    
    try {
        await Promise.all([
            this.loadLeaves(),
            this.loadLeaveTypesConfig(),
            this.loadLeaveQuotasByYear()
        ]);
    } catch (error) {
        console.error('Erreur lors du chargement des données utilisateur:', error);
    }
}

