/**
 * Modals - Gestion des modales (configuration, aide)
 * 
 * Ce module contient toutes les fonctions liées à l'affichage et à la gestion
 * des modales de l'application (modale d'aide, modale de configuration).
 * Ces fonctions seront ajoutées au prototype de LeaveManager.
 */

/**
 * Ouvre la modale d'aide qui contient les instructions d'utilisation de l'application
 */
function openHelpModal() {
    const modal = document.getElementById('helpModal');
    if (modal) {
        modal.style.display = 'block';
        modal.classList.add('active');
    }
}

/**
 * Ferme la modale d'aide
 */
function closeHelpModal() {
    const modal = document.getElementById('helpModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
}

/**
 * Ouvre la modale de configuration où l'utilisateur peut :
 * - Configurer les types de congés (nom, label, couleur, quota)
 * - Réinitialiser tous les congés
 * - Supprimer son compte
 */
function openConfigModal() {
    const modal = document.getElementById('configModal');
    // Réinitialiser l'année de configuration à l'année en cours
    this.configYear = this.currentDate.getFullYear();
    this.renderConfigModal();
    modal.style.display = 'block';
}

/**
 * Ferme la modale de configuration
 */
function closeConfigModal() {
    const modal = document.getElementById('configModal');
    modal.style.display = 'none';
}

/**
 * Rend (affiche) le contenu de la modale de configuration
 * 
 * Cette fonction :
 * 1. Met à jour le sélecteur d'année avec les années disponibles
 * 2. Affiche tous les types de congés configurés avec leurs paramètres
 * 3. Ajoute les event listeners pour les interactions (suppression, modification)
 */
function renderConfigModal() {
    // Mettre à jour le sélecteur d'année
    const yearSelect = document.getElementById('configYearSelect');
    if (yearSelect) {
        // Générer les options d'années (année actuelle - 2 à année actuelle + 5)
        // Cela permet de configurer les quotas pour les années passées et futures
        const currentYear = this.currentDate.getFullYear();
        yearSelect.innerHTML = '';
        for (let year = currentYear - 2; year <= currentYear + 5; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            if (year === this.configYear) {
                option.selected = true;
            }
            yearSelect.appendChild(option);
        }
        
        // Event listener pour le changement d'année (éviter les doublons avec l'attribut data-listener-added)
        if (!yearSelect.hasAttribute('data-listener-added')) {
            yearSelect.setAttribute('data-listener-added', 'true');
            yearSelect.addEventListener('change', (e) => {
                this.configYear = parseInt(e.target.value);
                this.renderConfigModal(); // Re-rendre avec la nouvelle année
            });
        }
    }

    const container = document.getElementById('leaveTypesConfig');
    container.innerHTML = '';

    // Afficher les quotas pour l'année sélectionnée
    const selectedYear = this.configYear;
    this.leaveTypesConfig.forEach((typeConfig, index) => {
        const quota = this.getQuotaForYear(typeConfig.id, selectedYear);
        const item = document.createElement('div');
        item.className = 'leave-type-item';
        const category = typeConfig.category || 'leave';
        item.innerHTML = `
            <div class="leave-type-inputs">
                <input type="text" class="leave-type-name" value="${typeConfig.name}" 
                       placeholder="Nom du type" data-index="${index}">
                <input type="text" class="leave-type-label" value="${typeConfig.label}" 
                       placeholder="Label (ex: P)" maxlength="10" data-index="${index}">
                <input type="color" class="leave-type-color" value="${typeConfig.color}" 
                       data-index="${index}">
                <select class="leave-type-category" data-index="${index}" title="Catégorie : Congé (avec quota) ou Événement (sans quota)">
                    <option value="leave" ${category === 'leave' ? 'selected' : ''}>Congé</option>
                    <option value="event" ${category === 'event' ? 'selected' : ''}>Événement</option>
                </select>
                <input type="number" class="leave-type-quota" value="${quota !== null && quota !== undefined ? quota : ''}" 
                       placeholder="Quota (vide = illimité)" min="0" data-index="${index}" 
                       ${category === 'event' ? 'disabled' : ''} title="${category === 'event' ? 'Les événements n\'ont pas de quota' : 'Quota pour ce congé'}">
                <button class="delete-type-btn" data-index="${index}" title="Supprimer ce type" aria-label="Supprimer">⌧</button>
            </div>
        `;
        container.appendChild(item);
        
        // Ajouter un event listener pour désactiver/activer le quota selon la catégorie
        const categorySelect = item.querySelector('.leave-type-category');
        const quotaInput = item.querySelector('.leave-type-quota');
        
        if (categorySelect && quotaInput) {
            // Event listener pour changer la catégorie
            categorySelect.addEventListener('change', (e) => {
                const selectedCategory = e.target.value;
                if (selectedCategory === 'event') {
                    quotaInput.disabled = true;
                    quotaInput.value = '';
                    quotaInput.title = 'Les événements n\'ont pas de quota';
                } else {
                    quotaInput.disabled = false;
                    quotaInput.title = 'Quota pour ce congé';
                }
            });
        }
    });

    // Ajouter les événements pour les boutons de suppression de type
    container.querySelectorAll('.delete-type-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const index = parseInt(e.target.dataset.index);
            const typeToDelete = this.leaveTypesConfig[index];
            
            // Vérifier si ce type est utilisé dans les congés existants
            const isUsed = this.isLeaveTypeUsed(typeToDelete.id);
            
            // Construire le message de confirmation avec les avertissements appropriés
            let confirmMessage = `Êtes-vous sûr de vouloir supprimer le type "${typeToDelete.name}" ?`;
            if (isUsed) {
                const usageCount = this.countLeaveTypeUsage(typeToDelete.id);
                confirmMessage += `\n\n⚠️ Attention : Ce type est utilisé dans ${usageCount} jour(s) de congé. Ces congés seront également supprimés.`;
            }
            if (this.leaveTypesConfig.length === 1) {
                confirmMessage += `\n\n⚠️ Attention : C'est le dernier type de congé. Vous devrez en créer un nouveau.`;
            }
            
            // Utiliser SweetAlert2 pour la confirmation au lieu de confirm() natif
            const confirmed = await swalConfirm(
                'Supprimer le type de congé',
                confirmMessage,
                'warning'
            );
            
            if (confirmed) {
                // Supprimer les congés de ce type si nécessaire
                if (isUsed) {
                    await this.removeLeavesOfType(typeToDelete.id);
                }
                
                // Supprimer le type de la configuration
                this.leaveTypesConfig.splice(index, 1);
                
                // Si c'était le dernier type, en créer un par défaut pour éviter une configuration vide
                if (this.leaveTypesConfig.length === 0) {
                    this.leaveTypesConfig.push({
                        id: `type-${Date.now()}`,
                        name: 'Congé',
                        label: 'C',
                        color: '#4a90e2',
                        category: 'leave'
                    });
                }
                
                // Sauvegarder et re-rendre la modale
                await this.saveLeaveTypesConfig();
                this.renderConfigModal();
            }
        });
    });
}

