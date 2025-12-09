// Stats - Statistiques et quotas
// Ces fonctions seront ajoutées au prototype de LeaveManager

// Obtenir le quota d'un type de congé pour une année donnée
function getQuotaForYear(typeId, year) {
    // Si l'année demandée a des quotas configurés, les utiliser
    if (this.leaveQuotasByYear && this.leaveQuotasByYear[year]) {
        const quota = this.leaveQuotasByYear[year][typeId];
        if (quota !== undefined && quota !== null) {
            return quota;
        }
    }
    
    // Sinon, utiliser les quotas de l'année en cours par défaut
    const currentYear = new Date().getFullYear();
    if (this.leaveQuotasByYear && this.leaveQuotasByYear[currentYear]) {
        const quota = this.leaveQuotasByYear[currentYear][typeId];
        if (quota !== undefined && quota !== null) {
            return quota;
        }
    }
    
    return null;
}

// Vérifier si un type de congé a un quota valide (> 0)
function hasValidQuota(typeId, year) {
    const quota = this.getQuotaForYear(typeId, year);
    return quota !== null && quota !== undefined && quota > 0;
}

// Mettre à jour les statistiques
function updateStats() {
    // Utiliser l'année de la vue actuelle avec date-fns
    const currentYear = getYear(this.currentDate);
    
    // Compter les jours (0.5 pour demi-journée, 1 pour journée complète) pour l'année en cours uniquement
    // Exclure les types sans quota ou avec quota = 0
    const usedDays = {};
    const processedDatesForQuota = new Set();
    let totalRemaining = 0;

    Object.keys(this.leaves).forEach(dateKey => {
        const baseDateKey = dateKey.split('-').slice(0, 3).join('-');
        const date = new Date(baseDateKey);
        
        // Filtrer par année avec date-fns
        if (getYear(date) !== currentYear) {
            return;
        }
        
        if (!processedDatesForQuota.has(baseDateKey)) {
            processedDatesForQuota.add(baseDateKey);
            const leaveInfo = this.getLeaveForDate(date);
            
            // Ne compter que les jours de types avec quota valide (> 0)
            if (leaveInfo.full && this.hasValidQuota(leaveInfo.full, currentYear)) {
                usedDays[leaveInfo.full] = (usedDays[leaveInfo.full] || 0) + 1;
            } else {
                if (leaveInfo.morning && this.hasValidQuota(leaveInfo.morning, currentYear)) {
                    usedDays[leaveInfo.morning] = (usedDays[leaveInfo.morning] || 0) + 0.5;
                }
                if (leaveInfo.afternoon && this.hasValidQuota(leaveInfo.afternoon, currentYear)) {
                    usedDays[leaveInfo.afternoon] = (usedDays[leaveInfo.afternoon] || 0) + 0.5;
                }
            }
        }
    });

    // Calculer les jours restants et le total des quotas pour chaque type avec quota (pour l'année en cours)
    let totalQuotas = 0;
    let totalUsed = 0; // Total des jours posés
    console.log('Calcul des jours restants pour l\'année:', currentYear);
    console.log('Quotas disponibles:', this.leaveQuotasByYear);
    this.leaveTypesConfig.forEach(typeConfig => {
        const quota = this.getQuotaForYear(typeConfig.id, currentYear);
        console.log(`Type: ${typeConfig.name} (${typeConfig.id}), Quota: ${quota}`);
        if (quota !== null && quota !== undefined && quota > 0) {
            totalQuotas += quota; // Ajouter au total des quotas
            const used = usedDays[typeConfig.id] || 0;
            totalUsed += used; // Ajouter au total des jours posés
            const remaining = quota - used;
            totalRemaining += Math.max(0, remaining); // Ne pas compter les dépassements négatifs
            console.log(`  -> Utilisé: ${used}, Restant: ${remaining}`);
        }
    });
    
    console.log(`Total jours posés: ${totalUsed}, Total jours restants: ${totalRemaining}, Total quotas: ${totalQuotas}`);

    // Afficher le total des jours posés
    const totalDaysElement = document.getElementById('totalDays');
    if (totalDaysElement) {
        totalDaysElement.textContent = formatNumber(totalUsed);
    }
    
    // Afficher au format "restants/total" (ex: 24/49 ou 24.5/49.5)
    document.getElementById('remainingDays').textContent = `${formatNumber(totalRemaining)}/${formatNumber(totalQuotas)}`;
}

