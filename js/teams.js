// Teams - Gestion des équipes et groupes
// Ces fonctions seront ajoutées au prototype de LeaveManager

// Charger les équipes de l'utilisateur
async function loadUserTeams() {
    if (!this.user || !supabase) {
        this.userTeams = [];
        this.currentTeamId = null;
        return;
    }

    try {
        // Charger les équipes où l'utilisateur est membre
        const { data, error } = await supabase
            .from('team_members')
            .select(`
                team_id,
                role,
                teams (
                    id,
                    name,
                    description,
                    created_by,
                    created_at
                )
            `)
            .eq('user_id', this.user.id);

        if (error) throw error;

        this.userTeams = (data || []).map(member => ({
            id: member.teams.id,
            name: member.teams.name,
            description: member.teams.description,
            role: member.role,
            createdBy: member.teams.created_by,
            createdAt: member.teams.created_at
        }));

        // Si aucune équipe n'est sélectionnée et qu'il y a des équipes, sélectionner la première
        if (!this.currentTeamId && this.userTeams.length > 0) {
            this.currentTeamId = this.userTeams[0].id;
        }

        console.log('Équipes chargées:', this.userTeams.length);
    } catch (e) {
        console.error('Erreur lors du chargement des équipes:', e);
        this.userTeams = [];
    }
}

// Créer une nouvelle équipe
async function createTeam(name, description = '') {
    if (!this.user || !supabase) {
        throw new Error('Utilisateur non connecté');
    }

    try {
        // Créer l'équipe
        const { data: team, error: teamError } = await supabase
            .from('teams')
            .insert({
                name: name,
                description: description,
                created_by: this.user.id
            })
            .select()
            .single();

        if (teamError) throw teamError;

        // Ajouter le créateur comme owner
        const { error: memberError } = await supabase
            .from('team_members')
            .insert({
                team_id: team.id,
                user_id: this.user.id,
                role: 'owner',
                invited_by: this.user.id
            });

        if (memberError) throw memberError;

        // Recharger les équipes
        await this.loadUserTeams();
        this.currentTeamId = team.id;

        return team;
    } catch (e) {
        console.error('Erreur lors de la création de l\'équipe:', e);
        throw e;
    }
}

// Charger les membres d'une équipe
async function loadTeamMembers(teamId) {
    if (!this.user || !supabase || !teamId) {
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('team_members')
            .select(`
                id,
                role,
                joined_at,
                user_id,
                users:user_id (
                    id,
                    email
                )
            `)
            .eq('team_id', teamId)
            .order('joined_at');

        if (error) throw error;

        return (data || []).map(member => ({
            id: member.id,
            userId: member.user_id,
            email: member.users?.email || 'Utilisateur inconnu',
            role: member.role,
            joinedAt: member.joined_at
        }));
    } catch (e) {
        console.error('Erreur lors du chargement des membres:', e);
        return [];
    }
}

