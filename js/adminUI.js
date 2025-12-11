/**
 * AdminUI - Interface utilisateur pour l'administration
 * 
 * Ce module gère toute l'interface utilisateur de la page d'administration :
 * - Affichage/masquage du bouton admin selon les droits
 * - Gestion de la modale d'administration avec ses onglets
 * - Affichage et gestion des utilisateurs (liste, suppression)
 * - Affichage et gestion des équipes (liste, suppression)
 * - Configuration des paramètres par défaut (types de congés, quotas, pays)
 * - Affichage des statistiques globales
 * - Affichage des logs d'audit
 * 
 * Ces fonctions seront ajoutées au prototype de LeaveManager.
 */

/**
 * Vérifie si l'utilisateur est administrateur et met à jour la visibilité du bouton admin
 * 
 * Le bouton admin n'est affiché que si l'utilisateur a les droits d'administrateur.
 * Cette fonction est appelée lors du chargement des données utilisateur.
 */
async function updateAdminButtonVisibility() {
    const adminBtn = document.getElementById('adminBtn');
    if (!adminBtn) return;

    const isAdmin = await this.checkIsAdmin();
    adminBtn.style.display = isAdmin ? 'inline-block' : 'none';
    
    if (isAdmin) {
        logger.debug('[AdminUI] Bouton admin affiché pour:', this.user?.email);
    }
}

/**
 * Ouvre la modale d'administration
 * 
 * Cette fonction :
 * 1. Vérifie que la modale existe dans le DOM
 * 2. Vérifie que l'utilisateur a les droits d'administrateur
 * 3. Affiche la modale
 * 4. Charge et affiche l'onglet par défaut (utilisateurs)
 */
async function openAdminModal() {
    logger.debug('[AdminUI] openAdminModal appelée');
    const adminModal = document.getElementById('adminModal');
    if (!adminModal) {
        logger.error('[AdminUI] Modale adminModal introuvable dans le DOM');
        await swalError(
            'Erreur',
            'La modale d\'administration est introuvable dans le DOM.'
        );
        return;
    }

    logger.debug('[AdminUI] Modale trouvée, vérification des droits admin...');
    // Vérifier que l'utilisateur est admin avant d'afficher la modale
    const isAdmin = await this.checkIsAdmin();
    logger.debug('[AdminUI] isAdmin:', isAdmin);
    if (!isAdmin) {
        await swalError(
            'Accès refusé',
            'Vous n\'avez pas les droits d\'administrateur pour accéder à cette page.'
        );
        return;
    }

    logger.debug('[AdminUI] Affichage de la modale...');
    adminModal.style.display = 'block';
    adminModal.classList.add('active');
    logger.debug('[AdminUI] Modale affichée, display:', adminModal.style.display, 'classList:', adminModal.classList.toString());

    // Afficher l'onglet par défaut
    await this.switchAdminTab('users');
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
        case 'stats':
            await this.renderAdminStats();
            break;
        case 'audit':
            await this.renderAuditLogs();
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
                    <button class="admin-delete-btn" data-user-id="${user.id}" title="Supprimer l'utilisateur">⌧</button>
                </div>
            `;

            const deleteBtn = userCard.querySelector('.admin-delete-btn');
            deleteBtn.addEventListener('click', () => {
                this.handleDeleteUser(user.id, user.email);
            });

            usersList.appendChild(userCard);
        });
    } catch (error) {
        logger.error('[renderAdminUsersList] Erreur:', error);
        usersList.innerHTML = '<p class="error">Erreur lors du chargement des utilisateurs</p>';
    }
}

// Gérer la suppression d'un utilisateur
async function handleDeleteUser(userId, userEmail) {
    const confirmed = await swalConfirmHTML(
        '⚠️ Supprimer l\'utilisateur ?',
        `Êtes-vous sûr de vouloir supprimer <strong>${userEmail}</strong> ?<br><br>
         Cette action est <strong style="color: var(--danger-color);">irréversible</strong> et supprimera toutes ses données (congés, équipes, etc.).<br><br>
         <small>Note: La suppression du compte dans auth.users doit être faite depuis le dashboard Supabase.</small>`,
        'Oui, supprimer',
        'Annuler'
    );
    
    if (!confirmed) {
        return;
    }

    try {
        await this.deleteUser(userId);
        
        // Enregistrer le log d'audit
        await this.logAuditEvent('user_deleted', 'user', userId, {
            email: userEmail,
            deleted_by: this.user?.email
        });
        
        await swalSuccess(
            '✅ Suppression réussie',
            'Les données de l\'utilisateur ont été supprimées.<br><br><small>Note: Pour supprimer complètement le compte, allez dans le dashboard Supabase > Authentication > Users.</small>',
            4000
        );
        await this.renderAdminUsersList();
    } catch (error) {
        logger.error('[handleDeleteUser] Erreur:', error);
        await swalError('❌ Erreur', 'Erreur lors de la suppression: ' + (error.message || error));
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
                    <button class="admin-delete-btn" data-team-id="${team.id}" title="Supprimer le groupe">⌧</button>
                </div>
            `;

            const deleteBtn = teamCard.querySelector('.admin-delete-btn');
            deleteBtn.addEventListener('click', () => {
                this.handleDeleteTeamAsAdmin(team.id, team.name);
            });

            teamsList.appendChild(teamCard);
        });
    } catch (error) {
        logger.error('[renderAdminTeamsList] Erreur:', error);
        teamsList.innerHTML = '<p class="error">Erreur lors du chargement des groupes</p>';
    }
}

