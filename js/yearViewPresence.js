// Vue annuelle Matrice de Présence - Pour comparer plusieurs calendriers
// Cette vue permet de voir les présences/absences de plusieurs utilisateurs

async function renderYearViewPresence() {
    const manager = this; // Capturer le contexte
    const semesterCalendar = document.getElementById('semesterCalendar');
    if (!semesterCalendar) {
        console.error('[YearViewPresence] semesterCalendar element not found');
        return;
    }
    semesterCalendar.innerHTML = '';
    semesterCalendar.className = 'year-calendar-view year-presence-view';
    
    const semesterView = document.getElementById('semesterView');
    if (semesterView) {
        semesterView.className = 'semester-view';
    }

    const year = getYear(this.currentDate);
    this.currentYear = year;
    console.log('[YearViewPresence] Rendu de la vue présence pour l\'année', year);
    
    const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    document.getElementById('currentMonth').textContent = `Matrice de Présence ${year}`;

    // Charger les utilisateurs de l'équipe sélectionnée ou utiliser l'utilisateur actuel
    let users = this.presenceUsers || [];
    
    // Si une équipe est sélectionnée, charger les données de l'équipe
    if (this.currentTeamId && typeof this.loadTeamLeaves === 'function' && typeof this.loadTeamMembers === 'function') {
        try {
            const members = await this.loadTeamMembers(this.currentTeamId);
            const teamLeaves = await this.loadTeamLeaves(this.currentTeamId, year);
            const teamLeaveTypes = await this.loadTeamLeaveTypes(this.currentTeamId);
            
            users = members.map(member => ({
                id: member.userId,
                name: member.email,
                leaves: teamLeaves[member.userId] || {},
                leaveTypes: teamLeaveTypes[member.userId] || []
            }));
        } catch (error) {
            console.error('Erreur lors du chargement des données de l\'équipe:', error);
            // Fallback sur l'utilisateur actuel
            users = [{ id: this.user?.id, name: this.user?.email || 'Moi', leaves: this.leaves }];
        }
    } else {
        // Pas d'équipe sélectionnée, utiliser seulement l'utilisateur actuel
        users = [{ id: this.user?.id, name: this.user?.email || 'Moi', leaves: this.leaves }];
    }
    
    // Créer le conteneur principal
    const presenceContainer = document.createElement('div');
    presenceContainer.className = 'year-presence-container';
    
    // En-tête avec les jours de l'année (groupés par mois)
    const headerRow = document.createElement('div');
    headerRow.className = 'year-presence-header-row';
    
    // Colonne pour les noms d'utilisateurs
    const userLabelCell = document.createElement('div');
    userLabelCell.className = 'year-presence-user-label';
    userLabelCell.textContent = 'Utilisateur';
    headerRow.appendChild(userLabelCell);
    
    // Obtenir le mois courant pour le scroll automatique
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const isCurrentYear = year === currentYear;
    
    // Créer une colonne pour chaque mois avec les jours
    for (let month = 0; month < 12; month++) {
        const monthColumn = document.createElement('div');
        monthColumn.className = 'year-presence-month-column';
        
        // Ajouter un identifiant pour le mois courant
        if (isCurrentYear && month === currentMonth) {
            monthColumn.id = 'current-month-column';
            monthColumn.classList.add('current-month');
        }
        
        // En-tête du mois
        const monthHeader = document.createElement('div');
        monthHeader.className = 'year-presence-month-header';
        monthHeader.textContent = monthNames[month];
        if (isCurrentYear && month === currentMonth) {
            monthHeader.classList.add('current-month-header');
        }
        monthColumn.appendChild(monthHeader);
        
        // Colonnes pour les jours du mois
        const daysContainer = document.createElement('div');
        daysContainer.className = 'year-presence-days-container';
        
        const firstDay = createDate(year, month, 1);
        const daysInMonth = getDaysInMonth(firstDay);
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'year-presence-day-header';
            dayHeader.textContent = day;
            
            // Ajouter un indicateur pour le jour de la semaine
            const date = createDate(year, month, day);
            const dayOfWeek = getDay(date);
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                dayHeader.classList.add('weekend');
            }
            
            // Indiquer si c'est un jour férié
            const publicHolidays = this.getPublicHolidays('FR', year);
            const dateKey = getDateKey(date);
            if (publicHolidays[dateKey]) {
                dayHeader.classList.add('public-holiday');
                dayHeader.title = publicHolidays[dateKey];
            }
            
            daysContainer.appendChild(dayHeader);
        }
        
        monthColumn.appendChild(daysContainer);
        headerRow.appendChild(monthColumn);
    }
    
    presenceContainer.appendChild(headerRow);
    
    // Créer une ligne pour chaque utilisateur
    users.forEach((user, userIndex) => {
        const userRow = document.createElement('div');
        userRow.className = 'year-presence-user-row';
        
        // Nom de l'utilisateur
        const userNameCell = document.createElement('div');
        userNameCell.className = 'year-presence-user-name';
        userNameCell.textContent = user.name;
        userRow.appendChild(userNameCell);
        
        // Colonnes pour chaque mois
        for (let month = 0; month < 12; month++) {
            const monthColumn = document.createElement('div');
            monthColumn.className = 'year-presence-month-column';
            
            const daysContainer = document.createElement('div');
            daysContainer.className = 'year-presence-days-container';
            
            const firstDay = createDate(year, month, 1);
            const daysInMonth = getDaysInMonth(firstDay);
            
            for (let day = 1; day <= daysInMonth; day++) {
                const date = createDate(year, month, day);
                const dayCell = manager.createPresenceDayCell(date, user);
                daysContainer.appendChild(dayCell);
            }
            
            monthColumn.appendChild(daysContainer);
            userRow.appendChild(monthColumn);
        }
        
        presenceContainer.appendChild(userRow);
    });
    
    // Ligne de statistiques (comptage des présences)
    const statsRow = document.createElement('div');
    statsRow.className = 'year-presence-stats-row';
    
    const statsLabelCell = document.createElement('div');
    statsLabelCell.className = 'year-presence-user-label';
    statsLabelCell.textContent = 'Présents';
    statsLabelCell.style.fontWeight = 'bold';
    statsRow.appendChild(statsLabelCell);
    
    // Compter les présences pour chaque jour
    for (let month = 0; month < 12; month++) {
        const monthColumn = document.createElement('div');
        monthColumn.className = 'year-presence-month-column';
        
        const daysContainer = document.createElement('div');
        daysContainer.className = 'year-presence-days-container';
        
        const firstDay = createDate(year, month, 1);
        const daysInMonth = getDaysInMonth(firstDay);
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = createDate(year, month, day);
            const dateKey = getDateKey(date);
            
            // Compter combien d'utilisateurs sont présents ce jour
            let presentCount = 0;
            const dayOfWeek = getDay(date);
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const publicHolidays = manager.getPublicHolidays('FR', year);
            const isHoliday = publicHolidays[dateKey];
            
            // Ne compter que les jours ouvrés (pas weekend, pas férié)
            if (!isWeekend && !isHoliday) {
                users.forEach(user => {
                    const userLeaves = user.leaves || {};
                    // Présent si pas de congé ce jour
                    const hasLeave = userLeaves[dateKey] || 
                                    userLeaves[`${dateKey}-morning`] || 
                                    userLeaves[`${dateKey}-afternoon`];
                    
                    if (!hasLeave) {
                        presentCount++;
                    }
                });
            }
            
            const statsCell = document.createElement('div');
            statsCell.className = 'year-presence-stats-cell';
            statsCell.textContent = presentCount;
            
            // Colorer selon le nombre de présents
            const totalUsers = users.length;
            const percentage = totalUsers > 0 ? (presentCount / totalUsers) * 100 : 0;
            
            if (percentage === 100) {
                statsCell.style.backgroundColor = '#4caf50'; // Vert = tous présents
            } else if (percentage >= 50) {
                statsCell.style.backgroundColor = '#ffc107'; // Jaune = la moitié
            } else if (percentage > 0) {
                statsCell.style.backgroundColor = '#ff9800'; // Orange = quelques présents
            } else {
                statsCell.style.backgroundColor = '#f44336'; // Rouge = personne
            }
            
            statsCell.title = `${presentCount}/${totalUsers} présents`;
            daysContainer.appendChild(statsCell);
        }
        
        monthColumn.appendChild(daysContainer);
        statsRow.appendChild(monthColumn);
    }
    
    presenceContainer.appendChild(statsRow);
    semesterCalendar.appendChild(presenceContainer);
    
    // Faire défiler automatiquement vers le mois courant si c'est l'année en cours
    if (isCurrentYear) {
        setTimeout(() => {
            const currentMonthColumn = document.getElementById('current-month-column');
            if (currentMonthColumn) {
                console.log('[YearViewPresence] Mois courant trouvé, scroll automatique...');
                
                // Le conteneur scrollable est semesterCalendar lui-même (qui a overflow-x: auto)
                const scrollContainer = semesterCalendar;
                
                if (scrollContainer) {
                    // Calculer la position de scroll pour centrer le mois courant
                    const containerRect = scrollContainer.getBoundingClientRect();
                    const columnRect = currentMonthColumn.getBoundingClientRect();
                    
                    // Position relative de la colonne par rapport au conteneur
                    const relativeLeft = columnRect.left - containerRect.left;
                    
                    // Calculer le scroll pour centrer la colonne
                    const scrollLeft = scrollContainer.scrollLeft + relativeLeft - (containerRect.width / 2) + (columnRect.width / 2);
                    
                    console.log('[YearViewPresence] Scroll vers:', scrollLeft);
                    
                    scrollContainer.scrollTo({
                        left: Math.max(0, scrollLeft),
                        behavior: 'smooth'
                    });
                } else {
                    // Fallback: utiliser scrollIntoView
                    console.log('[YearViewPresence] Utilisation de scrollIntoView comme fallback');
                    currentMonthColumn.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'nearest',
                        inline: 'center'
                    });
                }
            } else {
                console.warn('[YearViewPresence] Mois courant non trouvé (current-month-column)');
            }
        }, 300); // Augmenter le délai pour s'assurer que le DOM est complètement rendu
    }
}