/**
 * Vérifie si un type de congé est utilisé dans au moins un jour de congé
 * 
 * @param {string} typeId - L'identifiant du type de congé à vérifier
 * @returns {boolean} - true si le type est utilisé, false sinon
 */
function isLeaveTypeUsed(typeId) {
    return Object.values(this.leaves).includes(typeId);
}

/**
 * Compte le nombre de jours (ou demi-jours) où un type de congé est utilisé
 * 
 * @param {string} typeId - L'identifiant du type de congé à compter
 * @returns {number} - Le nombre de jours (1 = journée complète, 0.5 = demi-journée)
 */
function countLeaveTypeUsage(typeId) {
    let count = 0;
    const processedDates = new Set(); // Éviter de compter deux fois la même date

    Object.keys(this.leaves).forEach(dateKey => {
        // Extraire la date de base (sans le suffixe de période -morning/-afternoon)
        const baseDateKey = dateKey.split('-').slice(0, 3).join('-');
        
        if (!processedDates.has(baseDateKey)) {
            processedDates.add(baseDateKey);
            const leaveInfo = this.getLeaveForDate(new Date(baseDateKey));
            
            // Compter les journées complètes et les demi-journées
            if (leaveInfo.full === typeId) {
                count += 1; // Journée complète
            } else {
                if (leaveInfo.morning === typeId) count += 0.5; // Demi-journée matin
                if (leaveInfo.afternoon === typeId) count += 0.5; // Demi-journée après-midi
            }
        }
    });

    return count;
}

