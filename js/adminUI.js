// AdminUI - Interface utilisateur pour l'administration
// Ces fonctions seront ajoutées au prototype de LeaveManager

// Vérifier et mettre à jour la visibilité du bouton admin
async function updateAdminButtonVisibility() {
    const adminBtn = document.getElementById('adminBtn');
    if (!adminBtn) return;

    const isAdmin = await this.checkIsAdmin();
    adminBtn.style.display = isAdmin ? 'inline-block' : 'none';
    
    if (isAdmin) {
        console.log('[AdminUI] Bouton admin affiché pour:', this.user?.email);
    }
}

// Ouvrir la modale d'administration
async function openAdminModal() {
    const adminModal = document.getElementById('adminModal');
    if (!adminModal) return;

    // Vérifier que l'utilisateur est admin
    const isAdmin = await this.checkIsAdmin();
    if (!isAdmin) {
        alert('Vous n\'avez pas les droits d\'administrateur');
        return;
    }

    adminModal.style.display = 'block';
    adminModal.classList.add('active');

    // Afficher l'onglet par défaut
    this.switchAdminTab('users');
}

// Fermer la modale d'administration
function closeAdminModal() {
    const adminModal = document.getElementById('adminModal');
    if (!adminModal) return;

    adminModal.style.display = 'none';
    adminModal.classList.remove('active');
}

