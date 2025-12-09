// TeamsUI - Interface utilisateur pour la gestion des équipes
// Ces fonctions seront ajoutées au prototype de LeaveManager

// Afficher/masquer le sélecteur d'équipe selon le contexte
function updateTeamSelectorVisibility() {
    const teamSelect = document.getElementById('teamSelect');
    const teamsBtn = document.getElementById('teamsBtn');
    
    if (!teamSelect || !teamsBtn) {
        console.warn('[TeamsUI] Éléments teamsBtn ou teamSelect non trouvés dans le DOM');
        return;
    }
    
    // Afficher le bouton si l'utilisateur est connecté (toujours visible pour permettre la création d'équipes)
    if (this.user) {
        teamsBtn.style.display = 'inline-block';
        console.log('[TeamsUI] Bouton équipes affiché pour utilisateur:', this.user.email);
        console.log('[TeamsUI] Équipes disponibles:', this.userTeams?.length || 0);
        
        // Afficher le sélecteur s'il y a des équipes ou si on est en vue présence
        if (this.userTeams && this.userTeams.length > 0) {
            teamSelect.style.display = 'inline-block';
            console.log('[TeamsUI] Sélecteur d\'équipe affiché (équipes disponibles:', this.userTeams.length, ')');
            // S'assurer que le sélecteur est rempli
            this.populateTeamSelector();
        } else if (this.viewMode === 'year' && this.yearViewFormat === 'presence') {
            teamSelect.style.display = 'inline-block';
            console.log('[TeamsUI] Sélecteur d\'équipe affiché (vue présence)');
        } else {
            teamSelect.style.display = 'none';
        }
    } else {
        teamsBtn.style.display = 'none';
        teamSelect.style.display = 'none';
        console.log('[TeamsUI] Bouton et sélecteur masqués (utilisateur non connecté)');
    }
}

// Remplir le sélecteur d'équipe
function populateTeamSelector() {
    const teamSelect = document.getElementById('teamSelect');
    if (!teamSelect) {
        console.warn('[populateTeamSelector] Élément teamSelect non trouvé');
        return;
    }
    
    console.log('[populateTeamSelector] Remplissage du sélecteur...');
    console.log('[populateTeamSelector] Équipes disponibles:', this.userTeams?.length || 0);
    
    // Vider le sélecteur
    teamSelect.innerHTML = '<option value="">Mon calendrier</option>';
    
    // Ajouter les équipes
    if (this.userTeams && this.userTeams.length > 0) {
        this.userTeams.forEach(team => {
            const option = document.createElement('option');
            option.value = team.id;
            option.textContent = team.name;
            if (team.id === this.currentTeamId) {
                option.selected = true;
            }
            teamSelect.appendChild(option);
            console.log('[populateTeamSelector] Équipe ajoutée:', team.name, team.id);
        });
        console.log('[populateTeamSelector] Total équipes ajoutées:', this.userTeams.length);
    } else {
        console.warn('[populateTeamSelector] Aucune équipe disponible');
    }
}

// Ouvrir la modale de gestion des équipes
async function openTeamsModal() {
    const teamsModal = document.getElementById('teamsModal');
    if (!teamsModal) {
        console.error('[openTeamsModal] Modale non trouvée');
        return;
    }
    
    console.log('[openTeamsModal] Ouverture de la modale...');
    console.log('[openTeamsModal] Équipes actuelles:', this.userTeams?.length || 0);
    
    teamsModal.style.display = 'block';
    teamsModal.classList.add('active');
    
    // Recharger les équipes pour s'assurer qu'elles sont à jour
    console.log('[openTeamsModal] Rechargement des équipes...');
    await this.loadUserTeams();
    
    console.log('[openTeamsModal] Équipes après rechargement:', this.userTeams?.length || 0);
    
    // Afficher la liste des équipes
    this.renderTeamsList();
}