// Mettre à jour l'affichage des quotas
function updateLeaveQuotas() {
    const container = document.getElementById('leaveQuotas');
    container.innerHTML = '';

    // Utiliser l'année de la vue actuelle
    const currentYear = this.currentDate.getFullYear();

    // Compter les jours utilisés par type (0.5 pour demi-journée, 1 pour journée complète) pour l'année en cours uniquement
    // Exclure les types sans quota ou avec quota = 0
    const usedDays = {};
    const processedDates = new Set();

    Object.keys(this.leaves).forEach(dateKey => {
        const baseDateKey = dateKey.split('-').slice(0, 3).join('-');
        const date = new Date(baseDateKey);
        
        // Filtrer par année
        if (date.getFullYear() !== currentYear) {
            return;
        }
        
        if (!processedDates.has(baseDateKey)) {
            processedDates.add(baseDateKey);
            const leaveInfo = this.getLeaveForDate(date);
            
            // Ne compter que les jours de types avec quota valide (> 0)
            if (leaveInfo.full && this.hasValidQuota(leaveInfo.full, currentYear)) {
                usedDays[leaveInfo.full] = (usedDays[leaveInfo.full] || 0) + 1;
            } else {
                if (leaveInfo.morning && this.hasValidQuota(leaveInfo.morning, currentYear)) {
                    usedDays[leaveInfo.morning] = (usedDays[leaveInfo.morning] || 0) + 0.5;
                }
                if (leaveInfo.afternoon && this.hasValidQuota(leaveInfo.afternoon, currentYear)) {
                    usedDays[leaveInfo.afternoon] = (usedDays[leaveInfo.afternoon] || 0) + 0.5;
                }
            }
        }
    });

    // Créer les cartes de quota (pour l'année en cours)
    // Exclure les types sans quota ou avec quota = 0
    this.leaveTypesConfig.forEach(typeConfig => {
        const quota = this.getQuotaForYear(typeConfig.id, currentYear);
        if (quota !== null && quota !== undefined && quota > 0) {
            const used = usedDays[typeConfig.id] || 0;
            const remaining = quota - used;
            const percentage = quota > 0 ? (used / quota) * 100 : 0;

            const quotaCard = document.createElement('div');
            quotaCard.className = 'quota-card';
            
            const quotaHeader = document.createElement('div');
            quotaHeader.className = 'quota-header';
            quotaHeader.innerHTML = `
                <span class="quota-name">${typeConfig.name}</span>
                <span class="quota-numbers">${formatNumber(used)} / ${formatNumber(quota)}</span>
            `;
            quotaCard.appendChild(quotaHeader);

            const quotaBar = document.createElement('div');
            quotaBar.className = 'quota-bar';
            const quotaFill = document.createElement('div');
            quotaFill.className = 'quota-fill';
            quotaFill.style.width = `${Math.min(percentage, 100)}%`;
            quotaFill.style.backgroundColor = typeConfig.color;
            quotaBar.appendChild(quotaFill);
            quotaCard.appendChild(quotaBar);

            const quotaFooter = document.createElement('div');
            quotaFooter.className = 'quota-footer';
            quotaFooter.innerHTML = `
                <span class="quota-remaining ${remaining < 0 ? 'quota-exceeded' : ''}">
                    ${remaining >= 0 ? `Restant: ${formatNumber(remaining)}` : `Dépassé: ${formatNumber(Math.abs(remaining))}`}
                </span>
            `;
            quotaCard.appendChild(quotaFooter);

            container.appendChild(quotaCard);
        }
    });
}