// Créer une cellule de jour pour la matrice de présence
function createPresenceDayCell(date, user) {
    const cell = document.createElement('div');
    cell.className = 'year-presence-day-cell';
    const dateKey = getDateKey(date);
    cell.setAttribute('data-date-key', dateKey);
    cell.setAttribute('data-user-id', user.id);
    
    // Vérifier si c'est aujourd'hui, passé ou futur
    const todayDate = today();
    
    if (isSameDay(date, todayDate)) {
        cell.classList.add('today');
    } else if (isBefore(date, todayDate)) {
        cell.classList.add('past-day');
    } else {
        cell.classList.add('future-day');
    }
    
    // Vérifier si c'est un weekend
    const dayOfWeek = getDay(date);
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        cell.classList.add('weekend');
    }
    
    // Vérifier si c'est un jour férié
    const publicHolidays = this.getPublicHolidays('FR', getYear(date));
    if (publicHolidays[dateKey]) {
        cell.classList.add('public-holiday');
    }
    
    // Vérifier les congés de l'utilisateur
    const userLeaves = user.leaves || {};
    const leaveInfo = {
        full: userLeaves[dateKey],
        morning: userLeaves[`${dateKey}-morning`],
        afternoon: userLeaves[`${dateKey}-afternoon`]
    };
    
    if (leaveInfo.full || leaveInfo.morning || leaveInfo.afternoon) {
        // Si on a matin ET après-midi (et qu'ils sont différents), créer une division diagonale
        if (leaveInfo.morning && leaveInfo.afternoon && leaveInfo.morning !== leaveInfo.afternoon) {
            const morningConfig = this.getLeaveTypeConfig(leaveInfo.morning);
            const afternoonConfig = this.getLeaveTypeConfig(leaveInfo.afternoon);
            
            if (morningConfig && afternoonConfig) {
                cell.classList.add('has-leave', 'has-split');
                cell.style.position = 'relative';
                cell.style.overflow = 'hidden';
                cell.style.background = 'transparent';
                
                // Moitié supérieure gauche (matin) - triangle
                const morningHalf = document.createElement('div');
                morningHalf.className = 'presence-cell-half presence-cell-morning';
                morningHalf.style.position = 'absolute';
                morningHalf.style.top = '0';
                morningHalf.style.left = '0';
                morningHalf.style.width = '100%';
                morningHalf.style.height = '100%';
                morningHalf.style.backgroundColor = morningConfig.color;
                morningHalf.style.clipPath = 'polygon(0 0, 100% 0, 0 100%)';
                cell.appendChild(morningHalf);
                
                // Moitié inférieure droite (après-midi) - triangle
                const afternoonHalf = document.createElement('div');
                afternoonHalf.className = 'presence-cell-half presence-cell-afternoon';
                afternoonHalf.style.position = 'absolute';
                afternoonHalf.style.top = '0';
                afternoonHalf.style.left = '0';
                afternoonHalf.style.width = '100%';
                afternoonHalf.style.height = '100%';
                afternoonHalf.style.backgroundColor = afternoonConfig.color;
                afternoonHalf.style.clipPath = 'polygon(100% 0, 100% 100%, 0 100%)';
                cell.appendChild(afternoonHalf);
                
                // Ligne diagonale discrète pour séparer les deux parties
                const diagonalLine = document.createElement('div');
                diagonalLine.className = 'presence-cell-diagonal';
                diagonalLine.style.position = 'absolute';
                diagonalLine.style.top = '0';
                diagonalLine.style.left = '0';
                diagonalLine.style.width = '141.42%'; // √2 * 100% pour couvrir la diagonale complète
                diagonalLine.style.height = '1px';
                diagonalLine.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
                diagonalLine.style.transform = 'rotate(45deg)';
                diagonalLine.style.transformOrigin = 'top left';
                cell.appendChild(diagonalLine);
                
                cell.title = `${user.name} - Matin: ${morningConfig.name}, Après-midi: ${afternoonConfig.name}`;
            }
        } else {
            // Cas normal : journée complète ou une seule demi-journée
            const leaveType = leaveInfo.full || leaveInfo.morning || leaveInfo.afternoon;
            const leaveConfig = this.getLeaveTypeConfig(leaveType);
            
            if (leaveConfig) {
                cell.style.backgroundColor = leaveConfig.color;
                cell.style.color = 'white';
                cell.classList.add('has-leave');
                
                // Indicateur pour demi-journée
                if (!leaveInfo.full) {
                    if (leaveInfo.morning) {
                        cell.style.borderTopWidth = '3px';
                        cell.style.borderTopColor = 'white';
                    }
                    if (leaveInfo.afternoon) {
                        cell.style.borderBottomWidth = '3px';
                        cell.style.borderBottomColor = 'white';
                    }
                }
                
                cell.title = `${user.name} - ${leaveConfig.name}`;
            }
        }
    } else {
        // Présent (pas de congé)
        cell.classList.add('present');
        cell.title = `${user.name} - Présent`;
    }
    
    // Event listener pour le clic (pour ouvrir la modale de l'utilisateur)
    cell.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        // Seulement pour l'utilisateur actuel
        if (user.id !== this.user?.id) {
            return;
        }
        
        // Détecter si on est sur mobile (pas de sélection multiple sur mobile)
        const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Vérifier si Ctrl/Cmd est pressé pour la sélection multiple (uniquement sur desktop)
        const hasCtrl = this.ctrlKeyPressed || e.ctrlKey || e.metaKey;
        const isMultiSelect = !isMobile && hasCtrl;
        
        if (isMultiSelect) {
            // Sélection multiple : ajouter/retirer ce jour de la sélection
            const dateKey = getDateKey(date);
            const index = this.selectedDates.findIndex(d => getDateKey(d) === dateKey);
            
            if (index > -1) {
                // Déjà sélectionné, le retirer
                this.selectedDates.splice(index, 1);
            } else {
                // Pas sélectionné, l'ajouter
                this.selectedDates.push(date);
            }
            
            this.updateDateSelectionVisual();
            
            // Mettre à jour les jours ouvrés dans la modale si elle est ouverte
            if (document.getElementById('modal')?.style.display === 'block') {
                this.updateWorkingDaysInfo();
            }
            
            // Si on a désélectionné tous les jours, fermer la modale si elle est ouverte
            if (this.selectedDates.length === 0) {
                this.closeModal();
            }
        } else {
            // Sélection unique : sélectionner ce jour et ouvrir la modale
            const dateKey = getDateKey(date);
            const isDateSelected = this.selectedDates.some(d => getDateKey(d) === dateKey);
            
            if (this.selectedDates.length > 1 && isDateSelected) {
                // On clique sur un jour déjà sélectionné, ouvrir la modale
                this.openModal(date);
            } else {
                // Nouvelle sélection unique
                this.selectedDates = [date];
                this.selectedDate = date;
                this.updateDateSelectionVisual();
                this.openModal(date);
            }
        }
    });
    
    return cell;
}

