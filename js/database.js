// Database - Opérations Supabase pour les congés, types, quotas et préférences
// Ces fonctions seront ajoutées au prototype de LeaveManager

// Charger les congés depuis Supabase
async function loadLeaves() {
    if (!this.user || !supabase) {
        this.leaves = {};
        return;
    }

    try {
        const { data, error } = await supabase
            .from('leaves')
            .select('*')
            .eq('user_id', this.user.id);

        if (error) throw error;

        // Convertir les données en format interne
        this.leaves = {};
        if (data) {
            data.forEach(leave => {
                this.leaves[leave.date_key] = leave.leave_type_id;
            });
        }
        console.log('Jours de congé chargés:', Object.keys(this.leaves).length, 'entrées');
    } catch (e) {
        console.error('Erreur lors du chargement des jours de congé:', e);
        this.leaves = {};
    }
}

// Sauvegarder les congés dans Supabase
async function saveLeaves() {
    if (!this.user || !supabase) return;

    try {
        // Récupérer tous les congés existants pour cet utilisateur
        const { data: existingLeaves } = await supabase
            .from('leaves')
            .select('id, date_key')
            .eq('user_id', this.user.id);

        const existingKeys = new Set(existingLeaves?.map(l => l.date_key) || []);
        const currentKeys = new Set(Object.keys(this.leaves));

        // Supprimer les congés qui n'existent plus
        const toDelete = existingLeaves?.filter(l => !currentKeys.has(l.date_key)) || [];
        if (toDelete.length > 0) {
            const idsToDelete = toDelete.map(l => l.id);
            await supabase
                .from('leaves')
                .delete()
                .in('id', idsToDelete);
        }

        // Insérer ou mettre à jour les congés
        const leavesToInsert = [];
        Object.keys(this.leaves).forEach(dateKey => {
            if (!existingKeys.has(dateKey)) {
                leavesToInsert.push({
                    user_id: this.user.id,
                    date_key: dateKey,
                    leave_type_id: this.leaves[dateKey]
                });
            }
        });

        if (leavesToInsert.length > 0) {
            await supabase
                .from('leaves')
                .insert(leavesToInsert);
        }

        console.log('Jours de congé sauvegardés:', Object.keys(this.leaves).length, 'entrées');
        this.updateStats();
        this.updateLeaveQuotas();
    } catch (e) {
        console.error('Erreur lors de la sauvegarde des jours de congé:', e);
    }
}

// Charger la configuration des types de congés depuis Supabase
async function loadLeaveTypesConfig() {
    if (!this.user || !supabase) {
        // Configuration par défaut si pas d'utilisateur
        this.leaveTypesConfig = getDefaultLeaveTypes();
        return;
    }

    try {
        const { data, error } = await supabase
            .from('leave_types')
            .select('*')
            .eq('user_id', this.user.id)
            .order('created_at');

        if (error) throw error;

        if (data && data.length > 0) {
            this.leaveTypesConfig = data.map(t => ({
                id: t.id,
                name: t.name,
                label: t.label,
                color: t.color
            }));
        } else {
            // Si aucun type n'existe, créer les types par défaut
            this.leaveTypesConfig = getDefaultLeaveTypes();
            await this.saveLeaveTypesConfig();
        }
    } catch (e) {
        console.error('Erreur lors du chargement des types de congés:', e);
        this.leaveTypesConfig = getDefaultLeaveTypes();
    }
}

// Sauvegarder la configuration des types de congés dans Supabase
async function saveLeaveTypesConfig() {
    if (!this.user || !supabase) {
        this.renderLeaveTypeButtons();
        this.updateLeaveQuotas();
        return;
    }

    try {
        // Récupérer tous les types existants
        const { data: existingTypes } = await supabase
            .from('leave_types')
            .select('id')
            .eq('user_id', this.user.id);

        const existingIds = new Set(existingTypes?.map(t => t.id) || []);
        const currentIds = new Set(this.leaveTypesConfig.map(t => t.id));

        // Supprimer les types qui n'existent plus
        const toDelete = existingTypes?.filter(t => !currentIds.has(t.id)) || [];
        if (toDelete.length > 0) {
            const idsToDelete = toDelete.map(t => t.id);
            await supabase
                .from('leave_types')
                .delete()
                .in('id', idsToDelete);
        }

        // Insérer ou mettre à jour les types
        const typesToInsert = [];
        const typesToUpdate = [];

        this.leaveTypesConfig.forEach(type => {
            if (existingIds.has(type.id)) {
                typesToUpdate.push(type);
            } else {
                typesToInsert.push({
                    id: type.id,
                    user_id: this.user.id,
                    name: type.name,
                    label: type.label,
                    color: type.color
                });
            }
        });

        // Insérer les nouveaux types
        if (typesToInsert.length > 0) {
            await supabase
                .from('leave_types')
                .insert(typesToInsert);
        }

        // Mettre à jour les types existants
        for (const type of typesToUpdate) {
            await supabase
                .from('leave_types')
                .update({
                    name: type.name,
                    label: type.label,
                    color: type.color
                })
                .eq('id', type.id)
                .eq('user_id', this.user.id);
        }

        this.renderLeaveTypeButtons();
        this.updateLeaveQuotas();
    } catch (e) {
        console.error('Erreur lors de la sauvegarde des types de congés:', e);
    }
}

