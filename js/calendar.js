// Calendar - Rendu du calendrier et gestion des dates
// Ces fonctions seront ajoutées au prototype de LeaveManager

// Vérifier si une date a un congé et retourner les détails
function getLeaveForDate(date) {
    const keys = getDateKeys(date);
    const result = {
        full: null,
        morning: null,
        afternoon: null
    };

    if (this.leaves[keys.full]) {
        result.full = this.leaves[keys.full];
    }
    if (this.leaves[keys.morning]) {
        result.morning = this.leaves[keys.morning];
    }
    if (this.leaves[keys.afternoon]) {
        result.afternoon = this.leaves[keys.afternoon];
    }

    return result;
}

// Rendre le calendrier (semestriel ou annuel selon la vue)
function renderCalendar() {
    const semesterCalendar = document.getElementById('semesterCalendar');
    if (!semesterCalendar) {
        console.error('semesterCalendar element not found');
        return;
    }
    
    if (this.viewMode === 'year') {
        this.renderYearView();
    } else {
        // S'assurer qu'on n'est pas en mode plein écran
        this.exitYearViewFullscreen();
        this.renderSemesterView();
    }
}

// Entrer en mode plein écran pour la vue annuelle
function enterYearViewFullscreen() {
    const calendarContainer = document.querySelector('.calendar-container');
    const semesterView = document.getElementById('semesterView');
    if (calendarContainer && semesterView) {
        calendarContainer.classList.add('year-view-fullscreen');
        semesterView.classList.add('year-view-fullscreen');
    }
}

// Sortir du mode plein écran
function exitYearViewFullscreen() {
    const calendarContainer = document.querySelector('.calendar-container');
    const semesterView = document.getElementById('semesterView');
    if (calendarContainer && semesterView) {
        calendarContainer.classList.remove('year-view-fullscreen');
        semesterView.classList.remove('year-view-fullscreen');
    }
}

// Rendre la vue semestrielle
function renderSemesterView() {
    const semesterCalendar = document.getElementById('semesterCalendar');
    if (!semesterCalendar) {
        console.error('semesterCalendar element not found');
        return;
    }
    semesterCalendar.innerHTML = '';
    semesterCalendar.className = 'semester-calendar';

    // Utiliser currentDate pour obtenir l'année et le mois actuels
    // Cela garantit la cohérence avec la navigation
    const year = this.currentDate.getFullYear();
    const currentMonth = this.currentDate.getMonth();
    
    // Synchroniser currentYear avec currentDate pour éviter les désynchronisations
    this.currentYear = year;
    
    console.log('[RenderSemesterView] Année:', year, 'Mois:', currentMonth, 'currentYear:', this.currentYear);
    
    const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    // Déterminer le semestre (1er semestre: 0-5, 2ème semestre: 6-11)
    // IMPORTANT: Utiliser le mois de currentDate, pas de currentYear
    const semesterStart = currentMonth < 6 ? 0 : 6;
    const semesterEnd = currentMonth < 6 ? 6 : 12;

    // Mettre à jour le titre
    const semesterName = currentMonth < 6 ? '1er Semestre' : '2ème Semestre';
    document.getElementById('currentMonth').textContent = `${semesterName} ${year}`;
    console.log('[RenderSemesterView] Semestre affiché:', semesterName, year, 'Mois de début:', semesterStart, 'Mois de fin:', semesterEnd);

    // Créer une colonne pour chaque mois du semestre
    for (let month = semesterStart; month < semesterEnd; month++) {
        const monthColumn = document.createElement('div');
        monthColumn.className = 'semester-month-column';

        // En-tête du mois
        const monthHeader = document.createElement('div');
        monthHeader.className = 'semester-month-header';
        monthHeader.textContent = monthNames[month];
        monthColumn.appendChild(monthHeader);

        // Jours du mois
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayElement = this.createYearDayElement(date);
            monthColumn.appendChild(dayElement);
        }

        semesterCalendar.appendChild(monthColumn);
    }
}

