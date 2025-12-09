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
        
        // Afficher le sélecteur s'il y a des équipes ou si on est en vue présence
        if (this.userTeams && this.userTeams.length > 0) {
            teamSelect.style.display = 'inline-block';
            console.log('[TeamsUI] Sélecteur d\'équipe affiché (équipes disponibles:', this.userTeams.length, ')');
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
    if (!teamSelect) return;
    
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
        });
    }
}

// Ouvrir la modale de gestion des équipes
function openTeamsModal() {
    const teamsModal = document.getElementById('teamsModal');
    if (!teamsModal) return;
    
    teamsModal.style.display = 'block';
    teamsModal.classList.add('active');
    
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
    if (!teamsList) return;
    
    teamsList.innerHTML = '';
    
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
    const members = await this.loadTeamMembers(teamId);
    
    // Rendre la liste des membres
    teamMembersList.innerHTML = '';
    
    if (members.length === 0) {
        teamMembersList.innerHTML = '<p class="no-members">Aucun membre dans cette équipe.</p>';
    } else {
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
    
    if (!createTeamSection) return;
    
    teamDetailsSection.style.display = 'none';
    createTeamSection.style.display = 'block';
    
    // Réinitialiser les champs
    document.getElementById('teamNameInput').value = '';
    document.getElementById('teamDescriptionInput').value = '';
}

// Créer une équipe
async function handleCreateTeam() {
    const nameInput = document.getElementById('teamNameInput');
    const descriptionInput = document.getElementById('teamDescriptionInput');
    
    if (!nameInput || !nameInput.value.trim()) {
        alert('Veuillez entrer un nom pour l\'équipe');
        return;
    }
    
    try {
        await this.createTeam(nameInput.value.trim(), descriptionInput.value.trim());
        
        // Fermer le formulaire et rafraîchir la liste
        document.getElementById('createTeamSection').style.display = 'none';
        this.renderTeamsList();
        this.populateTeamSelector();
        this.updateTeamSelectorVisibility();
        
        alert('Équipe créée avec succès !');
    } catch (error) {
        console.error('Erreur lors de la création de l\'équipe:', error);
        alert('Erreur lors de la création de l\'équipe: ' + (error.message || error));
    }
}

// Afficher le dialogue d'ajout de membre
function showAddMemberDialog(teamId) {
    const email = prompt('Entrez l\'email de l\'utilisateur à ajouter :');
    if (!email || !email.trim()) return;
    
    // Pour l'instant, on ne peut pas ajouter directement par email
    // Il faudrait que l'utilisateur existe déjà dans Supabase
    alert('Pour ajouter un membre, l\'utilisateur doit d\'abord s\'inscrire à l\'application. Partagez-lui le lien d\'inscription, puis vous pourrez l\'ajouter à l\'équipe.');
}

// Retirer un membre
async function handleRemoveMember(teamId, userId) {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce membre de l\'équipe ?')) {
        return;
    }
    
    try {
        await this.removeMemberFromTeam(teamId, userId);
        await this.showTeamDetails(teamId);
        alert('Membre retiré avec succès');
    } catch (error) {
        console.error('Erreur lors du retrait du membre:', error);
        alert('Erreur lors du retrait du membre: ' + (error.message || error));
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
    if (createTeamBtn) {
        createTeamBtn.addEventListener('click', () => this.showCreateTeamForm());
    }
    
    // Bouton d'annulation de création
    const cancelCreateTeamBtn = document.getElementById('cancelCreateTeamBtn');
    if (cancelCreateTeamBtn) {
        cancelCreateTeamBtn.addEventListener('click', () => {
            document.getElementById('createTeamSection').style.display = 'none';
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