// Inviter un utilisateur à rejoindre une équipe (par email)
async function inviteUserToTeam(teamId, email) {
    if (!this.user || !supabase || !teamId || !email) {
        throw new Error('Paramètres manquants');
    }

    try {
        // Vérifier que l'utilisateur a les droits (owner ou admin)
        const userTeam = this.userTeams.find(t => t.id === teamId);
        if (!userTeam || !['owner', 'admin'].includes(userTeam.role)) {
            throw new Error('Vous n\'avez pas les droits pour inviter des membres');
        }

        // Vérifier que l'email est valide
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            throw new Error('Email invalide');
        }

        // Vérifier que l'utilisateur n'est pas déjà membre
        const existingMembers = await this.loadTeamMembers(teamId);
        if (existingMembers.some(m => m.email.toLowerCase() === email.toLowerCase())) {
            throw new Error('Cet utilisateur est déjà membre de l\'équipe');
        }

        // Vérifier qu'il n'y a pas déjà une invitation en attente pour cet email
        const { data: existingInvitations, error: checkError } = await supabase
            .from('team_invitations')
            .select('id, status')
            .eq('team_id', teamId)
            .eq('email', email.toLowerCase().trim())
            .eq('status', 'pending');

        if (checkError) throw checkError;

        if (existingInvitations && existingInvitations.length > 0) {
            throw new Error('Une invitation est déjà en attente pour cet email');
        }

        // Créer l'invitation
        const { data, error } = await supabase
            .from('team_invitations')
            .insert({
                team_id: teamId,
                email: email.toLowerCase().trim(),
                invited_by: this.user.id,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        console.log('Invitation créée avec succès:', data);
        return data;
    } catch (e) {
        console.error('Erreur lors de l\'invitation:', e);
        throw e;
    }
}

// Charger les invitations d'une équipe
async function loadTeamInvitations(teamId) {
    if (!this.user || !supabase || !teamId) {
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('team_invitations')
            .select(`
                id,
                email,
                status,
                created_at,
                accepted_at,
                invited_by,
                teams:team_id (
                    name
                )
            `)
            .eq('team_id', teamId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(invitation => ({
            id: invitation.id,
            email: invitation.email,
            status: invitation.status,
            createdAt: invitation.created_at,
            acceptedAt: invitation.accepted_at,
            invitedBy: invitation.invited_by,
            teamName: invitation.teams?.name || 'Équipe inconnue'
        }));
    } catch (e) {
        console.error('Erreur lors du chargement des invitations:', e);
        return [];
    }
}

// Charger les invitations en attente pour l'utilisateur actuel (par email)
async function loadUserPendingInvitations() {
    if (!this.user || !supabase) {
        return [];
    }

    try {
        // Récupérer l'email de l'utilisateur actuel
        const userEmail = this.user.email?.toLowerCase();

        if (!userEmail) {
            return [];
        }

        const { data, error } = await supabase
            .from('team_invitations')
            .select(`
                id,
                team_id,
                email,
                status,
                created_at,
                teams:team_id (
                    id,
                    name,
                    description
                ),
                inviter:invited_by (
                    email
                )
            `)
            .eq('email', userEmail)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(invitation => ({
            id: invitation.id,
            teamId: invitation.team_id,
            email: invitation.email,
            status: invitation.status,
            createdAt: invitation.created_at,
            team: invitation.teams,
            inviterEmail: invitation.inviter?.email || 'Utilisateur inconnu'
        }));
    } catch (e) {
        console.error('Erreur lors du chargement des invitations en attente:', e);
        return [];
    }
}

// Accepter une invitation
async function acceptTeamInvitation(invitationId) {
    if (!this.user || !supabase || !invitationId) {
        throw new Error('Paramètres manquants');
    }

    try {
        // Récupérer l'invitation
        const { data: invitation, error: fetchError } = await supabase
            .from('team_invitations')
            .select('*')
            .eq('id', invitationId)
            .eq('email', this.user.email?.toLowerCase())
            .eq('status', 'pending')
            .single();

        if (fetchError) throw fetchError;
        if (!invitation) {
            throw new Error('Invitation non trouvée ou déjà traitée');
        }

        // Vérifier que l'utilisateur n'est pas déjà membre
        const existingMembers = await this.loadTeamMembers(invitation.team_id);
        if (existingMembers.some(m => m.userId === this.user.id)) {
            // L'utilisateur est déjà membre, marquer l'invitation comme acceptée
            await supabase
                .from('team_invitations')
                .update({
                    status: 'accepted',
                    accepted_at: new Date().toISOString()
                })
                .eq('id', invitationId);
            return true;
        }

        // Ajouter l'utilisateur à l'équipe
        const { error: memberError } = await supabase
            .from('team_members')
            .insert({
                team_id: invitation.team_id,
                user_id: this.user.id,
                role: 'member',
                invited_by: invitation.invited_by
            });

        if (memberError) throw memberError;

        // Marquer l'invitation comme acceptée
        const { error: updateError } = await supabase
            .from('team_invitations')
            .update({
                status: 'accepted',
                accepted_at: new Date().toISOString()
            })
            .eq('id', invitationId);

        if (updateError) throw updateError;

        // Recharger les équipes de l'utilisateur
        await this.loadUserTeams();

        return true;
    } catch (e) {
        console.error('Erreur lors de l\'acceptation de l\'invitation:', e);
        throw e;
    }
}

// Refuser une invitation
async function declineTeamInvitation(invitationId) {
    if (!this.user || !supabase || !invitationId) {
        throw new Error('Paramètres manquants');
    }

    try {
        const { error } = await supabase
            .from('team_invitations')
            .update({
                status: 'declined'
            })
            .eq('id', invitationId)
            .eq('email', this.user.email?.toLowerCase())
            .eq('status', 'pending');

        if (error) throw error;

        return true;
    } catch (e) {
        console.error('Erreur lors du refus de l\'invitation:', e);
        throw e;
    }
}

// Supprimer une invitation (pour les owners/admins)
async function deleteTeamInvitation(invitationId) {
    if (!this.user || !supabase || !invitationId) {
        throw new Error('Paramètres manquants');
    }

    try {
        // Récupérer l'invitation pour vérifier les droits
        const { data: invitation, error: fetchError } = await supabase
            .from('team_invitations')
            .select('team_id')
            .eq('id', invitationId)
            .single();

        if (fetchError) throw fetchError;

        // Vérifier que l'utilisateur a les droits
        const userTeam = this.userTeams.find(t => t.id === invitation.team_id);
        if (!userTeam || !['owner', 'admin'].includes(userTeam.role)) {
            throw new Error('Vous n\'avez pas les droits pour supprimer cette invitation');
        }

        const { error } = await supabase
            .from('team_invitations')
            .delete()
            .eq('id', invitationId);

        if (error) throw error;

        return true;
    } catch (e) {
        console.error('Erreur lors de la suppression de l\'invitation:', e);
        throw e;
    }
}

// Ajouter un membre à une équipe (si l'utilisateur existe déjà)
async function addMemberToTeam(teamId, userId) {
    if (!this.user || !supabase || !teamId || !userId) {
        throw new Error('Paramètres manquants');
    }

    try {
        // Vérifier que l'utilisateur a les droits
        const userTeam = this.userTeams.find(t => t.id === teamId);
        if (!userTeam || !['owner', 'admin'].includes(userTeam.role)) {
            throw new Error('Vous n\'avez pas les droits pour ajouter des membres');
        }

        // Vérifier que l'utilisateur n'est pas déjà membre
        const existingMembers = await this.loadTeamMembers(teamId);
        if (existingMembers.some(m => m.userId === userId)) {
            throw new Error('Cet utilisateur est déjà membre de l\'équipe');
        }

        // Ajouter le membre
        const { error } = await supabase
            .from('team_members')
            .insert({
                team_id: teamId,
                user_id: userId,
                role: 'member',
                invited_by: this.user.id
            });

        if (error) throw error;

        return true;
    } catch (e) {
        console.error('Erreur lors de l\'ajout du membre:', e);
        throw e;
    }
}

// Retirer un membre d'une équipe
async function removeMemberFromTeam(teamId, userId) {
    if (!this.user || !supabase || !teamId || !userId) {
        throw new Error('Paramètres manquants');
    }

    try {
        // Vérifier que l'utilisateur a les droits
        const userTeam = this.userTeams.find(t => t.id === teamId);
        if (!userTeam || !['owner', 'admin'].includes(userTeam.role)) {
            throw new Error('Vous n\'avez pas les droits pour retirer des membres');
        }

        // Ne pas permettre de retirer le propriétaire
        if (userId === userTeam.createdBy && userTeam.role === 'owner') {
            throw new Error('Le propriétaire de l\'équipe ne peut pas être retiré');
        }

        // Retirer le membre
        const { error } = await supabase
            .from('team_members')
            .delete()
            .eq('team_id', teamId)
            .eq('user_id', userId);

        if (error) throw error;

        return true;
    } catch (e) {
        console.error('Erreur lors du retrait du membre:', e);
        throw e;
    }
}

// Charger les congés de tous les membres d'une équipe pour une année donnée
async function loadTeamLeaves(teamId, year) {
    if (!this.user || !supabase || !teamId || !year) {
        return {};
    }

    try {
        // Charger les membres de l'équipe
        const members = await this.loadTeamMembers(teamId);
        if (members.length === 0) {
            return {};
        }

        const memberIds = members.map(m => m.userId);

        // Charger les congés de tous les membres pour l'année
        const yearStart = `${year}-01-01`;
        const yearEnd = `${year}-12-31`;

        const { data, error } = await supabase
            .from('leaves')
            .select('user_id, date_key, leave_type_id')
            .in('user_id', memberIds)
            .gte('date_key', yearStart)
            .lte('date_key', yearEnd);

        if (error) throw error;

        // Organiser les données par utilisateur
        const teamLeaves = {};
        members.forEach(member => {
            teamLeaves[member.userId] = {};
        });

        (data || []).forEach(leave => {
            if (!teamLeaves[leave.user_id]) {
                teamLeaves[leave.user_id] = {};
            }
            teamLeaves[leave.user_id][leave.date_key] = leave.leave_type_id;
        });

        return teamLeaves;
    } catch (e) {
        console.error('Erreur lors du chargement des congés de l\'équipe:', e);
        return {};
    }
}

// Charger les types de congés de tous les membres d'une équipe
async function loadTeamLeaveTypes(teamId) {
    if (!this.user || !supabase || !teamId) {
        return {};
    }

    try {
        const members = await this.loadTeamMembers(teamId);
        if (members.length === 0) {
            return {};
        }

        const memberIds = members.map(m => m.userId);

        const { data, error } = await supabase
            .from('leave_types')
            .select('user_id, id, name, label, color')
            .in('user_id', memberIds);

        if (error) throw error;

        // Organiser par utilisateur
        const teamLeaveTypes = {};
        (data || []).forEach(type => {
            if (!teamLeaveTypes[type.user_id]) {
                teamLeaveTypes[type.user_id] = [];
            }
            teamLeaveTypes[type.user_id].push({
                id: type.id,
                name: type.name,
                label: type.label,
                color: type.color
            });
        });

        return teamLeaveTypes;
    } catch (e) {
        console.error('Erreur lors du chargement des types de congés de l\'équipe:', e);
        return {};
    }
}

// Supprimer une équipe
async function deleteTeam(teamId) {
    if (!this.user || !supabase || !teamId) {
        throw new Error('Paramètres manquants');
    }

    try {
        // Vérifier que l'utilisateur est le propriétaire
        const userTeam = this.userTeams.find(t => t.id === teamId);
        if (!userTeam || userTeam.createdBy !== this.user.id) {
            throw new Error('Seul le propriétaire peut supprimer l\'équipe');
        }

        // Supprimer l'équipe (les membres seront supprimés automatiquement via CASCADE)
        const { error } = await supabase
            .from('teams')
            .delete()
            .eq('id', teamId);

        if (error) throw error;

        // Recharger les équipes
        await this.loadUserTeams();
        
        // Si l'équipe supprimée était sélectionnée, sélectionner la première disponible
        if (this.currentTeamId === teamId) {
            this.currentTeamId = this.userTeams.length > 0 ? this.userTeams[0].id : null;
        }

        return true;
    } catch (e) {
        console.error('Erreur lors de la suppression de l\'équipe:', e);
        throw e;
    }
}

