/**
 * Vue annuelle compacte - Mini calendriers pour voir l'essentiel
 * 
 * Cette vue affiche :
 * - L'année
 * - Le mois
 * - La date du jour
 * - La lettre de la semaine (L, M, M, J, V, S, D)
 * - Les jours fériés ou weekends
 * - État : matin, après-midi, journée complète
 */

async function renderYearViewCompact() {
    const manager = this;
    const semesterCalendar = document.getElementById('semesterCalendar');
    if (!semesterCalendar) {
        logger.error('[YearViewCompact] semesterCalendar element not found');
        return;
    }
    
    semesterCalendar.innerHTML = '';
    semesterCalendar.className = 'year-calendar-view year-compact-view';
    
    const semesterView = document.getElementById('semesterView');
    if (semesterView) {
        semesterView.className = 'semester-view';
    }

    const year = getYear(this.currentDate);
    this.currentYear = year;
    logger.debug('[YearViewCompact] Rendu de la vue compacte pour l\'année', year);
    
    const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    // Titre avec l'année
    document.getElementById('currentMonth').textContent = `Année ${year}`;

    // Obtenir les jours fériés pour l'année
    const country = this.selectedCountry || 'FR';
    const holidays = typeof getPublicHolidays === 'function' 
        ? getPublicHolidays(country, year) 
        : {};

    // Créer le conteneur principal avec grille 4x3 (12 mois)
    const container = document.createElement('div');
    container.className = 'year-compact-container';

    // Créer un mini calendrier pour chaque mois
    for (let month = 0; month < 12; month++) {
        const monthCard = this.createCompactMonthCard(year, month, monthNames[month], holidays);
        container.appendChild(monthCard);
    }

    semesterCalendar.appendChild(container);
}

/**
 * Crée une carte de mois compacte
 */
function createCompactMonthCard(year, month, monthName, holidays) {
    const monthCard = document.createElement('div');
    monthCard.className = 'year-compact-month-card';

    // En-tête du mois avec année
    const monthHeader = document.createElement('div');
    monthHeader.className = 'year-compact-month-header';
    monthHeader.innerHTML = `<span class="month-name">${monthName}</span><span class="month-year">${year}</span>`;
    monthCard.appendChild(monthHeader);

    // En-tête des jours de la semaine (lettres)
    const weekHeader = document.createElement('div');
    weekHeader.className = 'year-compact-week-header';
    const dayLetters = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    dayLetters.forEach(letter => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'year-compact-day-header';
        dayHeader.textContent = letter;
        weekHeader.appendChild(dayHeader);
    });
    monthCard.appendChild(weekHeader);

    // Grille des jours
    const daysGrid = document.createElement('div');
    daysGrid.className = 'year-compact-days-grid';

    const firstDay = createDate(year, month, 1);
    const daysInMonth = getDaysInMonth(firstDay);
    const startingDayOfWeek = getDay(firstDay); // 0 = Dimanche, 1 = Lundi, etc.
    
    // Convertir dimanche (0) en 6 pour l'affichage (Lundi = 0)
    const adjustedStartDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

    // Cellules vides pour aligner le premier jour
    for (let i = 0; i < adjustedStartDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'year-compact-day-empty';
        daysGrid.appendChild(emptyCell);
    }

    // Créer les jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
        const date = createDate(year, month, day);
        const dayElement = this.createCompactDayElement(date, day, holidays);
        daysGrid.appendChild(dayElement);
    }

    monthCard.appendChild(daysGrid);
    return monthCard;
}

/**
 * Crée un élément de jour compact avec toutes les informations
 */
