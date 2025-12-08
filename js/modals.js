// Modals - Gestion des modales (config, help)
// Ces fonctions seront ajoutées au prototype de LeaveManager

// Ouvrir la modale d'aide
function openHelpModal() {
    const modal = document.getElementById('helpModal');
    if (modal) {
        modal.style.display = 'block';
        modal.classList.add('active');
    }
}

// Fermer la modale d'aide
function closeHelpModal() {
    const modal = document.getElementById('helpModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
}

// Ouvrir la modale de configuration
function openConfigModal() {
    const modal = document.getElementById('configModal');
    // Réinitialiser l'année de configuration à l'année en cours
    this.configYear = this.currentDate.getFullYear();
    this.renderConfigModal();
    modal.style.display = 'block';
}

// Fermer la modale de configuration
function closeConfigModal() {
    const modal = document.getElementById('configModal');
    modal.style.display = 'none';
}

// Rendre la modale de configuration
function renderConfigModal() {
    // Mettre à jour le sélecteur de pays
    const countrySelect = document.getElementById('countrySelect');
    if (countrySelect) {
        countrySelect.value = this.selectedCountry;
    }

    // Mettre à jour le sélecteur d'année
    const yearSelect = document.getElementById('configYearSelect');
    if (yearSelect) {
        // Générer les options d'années (année actuelle - 2 à année actuelle + 5)
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
        
        // Event listener pour le changement d'année (éviter les doublons)
        if (!yearSelect.hasAttribute('data-listener-added')) {
            yearSelect.setAttribute('data-listener-added', 'true');
            yearSelect.addEventListener('change', (e) => {
                this.configYear = parseInt(e.target.value);
                this.renderConfigModal();
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
        item.innerHTML = `
            <div class="leave-type-inputs">
                <input type="text" class="leave-type-name" value="${typeConfig.name}" 
                       placeholder="Nom du type" data-index="${index}">
                <input type="text" class="leave-type-label" value="${typeConfig.label}" 
                       placeholder="Label (ex: P)" maxlength="10" data-index="${index}">
                <input type="color" class="leave-type-color" value="${typeConfig.color}" 
                       data-index="${index}">
                <input type="number" class="leave-type-quota" value="${quota !== null && quota !== undefined ? quota : ''}" 
                       placeholder="Quota (vide = illimité)" min="0" data-index="${index}">
                <button class="delete-type-btn" data-index="${index}" title="Supprimer ce type" aria-label="Supprimer">🗑️</button>
            </div>
        `;
        container.appendChild(item);
    });

    // Ajouter les événements
    container.querySelectorAll('.delete-type-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const index = parseInt(e.target.dataset.index);
            const typeToDelete = this.leaveTypesConfig[index];
            
            // Vérifier si ce type est utilisé dans les congés
            const isUsed = this.isLeaveTypeUsed(typeToDelete.id);
            
            let confirmMessage = `Êtes-vous sûr de vouloir supprimer le type "${typeToDelete.name}" ?`;
            if (isUsed) {
                confirmMessage += `\n\nAttention : Ce type est utilisé dans ${this.countLeaveTypeUsage(typeToDelete.id)} jour(s) de congé. Ces congés seront également supprimés.`;
            }
            if (this.leaveTypesConfig.length === 1) {
                confirmMessage += `\n\nAttention : C'est le dernier type de congé. Vous devrez en créer un nouveau.`;
            }
            
            if (confirm(confirmMessage)) {
                // Supprimer les congés de ce type
                if (isUsed) {
                    await this.removeLeavesOfType(typeToDelete.id);
                }
                
                // Supprimer le type de la configuration
                this.leaveTypesConfig.splice(index, 1);
                
                // Si c'était le dernier type, en créer un par défaut
                if (this.leaveTypesConfig.length === 0) {
                    this.leaveTypesConfig.push({
                        id: `type-${Date.now()}`,
                        name: 'Congé',
                        label: 'C',
                        color: '#4a90e2',
                        quota: null
                    });
                }
                
                this.renderConfigModal();
            }
        });
    });
}

// Vérifier si un type de congé est utilisé
function isLeaveTypeUsed(typeId) {
    return Object.values(this.leaves).includes(typeId);
}

// Compter le nombre de jours où un type de congé est utilisé
function countLeaveTypeUsage(typeId) {
    let count = 0;
    const processedDates = new Set();

    Object.keys(this.leaves).forEach(dateKey => {
        const baseDateKey = dateKey.split('-').slice(0, 3).join('-');
        
        if (!processedDates.has(baseDateKey)) {
            processedDates.add(baseDateKey);
            const leaveInfo = this.getLeaveForDate(new Date(baseDateKey));
            
            if (leaveInfo.full === typeId) {
                count += 1;
            } else {
                if (leaveInfo.morning === typeId) count += 0.5;
                if (leaveInfo.afternoon === typeId) count += 0.5;
            }
        }
    });

    return count;
}

