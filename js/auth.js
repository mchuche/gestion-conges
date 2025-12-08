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
    }
    
    if (session) {
        this.user = session.user;
        await this.loadUserData();
        this.showMainApp();
    } else {
        this.showAuthModal();
    }
    
    // Écouter les changements d'authentification
    supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
            this.user = session.user;
            await this.loadUserData();
            this.showMainApp();
        } else if (event === 'SIGNED_OUT') {
            this.user = null;
            this.leaves = {};
            this.leaveTypesConfig = [];
            this.leaveQuotasByYear = {};
            this.selectedCountry = 'FR';
            this.showAuthModal();
        }
    });

    // Event listeners pour l'authentification
    this.setupAuthListeners();
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
}

async function login(email, password) {
    const errorEl = document.getElementById('authError');
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
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
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Erreur de déconnexion:', error);
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
            this.loadLeaveQuotasByYear(),
            this.loadSelectedCountry()
        ]);
    } catch (error) {
        console.error('Erreur lors du chargement des données utilisateur:', error);
    }
}

