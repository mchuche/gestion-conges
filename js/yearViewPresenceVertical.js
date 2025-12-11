/**
 * Vue annuelle Matrice de Présence Verticale - Mois empilés verticalement
 * Cette vue permet de voir les présences/absences de plusieurs utilisateurs
 * avec les mois affichés les uns en dessous des autres
 */

async function renderYearViewPresenceVertical() {
    const manager = this; // Capturer le contexte
    const semesterCalendar = document.getElementById('semesterCalendar');
    if (!semesterCalendar) {
        logger.error('[YearViewPresenceVertical] semesterCalendar element not found');
        return;
    }
    semesterCalendar.innerHTML = '';
    semesterCalendar.className = 'year-calendar-view year-presence-vertical-view';
    
    const semesterView = document.getElementById('semesterView');
    if (semesterView) {
        semesterView.className = 'semester-view';
    }

    const year = getYear(this.currentDate);
    this.currentYear = year;
    logger.debug('[YearViewPresenceVertical] Rendu de la vue présence verticale pour l\'année', year);
    
    const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    document.getElementById('currentMonth').textContent = `Matrice de Présence ${year} (Verticale)`;

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
            logger.error('Erreur lors du chargement des données de l\'équipe:', error);
            // Fallback sur l'utilisateur actuel
            users = [{ id: this.user?.id, name: this.user?.email || 'Moi', leaves: this.leaves }];
        }
    } else {
        // Pas d'équipe sélectionnée, utiliser seulement l'utilisateur actuel
        users = [{ id: this.user?.id, name: this.user?.email || 'Moi', leaves: this.leaves }];
    }
    
    // Créer le conteneur principal
    const presenceContainer = document.createElement('div');
    presenceContainer.className = 'year-presence-vertical-container';
    
    // Pour chaque mois, créer un bloc vertical
    for (let month = 0; month < 12; month++) {
        const monthBlock = document.createElement('div');
        monthBlock.className = 'year-presence-vertical-month-block';
        
        // En-tête du mois
        const monthHeader = document.createElement('div');
        monthHeader.className = 'year-presence-vertical-month-header';
        monthHeader.textContent = monthNames[month];
        monthBlock.appendChild(monthHeader);
        
        // Conteneur pour les jours (en-tête)
        const daysHeaderRow = document.createElement('div');
        daysHeaderRow.className = 'year-presence-vertical-days-header-row';
        
        // Colonne pour les noms d'utilisateurs (vide dans l'en-tête)
        const userLabelCell = document.createElement('div');
        userLabelCell.className = 'year-presence-vertical-user-label';
        userLabelCell.textContent = 'Utilisateur';
        daysHeaderRow.appendChild(userLabelCell);
        
        // Colonnes pour les jours du mois
        const daysContainer = document.createElement('div');
        daysContainer.className = 'year-presence-vertical-days-container';
        
        const firstDay = createDate(year, month, 1);
        const daysInMonth = getDaysInMonth(firstDay);
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'year-presence-vertical-day-header';
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
        
        daysHeaderRow.appendChild(daysContainer);
        monthBlock.appendChild(daysHeaderRow);
        
        // Créer une ligne pour chaque utilisateur
        users.forEach((user) => {
            const userRow = document.createElement('div');
            userRow.className = 'year-presence-vertical-user-row';
            
            // Nom de l'utilisateur
            const userNameCell = document.createElement('div');
            userNameCell.className = 'year-presence-vertical-user-name';
            userNameCell.textContent = user.name;
            userRow.appendChild(userNameCell);
            
            // Conteneur pour les jours du mois
            const userDaysContainer = document.createElement('div');
            userDaysContainer.className = 'year-presence-vertical-days-container';
            
            for (let day = 1; day <= daysInMonth; day++) {
                const date = createDate(year, month, day);
                const dayCell = manager.createPresenceDayCell(date, user);
                userDaysContainer.appendChild(dayCell);
            }
            
            userRow.appendChild(userDaysContainer);
            monthBlock.appendChild(userRow);
        });
        
        // Ligne de statistiques pour ce mois
        const statsRow = document.createElement('div');
        statsRow.className = 'year-presence-vertical-stats-row';
        
        const statsLabelCell = document.createElement('div');
        statsLabelCell.className = 'year-presence-vertical-user-label';
        statsLabelCell.textContent = 'Présents';
        statsLabelCell.style.fontWeight = 'bold';
        statsRow.appendChild(statsLabelCell);
        
        const statsDaysContainer = document.createElement('div');
        statsDaysContainer.className = 'year-presence-vertical-days-container';
        
        // Compter les présences pour chaque jour du mois
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
            statsDaysContainer.appendChild(statsCell);
        }
        
        statsRow.appendChild(statsDaysContainer);
        monthBlock.appendChild(statsRow);
        
        presenceContainer.appendChild(monthBlock);
    }
    
    semesterCalendar.appendChild(presenceContainer);
}