// Gérer la suppression d'un groupe
async function handleDeleteTeamAsAdmin(teamId, teamName) {
    const confirmed = await swalConfirmHTML(
        '⚠️ Supprimer le groupe ?',
        `Le groupe <strong>"${teamName}"</strong> sera définitivement supprimé.<br><br>
         <span style="color: var(--danger-color);">⚠️ Cette action est irréversible</span>`,
        'Oui, supprimer',
        'Annuler'
    );
    
    if (!confirmed) {
        return;
    }

    try {
        await this.deleteTeamAsAdmin(teamId);
        
        // Enregistrer le log d'audit
        await this.logAuditEvent('team_deleted', 'team', teamId, {
            team_name: teamName,
            deleted_by: this.user?.email
        });
        
        await swalSuccess('✅ Groupe supprimé', 'Le groupe a été supprimé avec succès.', 3000);
        await this.renderAdminTeamsList();
    } catch (error) {
        logger.error('[handleDeleteTeamAsAdmin] Erreur:', error);
        await swalError('❌ Erreur', 'Erreur lors de la suppression: ' + (error.message || error));
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
        logger.error('[renderAdminSettings] Erreur:', error);
        await swalError(
            'Erreur',
            'Erreur lors du chargement des paramètres. Vérifiez la console pour plus de détails.'
        );
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
        
        // Enregistrer le log d'audit pour tracer les modifications
        await this.logAuditEvent('settings_updated', 'settings', null, {
            updated_by: this.user?.email,
            settings_keys: Object.keys(settings)
        });
        
        // Afficher un message de succès
        await swalSuccess(
            '✅ Paramètres sauvegardés',
            'Les paramètres par défaut ont été sauvegardés avec succès.',
            2000
        );
    } catch (error) {
        logger.error('[handleSaveDefaultSettings] Erreur:', error);
        if (error instanceof SyntaxError) {
            await swalError(
                '❌ Erreur de syntaxe JSON',
                'Le JSON est invalide. Vérifiez la syntaxe (virgules, guillemets, accolades, etc.).'
            );
        } else {
            await swalError(
                '❌ Erreur de sauvegarde',
                'Erreur lors de la sauvegarde: ' + (error.message || error)
            );
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
        logger.error('[renderAdminStats] Erreur:', error);
        statsContainer.innerHTML = '<p class="error">Erreur lors du chargement des statistiques</p>';
    }
}

// Rendre les logs d'audit
async function renderAuditLogs() {
    const logsContainer = document.getElementById('adminAuditLogs');
    if (!logsContainer) return;

    logsContainer.innerHTML = '<p>Chargement...</p>';

    try {
        const logs = await this.loadAuditLogs(200);

        logsContainer.innerHTML = '';

        if (logs.length === 0) {
            logsContainer.innerHTML = '<p class="no-data">Aucun log disponible</p>';
            return;
        }

        // Créer un conteneur scrollable pour les logs
        const logsList = document.createElement('div');
        logsList.className = 'admin-logs-list';

        logs.forEach(log => {
            const logCard = document.createElement('div');
            logCard.className = 'admin-log-card';

            // Formater la date
            const date = new Date(log.createdAt);
            const dateStr = date.toLocaleString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            // Déterminer l'icône selon l'action
            let icon = '📝';
            let actionLabel = log.action;
            const actionColors = {
                'user_deleted': { icon: '⌧', color: '#e74c3c', label: 'Utilisateur supprimé' },
                'team_deleted': { icon: '⌧', color: '#e74c3c', label: 'Groupe supprimé' },
                'settings_updated': { icon: '⚙', color: '#3498db', label: 'Paramètres modifiés' },
                'team_created': { icon: '➕', color: '#2ecc71', label: 'Groupe créé' },
                'user_created': { icon: '➕', color: '#2ecc71', label: 'Utilisateur créé' },
                'admin_action': { icon: '🔒', color: '#9b59b6', label: 'Action admin' }
            };

            if (actionColors[log.action]) {
                icon = actionColors[log.action].icon;
                actionLabel = actionColors[log.action].label;
            }

            // Formater les détails
            let detailsHtml = '';
            if (log.details && Object.keys(log.details).length > 0) {
                detailsHtml = '<div class="admin-log-details">';
                for (const [key, value] of Object.entries(log.details)) {
                    detailsHtml += `<span class="admin-log-detail-item"><strong>${key}:</strong> ${value}</span>`;
                }
                detailsHtml += '</div>';
            }

            logCard.innerHTML = `
                <div class="admin-log-header">
                    <span class="admin-log-icon" style="color: ${actionColors[log.action]?.color || '#666'}">${icon}</span>
                    <div class="admin-log-info">
                        <div class="admin-log-action">${actionLabel}</div>
                        <div class="admin-log-meta">
                            <span>Par: ${log.userEmail}</span>
                            <span>•</span>
                            <span>${dateStr}</span>
                            ${log.entityType ? `<span>•</span><span>Type: ${log.entityType}</span>` : ''}
                        </div>
                    </div>
                </div>
                ${detailsHtml}
            `;

            logsList.appendChild(logCard);
        });

        logsContainer.appendChild(logsList);
    } catch (error) {
        logger.error('[renderAuditLogs] Erreur:', error);
        logsContainer.innerHTML = '<p class="error">Erreur lors du chargement des logs</p>';
    }
}

// Configurer les event listeners pour l'admin
function setupAdminEventListeners() {
    const manager = this; // Capturer le contexte
    
    // Bouton admin dans le header
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn && !adminBtn.hasAttribute('data-listener-added')) {
        adminBtn.setAttribute('data-listener-added', 'true');
        adminBtn.addEventListener('click', async () => {
            logger.debug('[AdminUI] Bouton admin cliqué');
            await manager.openAdminModal();
        });
    }

    // Bouton de fermeture de la modale
    const adminClose = document.querySelector('.admin-close');
    if (adminClose && !adminClose.hasAttribute('data-listener-added')) {
        adminClose.setAttribute('data-listener-added', 'true');
        adminClose.addEventListener('click', () => {
            manager.closeAdminModal();
        });
    }

    // Onglets
    document.querySelectorAll('.admin-tab').forEach(tab => {
        if (!tab.hasAttribute('data-listener-added')) {
            tab.setAttribute('data-listener-added', 'true');
            tab.addEventListener('click', async () => {
                const tabName = tab.getAttribute('data-tab');
                await manager.switchAdminTab(tabName);
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
            searchTimeout = setTimeout(async () => {
                await manager.renderAdminUsersList();
            }, 300);
        });
    }

    // Bouton de sauvegarde des paramètres
    const saveSettingsBtn = document.getElementById('saveDefaultSettingsBtn');
    if (saveSettingsBtn && !saveSettingsBtn.hasAttribute('data-listener-added')) {
        saveSettingsBtn.setAttribute('data-listener-added', 'true');
        saveSettingsBtn.addEventListener('click', async () => {
            await manager.handleSaveDefaultSettings();
        });
    }
}