// Rendre la vue annuelle (mini-calendriers)
function renderYearView() {
    const semesterCalendar = document.getElementById('semesterCalendar');
    if (!semesterCalendar) {
        console.error('[YearView] semesterCalendar element not found');
        return;
    }
    semesterCalendar.innerHTML = '';
    semesterCalendar.className = 'year-calendar-view';
    
    // S'assurer que le conteneur parent a la bonne classe
    const semesterView = document.getElementById('semesterView');
    if (semesterView) {
        semesterView.className = 'semester-view';
    }

    // Utiliser currentDate pour obtenir l'année actuelle et synchroniser
    const year = this.currentDate.getFullYear();
    this.currentYear = year;
    console.log('[YearView] Rendu de la vue annuelle pour l\'année', year);
    const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    const dayNames = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

    // Mettre à jour le titre
    document.getElementById('currentMonth').textContent = `Année ${year}`;

    // Créer une grille pour tous les mois (format 16/9 ou 16/10)
    // 4 lignes x 3 colonnes = 12 mois
    for (let month = 0; month < 12; month++) {
        const monthCard = document.createElement('div');
        monthCard.className = 'year-month-card';

        // En-tête du mois
        const monthHeader = document.createElement('div');
        monthHeader.className = 'year-month-card-header';
        monthHeader.textContent = monthNames[month];
        monthCard.appendChild(monthHeader);

        // En-tête des jours de la semaine
        const weekHeader = document.createElement('div');
        weekHeader.className = 'year-week-header';
        dayNames.forEach(dayName => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'year-week-day';
            dayHeader.textContent = dayName;
            weekHeader.appendChild(dayHeader);
        });
        monthCard.appendChild(weekHeader);

        // Grille des jours
        const daysGrid = document.createElement('div');
        daysGrid.className = 'year-days-grid';

        // Calculer le premier jour du mois et le nombre de jours
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay(); // 0 = Dimanche, 1 = Lundi, etc.

        // Ajouter des cellules vides pour aligner le premier jour
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'year-day-empty';
            daysGrid.appendChild(emptyCell);
        }

        // Ajouter les jours du mois
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayElement = this.createYearViewDayElement(date);
            daysGrid.appendChild(dayElement);
        }

        monthCard.appendChild(daysGrid);
        semesterCalendar.appendChild(monthCard);
    }
}

// Créer un élément de jour pour la vue annuelle (mini-calendrier)
function createYearViewDayElement(date) {
    const dayElement = document.createElement('div');
    dayElement.className = 'year-view-day';
    const dateKey = getDateKey(date);
    dayElement.setAttribute('data-date-key', dateKey);

    const dayOfMonth = date.getDate();

    // Vérifier si c'est aujourd'hui, passé ou futur
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    
    if (compareDate.toDateString() === today.toDateString()) {
        dayElement.classList.add('today');
    } else if (compareDate < today) {
        dayElement.classList.add('past-day');
    } else {
        dayElement.classList.add('future-day');
    }

    // Vérifier si c'est un weekend
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        dayElement.classList.add('weekend');
    }

    // Vérifier si c'est un jour férié
    const publicHolidays = this.getPublicHolidays(date.getFullYear());
    const dateKeyForHoliday = getDateKey(date);
    if (publicHolidays.some(h => getDateKey(new Date(h.date)) === dateKeyForHoliday)) {
        dayElement.classList.add('public-holiday');
    }

    // Vérifier s'il y a un congé
    const leaveInfo = this.getLeaveForDate(date);
    if (leaveInfo.full || leaveInfo.morning || leaveInfo.afternoon) {
        const leaveType = leaveInfo.full || leaveInfo.morning || leaveInfo.afternoon;
        const leaveConfig = this.getLeaveTypeConfig(leaveType);
        if (leaveConfig) {
            dayElement.style.backgroundColor = leaveConfig.color;
            dayElement.style.color = 'white';
            dayElement.style.fontWeight = 'bold';
            
            // Indicateur pour demi-journée
            if (!leaveInfo.full) {
                if (leaveInfo.morning) {
                    dayElement.style.borderTop = '2px solid white';
                }
                if (leaveInfo.afternoon) {
                    dayElement.style.borderBottom = '2px solid white';
                }
            }
        }
    }

    // Numéro du jour
    const dayNumber = document.createElement('span');
    dayNumber.className = 'year-view-day-number';
    dayNumber.textContent = dayOfMonth;
    dayElement.appendChild(dayNumber);

    // Event listeners pour le clic
    const handleDayClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        
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
                this.updateDateSelectionVisual();
                this.openModal(date);
            }
        }
    };
    
    dayElement.addEventListener('mousedown', handleDayClick);

    return dayElement;
}