// Charger les quotas par année depuis Supabase
async function loadLeaveQuotasByYear() {
    if (!this.user || !supabase) {
        this.leaveQuotasByYear = {};
        return;
    }

    try {
        const { data, error } = await supabase
            .from('leave_quotas')
            .select('*')
            .eq('user_id', this.user.id);

        if (error) throw error;

        // Convertir les données en format interne
        this.leaveQuotasByYear = {};
        if (data) {
            data.forEach(quota => {
                if (!this.leaveQuotasByYear[quota.year]) {
                    this.leaveQuotasByYear[quota.year] = {};
                }
                this.leaveQuotasByYear[quota.year][quota.leave_type_id] = quota.quota;
            });
        }

        // S'assurer que l'année en cours a des quotas par défaut si elle n'existe pas
        const currentYear = new Date().getFullYear();
        if (!this.leaveQuotasByYear[currentYear]) {
            this.leaveQuotasByYear[currentYear] = {
                'congé-payé': 25,
                'rtt': 22,
                'jours-hiver': 2
            };
            await this.saveLeaveQuotasByYear();
        }
    } catch (e) {
        console.error('Erreur lors du chargement des quotas:', e);
        this.leaveQuotasByYear = {};
    }
}

// Sauvegarder les quotas par année dans Supabase
async function saveLeaveQuotasByYear() {
    if (!this.user || !supabase) return;

    try {
        // Récupérer tous les quotas existants
        const { data: existingQuotas } = await supabase
            .from('leave_quotas')
            .select('id, leave_type_id, year')
            .eq('user_id', this.user.id);

        const existingMap = new Map();
        existingQuotas?.forEach(q => {
            const key = `${q.year}-${q.leave_type_id}`;
            existingMap.set(key, q.id);
        });

        // Insérer ou mettre à jour les quotas
        const quotasToInsert = [];
        const quotasToUpdate = [];

        Object.keys(this.leaveQuotasByYear).forEach(year => {
            Object.keys(this.leaveQuotasByYear[year]).forEach(leaveTypeId => {
                const quota = this.leaveQuotasByYear[year][leaveTypeId];
                const key = `${year}-${leaveTypeId}`;
                const existingId = existingMap.get(key);

                if (existingId) {
                    quotasToUpdate.push({
                        id: existingId,
                        quota: quota
                    });
                } else {
                    quotasToInsert.push({
                        user_id: this.user.id,
                        leave_type_id: leaveTypeId,
                        year: parseInt(year),
                        quota: quota
                    });
                }
            });
        });

        // Supprimer les quotas qui n'existent plus
        const currentKeys = new Set();
        Object.keys(this.leaveQuotasByYear).forEach(year => {
            Object.keys(this.leaveQuotasByYear[year]).forEach(leaveTypeId => {
                currentKeys.add(`${year}-${leaveTypeId}`);
            });
        });

        const toDelete = existingQuotas?.filter(q => {
            const key = `${q.year}-${q.leave_type_id}`;
            return !currentKeys.has(key);
        }) || [];

        if (toDelete.length > 0) {
            const idsToDelete = toDelete.map(q => q.id);
            await supabase
                .from('leave_quotas')
                .delete()
                .in('id', idsToDelete);
        }

        // Mettre à jour les quotas existants
        for (const quota of quotasToUpdate) {
            await supabase
                .from('leave_quotas')
                .update({ quota: quota.quota, updated_at: new Date().toISOString() })
                .eq('id', quota.id);
        }

        // Insérer les nouveaux quotas
        if (quotasToInsert.length > 0) {
            await supabase
                .from('leave_quotas')
                .insert(quotasToInsert);
        }
    } catch (e) {
        console.error('Erreur lors de la sauvegarde des quotas:', e);
    }
}

// Charger le pays sélectionné depuis Supabase
async function loadSelectedCountry() {
    if (!this.user || !supabase) {
        this.selectedCountry = 'FR';
        return;
    }

    try {
        const { data, error } = await supabase
            .from('user_preferences')
            .select('selected_country')
            .eq('user_id', this.user.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

        if (data) {
            this.selectedCountry = data.selected_country || 'FR';
        } else {
            this.selectedCountry = 'FR';
            await this.saveSelectedCountry();
        }
    } catch (e) {
        console.error('Erreur lors du chargement du pays:', e);
        this.selectedCountry = 'FR';
    }
}

// Sauvegarder le pays sélectionné dans Supabase
async function saveSelectedCountry() {
    if (!this.user || !supabase) {
        this.renderCalendar();
        return;
    }

    try {
        const { error } = await supabase
            .from('user_preferences')
            .upsert({
                user_id: this.user.id,
                selected_country: this.selectedCountry,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            });

        if (error) throw error;
        this.renderCalendar();
    } catch (e) {
        console.error('Erreur lors de la sauvegarde du pays:', e);
    }
}

