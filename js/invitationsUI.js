// InvitationsUI - Interface utilisateur pour gérer les invitations d'équipe
// Ces fonctions seront ajoutées au prototype de LeaveManager

// Afficher le badge d'invitations si nécessaire
async function updateInvitationsBadge() {
    const badge = document.getElementById('invitationsBadge');
    if (!badge) return;
    
    if (!this.user) {
        badge.style.display = 'none';
        return;
    }
    
    try {
        const pendingInvitations = await this.loadUserPendingInvitations();
        if (pendingInvitations.length > 0) {
            badge.style.display = 'inline-block';
            badge.textContent = `📨 ${pendingInvitations.length}`;
            badge.title = `Vous avez ${pendingInvitations.length} invitation(s) en attente`;
        } else {
            badge.style.display = 'none';
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour du badge d\'invitations:', error);
        badge.style.display = 'none';
    }
}

// Ouvrir la modale des invitations
async function openInvitationsModal() {
    const invitationsModal = document.getElementById('invitationsModal');
    if (!invitationsModal) return;
    
    invitationsModal.style.display = 'block';
    invitationsModal.classList.add('active');
    
    // Charger et afficher les invitations
    await this.renderInvitationsList();
}

// Fermer la modale des invitations
function closeInvitationsModal() {
    const invitationsModal = document.getElementById('invitationsModal');
    if (!invitationsModal) return;
    
    invitationsModal.style.display = 'none';
    invitationsModal.classList.remove('active');
}

// Rendre la liste des invitations
async function renderInvitationsList() {
    const invitationsList = document.getElementById('invitationsList');
    if (!invitationsList) return;
    
    invitationsList.innerHTML = '<p class="no-invitations">Chargement...</p>';
    
    try {
        const pendingInvitations = await this.loadUserPendingInvitations();
        
        if (pendingInvitations.length === 0) {
            invitationsList.innerHTML = '<p class="no-invitations">Aucune invitation en attente.</p>';
            return;
        }
        
        invitationsList.innerHTML = '';
        
        pendingInvitations.forEach(invitation => {
            const invitationItem = document.createElement('div');
            invitationItem.className = 'invitation-item';
            
            invitationItem.innerHTML = `
                <div class="invitation-item-header">
                    <div>
                        <div class="invitation-team-name">${invitation.team?.name || 'Équipe inconnue'}</div>
                        <div class="invitation-email">Invité par: ${invitation.inviterEmail}</div>
                        ${invitation.team?.description ? `<p style="margin-top: 5px; opacity: 0.7; font-size: 0.9em;">${invitation.team.description}</p>` : ''}
                    </div>
                </div>
                <div class="invitation-actions">
                    <button class="accept-invitation-btn" data-invitation-id="${invitation.id}">✓ Accepter</button>
                    <button class="decline-invitation-btn" data-invitation-id="${invitation.id}">✗ Refuser</button>
                </div>
            `;
            
            // Event listeners pour les boutons
            invitationItem.querySelector('.accept-invitation-btn').addEventListener('click', () => {
                this.handleAcceptInvitation(invitation.id);
            });
            
            invitationItem.querySelector('.decline-invitation-btn').addEventListener('click', () => {
                this.handleDeclineInvitation(invitation.id);
            });
            
            invitationsList.appendChild(invitationItem);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des invitations:', error);
        invitationsList.innerHTML = '<p class="no-invitations">Erreur lors du chargement des invitations.</p>';
    }
}

// Accepter une invitation
async function handleAcceptInvitation(invitationId) {
    try {
        await this.acceptTeamInvitation(invitationId);
        
        // Rafraîchir la liste des invitations
        await this.renderInvitationsList();
        
        // Mettre à jour le badge
        await this.updateInvitationsBadge();
        
        // Mettre à jour les équipes et le sélecteur
        await this.loadUserTeams();
        if (typeof this.populateTeamSelector === 'function') {
            this.populateTeamSelector();
        }
        if (typeof this.updateTeamSelectorVisibility === 'function') {
            this.updateTeamSelectorVisibility();
        }
        
        alert('Invitation acceptée ! Vous avez rejoint l\'équipe.');
        
        // Fermer la modale si plus d'invitations
        const pendingInvitations = await this.loadUserPendingInvitations();
        if (pendingInvitations.length === 0) {
            this.closeInvitationsModal();
        }
    } catch (error) {
        console.error('Erreur lors de l\'acceptation de l\'invitation:', error);
        alert('Erreur lors de l\'acceptation de l\'invitation: ' + (error.message || error));
    }
}

// Refuser une invitation
async function handleDeclineInvitation(invitationId) {
    if (!confirm('Êtes-vous sûr de vouloir refuser cette invitation ?')) {
        return;
    }
    
    try {
        await this.declineTeamInvitation(invitationId);
        
        // Rafraîchir la liste des invitations
        await this.renderInvitationsList();
        
        // Mettre à jour le badge
        await this.updateInvitationsBadge();
        
        // Fermer la modale si plus d'invitations
        const pendingInvitations = await this.loadUserPendingInvitations();
        if (pendingInvitations.length === 0) {
            this.closeInvitationsModal();
        }
        
        alert('Invitation refusée.');
    } catch (error) {
        console.error('Erreur lors du refus de l\'invitation:', error);
        alert('Erreur lors du refus de l\'invitation: ' + (error.message || error));
    }
}

// Configurer les event listeners pour les invitations
function setupInvitationsEventListeners() {
    // Badge d'invitations dans le header
    const invitationsBadge = document.getElementById('invitationsBadge');
    if (invitationsBadge && !invitationsBadge.hasAttribute('data-listener-added')) {
        invitationsBadge.setAttribute('data-listener-added', 'true');
        invitationsBadge.addEventListener('click', () => this.openInvitationsModal());
    }
    
    // Fermeture de la modale
    const invitationsClose = document.querySelector('.invitations-close');
    if (invitationsClose) {
        invitationsClose.addEventListener('click', () => this.closeInvitationsModal());
    }
    
    const closeInvitationsModalBtn = document.getElementById('closeInvitationsModalBtn');
    if (closeInvitationsModalBtn) {
        closeInvitationsModalBtn.addEventListener('click', () => this.closeInvitationsModal());
    }
    
    // Fermer la modale en cliquant en dehors
    const invitationsModal = document.getElementById('invitationsModal');
    if (invitationsModal) {
        invitationsModal.addEventListener('click', (e) => {
            if (e.target === invitationsModal) {
                this.closeInvitationsModal();
            }
        });
    }
}

