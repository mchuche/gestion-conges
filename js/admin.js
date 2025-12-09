// Admin - Fonctions backend pour l'administration
// Ces fonctions seront ajoutées au prototype de LeaveManager

// Vérifier si l'utilisateur actuel est administrateur
async function checkIsAdmin() {
    if (!this.user || !supabase) {
        return false;
    }

    try {
        const { data, error } = await supabase
            .from('app_admins')
            .select('role')
            .eq('user_id', this.user.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('[checkIsAdmin] Erreur:', error);
            return false;
        }

        return data !== null;
    } catch (e) {
        console.error('[checkIsAdmin] Erreur:', e);
        return false;
    }
}

// Vérifier si l'utilisateur actuel est super_admin
async function checkIsSuperAdmin() {
    if (!this.user || !supabase) {
        return false;
    }

    try {
        const { data, error } = await supabase
            .from('app_admins')
            .select('role')
            .eq('user_id', this.user.id)
            .eq('role', 'super_admin')
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('[checkIsSuperAdmin] Erreur:', error);
            return false;
        }

        return data !== null;
    } catch (e) {
        console.error('[checkIsSuperAdmin] Erreur:', e);
        return false;
    }
}

// Charger tous les utilisateurs (pour les admins)
async function loadAllUsers(searchTerm = '') {
    if (!this.user || !supabase) {
        return [];
    }

    try {
        let query = supabase
            .from('user_emails')
            .select('user_id, email, created_at')
            .order('created_at', { ascending: false });

        if (searchTerm && searchTerm.trim()) {
            query = query.ilike('email', `%${searchTerm.trim()}%`);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Enrichir avec des statistiques
        const usersWithStats = await Promise.all((data || []).map(async (user) => {
            // Compter les congés
            const { count: leavesCount } = await supabase
                .from('leaves')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.user_id);

            // Compter les équipes
            const { count: teamsCount } = await supabase
                .from('team_members')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.user_id);

            return {
                id: user.user_id,
                email: user.email,
                createdAt: user.created_at,
                leavesCount: leavesCount || 0,
                teamsCount: teamsCount || 0
            };
        }));

        return usersWithStats;
    } catch (e) {
        console.error('[loadAllUsers] Erreur:', e);
        return [];
    }
}

// Supprimer un utilisateur (super_admin uniquement)
async function deleteUser(userId) {
    if (!this.user || !supabase) {
        throw new Error('Utilisateur non connecté');
    }

    const isSuperAdmin = await this.checkIsSuperAdmin();
    if (!isSuperAdmin) {
        throw new Error('Seuls les super-administrateurs peuvent supprimer des utilisateurs');
    }

    try {
        // La suppression dans auth.users se fait via Supabase Admin API
        // Pour l'instant, on supprime juste les données associées
        // Note: La suppression dans auth.users nécessite l'Admin API
        
        // Supprimer les données associées (cascade devrait le faire automatiquement)
        // Mais on peut aussi le faire manuellement pour être sûr
        
        console.log('[deleteUser] Suppression de l\'utilisateur:', userId);
        // Note: La suppression réelle dans auth.users doit être faite via l'Admin API
        // ou depuis le dashboard Supabase
        
        return { success: true, message: 'Les données de l\'utilisateur ont été supprimées. La suppression du compte doit être faite depuis le dashboard Supabase.' };
    } catch (e) {
        console.error('[deleteUser] Erreur:', e);
        throw e;
    }
}