/**
 * Supprime tous les congés d'un type donné
 * 
 * @param {string} typeId - L'identifiant du type de congé à supprimer
 */
async function removeLeavesOfType(typeId) {
    const keysToDelete = [];
    
    // Collecter toutes les clés de dates qui utilisent ce type
    Object.keys(this.leaves).forEach(dateKey => {
        if (this.leaves[dateKey] === typeId) {
            keysToDelete.push(dateKey);
        }
    });
    
    // Supprimer les congés de l'objet local
    keysToDelete.forEach(key => {
        delete this.leaves[key];
    });
    
    // Sauvegarder dans la base de données et mettre à jour l'affichage
    if (keysToDelete.length > 0) {
        await this.saveLeaves();
        this.renderCalendar();
    }
}

/**
 * Réinitialise tous les jours de congé de l'utilisateur
 * 
 * ⚠️ ATTENTION : Cette action est irréversible et supprime définitivement
 * tous les congés enregistrés dans la base de données.
 * 
 * Cette fonction :
 * 1. Vérifie que l'utilisateur est connecté
 * 2. Demande confirmation avec un message d'avertissement
 * 3. Supprime tous les congés de la base de données
 * 4. Réinitialise l'objet local
 * 5. Met à jour l'affichage (calendrier, statistiques, quotas)
 */
async function resetAllLeaves() {
    // Vérifier que l'utilisateur est connecté
    if (!this.user || !supabase) {
        await swalError(
            'Erreur',
            'Vous devez être connecté pour réinitialiser les congés.'
        );
        return;
    }

    const leavesCount = Object.keys(this.leaves).length;
    const confirmMessage = `⚠️ <strong>ATTENTION : Cette action est irréversible !</strong><br><br>Êtes-vous sûr de vouloir supprimer <strong>TOUS</strong> vos jours de congé ?<br><br>Cette action supprimera <strong>${leavesCount}</strong> jour(s) de congé.`;
    
    // Utiliser SweetAlert2 pour la confirmation
    const confirmed = await swalConfirmHTML(
        'Réinitialiser tous les congés',
        confirmMessage,
        'warning'
    );
    
    if (!confirmed) {
        return;
    }

    try {
        // Supprimer tous les congés de la base de données Supabase
        const { error } = await supabase
            .from('leaves')
            .delete()
            .eq('user_id', this.user.id);

        if (error) throw error;

        // Réinitialiser l'objet local (mémoire)
        this.leaves = {};
        
        // Mettre à jour l'affichage pour refléter les changements
        this.renderCalendar();
        this.updateStats();
        this.updateLeaveQuotas();
        
        // Fermer la modale de configuration
        this.closeConfigModal();
        
        // Afficher un message de succès
        await swalSuccess(
            '✅ Réinitialisation réussie',
            `Tous les jours de congé (${leavesCount} jour(s)) ont été supprimés avec succès.`
        );
    } catch (e) {
        logger.error('Erreur lors de la réinitialisation des congés:', e);
        await swalError(
            '❌ Erreur',
            'Erreur lors de la suppression des congés. Vérifiez la console pour plus de détails.'
        );
    }
}

/**
 * Ajoute un nouveau type de congé à la configuration
 * 
 * Crée un type par défaut avec :
 * - Un ID unique basé sur le timestamp
 * - Un nom par défaut "Nouveau Type"
 * - Un label par défaut "NT"
 * - Une couleur par défaut bleue
 * - Pas de quota (illimité)
 */
function addLeaveType() {
    const newType = {
        id: `type-${Date.now()}`,
        name: 'Nouveau Type',
        label: 'NT',
        color: '#4a90e2',
        category: 'leave'
    };
    this.leaveTypesConfig.push(newType);
    this.renderConfigModal(); // Re-rendre pour afficher le nouveau type
}

