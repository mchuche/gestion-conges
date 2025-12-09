// Vue annuelle Heatmap - Format style GitHub (carrés colorés)
function renderYearViewHeatmap() {
    const semesterCalendar = document.getElementById('semesterCalendar');
    if (!semesterCalendar) {
        console.error('[YearViewHeatmap] semesterCalendar element not found');
        return;
    }
    semesterCalendar.innerHTML = '';
    semesterCalendar.className = 'year-calendar-view year-heatmap-view';
    
    const semesterView = document.getElementById('semesterView');
    if (semesterView) {
        semesterView.className = 'semester-view';
    }

    const year = getYear(this.currentDate);
    this.currentYear = year;
    console.log('[YearViewHeatmap] Rendu de la vue heatmap pour l\'année', year);
    
    const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    document.getElementById('currentMonth').textContent = `Année ${year}`;

    // Créer un conteneur pour la heatmap
    const heatmapContainer = document.createElement('div');
    heatmapContainer.className = 'year-heatmap-container';
    
    // Créer une section pour chaque mois
    for (let month = 0; month < 12; month++) {
        const monthSection = document.createElement('div');
        monthSection.className = 'year-heatmap-month-section';
        
        // En-tête du mois avec légende
        const monthHeader = document.createElement('div');
        monthHeader.className = 'year-heatmap-month-header';
        
        const monthLabel = document.createElement('span');
        monthLabel.className = 'year-heatmap-month-label';
        monthLabel.textContent = monthNames[month];
        monthHeader.appendChild(monthLabel);
        
        // Légende des jours de la semaine (optionnel, peut être masqué)
        const weekLegend = document.createElement('div');
        weekLegend.className = 'year-heatmap-week-legend';
        const dayLabels = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
        dayLabels.forEach((label, idx) => {
            const legendDay = document.createElement('span');
            legendDay.className = 'year-heatmap-legend-day';
            legendDay.textContent = idx % 2 === 0 ? label : ''; // Afficher seulement D, M, J, S pour économiser l'espace
            weekLegend.appendChild(legendDay);
        });
        monthHeader.appendChild(weekLegend);
        
        monthSection.appendChild(monthHeader);
        
        // Grille de carrés pour les jours
        const heatmapGrid = document.createElement('div');
        heatmapGrid.className = 'year-heatmap-grid';
        
        const firstDay = createDate(year, month, 1);
        const daysInMonth = getDaysInMonth(firstDay);
        const startingDayOfWeek = getDay(firstDay);
        
        // Cellules vides pour aligner
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'year-heatmap-square-empty';
            heatmapGrid.appendChild(emptyCell);
        }
        
        // Carrés pour chaque jour
        for (let day = 1; day <= daysInMonth; day++) {
            const date = createDate(year, month, day);
            const square = this.createYearViewHeatmapSquare(date);
            heatmapGrid.appendChild(square);
        }
        
        monthSection.appendChild(heatmapGrid);
        heatmapContainer.appendChild(monthSection);
    }
    
    semesterCalendar.appendChild(heatmapContainer);
}

// Créer un carré pour la heatmap
function createYearViewHeatmapSquare(date) {
    const square = document.createElement('div');
    square.className = 'year-heatmap-square';
    const dateKey = getDateKey(date);
    square.setAttribute('data-date-key', dateKey);
    square.setAttribute('title', `${getDate(date)}/${getMonth(date) + 1}/${getYear(date)}`);
    
    // Vérifier si c'est aujourd'hui, passé ou futur
    const todayDate = today();
    
    if (isSameDay(date, todayDate)) {
        square.classList.add('today');
    } else if (isBefore(date, todayDate)) {
        square.classList.add('past-day');
    } else {
        square.classList.add('future-day');
    }
    
    // Vérifier si c'est un weekend
    const dayOfWeek = getDay(date);
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        square.classList.add('weekend');
    }
    
    // Vérifier si c'est un jour férié
    const publicHolidays = this.getPublicHolidays('FR', getYear(date));
    const dateKeyForHoliday = getDateKey(date);
    if (publicHolidays[dateKeyForHoliday]) {
        square.classList.add('public-holiday');
        square.setAttribute('title', `${square.getAttribute('title')} - ${publicHolidays[dateKeyForHoliday]}`);
    }
    
    // Vérifier s'il y a un congé
    const leaveInfo = this.getLeaveForDate(date);
    if (leaveInfo.full || leaveInfo.morning || leaveInfo.afternoon) {
        const leaveType = leaveInfo.full || leaveInfo.morning || leaveInfo.afternoon;
        const leaveConfig = this.getLeaveTypeConfig(leaveType);
        if (leaveConfig) {
            square.style.backgroundColor = leaveConfig.color;
            square.style.borderColor = leaveConfig.color;
            square.classList.add('has-leave');
            
            // Indicateur pour demi-journée
            if (!leaveInfo.full) {
                if (leaveInfo.morning) {
                    square.style.borderTopWidth = '3px';
                }
                if (leaveInfo.afternoon) {
                    square.style.borderBottomWidth = '3px';
                }
            }
        }
    }
    
    // Event listener pour le clic
    const handleSquareClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        // Sélection simple ou multiple selon Ctrl/Cmd
        const isMultiSelect = e.ctrlKey || e.metaKey || this.ctrlKeyPressed;
        
        if (isMultiSelect) {
            // Sélection multiple
            const dateKey = getDateKey(date);
            const index = this.selectedDates.findIndex(d => getDateKey(d) === dateKey);
            
            if (index > -1) {
                // Déjà sélectionné, le retirer
                this.selectedDates.splice(index, 1);
                square.classList.remove('selected');
            } else {
                // Ajouter à la sélection
                this.selectedDates.push(date);
                square.classList.add('selected');
            }
            
            this.updateDateSelectionVisual();
        } else {
            // Sélection simple - ouvrir la modale
            this.selectedDates = [date];
            this.selectedDate = date;
            this.updateDateSelectionVisual();
            this.openModal(date);
        }
    };
    
    square.addEventListener('click', handleSquareClick);
    
    return square;
}


