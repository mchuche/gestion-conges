// Vue annuelle Matrice de Présence - Pour comparer plusieurs calendriers
// Cette vue permet de voir les présences/absences de plusieurs utilisateurs

function renderYearViewPresence() {
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

    // Pour l'instant, on affiche seulement le calendrier de l'utilisateur actuel
    // Plus tard, on pourra charger plusieurs utilisateurs depuis la base de données
    const users = this.presenceUsers || [{ id: this.user?.id, name: this.user?.email || 'Moi', leaves: this.leaves }];
    
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
    
    // Créer une colonne pour chaque mois avec les jours
    for (let month = 0; month < 12; month++) {
        const monthColumn = document.createElement('div');
        monthColumn.className = 'year-presence-month-column';
        
        // En-tête du mois
        const monthHeader = document.createElement('div');
        monthHeader.className = 'year-presence-month-header';
        monthHeader.textContent = monthNames[month];
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
                const dayCell = this.createPresenceDayCell(date, user);
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
            users.forEach(user => {
                const userLeaves = user.leaves || {};
                // Présent si pas de congé ce jour
                const hasLeave = userLeaves[dateKey] || 
                                userLeaves[`${dateKey}-morning`] || 
                                userLeaves[`${dateKey}-afternoon`];
                
                // Vérifier aussi si c'est un weekend ou jour férié (ne compte pas comme absence)
                const dayOfWeek = getDay(date);
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const publicHolidays = this.getPublicHolidays('FR', year);
                const isHoliday = publicHolidays[dateKey];
                
                if (!hasLeave && !isWeekend && !isHoliday) {
                    presentCount++;
                }
            });
            
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
    } else {
        // Présent (pas de congé)
        cell.classList.add('present');
        cell.title = `${user.name} - Présent`;
    }
    
    // Event listener pour le clic (pour ouvrir la modale de l'utilisateur)
    cell.addEventListener('click', (e) => {
        e.stopPropagation();
        // Pour l'instant, on ouvre la modale avec la date
        // Plus tard, on pourra ouvrir la modale de l'utilisateur spécifique
        if (user.id === this.user?.id) {
            this.selectedDates = [date];
            this.selectedDate = date;
            this.updateDateSelectionVisual();
            this.openModal(date);
        }
    });
    
    return cell;
}

