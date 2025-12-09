// Vue annuelle Timeline - Format horizontal scrollable
function renderYearViewTimeline() {
    const semesterCalendar = document.getElementById('semesterCalendar');
    if (!semesterCalendar) {
        console.error('[YearViewTimeline] semesterCalendar element not found');
        return;
    }
    semesterCalendar.innerHTML = '';
    semesterCalendar.className = 'year-calendar-view year-timeline-view';
    
    const semesterView = document.getElementById('semesterView');
    if (semesterView) {
        semesterView.className = 'semester-view';
    }

    const year = getYear(this.currentDate);
    this.currentYear = year;
    console.log('[YearViewTimeline] Rendu de la vue timeline pour l\'année', year);
    
    const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    const dayNames = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

    document.getElementById('currentMonth').textContent = `Année ${year}`;

    // Créer un conteneur horizontal scrollable
    const timelineContainer = document.createElement('div');
    timelineContainer.className = 'year-timeline-container';
    
    // Créer une colonne pour chaque mois
    for (let month = 0; month < 12; month++) {
        const monthColumn = document.createElement('div');
        monthColumn.className = 'year-timeline-month';
        
        // En-tête du mois
        const monthHeader = document.createElement('div');
        monthHeader.className = 'year-timeline-month-header';
        monthHeader.textContent = monthNames[month];
        monthColumn.appendChild(monthHeader);
        
        // En-tête des jours de la semaine
        const weekHeader = document.createElement('div');
        weekHeader.className = 'year-timeline-week-header';
        dayNames.forEach(dayName => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'year-timeline-week-day';
            dayHeader.textContent = dayName;
            weekHeader.appendChild(dayHeader);
        });
        monthColumn.appendChild(weekHeader);
        
        // Grille des jours
        const daysGrid = document.createElement('div');
        daysGrid.className = 'year-timeline-days-grid';
        
        const firstDay = createDate(year, month, 1);
        const daysInMonth = getDaysInMonth(firstDay);
        const startingDayOfWeek = getDay(firstDay);
        
        // Cellules vides pour aligner
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'year-timeline-day-empty';
            daysGrid.appendChild(emptyCell);
        }
        
        // Jours du mois
        for (let day = 1; day <= daysInMonth; day++) {
            const date = createDate(year, month, day);
            const dayElement = this.createYearViewDayElement(date);
            dayElement.className = 'year-view-day year-timeline-day';
            daysGrid.appendChild(dayElement);
        }
        
        monthColumn.appendChild(daysGrid);
        timelineContainer.appendChild(monthColumn);
    }
    
    semesterCalendar.appendChild(timelineContainer);
}