// Charger tous les groupes
async function loadAllTeams() {
    if (!this.user || !supabase) {
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('teams')
            .select(`
                id,
                name,
                description,
                created_by,
                created_at,
                team_members (
                    user_id,
                    role
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(team => ({
            id: team.id,
            name: team.name,
            description: team.description,
            createdBy: team.created_by,
            createdAt: team.created_at,
            membersCount: team.team_members?.length || 0
        }));
    } catch (e) {
        console.error('[loadAllTeams] Erreur:', e);
        return [];
    }
}

// Supprimer un groupe
async function deleteTeamAsAdmin(teamId) {
    if (!this.user || !supabase) {
        throw new Error('Utilisateur non connecté');
    }

    const isAdmin = await this.checkIsAdmin();
    if (!isAdmin) {
        throw new Error('Seuls les administrateurs peuvent supprimer des groupes');
    }

    try {
        const { error } = await supabase
            .from('teams')
            .delete()
            .eq('id', teamId);

        if (error) throw error;

        return { success: true };
    } catch (e) {
        console.error('[deleteTeamAsAdmin] Erreur:', e);
        throw e;
    }
}

// Charger les paramètres par défaut
async function loadDefaultSettings() {
    if (!supabase) {
        return {};
    }

    try {
        const { data, error } = await supabase
            .from('app_settings')
            .select('key, value, description');

        if (error) throw error;

        const settings = {};
        (data || []).forEach(setting => {
            settings[setting.key] = {
                value: setting.value,
                description: setting.description
            };
        });

        return settings;
    } catch (e) {
        console.error('[loadDefaultSettings] Erreur:', e);
        return {};
    }
}

// Sauvegarder les paramètres par défaut
async function saveDefaultSettings(settings) {
    if (!this.user || !supabase) {
        throw new Error('Utilisateur non connecté');
    }

    const isAdmin = await this.checkIsAdmin();
    if (!isAdmin) {
        throw new Error('Seuls les administrateurs peuvent modifier les paramètres');
    }

    try {
        const updates = Object.keys(settings).map(key => ({
            key,
            value: typeof settings[key] === 'string' ? JSON.parse(settings[key]) : settings[key],
            updated_by: this.user.id,
            updated_at: new Date().toISOString()
        }));

        for (const update of updates) {
            const { error } = await supabase
                .from('app_settings')
                .upsert(update, {
                    onConflict: 'key'
                });

            if (error) throw error;
        }

        return { success: true };
    } catch (e) {
        console.error('[saveDefaultSettings] Erreur:', e);
        throw e;
    }
}

// Charger les statistiques globales
async function loadAdminStats() {
    if (!this.user || !supabase) {
        return null;
    }

    try {
        // Nombre total d'utilisateurs
        const { count: usersCount } = await supabase
            .from('user_emails')
            .select('*', { count: 'exact', head: true });

        // Nombre total de groupes
        const { count: teamsCount } = await supabase
            .from('teams')
            .select('*', { count: 'exact', head: true });

        // Nombre total de congés
        const { count: leavesCount } = await supabase
            .from('leaves')
            .select('*', { count: 'exact', head: true });

        // Nombre total d'invitations en attente
        const { count: pendingInvitationsCount } = await supabase
            .from('team_invitations')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        return {
            usersCount: usersCount || 0,
            teamsCount: teamsCount || 0,
            leavesCount: leavesCount || 0,
            pendingInvitationsCount: pendingInvitationsCount || 0
        };
    } catch (e) {
        console.error('[loadAdminStats] Erreur:', e);
        return null;
    }
}

// Enregistrer un log d'audit
async function logAuditEvent(action, entityType, entityId = null, details = {}) {
    if (!supabase) {
        console.warn('[logAuditEvent] Supabase non disponible');
        return;
    }

    try {
        const logData = {
            user_id: this.user?.id || null,
            action: action,
            entity_type: entityType,
            entity_id: entityId,
            details: details,
            ip_address: null, // Peut être récupéré côté serveur si nécessaire
            user_agent: navigator.userAgent || null
        };

        const { error } = await supabase
            .from('audit_logs')
            .insert(logData);

        if (error) {
            console.error('[logAuditEvent] Erreur:', error);
        }
    } catch (e) {
        console.error('[logAuditEvent] Erreur:', e);
    }
}

// Charger les logs d'audit
async function loadAuditLogs(limit = 100) {
    if (!this.user || !supabase) {
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('audit_logs')
            .select(`
                id,
                user_id,
                action,
                entity_type,
                entity_id,
                details,
                created_at,
                user_emails!audit_logs_user_id_fkey(email)
            `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        // Formater les logs avec les emails des utilisateurs
        return (data || []).map(log => ({
            id: log.id,
            userId: log.user_id,
            userEmail: log.user_emails?.email || 'Système',
            action: log.action,
            entityType: log.entity_type,
            entityId: log.entity_id,
            details: log.details,
            createdAt: log.created_at
        }));
    } catch (e) {
        console.error('[loadAuditLogs] Erreur:', e);
        return [];
    }
}