// Fermer la modale de gestion des équipes
function closeTeamsModal() {
    const teamsModal = document.getElementById('teamsModal');
    if (!teamsModal) return;
    
    teamsModal.style.display = 'none';
    teamsModal.classList.remove('active');
    
    // Masquer les sections
    document.getElementById('teamDetailsSection').style.display = 'none';
    document.getElementById('createTeamSection').style.display = 'none';
}

// Rendre la liste des équipes
function renderTeamsList() {
    const teamsList = document.getElementById('teamsList');
    if (!teamsList) {
        console.warn('[renderTeamsList] Élément teamsList non trouvé');
        return;
    }
    
    teamsList.innerHTML = '';
    
    console.log('[renderTeamsList] Équipes disponibles:', this.userTeams?.length || 0);
    
    if (!this.userTeams || this.userTeams.length === 0) {
        teamsList.innerHTML = '<p class="no-teams">Aucune équipe. Créez-en une pour commencer !</p>';
        return;
    }
    
    this.userTeams.forEach(team => {
        const teamCard = document.createElement('div');
        teamCard.className = 'team-card';
        teamCard.innerHTML = `
            <div class="team-card-header">
                <h5>${team.name}</h5>
                <span class="team-role-badge">${team.role === 'owner' ? '👑 Propriétaire' : team.role === 'admin' ? '🔧 Admin' : '👤 Membre'}</span>
            </div>
            ${team.description ? `<p class="team-description">${team.description}</p>` : ''}
            <button class="view-team-btn" data-team-id="${team.id}">Voir les membres</button>
        `;
        
        teamCard.querySelector('.view-team-btn').addEventListener('click', () => {
            this.showTeamDetails(team.id);
        });
        
        teamsList.appendChild(teamCard);
    });
    
    console.log('[renderTeamsList] Liste des équipes rendue avec', this.userTeams.length, 'équipe(s)');
}