/**
 * Sauvegarde la configuration des types de congés et des quotas
 * 
 * Cette fonction :
 * 1. Collecte tous les types de congés depuis les inputs de la modale
 * 2. Valide que chaque type a au moins un nom et un label
 * 3. Sauvegarde les quotas pour l'année sélectionnée
 * 4. Met à jour la configuration locale
 * 5. Sauvegarde dans Supabase
 * 6. Met à jour l'affichage (calendrier, statistiques, quotas)
 */
async function saveConfig() {
    // Récupérer tous les éléments de type de congé depuis la modale
    const inputs = document.querySelectorAll('#leaveTypesConfig .leave-type-item');
    const newConfig = [];
    const selectedYear = this.configYear;

    // Initialiser l'année dans leaveQuotasByYear si elle n'existe pas encore
    // Cela permet de stocker les quotas par année
    if (!this.leaveQuotasByYear[selectedYear]) {
        this.leaveQuotasByYear[selectedYear] = {};
    }

    // Parcourir chaque type de congé et collecter ses informations
    inputs.forEach((item, index) => {
        const name = item.querySelector('.leave-type-name').value.trim();
        const label = item.querySelector('.leave-type-label').value.trim();
        const color = item.querySelector('.leave-type-color').value;
        const category = item.querySelector('.leave-type-category').value || 'leave';
        const quotaInput = item.querySelector('.leave-type-quota').value;
        const quota = quotaInput === '' ? null : parseInt(quotaInput);
        
        // Récupérer l'ID du type depuis la configuration actuelle
        // L'ID est important car il lie les congés existants au type
        const typeId = this.leaveTypesConfig[index]?.id;
        
        // Sauvegarder le quota pour l'année sélectionnée (seulement pour les congés)
        if (category === 'leave') {
            if (quota !== null && !isNaN(quota)) {
                this.leaveQuotasByYear[selectedYear][typeId] = quota;
            } else {
                // Supprimer le quota si le champ est vide (quota illimité)
                if (this.leaveQuotasByYear[selectedYear][typeId] !== undefined) {
                    delete this.leaveQuotasByYear[selectedYear][typeId];
                }
            }
        } else {
            // Supprimer le quota pour les événements
            if (this.leaveQuotasByYear[selectedYear][typeId] !== undefined) {
                delete this.leaveQuotasByYear[selectedYear][typeId];
            }
        }

        // Ajouter le type à la nouvelle configuration seulement s'il a un nom et un label
        if (name && label) {
            const oldType = this.leaveTypesConfig[index];
            newConfig.push({
                id: oldType ? oldType.id : `type-${Date.now()}-${index}`, // Conserver l'ID existant ou en créer un nouveau
                name: name,
                label: label,
                color: color,
                category: category
            });
        }
    });

    // Valider qu'au moins un type de congé est configuré
    if (newConfig.length > 0) {
        // Sauvegarder les types de congés AVANT de mettre à jour la configuration
        // pour s'assurer que les jours de congé existants ne sont pas perdus
        logger.debug('Jours de congé avant sauvegarde de la config:', Object.keys(this.leaves).length, 'entrées');
        
        // Mettre à jour la configuration locale
        this.leaveTypesConfig = newConfig;
        
        // Sauvegarder dans Supabase
        await this.saveLeaveTypesConfig();
        await this.saveLeaveQuotasByYear();
        
        // Vérifier que les jours de congé sont toujours présents après la sauvegarde
        logger.debug('Jours de congé après sauvegarde de la config:', Object.keys(this.leaves).length, 'entrées');
        
        // Fermer la modale et mettre à jour l'affichage
        this.closeConfigModal();
        this.renderCalendar();
        this.updateStats();
        this.updateLeaveQuotas();
    } else {
        // Afficher une erreur si aucun type n'est configuré
        await swalError(
            'Configuration incomplète',
            'Veuillez remplir au moins un type de congé avec un nom et un label.'
        );
    }
}