function createCompactDayElement(date, dayNumber, holidays) {
    const dayElement = document.createElement('div');
    dayElement.className = 'year-compact-day';
    
    const dateKey = getDateKey(date);
    const dayOfWeek = getDay(date); // 0 = Dimanche, 6 = Samedi
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidays[dateKey];
    const isToday = getDateKey(new Date()) === dateKey;
    
    // Obtenir le congé pour ce jour
    const leaveInfo = this.getLeaveForDate(date);
    const hasLeave = leaveInfo.full || leaveInfo.morning || leaveInfo.afternoon;
    
    // Classes CSS
    if (isToday) dayElement.classList.add('today');
    if (isWeekend) dayElement.classList.add('weekend');
    if (isHoliday) dayElement.classList.add('holiday');
    if (hasLeave) dayElement.classList.add('has-leave');
    
    // Contenu du jour
    const dayContent = document.createElement('div');
    dayContent.className = 'year-compact-day-content';
    
    // Numéro du jour
    const dayNumberEl = document.createElement('div');
    dayNumberEl.className = 'year-compact-day-number';
    dayNumberEl.textContent = dayNumber;
    dayContent.appendChild(dayNumberEl);
    
    // Indicateur de congé (si présent)
    if (hasLeave) {
        const leaveIndicator = document.createElement('div');
        leaveIndicator.className = 'year-compact-leave-indicator';
        
        if (leaveInfo.full) {
            leaveIndicator.classList.add('full-day');
            leaveIndicator.title = `Journée complète: ${this.getLeaveTypeLabel(leaveInfo.full)}`;
        } else if (leaveInfo.morning && leaveInfo.afternoon) {
            leaveIndicator.classList.add('full-day');
            leaveIndicator.title = `Matin + Après-midi`;
        } else if (leaveInfo.morning) {
            leaveIndicator.classList.add('morning');
            leaveIndicator.title = `Matin: ${this.getLeaveTypeLabel(leaveInfo.morning)}`;
        } else if (leaveInfo.afternoon) {
            leaveIndicator.classList.add('afternoon');
            leaveIndicator.title = `Après-midi: ${this.getLeaveTypeLabel(leaveInfo.afternoon)}`;
        }
        
        // Couleur selon le type de congé
        if (leaveInfo.full) {
            const leaveType = this.getLeaveTypeConfig(leaveInfo.full);
            if (leaveType) {
                leaveIndicator.style.backgroundColor = leaveType.color;
            }
        } else if (leaveInfo.morning) {
            const leaveType = this.getLeaveTypeConfig(leaveInfo.morning);
            if (leaveType) {
                leaveIndicator.style.borderTopColor = leaveType.color;
            }
        } else if (leaveInfo.afternoon) {
            const leaveType = this.getLeaveTypeConfig(leaveInfo.afternoon);
            if (leaveType) {
                leaveIndicator.style.borderBottomColor = leaveType.color;
            }
        }
        
        dayContent.appendChild(leaveIndicator);
    }
    
    // Indicateur de jour férié
    if (isHoliday) {
        const holidayIndicator = document.createElement('div');
        holidayIndicator.className = 'year-compact-holiday-indicator';
        holidayIndicator.title = holidays[dateKey];
        dayContent.appendChild(holidayIndicator);
    }
    
    dayElement.appendChild(dayContent);
    
    // Tooltip avec informations complètes
    let tooltip = `${dayNumber} ${this.getMonthName(date)} ${getYear(date)}`;
    if (isWeekend) {
        tooltip += ` - ${dayOfWeek === 0 ? 'Dimanche' : 'Samedi'}`;
    }
    if (isHoliday) {
        tooltip += ` - ${holidays[dateKey]}`;
    }
    if (hasLeave) {
        if (leaveInfo.full) {
            tooltip += ` - Congé: ${this.getLeaveTypeLabel(leaveInfo.full)} (Journée)`;
        } else {
            const parts = [];
            if (leaveInfo.morning) parts.push(`Matin: ${this.getLeaveTypeLabel(leaveInfo.morning)}`);
            if (leaveInfo.afternoon) parts.push(`Après-midi: ${this.getLeaveTypeLabel(leaveInfo.afternoon)}`);
            tooltip += ` - Congé: ${parts.join(', ')}`;
        }
    }
    dayElement.title = tooltip;
    
    // Clic pour ouvrir la modale
    dayElement.addEventListener('click', () => {
        this.selectedDates = [date];
        this.updateDateSelectionVisual();
        this.openModal(date);
    });
    
    return dayElement;
}

/**
 * Obtient le nom du mois en français
 */
function getMonthName(date) {
    const monthNames = [
        'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];
    return monthNames[getMonth(date)];
}