// Afficher les détails d'une équipe
async function showTeamDetails(teamId) {
    const teamDetailsSection = document.getElementById('teamDetailsSection');
    const createTeamSection = document.getElementById('createTeamSection');
    const teamDetailsTitle = document.getElementById('teamDetailsTitle');
    const teamMembersList = document.getElementById('teamMembersList');
    const deleteTeamBtn = document.getElementById('deleteTeamBtn');
    
    if (!teamDetailsSection || !teamDetailsTitle || !teamMembersList) return;
    
    // Masquer la section de création
    createTeamSection.style.display = 'none';
    
    // Trouver l'équipe
    const team = this.userTeams.find(t => t.id === teamId);
    if (!team) return;
    
    teamDetailsTitle.textContent = team.name;
    
    // Afficher le bouton de suppression seulement si l'utilisateur est propriétaire
    if (deleteTeamBtn) {
        deleteTeamBtn.style.display = team.createdBy === this.user.id ? 'inline-block' : 'none';
        deleteTeamBtn.onclick = () => this.handleDeleteTeam(teamId);
    }
    
    // Charger les membres
    console.log('[showTeamDetails] Chargement des membres pour l\'équipe:', teamId);
    const members = await this.loadTeamMembers(teamId);
    console.log('[showTeamDetails] Membres chargés:', members.length, members);
    
    // Charger les invitations en attente
    const invitations = await this.loadTeamInvitations(teamId);
    const pendingInvitations = invitations.filter(inv => inv.status === 'pending');
    console.log('[showTeamDetails] Invitations en attente:', pendingInvitations.length);
    
    // Rendre la liste des membres
    teamMembersList.innerHTML = '';
    
    // Afficher les membres actifs
    if (members.length === 0 && pendingInvitations.length === 0) {
        teamMembersList.innerHTML = '<p class="no-members">Aucun membre dans cette équipe.</p>';
    } else {
        // En-tête pour les membres
        if (members.length > 0) {
            const membersHeader = document.createElement('div');
            membersHeader.className = 'members-header';
            membersHeader.innerHTML = '<h5 style="margin: 0 0 10px 0; color: var(--text-color);">Membres de l\'équipe</h5>';
            teamMembersList.appendChild(membersHeader);
        }
        
        members.forEach(member => {
            const memberCard = document.createElement('div');
            memberCard.className = 'member-card';
            const isOwner = team.createdBy === member.userId;
            const canRemove = (team.role === 'owner' || team.role === 'admin') && !isOwner;
            
            memberCard.innerHTML = `
                <div class="member-info">
                    <span class="member-email">${member.email}</span>
                    <span class="member-role">${member.role === 'owner' ? '👑 Propriétaire' : member.role === 'admin' ? '🔧 Admin' : '👤 Membre'}</span>
                </div>
                ${canRemove ? `<button class="remove-member-btn" data-user-id="${member.userId}">Retirer</button>` : ''}
            `;
            
            if (canRemove) {
                memberCard.querySelector('.remove-member-btn').addEventListener('click', () => {
                    this.handleRemoveMember(teamId, member.userId);
                });
            }
            
            teamMembersList.appendChild(memberCard);
        });
        
        // Afficher les invitations en attente
        if (pendingInvitations.length > 0) {
            const invitationsHeader = document.createElement('div');
            invitationsHeader.className = 'invitations-header';
            invitationsHeader.innerHTML = '<h5 style="margin: 20px 0 10px 0; color: var(--text-color);">Invitations en attente</h5>';
            teamMembersList.appendChild(invitationsHeader);
            
            pendingInvitations.forEach(invitation => {
                const invitationCard = document.createElement('div');
                invitationCard.className = 'member-card invitation-card';
                const canDelete = team.role === 'owner' || team.role === 'admin';
                
                invitationCard.innerHTML = `
                    <div class="member-info">
                        <span class="member-email">${invitation.email}</span>
                        <span class="member-role" style="opacity: 0.7;">⏳ En attente</span>
                    </div>
                    ${canDelete ? `<button class="remove-member-btn" data-invitation-id="${invitation.id}">Annuler</button>` : ''}
                `;
                
                if (canDelete) {
                    invitationCard.querySelector('.remove-member-btn').addEventListener('click', () => {
                        this.handleDeleteInvitation(invitation.id, teamId);
                    });
                }
                
                teamMembersList.appendChild(invitationCard);
            });
        }
    }
    
    // Configurer le bouton d'ajout de membre
    const addMemberBtn = document.getElementById('addMemberBtn');
    if (addMemberBtn) {
        addMemberBtn.onclick = () => this.showAddMemberDialog(teamId);
    }
    
    // Afficher la section
    teamDetailsSection.style.display = 'block';
}

// Afficher le formulaire de création d'équipe
function showCreateTeamForm() {
    const createTeamSection = document.getElementById('createTeamSection');
    const teamDetailsSection = document.getElementById('teamDetailsSection');
    const saveTeamBtn = document.getElementById('saveTeamBtn');
    
    if (!createTeamSection) return;
    
    teamDetailsSection.style.display = 'none';
    createTeamSection.style.display = 'block';
    
    // Réinitialiser les champs
    const nameInput = document.getElementById('teamNameInput');
    const descriptionInput = document.getElementById('teamDescriptionInput');
    if (nameInput) nameInput.value = '';
    if (descriptionInput) descriptionInput.value = '';
    
    // Réactiver le bouton au cas où il serait désactivé
    if (saveTeamBtn) {
        saveTeamBtn.disabled = false;
        saveTeamBtn.textContent = 'Créer';
    }
    
    // Focus sur le champ nom
    if (nameInput) {
        setTimeout(() => nameInput.focus(), 100);
    }
}