// Créer un élément de jour pour la vue semestrielle
function createYearDayElement(date) {
    const dayElement = document.createElement('div');
    dayElement.className = 'year-day';
    const dateKey = getDateKey(date);
    dayElement.setAttribute('data-date-key', dateKey);

    const dayOfWeek = date.getDay();
    const dayNames = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    const dayLetter = dayNames[dayOfWeek];

    // Vérifier si c'est aujourd'hui, passé ou futur
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    
    if (compareDate.toDateString() === today.toDateString()) {
        dayElement.classList.add('today');
    } else if (compareDate < today) {
        dayElement.classList.add('past-day');
    } else {
        dayElement.classList.add('future-day');
    }

    // Vérifier si c'est un week-end
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        dayElement.classList.add('weekend');
    }

    // Vérifier si c'est un jour férié (toujours français)
    const publicHolidays = getPublicHolidays('FR', date.getFullYear());
    if (publicHolidays[dateKey]) {
        dayElement.classList.add('public-holiday');
        dayElement.title = publicHolidays[dateKey];
    }
    
    // Vérifier si cette date est sélectionnée
    if (this.selectedDates.some(d => getDateKey(d) === dateKey)) {
        dayElement.classList.add('selected');
    }

    const leaveInfo = this.getLeaveForDate(date);

    // Contenu du jour - tout sur une seule ligne avec cases séparées
    const dayContent = document.createElement('div');
    dayContent.className = 'year-day-content';
    
    // Case pour le numéro du jour
    const dayNumber = document.createElement('span');
    dayNumber.className = 'year-day-number';
    dayNumber.textContent = date.getDate();
    dayContent.appendChild(dayNumber);
    
    // Case pour la lettre du jour
    const dayLetterSpan = document.createElement('span');
    dayLetterSpan.className = 'year-day-letter';
    dayLetterSpan.textContent = dayLetter;
    dayContent.appendChild(dayLetterSpan);

    if (leaveInfo.full) {
        // Journée complète : badge prend tout l'espace restant
        const badge = document.createElement('span');
        badge.className = `year-leave-badge year-leave-badge-full ${leaveInfo.full}`;
        badge.textContent = this.getLeaveTypeLabel(leaveInfo.full);
        const color = this.getLeaveColor(leaveInfo.full);
        badge.style.backgroundColor = color;
        dayContent.appendChild(badge);
    } else {
        // Demi-journées : conteneur pour partager l'espace équitablement
        const halfDayContainer = document.createElement('div');
        halfDayContainer.className = 'year-half-day-container';
        
        if (leaveInfo.morning) {
            const badge = document.createElement('span');
            badge.className = `year-leave-badge year-leave-badge-half year-leave-badge-morning ${leaveInfo.morning}`;
            badge.textContent = this.getLeaveTypeLabel(leaveInfo.morning);
            const color = this.getLeaveColor(leaveInfo.morning);
            badge.style.backgroundColor = color;
            halfDayContainer.appendChild(badge);
        } else {
            // Placeholder vide pour maintenir l'alignement
            const spacer = document.createElement('span');
            spacer.className = 'year-half-day-spacer';
            halfDayContainer.appendChild(spacer);
        }
        
        if (leaveInfo.afternoon) {
            const badge = document.createElement('span');
            badge.className = `year-leave-badge year-leave-badge-half year-leave-badge-afternoon ${leaveInfo.afternoon}`;
            badge.textContent = this.getLeaveTypeLabel(leaveInfo.afternoon);
            const color = this.getLeaveColor(leaveInfo.afternoon);
            badge.style.backgroundColor = color;
            halfDayContainer.appendChild(badge);
        } else {
            // Placeholder vide pour maintenir l'alignement
            const spacer = document.createElement('span');
            spacer.className = 'year-half-day-spacer';
            halfDayContainer.appendChild(spacer);
        }
        
        dayContent.appendChild(halfDayContainer);
    }

    dayElement.appendChild(dayContent);

    // Ajouter l'événement de clic sur l'élément jour
    const handleDayClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        // Détecter si on est sur mobile (pas de sélection multiple sur mobile)
        const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Vérifier si Ctrl/Cmd est pressé pour la sélection multiple (uniquement sur desktop)
        // Utiliser à la fois l'état tracké et l'événement pour plus de fiabilité
        const hasCtrl = this.ctrlKeyPressed || e.ctrlKey || e.metaKey;
        const isMultiSelect = !isMobile && hasCtrl;
        
        console.log('Clic sur jour:', {
            date: date.toISOString().split('T')[0],
            ctrlKeyPressed: this.ctrlKeyPressed,
            eventCtrlKey: e.ctrlKey,
            eventMetaKey: e.metaKey,
            hasCtrl: hasCtrl,
            isMobile: isMobile,
            isMultiSelect: isMultiSelect,
            selectedDatesCount: this.selectedDates.length
        });
        
        if (isMultiSelect) {
            // Sélection multiple : ajouter/retirer ce jour de la sélection
            const dateKey = getDateKey(date);
            const index = this.selectedDates.findIndex(d => getDateKey(d) === dateKey);
            
            if (index > -1) {
                // Déjà sélectionné, le retirer
                this.selectedDates.splice(index, 1);
                console.log('Jour retiré de la sélection, total:', this.selectedDates.length);
            } else {
                // Pas sélectionné, l'ajouter
                this.selectedDates.push(date);
                console.log('Jour ajouté à la sélection, total:', this.selectedDates.length);
            }
            
            this.updateDateSelectionVisual();
            
            // Ne pas ouvrir la modale automatiquement en mode sélection multiple
            // L'utilisateur peut continuer à sélectionner, puis cliquer sur un jour sélectionné pour ouvrir la modale
            // Si on a désélectionné tous les jours, fermer la modale si elle est ouverte
            if (this.selectedDates.length === 0) {
                this.closeModal();
            }
        } else {
            // Sélection unique : sélectionner ce jour et ouvrir la modale
            // Mais d'abord vérifier si on clique sur un jour déjà sélectionné en mode multi
            const dateKey = getDateKey(date);
            const isDateSelected = this.selectedDates.some(d => getDateKey(d) === dateKey);
            
            if (this.selectedDates.length > 1 && isDateSelected) {
                // On clique sur un jour déjà sélectionné, ouvrir la modale
                this.openModal(date);
            } else {
                // Nouvelle sélection unique
                this.selectedDates = [date];
                this.updateDateSelectionVisual();
                this.openModal(date);
            }
        }
    };
    
    dayElement.addEventListener('mousedown', handleDayClick);
    // Également sur le contenu pour s'assurer que ça fonctionne partout
    dayContent.addEventListener('mousedown', handleDayClick);

    return dayElement;
}


