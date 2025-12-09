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

// Rendre le calendrier (semestriel)
function renderCalendar() {
    this.renderSemesterView();
}

// Rendre la vue mensuelle
function renderMonthView() {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    // Premier jour du mois
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Jour de la semaine du premier jour (0 = dimanche, 1 = lundi, etc.)
    // On ajuste pour que lundi = 0
    let startingDay = (firstDay.getDay() + 6) % 7;

    // Afficher le mois et l'année
    const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    document.getElementById('currentMonth').textContent = 
        `${monthNames[month]} ${year}`;

    // Jours du mois précédent
    const prevMonth = new Date(year, month, 0);
    const daysInPrevMonth = prevMonth.getDate();
    
    for (let i = startingDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const date = new Date(year, month - 1, day);
        this.createDayElement(calendar, date, true);
    }

    // Jours du mois actuel
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        this.createDayElement(calendar, date, false);
    }

    // Jours du mois suivant pour compléter la grille
    const totalCells = calendar.children.length;
    const remainingCells = 42 - totalCells; // 6 semaines * 7 jours
    for (let day = 1; day <= remainingCells; day++) {
        const date = new Date(year, month + 1, day);
        this.createDayElement(calendar, date, true);
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

    const year = this.currentYear;
    const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    // Déterminer le semestre (1er semestre: 0-5, 2ème semestre: 6-11)
    const currentMonth = this.currentDate.getMonth();
    const semesterStart = currentMonth < 6 ? 0 : 6;
    const semesterEnd = currentMonth < 6 ? 6 : 12;

    // Mettre à jour le titre
    const semesterName = currentMonth < 6 ? '1er Semestre' : '2ème Semestre';
    document.getElementById('currentMonth').textContent = `${semesterName} ${year}`;

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

// Créer un élément de jour pour la vue semestrielle
function createYearDayElement(date) {
    const dayElement = document.createElement('div');
    dayElement.className = 'year-day';
    const dateKey = getDateKey(date);
    dayElement.setAttribute('data-date-key', dateKey);

    const dayOfWeek = date.getDay();
    const dayNames = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    const dayLetter = dayNames[dayOfWeek];

    // Vérifier si c'est aujourd'hui
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
        dayElement.classList.add('today');
    }

    // Vérifier si c'est un week-end
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        dayElement.classList.add('weekend');
    }

    // Vérifier si c'est un jour férié
    const publicHolidays = getPublicHolidays(this.selectedCountry, date.getFullYear());
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

// Créer un élément de jour
function createDayElement(container, date, isOtherMonth) {
    const day = document.createElement('div');
    day.className = 'day';
    const dateKey = getDateKey(date);
    day.setAttribute('data-date-key', dateKey);
    
    if (isOtherMonth) {
        day.classList.add('other-month');
    }

    // Vérifier si c'est aujourd'hui
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
        day.classList.add('today');
    }

    // Vérifier si c'est un jour férié
    const publicHolidays = getPublicHolidays(this.selectedCountry, date.getFullYear());
    if (publicHolidays[dateKey]) {
        day.classList.add('public-holiday');
        day.title = publicHolidays[dateKey];
    }
    
    // Vérifier si cette date est sélectionnée
    if (this.selectedDates.some(d => getDateKey(d) === dateKey)) {
        day.classList.add('selected');
    }

    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = date.getDate();
    day.appendChild(dayNumber);

    // Vérifier s'il y a un congé pour ce jour (journée complète ou demi-journées)
    const leaveInfo = this.getLeaveForDate(date);
    
    if (leaveInfo.full) {
        // Journée complète
        const badge = document.createElement('div');
        badge.className = `leave-badge ${leaveInfo.full}`;
        badge.textContent = this.getLeaveTypeLabel(leaveInfo.full);
        const color = this.getLeaveColor(leaveInfo.full);
        badge.style.backgroundColor = color;
        day.appendChild(badge);
    } else {
        // Demi-journées
        if (leaveInfo.morning) {
            const badge = document.createElement('div');
            badge.className = `leave-badge leave-badge-half leave-badge-morning ${leaveInfo.morning}`;
            badge.textContent = this.getLeaveTypeLabel(leaveInfo.morning);
            const color = this.getLeaveColor(leaveInfo.morning);
            badge.style.backgroundColor = color;
            day.appendChild(badge);
        }
        if (leaveInfo.afternoon) {
            const badge = document.createElement('div');
            badge.className = `leave-badge leave-badge-half leave-badge-afternoon ${leaveInfo.afternoon}`;
            badge.textContent = this.getLeaveTypeLabel(leaveInfo.afternoon);
            const color = this.getLeaveColor(leaveInfo.afternoon);
            badge.style.backgroundColor = color;
            day.appendChild(badge);
        }
    }

    // Ajouter l'événement de clic
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
    
    day.addEventListener('mousedown', handleDayClick);

    container.appendChild(day);
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
    document.querySelectorAll('.day.selected, .year-day.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Ajouter la classe de sélection aux dates sélectionnées
    this.selectedDates.forEach(date => {
        const dateKey = getDateKey(date);
        // Chercher par attribut data-date-key
        const dayElements = document.querySelectorAll(`[data-date-key="${dateKey}"]`);
        dayElements.forEach(el => el.classList.add('selected'));
        
        // Aussi chercher par classe si l'attribut n'est pas trouvé (pour compatibilité)
        if (dayElements.length === 0) {
            // Fallback : chercher dans tous les jours
            document.querySelectorAll('.day, .year-day').forEach(el => {
                // Vérifier si c'est le bon jour en comparant le contenu
                const dayContent = el.querySelector('.day-number, .year-day-info');
                if (dayContent && date.getDate().toString() === dayContent.textContent.trim().split(' ')[0]) {
                    el.classList.add('selected');
                }
            });
        }
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

// Changer de vue
function switchView(mode) {
    this.viewMode = mode;
    
    // Mettre à jour les boutons (vue mensuelle désactivée)
    const monthBtn = document.getElementById('monthViewBtn');
    if (monthBtn) {
        monthBtn.classList.toggle('active', mode === 'month');
    }
    document.getElementById('semesterViewBtn').classList.toggle('active', mode === 'semester');
    
    // Afficher/masquer les vues
    const monthView = document.getElementById('monthView');
    if (monthView) {
        monthView.style.display = mode === 'month' ? 'block' : 'none';
    }
    document.getElementById('semesterView').style.display = mode === 'semester' ? 'block' : 'none';
    
    // Afficher les contrôles de navigation
    const headerControls = document.querySelector('.header-controls');
    headerControls.style.display = 'flex';
    
    this.renderCalendar();
    this.updateStats();
    this.updateLeaveQuotas();
}