// Créer une équipe
async function handleCreateTeam() {
    const saveTeamBtn = document.getElementById('saveTeamBtn');
    
    // Protection contre les soumissions multiples
    if (saveTeamBtn && saveTeamBtn.disabled) {
        console.log('[TeamsUI] Création d\'équipe déjà en cours, ignore le clic');
        return;
    }
    
    const nameInput = document.getElementById('teamNameInput');
    const descriptionInput = document.getElementById('teamDescriptionInput');
    
    if (!nameInput || !nameInput.value.trim()) {
        alert('Veuillez entrer un nom pour l\'équipe');
        return;
    }
    
    // Désactiver le bouton pour éviter les doubles clics
    if (saveTeamBtn) {
        saveTeamBtn.disabled = true;
        saveTeamBtn.textContent = 'Création...';
    }
    
    try {
        await this.createTeam(nameInput.value.trim(), descriptionInput.value.trim());
        
        // Fermer le formulaire et rafraîchir la liste
        document.getElementById('createTeamSection').style.display = 'none';
        
        // Réinitialiser le formulaire
        if (nameInput) nameInput.value = '';
        if (descriptionInput) descriptionInput.value = '';
        
        this.renderTeamsList();
        this.populateTeamSelector();
        this.updateTeamSelectorVisibility();
        
        alert('Équipe créée avec succès !');
        
        // Recharger les équipes pour afficher la nouvelle équipe
        await this.loadUserTeams();
        
        // Rafraîchir la liste des équipes
        this.renderTeamsList();
        
        // Masquer le formulaire de création et revenir à la liste
        createTeamSection.style.display = 'none';
    } catch (error) {
        console.error('Erreur lors de la création de l\'équipe:', error);
        alert('Erreur lors de la création de l\'équipe: ' + (error.message || error));
    } finally {
        // Réactiver le bouton dans tous les cas
        if (saveTeamBtn) {
            saveTeamBtn.disabled = false;
            saveTeamBtn.textContent = 'Créer';
        }
    }
}

// Afficher le dialogue d'ajout de membre
async function showAddMemberDialog(teamId) {
    const email = prompt('Entrez l\'email de l\'utilisateur à inviter :');
    if (!email || !email.trim()) return;
    
    try {
        const result = await this.inviteUserToTeam(teamId, email.trim());
        
        // Rafraîchir les détails de l'équipe pour afficher les changements
        await this.showTeamDetails(teamId);
        
        // Afficher un message approprié selon le type de résultat
        if (result && result.type === 'direct_add') {
            // Message de succès avec indication visuelle
            await swalSuccess(
                '✅ Membre ajouté',
                `${result.message || `L'utilisateur <strong>${email.trim()}</strong> a été ajouté directement à l'équipe !`}<br><br>Vous pouvez maintenant le voir dans la liste des membres.`,
                3000
            );
        } else {
            await swalSuccess(
                '📨 Invitation envoyée',
                `Invitation envoyée à <strong>${email.trim()}</strong> !<br><br>L'utilisateur recevra une notification lorsqu'il se connectera à l'application.`,
                3000
            );
        }
    } catch (error) {
        console.error('Erreur lors de l\'invitation:', error);
        await swalError('❌ Erreur', 'Erreur lors de l\'invitation: ' + (error.message || error));
    }
}

// Retirer un membre
async function handleRemoveMember(teamId, userId) {
    const confirmed = await swalConfirm(
        'Retirer le membre ?',
        'Êtes-vous sûr de vouloir retirer ce membre de l\'équipe ?',
        'Oui, retirer',
        'Annuler'
    );
    
    if (!confirmed) {
        return;
    }
    
    try {
        await this.removeMemberFromTeam(teamId, userId);
        await this.showTeamDetails(teamId);
        await swalSuccess('✅ Membre retiré', 'Le membre a été retiré de l\'équipe avec succès.', 2000);
    } catch (error) {
        console.error('Erreur lors du retrait du membre:', error);
        await swalError('❌ Erreur', 'Erreur lors du retrait du membre: ' + (error.message || error));
    }
}

// Supprimer une invitation
async function handleDeleteInvitation(invitationId, teamId) {
    const confirmed = await swalConfirm(
        'Annuler l\'invitation ?',
        'Êtes-vous sûr de vouloir annuler cette invitation ?',
        'Oui, annuler',
        'Non'
    );
    
    if (!confirmed) {
        return;
    }
    
    try {
        await this.deleteTeamInvitation(invitationId);
        await this.showTeamDetails(teamId);
        await swalSuccess('✅ Invitation annulée', 'L\'invitation a été annulée avec succès.', 2000);
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'invitation:', error);
        await swalError('❌ Erreur', 'Erreur lors de la suppression de l\'invitation: ' + (error.message || error));
    }
}