// Obtenir le libellé du type de congé
function getLeaveTypeLabel(type) {
    const config = this.leaveTypesConfig.find(t => t.id === type);
    return config ? config.label : type;
}

// Obtenir la configuration d'un type de congé
function getLeaveTypeConfig(type) {
    const config = this.leaveTypesConfig.find(t => t.id === type);
    if (!config) return null;
    
    // Ajouter le quota de l'année en cours
    const currentYear = this.currentDate.getFullYear();
    const quota = this.getQuotaForYear(type, currentYear);
    return { ...config, quota };
}


// Mettre à jour l'affichage visuel des dates sélectionnées
function updateDateSelectionVisual() {
    // Retirer toutes les classes de sélection
    document.querySelectorAll('.year-day.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Ajouter la classe de sélection aux dates sélectionnées
    this.selectedDates.forEach(date => {
        const dateKey = getDateKey(date);
        // Chercher par attribut data-date-key
        const dayElements = document.querySelectorAll(`[data-date-key="${dateKey}"]`);
        dayElements.forEach(el => el.classList.add('selected'));
    });
}

// Ouvrir la modal
function openModal(date) {
    // Si plusieurs dates sont sélectionnées, utiliser la première
    if (this.selectedDates.length > 0 && !this.selectedDates.some(d => getDateKey(d) === getDateKey(date))) {
        date = this.selectedDates[0];
    }
    
    this.selectedDate = date;
    this.selectedPeriod = 'full';
    const modal = document.getElementById('modal');
    const leaveInfo = this.getLeaveForDate(date);
    
    // Afficher les informations de sélection
    let dateStr;
    const selectionInfo = document.getElementById('selectionInfo');
    const openSelectionBtn = document.getElementById('openSelectionBtn');
    
    if (this.selectedDates.length > 1) {
        dateStr = date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        selectionInfo.textContent = `⚠️ ${this.selectedDates.length} jours sélectionnés - Le congé sera appliqué à tous ces jours`;
        selectionInfo.style.display = 'block';
        if (openSelectionBtn) {
            openSelectionBtn.style.display = 'inline-block';
        }
    } else {
        dateStr = date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        selectionInfo.style.display = 'none';
        if (openSelectionBtn) {
            openSelectionBtn.style.display = 'none';
        }
    }
    
    document.getElementById('selectedDate').textContent = dateStr;
    
    // Réinitialiser les boutons de période
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById('fullDayBtn').classList.add('active');
    
    // Si une demi-journée est déjà posée, sélectionner la période correspondante
    if (leaveInfo.morning && !leaveInfo.afternoon) {
        this.selectedPeriod = 'morning';
        document.getElementById('morningBtn').classList.add('active');
        document.getElementById('fullDayBtn').classList.remove('active');
    } else if (leaveInfo.afternoon && !leaveInfo.morning) {
        this.selectedPeriod = 'afternoon';
        document.getElementById('afternoonBtn').classList.add('active');
        document.getElementById('fullDayBtn').classList.remove('active');
    } else if (leaveInfo.full) {
        this.selectedPeriod = 'full';
    }
    
    // S'assurer que leaveTypesConfig est chargé avant de rendre les boutons
    if (!this.leaveTypesConfig || this.leaveTypesConfig.length === 0) {
        console.warn('leaveTypesConfig vide, chargement des types par défaut...');
        if (typeof getDefaultLeaveTypes === 'function') {
            this.leaveTypesConfig = getDefaultLeaveTypes();
        } else {
            console.error('getDefaultLeaveTypes non disponible');
        }
    }
    
    // S'assurer que les boutons de types de congé sont rendus
    this.renderLeaveTypeButtons();
    
    // Mettre en évidence le bouton du type de congé actuel selon la période
    this.updateLeaveButtonsHighlight(leaveInfo);

    modal.style.display = 'block';
    // Ne pas bloquer les clics sur le calendrier - permettre la sélection multiple
    modal.classList.add('active');
}

// Mettre à jour la mise en évidence des boutons de congé
function updateLeaveButtonsHighlight(leaveInfo) {
    if (!leaveInfo) return;
    
    const leaveButtons = document.querySelectorAll('#leaveTypes .leave-btn');
    const currentType = leaveInfo[this.selectedPeriod || 'full'];
    
    leaveButtons.forEach(btn => {
        const typeColor = this.getLeaveColor(btn.dataset.type);
        if (currentType === btn.dataset.type) {
            btn.style.background = typeColor;
            btn.style.color = 'white';
        } else {
            btn.style.background = 'white';
            btn.style.color = '';
            btn.style.borderColor = typeColor;
        }
    });
}

// Obtenir la couleur du type de congé
function getLeaveColor(type) {
    const config = this.getLeaveTypeConfig(type);
    return config ? config.color : '#4a90e2';
}

// Rendre les boutons de types de congé dynamiquement
function renderLeaveTypeButtons() {
    const container = document.getElementById('leaveTypes');
    if (!container) {
        console.error('Conteneur #leaveTypes non trouvé');
        return;
    }
    
    container.innerHTML = '';

    // Vérifier que leaveTypesConfig est chargé
    if (!this.leaveTypesConfig || this.leaveTypesConfig.length === 0) {
        console.warn('leaveTypesConfig est vide, utilisation des types par défaut');
        // Charger les types par défaut si la config est vide
        if (typeof getDefaultLeaveTypes === 'function') {
            this.leaveTypesConfig = getDefaultLeaveTypes();
        } else {
            console.error('getDefaultLeaveTypes n\'est pas défini');
            container.innerHTML = '<p style="color: red;">Erreur: Aucun type de congé disponible</p>';
            return;
        }
    }

    console.log('Rendu de', this.leaveTypesConfig.length, 'types de congé');
    this.leaveTypesConfig.forEach(typeConfig => {
        const btn = document.createElement('button');
        btn.className = 'leave-btn';
        btn.dataset.type = typeConfig.id;
        btn.textContent = typeConfig.name;
        if (typeConfig.label !== typeConfig.name) {
            btn.textContent += ` (${typeConfig.label})`;
        }
        btn.style.borderColor = typeConfig.color;
        container.appendChild(btn);
    });
    
    console.log('Boutons de types de congé rendus:', container.children.length);
}

// Fermer la modal
function closeModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
    modal.classList.remove('active');
    this.selectedDate = null;
    this.selectedDates = [];
    this.multiSelectMode = false;
    
    // Masquer le message d'aide mobile
    const helpHint = document.getElementById('helpHint');
    if (helpHint) {
        helpHint.classList.remove('mobile-active');
        helpHint.style.display = 'none';
    }
    
    this.updateDateSelectionVisual();
}