// Changer d'onglet dans la modale admin
async function switchAdminTab(tabName) {
    // Masquer tous les onglets
    document.querySelectorAll('.admin-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Désactiver tous les boutons d'onglets
    document.querySelectorAll('.admin-tab').forEach(btn => {
        btn.classList.remove('active');
    });

    // Activer l'onglet sélectionné
    const tabContent = document.getElementById(`admin${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Tab`);
    const tabButton = document.querySelector(`.admin-tab[data-tab="${tabName}"]`);

    if (tabContent) {
        tabContent.classList.add('active');
    }
    if (tabButton) {
        tabButton.classList.add('active');
    }

    // Charger les données de l'onglet
    switch (tabName) {
        case 'users':
            await this.renderAdminUsersList();
            break;
        case 'teams':
            await this.renderAdminTeamsList();
            break;
        case 'settings':
            await this.renderAdminSettings();
            break;
        case 'logs':
            await this.renderAdminStats();
            break;
    }
}

// Rendre la liste des utilisateurs
async function renderAdminUsersList() {
    const usersList = document.getElementById('adminUsersList');
    if (!usersList) return;

    usersList.innerHTML = '<p>Chargement...</p>';

    try {
        const searchTerm = document.getElementById('adminUserSearch')?.value || '';
        const users = await this.loadAllUsers(searchTerm);

        usersList.innerHTML = '';

        if (users.length === 0) {
            usersList.innerHTML = '<p class="no-data">Aucun utilisateur trouvé</p>';
            return;
        }

        users.forEach(user => {
            const userCard = document.createElement('div');
            userCard.className = 'admin-user-card';
            userCard.innerHTML = `
                <div class="admin-user-info">
                    <div class="admin-user-email">${user.email}</div>
                    <div class="admin-user-meta">
                        <span>Inscrit le: ${new Date(user.createdAt).toLocaleDateString('fr-FR')}</span>
                        <span>• ${user.leavesCount} congés</span>
                        <span>• ${user.teamsCount} équipes</span>
                    </div>
                </div>
                <div class="admin-user-actions">
                    <button class="admin-delete-btn" data-user-id="${user.id}" title="Supprimer l'utilisateur">🗑️</button>
                </div>
            `;

            const deleteBtn = userCard.querySelector('.admin-delete-btn');
            deleteBtn.addEventListener('click', () => {
                this.handleDeleteUser(user.id, user.email);
            });

            usersList.appendChild(userCard);
        });
    } catch (error) {
        console.error('[renderAdminUsersList] Erreur:', error);
        usersList.innerHTML = '<p class="error">Erreur lors du chargement des utilisateurs</p>';
    }
}

// Gérer la suppression d'un utilisateur
async function handleDeleteUser(userId, userEmail) {
    if (!confirm(`⚠️ Êtes-vous sûr de vouloir supprimer l'utilisateur "${userEmail}" ?\n\nCette action est irréversible et supprimera toutes ses données (congés, équipes, etc.).\n\nNote: La suppression du compte dans auth.users doit être faite depuis le dashboard Supabase.`)) {
        return;
    }

    try {
        await this.deleteUser(userId);
        alert('✅ Les données de l\'utilisateur ont été supprimées.\n\nNote: Pour supprimer complètement le compte, allez dans le dashboard Supabase > Authentication > Users.');
        await this.renderAdminUsersList();
    } catch (error) {
        console.error('[handleDeleteUser] Erreur:', error);
        alert('❌ Erreur lors de la suppression: ' + (error.message || error));
    }
}

// Rendre la liste des groupes
async function renderAdminTeamsList() {
    const teamsList = document.getElementById('adminTeamsList');
    if (!teamsList) return;

    teamsList.innerHTML = '<p>Chargement...</p>';

    try {
        const teams = await this.loadAllTeams();

        teamsList.innerHTML = '';

        if (teams.length === 0) {
            teamsList.innerHTML = '<p class="no-data">Aucun groupe trouvé</p>';
            return;
        }

        teams.forEach(team => {
            const teamCard = document.createElement('div');
            teamCard.className = 'admin-team-card';
            teamCard.innerHTML = `
                <div class="admin-team-info">
                    <div class="admin-team-name">${team.name}</div>
                    <div class="admin-team-meta">
                        ${team.description ? `<span>${team.description}</span>` : ''}
                        <span>• ${team.membersCount} membre(s)</span>
                        <span>• Créé le: ${new Date(team.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                </div>
                <div class="admin-team-actions">
                    <button class="admin-delete-btn" data-team-id="${team.id}" title="Supprimer le groupe">🗑️</button>
                </div>
            `;

            const deleteBtn = teamCard.querySelector('.admin-delete-btn');
            deleteBtn.addEventListener('click', () => {
                this.handleDeleteTeamAsAdmin(team.id, team.name);
            });

            teamsList.appendChild(teamCard);
        });
    } catch (error) {
        console.error('[renderAdminTeamsList] Erreur:', error);
        teamsList.innerHTML = '<p class="error">Erreur lors du chargement des groupes</p>';
    }
}

// Gérer la suppression d'un groupe
async function handleDeleteTeamAsAdmin(teamId, teamName) {
    if (!confirm(`⚠️ Êtes-vous sûr de vouloir supprimer le groupe "${teamName}" ?\n\nCette action est irréversible.`)) {
        return;
    }

    try {
        await this.deleteTeamAsAdmin(teamId);
        alert('✅ Groupe supprimé avec succès');
        await this.renderAdminTeamsList();
    } catch (error) {
        console.error('[handleDeleteTeamAsAdmin] Erreur:', error);
        alert('❌ Erreur lors de la suppression: ' + (error.message || error));
    }
}

// Rendre les paramètres par défaut
async function renderAdminSettings() {
    const defaultLeaveTypes = document.getElementById('defaultLeaveTypes');
    const defaultQuotas = document.getElementById('defaultQuotas');
    const defaultCountry = document.getElementById('defaultCountry');

    if (!defaultLeaveTypes || !defaultQuotas || !defaultCountry) return;

    try {
        const settings = await this.loadDefaultSettings();

        if (settings.default_leave_types) {
            defaultLeaveTypes.value = JSON.stringify(settings.default_leave_types.value, null, 2);
        }

        if (settings.default_quotas) {
            defaultQuotas.value = JSON.stringify(settings.default_quotas.value, null, 2);
        }

        if (settings.default_country) {
            defaultCountry.value = settings.default_country.value;
        }
    } catch (error) {
        console.error('[renderAdminSettings] Erreur:', error);
        alert('Erreur lors du chargement des paramètres');
    }
}

// Sauvegarder les paramètres par défaut
async function handleSaveDefaultSettings() {
    const defaultLeaveTypes = document.getElementById('defaultLeaveTypes');
    const defaultQuotas = document.getElementById('defaultQuotas');
    const defaultCountry = document.getElementById('defaultCountry');

    if (!defaultLeaveTypes || !defaultQuotas || !defaultCountry) return;

    try {
        // Valider le JSON
        const leaveTypes = JSON.parse(defaultLeaveTypes.value);
        const quotas = JSON.parse(defaultQuotas.value);

        const settings = {
            default_leave_types: leaveTypes,
            default_quotas: quotas,
            default_country: defaultCountry.value
        };

        await this.saveDefaultSettings(settings);
        alert('✅ Paramètres sauvegardés avec succès');
    } catch (error) {
        console.error('[handleSaveDefaultSettings] Erreur:', error);
        if (error instanceof SyntaxError) {
            alert('❌ Erreur: JSON invalide. Vérifiez la syntaxe.');
        } else {
            alert('❌ Erreur lors de la sauvegarde: ' + (error.message || error));
        }
    }
}

// Rendre les statistiques
async function renderAdminStats() {
    const statsContainer = document.getElementById('adminStats');
    if (!statsContainer) return;

    statsContainer.innerHTML = '<p>Chargement...</p>';

    try {
        const stats = await this.loadAdminStats();

        if (!stats) {
            statsContainer.innerHTML = '<p class="error">Erreur lors du chargement des statistiques</p>';
            return;
        }

        statsContainer.innerHTML = `
            <div class="admin-stat-card">
                <div class="admin-stat-value">${stats.usersCount}</div>
                <div class="admin-stat-label">Utilisateurs</div>
            </div>
            <div class="admin-stat-card">
                <div class="admin-stat-value">${stats.teamsCount}</div>
                <div class="admin-stat-label">Groupes</div>
            </div>
            <div class="admin-stat-card">
                <div class="admin-stat-value">${stats.leavesCount}</div>
                <div class="admin-stat-label">Congés posés</div>
            </div>
            <div class="admin-stat-card">
                <div class="admin-stat-value">${stats.pendingInvitationsCount}</div>
                <div class="admin-stat-label">Invitations en attente</div>
            </div>
        `;
    } catch (error) {
        console.error('[renderAdminStats] Erreur:', error);
        statsContainer.innerHTML = '<p class="error">Erreur lors du chargement des statistiques</p>';
    }
}

// Configurer les event listeners pour l'admin
function setupAdminEventListeners() {
    // Bouton admin dans le header
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn && !adminBtn.hasAttribute('data-listener-added')) {
        adminBtn.setAttribute('data-listener-added', 'true');
        adminBtn.addEventListener('click', () => {
            this.openAdminModal();
        });
    }

    // Bouton de fermeture de la modale
    const adminClose = document.querySelector('.admin-close');
    if (adminClose && !adminClose.hasAttribute('data-listener-added')) {
        adminClose.setAttribute('data-listener-added', 'true');
        adminClose.addEventListener('click', () => {
            this.closeAdminModal();
        });
    }

    // Onglets
    document.querySelectorAll('.admin-tab').forEach(tab => {
        if (!tab.hasAttribute('data-listener-added')) {
            tab.setAttribute('data-listener-added', 'true');
            tab.addEventListener('click', () => {
                const tabName = tab.getAttribute('data-tab');
                this.switchAdminTab(tabName);
            });
        }
    });

    // Recherche d'utilisateurs
    const userSearch = document.getElementById('adminUserSearch');
    if (userSearch && !userSearch.hasAttribute('data-listener-added')) {
        userSearch.setAttribute('data-listener-added', 'true');
        let searchTimeout;
        userSearch.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.renderAdminUsersList();
            }, 300);
        });
    }

    // Bouton de sauvegarde des paramètres
    const saveSettingsBtn = document.getElementById('saveDefaultSettingsBtn');
    if (saveSettingsBtn && !saveSettingsBtn.hasAttribute('data-listener-added')) {
        saveSettingsBtn.setAttribute('data-listener-added', 'true');
        saveSettingsBtn.addEventListener('click', () => {
            this.handleSaveDefaultSettings();
        });
    }
}