// Supprimer tous les congés d'un type donné
async function removeLeavesOfType(typeId) {
    const keysToDelete = [];
    
    Object.keys(this.leaves).forEach(dateKey => {
        if (this.leaves[dateKey] === typeId) {
            keysToDelete.push(dateKey);
        }
    });
    
    keysToDelete.forEach(key => {
        delete this.leaves[key];
    });
    
    if (keysToDelete.length > 0) {
        await this.saveLeaves();
        this.renderCalendar();
    }
}

// Réinitialiser tous les jours de congé (pour débogage)
async function resetAllLeaves() {
    if (!this.user || !supabase) {
        alert('Erreur : Vous devez être connecté pour réinitialiser les congés.');
        return;
    }

    const confirmMessage = `⚠️ ATTENTION : Cette action est irréversible !\n\nÊtes-vous sûr de vouloir supprimer TOUS vos jours de congé ?\n\nCette action supprimera ${Object.keys(this.leaves).length} jour(s) de congé.`;
    
    if (!confirm(confirmMessage)) {
        return;
    }

    try {
        // Supprimer tous les congés de la base de données
        const { error } = await supabase
            .from('leaves')
            .delete()
            .eq('user_id', this.user.id);

        if (error) throw error;

        // Réinitialiser l'objet local
        this.leaves = {};
        
        // Mettre à jour l'affichage
        this.renderCalendar();
        this.updateStats();
        this.updateLeaveQuotas();
        
        // Fermer la modale de configuration
        this.closeConfigModal();
        
        alert('✅ Tous les jours de congé ont été supprimés avec succès.');
    } catch (e) {
        console.error('Erreur lors de la réinitialisation des congés:', e);
        alert('❌ Erreur lors de la suppression des congés. Vérifiez la console pour plus de détails.');
    }
}

// Ajouter un nouveau type de congé
function addLeaveType() {
    const newType = {
        id: `type-${Date.now()}`,
        name: 'Nouveau Type',
        label: 'NT',
        color: '#4a90e2',
        quota: null
    };
    this.leaveTypesConfig.push(newType);
    this.renderConfigModal();
}

// Sauvegarder la configuration
async function saveConfig() {
    // Sauvegarder le pays sélectionné
    const countrySelect = document.getElementById('countrySelect');
    if (countrySelect) {
        this.selectedCountry = countrySelect.value;
        await this.saveSelectedCountry();
    }

    const inputs = document.querySelectorAll('#leaveTypesConfig .leave-type-item');
    const newConfig = [];
    const selectedYear = this.configYear;

    // Initialiser l'année dans leaveQuotasByYear si elle n'existe pas
    if (!this.leaveQuotasByYear[selectedYear]) {
        this.leaveQuotasByYear[selectedYear] = {};
    }

    inputs.forEach((item, index) => {
        const name = item.querySelector('.leave-type-name').value.trim();
        const label = item.querySelector('.leave-type-label').value.trim();
        const color = item.querySelector('.leave-type-color').value;
        const quotaInput = item.querySelector('.leave-type-quota').value;
        const quota = quotaInput === '' ? null : parseInt(quotaInput);
        
        // Récupérer l'ID du type depuis la configuration actuelle
        const typeId = this.leaveTypesConfig[index].id;
        
        // Sauvegarder le quota pour l'année sélectionnée
        if (quota !== null && !isNaN(quota)) {
            this.leaveQuotasByYear[selectedYear][typeId] = quota;
        } else {
            // Supprimer le quota si vide
            if (this.leaveQuotasByYear[selectedYear][typeId] !== undefined) {
                delete this.leaveQuotasByYear[selectedYear][typeId];
            }
        }

        if (name && label) {
            const oldType = this.leaveTypesConfig[index];
            newConfig.push({
                id: oldType ? oldType.id : `type-${Date.now()}-${index}`,
                name: name,
                label: label,
                color: color
            });
        }
    });

    if (newConfig.length > 0) {
        // Sauvegarder les types de congés AVANT de mettre à jour la configuration
        // pour s'assurer que les jours de congé existants ne sont pas perdus
        console.log('Jours de congé avant sauvegarde de la config:', Object.keys(this.leaves).length, 'entrées');
        
        this.leaveTypesConfig = newConfig;
        await this.saveLeaveTypesConfig();
        await this.saveLeaveQuotasByYear();
        
        // Vérifier que les jours de congé sont toujours présents
        console.log('Jours de congé après sauvegarde de la config:', Object.keys(this.leaves).length, 'entrées');
        
        this.closeConfigModal();
        this.renderCalendar();
        this.updateStats();
        this.updateLeaveQuotas();
    } else {
        alert('Veuillez remplir au moins un type de congé avec un nom et un label.');
    }
}