// Ajouter ou modifier un congé
async function setLeave(date, type) {
    // Si plusieurs dates sont sélectionnées, appliquer à toutes
    const datesToProcess = this.selectedDates.length > 1 ? this.selectedDates : [date];
    const period = this.selectedPeriod || 'full';
    
    datesToProcess.forEach(d => {
        const keys = getDateKeys(d);
        
        // Si on pose une journée complète, supprimer les demi-journées
        if (period === 'full') {
            delete this.leaves[keys.morning];
            delete this.leaves[keys.afternoon];
            this.leaves[keys.full] = type;
        } else {
            // Si on pose une demi-journée, supprimer la journée complète
            delete this.leaves[keys.full];
            this.leaves[keys[period]] = type;
        }
    });
    
    // Réinitialiser la sélection multiple
    this.selectedDates = [];
    
    await this.saveLeaves();
    this.renderCalendar();
    this.closeModal();
}

// Supprimer un congé
async function removeLeave(date) {
    // Si plusieurs dates sont sélectionnées, supprimer pour toutes
    const datesToProcess = this.selectedDates.length > 1 ? this.selectedDates : [date];
    const period = this.selectedPeriod || 'full';
    
    datesToProcess.forEach(d => {
        const keys = getDateKeys(d);
        
        if (period === 'full') {
            // Supprimer tout
            delete this.leaves[keys.full];
            delete this.leaves[keys.morning];
            delete this.leaves[keys.afternoon];
        } else {
            // Supprimer seulement la période sélectionnée
            delete this.leaves[keys[period]];
        }
    });
    
    // Réinitialiser la sélection multiple
    this.selectedDates = [];
    
    await this.saveLeaves();
    this.renderCalendar();
    this.closeModal();
}


