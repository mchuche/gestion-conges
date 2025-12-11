/**
 * Vue annuelle - Affiche les 12 mois en colonnes verticales
 * 
 * Cette vue affiche :
 * - L'année
 * - Le mois
 * - La date du jour
 * - La lettre de la semaine (D, L, M, M, J, V, S)
 * - Les jours fériés ou weekends
 * - État : matin, après-midi, journée complète
 */

async function renderYearViewSemester() {
    const manager = this;
    const semesterCalendar = document.getElementById('semesterCalendar');
    if (!semesterCalendar) {
        logger.error('[YearViewSemester] semesterCalendar element not found');
        return;
    }
    
    semesterCalendar.innerHTML = '';
    semesterCalendar.className = 'semester-calendar year-semester-view';
    
    const semesterView = document.getElementById('semesterView');
    if (semesterView) {
        semesterView.className = 'semester-view';
    }

    const year = getYear(this.currentDate);
    this.currentYear = year;
    logger.debug('[YearViewSemester] Rendu de la vue annuelle pour l\'année', year);
    
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

    // Créer une colonne pour chaque mois (style semestrielle)
    for (let month = 0; month < 12; month++) {
        const monthColumn = document.createElement('div');
        monthColumn.className = 'semester-month-column';

        // En-tête du mois
        const monthHeader = document.createElement('div');
        monthHeader.className = 'semester-month-header';
        monthHeader.textContent = monthNames[month];
        monthColumn.appendChild(monthHeader);

        // Jours du mois
        const firstDay = createDate(year, month, 1);
        const daysInMonth = getDaysInMonth(firstDay);

        for (let day = 1; day <= daysInMonth; day++) {
            const date = createDate(year, month, day);
            const dayElement = this.createYearDayElement(date);
            monthColumn.appendChild(dayElement);
        }

        semesterCalendar.appendChild(monthColumn);
    }
}