// Supprimer une équipe
async function handleDeleteTeam(teamId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette équipe ? Cette action est irréversible.')) {
        return;
    }
    
    try {
        await this.deleteTeam(teamId);
        document.getElementById('teamDetailsSection').style.display = 'none';
        this.renderTeamsList();
        this.populateTeamSelector();
        this.updateTeamSelectorVisibility();
        
        // Si on était en vue présence avec cette équipe, revenir à la vue normale
        if (this.currentTeamId === teamId) {
            this.currentTeamId = null;
            if (this.viewMode === 'year' && this.yearViewFormat === 'presence') {
                this.renderCalendar();
            }
        }
        
        alert('Équipe supprimée avec succès');
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'équipe:', error);
        alert('Erreur lors de la suppression de l\'équipe: ' + (error.message || error));
    }
}

// Gérer le changement d'équipe dans le sélecteur
function handleTeamSelectChange() {
    const teamSelect = document.getElementById('teamSelect');
    if (!teamSelect) return;
    
    const selectedTeamId = teamSelect.value || null;
    this.currentTeamId = selectedTeamId;
    
    // Si on est en vue présence, recharger le calendrier
    if (this.viewMode === 'year' && this.yearViewFormat === 'presence') {
        this.renderCalendar();
    }
}

// Configurer les event listeners pour les équipes
function setupTeamsEventListeners() {
    // Bouton d'ouverture de la modale
    const teamsBtn = document.getElementById('teamsBtn');
    if (teamsBtn && !teamsBtn.hasAttribute('data-listener-added')) {
        teamsBtn.setAttribute('data-listener-added', 'true');
        teamsBtn.addEventListener('click', () => this.openTeamsModal());
    }
    
    // Sélecteur d'équipe
    const teamSelect = document.getElementById('teamSelect');
    if (teamSelect && !teamSelect.hasAttribute('data-listener-added')) {
        teamSelect.setAttribute('data-listener-added', 'true');
        teamSelect.addEventListener('change', () => this.handleTeamSelectChange());
    }
    
    // Fermeture de la modale
    const teamsClose = document.querySelector('.teams-close');
    if (teamsClose) {
        teamsClose.addEventListener('click', () => this.closeTeamsModal());
    }
    
    const closeTeamsModalBtn = document.getElementById('closeTeamsModalBtn');
    if (closeTeamsModalBtn) {
        closeTeamsModalBtn.addEventListener('click', () => this.closeTeamsModal());
    }
    
    // Bouton de création d'équipe
    const createTeamBtn = document.getElementById('createTeamBtn');
    if (createTeamBtn && !createTeamBtn.hasAttribute('data-listener-added')) {
        createTeamBtn.setAttribute('data-listener-added', 'true');
        createTeamBtn.addEventListener('click', () => this.showCreateTeamForm());
    }
    
    // Bouton d'annulation de création
    const cancelCreateTeamBtn = document.getElementById('cancelCreateTeamBtn');
    if (cancelCreateTeamBtn && !cancelCreateTeamBtn.hasAttribute('data-listener-added')) {
        cancelCreateTeamBtn.setAttribute('data-listener-added', 'true');
        cancelCreateTeamBtn.addEventListener('click', () => {
            document.getElementById('createTeamSection').style.display = 'none';
            // Réactiver le bouton de sauvegarde au cas où
            const saveBtn = document.getElementById('saveTeamBtn');
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Créer';
            }
        });
    }
    
    // Bouton de sauvegarde d'équipe
    const saveTeamBtn = document.getElementById('saveTeamBtn');
    if (saveTeamBtn) {
        saveTeamBtn.addEventListener('click', () => this.handleCreateTeam());
    }
    
    // Fermer la modale en cliquant en dehors
    const teamsModal = document.getElementById('teamsModal');
    if (teamsModal) {
        teamsModal.addEventListener('click', (e) => {
            if (e.target === teamsModal) {
                this.closeTeamsModal();
            }
        });
    }
}

