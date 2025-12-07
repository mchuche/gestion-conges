// Gestionnaire de congés - Application JavaScript

class LeaveManager {
    constructor() {
        this.currentDate = new Date();
        this.currentYear = this.currentDate.getFullYear();
        this.leaves = this.loadLeaves();
        this.leaveTypesConfig = this.loadLeaveTypesConfig();
        this.leaveQuotasByYear = this.loadLeaveQuotasByYear();
        this.selectedCountry = this.loadSelectedCountry();
        this.selectedDate = null;
        this.selectedDates = []; // Pour la sélection multiple
        this.configYear = this.currentYear; // Année sélectionnée dans la configuration
        this.viewMode = 'semester'; // 'semester' (vue mensuelle temporairement désactivée)
        this.init();
    }

    init() {
        console.log('Initialisation du gestionnaire de congés...');
        
        // Afficher la vue semestrielle par défaut
        const semesterView = document.getElementById('semesterView');
        if (semesterView) {
            semesterView.style.display = 'block';
            console.log('Vue semestrielle affichée');
        } else {
            console.error('semesterView element not found');
        }
        
        // Masquer la vue mensuelle si elle existe
        const monthView = document.getElementById('monthView');
        if (monthView) {
            monthView.style.display = 'none';
        }
        
        try {
            this.renderLeaveTypeButtons();
            console.log('Boutons de types de congés rendus');
        } catch (e) {
            console.error('Erreur lors du rendu des boutons:', e);
        }
        
        try {
            this.renderCalendar();
            console.log('Calendrier rendu');
        } catch (e) {
            console.error('Erreur lors du rendu du calendrier:', e);
        }
        
        try {
            this.setupEventListeners();
            console.log('Event listeners configurés');
        } catch (e) {
            console.error('Erreur lors de la configuration des event listeners:', e);
        }
        
        try {
            this.updateStats();
            this.updateLeaveQuotas();
            console.log('Statistiques mises à jour');
        } catch (e) {
            console.error('Erreur lors de la mise à jour des statistiques:', e);
        }
    }

    // Charger les congés depuis le localStorage
    loadLeaves() {
        const stored = localStorage.getItem('leaves');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                console.log('Jours de congé chargés:', Object.keys(parsed).length, 'entrées');
                return parsed;
            } catch (e) {
                console.error('Erreur lors du chargement des jours de congé:', e);
                return {};
            }
        }
        console.log('Aucun jour de congé trouvé dans le localStorage');
        return {};
    }

    // Sauvegarder les congés dans le localStorage
    saveLeaves() {
        try {
            localStorage.setItem('leaves', JSON.stringify(this.leaves));
            console.log('Jours de congé sauvegardés:', Object.keys(this.leaves).length, 'entrées');
            this.updateStats();
            this.updateLeaveQuotas();
        } catch (e) {
            console.error('Erreur lors de la sauvegarde des jours de congé:', e);
        }
    }

    // Charger la configuration des types de congés
    loadLeaveTypesConfig() {
        const stored = localStorage.getItem('leaveTypesConfig');
        if (stored) {
            return JSON.parse(stored);
        }
        // Configuration par défaut
        return [
            { id: 'congé-payé', name: 'Congé Payé', label: 'P', color: '#4a90e2' },
            { id: 'rtt', name: 'RTT', label: 'RTT', color: '#50c878' },
            { id: 'congé-sans-solde', name: 'Congé Sans Solde', label: 'CSS', color: '#95a5a6' },
            { id: 'permission', name: 'Permission', label: 'Perm', color: '#e67e22' },
            { id: 'maladie', name: 'Maladie', label: 'Maladie', color: '#e74c3c' },
            { id: 'télétravail', name: 'Télétravail', label: 'T', color: '#9b59b6' },
            { id: 'formation', name: 'Formation', label: 'Form', color: '#f39c12' },
            { id: 'grève', name: 'Grève', label: 'Grève', color: '#c0392b' }
        ];
    }

    // Charger les quotas par année
    loadLeaveQuotasByYear() {
        const stored = localStorage.getItem('leaveQuotasByYear');
        if (stored) {
            const parsed = JSON.parse(stored);
            // S'assurer que l'année en cours a des quotas par défaut si elle n'existe pas
            const currentYear = new Date().getFullYear();
            if (!parsed[currentYear]) {
                parsed[currentYear] = {
                    'congé-payé': 25,
                    'rtt': 10
                };
                localStorage.setItem('leaveQuotasByYear', JSON.stringify(parsed));
            }
            return parsed;
        }
        // Quotas par défaut pour l'année en cours
        const currentYear = new Date().getFullYear();
        const defaultQuotas = {
            [currentYear]: {
                'congé-payé': 25,
                'rtt': 10
            }
        };
        // Sauvegarder les quotas par défaut
        localStorage.setItem('leaveQuotasByYear', JSON.stringify(defaultQuotas));
        return defaultQuotas;
    }

    // Sauvegarder les quotas par année
    saveLeaveQuotasByYear() {
        localStorage.setItem('leaveQuotasByYear', JSON.stringify(this.leaveQuotasByYear));
    }

    // Formater un nombre (afficher les décimales seulement si nécessaire)
    formatNumber(num) {
        if (num % 1 === 0) {
            return num.toString();
        }
        return num.toFixed(1);
    }

    // Obtenir le quota d'un type de congé pour une année donnée
    getQuotaForYear(typeId, year) {
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

    // Sauvegarder la configuration des types de congés
    saveLeaveTypesConfig() {
        localStorage.setItem('leaveTypesConfig', JSON.stringify(this.leaveTypesConfig));
        this.renderLeaveTypeButtons();
        this.updateLeaveQuotas();
    }

    // Charger le pays sélectionné
    loadSelectedCountry() {
        const stored = localStorage.getItem('selectedCountry');
        return stored || 'FR'; // Par défaut France
    }

    // Sauvegarder le pays sélectionné
    saveSelectedCountry() {
        localStorage.setItem('selectedCountry', this.selectedCountry);
        this.renderCalendar();
    }

    // Obtenir les jours fériés pour un pays et une année
    getPublicHolidays(country, year) {
        const holidays = {};
        
        // Fonction pour calculer Pâques (algorithme de Meeus)
        const getEaster = (year) => {
            const a = year % 19;
            const b = Math.floor(year / 100);
            const c = year % 100;
            const d = Math.floor(b / 4);
            const e = b % 4;
            const f = Math.floor((b + 8) / 25);
            const g = Math.floor((b - f + 1) / 3);
            const h = (19 * a + b - d - g + 15) % 30;
            const i = Math.floor(c / 4);
            const k = c % 4;
            const l = (32 + 2 * e + 2 * i - h - k) % 7;
            const m = Math.floor((a + 11 * h + 22 * l) / 451);
            const month = Math.floor((h + l - 7 * m + 114) / 31);
            const day = ((h + l - 7 * m + 114) % 31) + 1;
            return new Date(year, month - 1, day);
        };

        const easter = getEaster(year);
        const easterMonday = new Date(easter);
        easterMonday.setDate(easterMonday.getDate() + 1);
        const ascension = new Date(easter);
        ascension.setDate(ascension.getDate() + 39);
        const whitMonday = new Date(easter);
        whitMonday.setDate(whitMonday.getDate() + 50);

        // Jours fériés fixes et variables selon le pays
        const countryHolidays = {
            'FR': [
                { month: 0, day: 1, name: 'Jour de l\'an' },
                { month: 4, day: 1, name: 'Fête du Travail' },
                { month: 4, day: 8, name: 'Victoire 1945' },
                { month: 6, day: 14, name: 'Fête Nationale' },
                { month: 7, day: 15, name: 'Assomption' },
                { month: 10, day: 1, name: 'Toussaint' },
                { month: 10, day: 11, name: 'Armistice 1918' },
                { month: 11, day: 25, name: 'Noël' },
                { date: easter, name: 'Pâques' },
                { date: easterMonday, name: 'Lundi de Pâques' },
                { date: ascension, name: 'Ascension' },
                { date: whitMonday, name: 'Lundi de Pentecôte' }
            ],
            'BE': [
                { month: 0, day: 1, name: 'Jour de l\'an' },
                { month: 4, day: 1, name: 'Fête du Travail' },
                { month: 6, day: 21, name: 'Fête Nationale' },
                { month: 7, day: 15, name: 'Assomption' },
                { month: 10, day: 1, name: 'Toussaint' },
                { month: 10, day: 11, name: 'Armistice' },
                { month: 11, day: 25, name: 'Noël' },
                { date: easter, name: 'Pâques' },
                { date: easterMonday, name: 'Lundi de Pâques' },
                { date: ascension, name: 'Ascension' },
                { date: whitMonday, name: 'Lundi de Pentecôte' }
            ],
            'CH': [
                { month: 0, day: 1, name: 'Jour de l\'an' },
                { month: 4, day: 1, name: 'Fête du Travail' },
                { month: 7, day: 1, name: 'Fête Nationale' },
                { month: 11, day: 25, name: 'Noël' },
                { month: 11, day: 26, name: 'Saint-Étienne' },
                { date: easter, name: 'Pâques' },
                { date: easterMonday, name: 'Lundi de Pâques' },
                { date: ascension, name: 'Ascension' },
                { date: whitMonday, name: 'Lundi de Pentecôte' }
            ],
            'CA': [
                { month: 0, day: 1, name: 'Jour de l\'an' },
                { month: 6, day: 1, name: 'Fête du Canada' },
                { month: 10, day: 11, name: 'Jour du Souvenir' },
                { month: 11, day: 25, name: 'Noël' },
                { month: 11, day: 26, name: 'Boxing Day' }
            ],
            'US': [
                { month: 0, day: 1, name: 'New Year\'s Day' },
                { month: 6, day: 4, name: 'Independence Day' },
                { month: 10, day: 11, name: 'Veterans Day' },
                { month: 11, day: 25, name: 'Christmas' }
            ],
            'GB': [
                { month: 0, day: 1, name: 'New Year\'s Day' },
                { month: 4, day: 1, name: 'May Day' },
                { month: 4, day: 31, name: 'Spring Bank Holiday' },
                { month: 7, day: 31, name: 'Summer Bank Holiday' },
                { month: 11, day: 25, name: 'Christmas' },
                { month: 11, day: 26, name: 'Boxing Day' },
                { date: easter, name: 'Easter' },
                { date: easterMonday, name: 'Easter Monday' }
            ],
            'DE': [
                { month: 0, day: 1, name: 'Neujahr' },
                { month: 4, day: 1, name: 'Tag der Arbeit' },
                { month: 9, day: 3, name: 'Tag der Deutschen Einheit' },
                { month: 11, day: 25, name: 'Weihnachten' },
                { month: 11, day: 26, name: '2. Weihnachtstag' },
                { date: easter, name: 'Ostern' },
                { date: easterMonday, name: 'Ostermontag' },
                { date: ascension, name: 'Christi Himmelfahrt' },
                { date: whitMonday, name: 'Pfingstmontag' }
            ],
            'ES': [
                { month: 0, day: 1, name: 'Año Nuevo' },
                { month: 0, day: 6, name: 'Epifanía' },
                { month: 4, day: 1, name: 'Día del Trabajador' },
                { month: 9, day: 12, name: 'Fiesta Nacional' },
                { month: 10, day: 1, name: 'Todos los Santos' },
                { month: 11, day: 6, name: 'Día de la Constitución' },
                { month: 11, day: 8, name: 'Inmaculada Concepción' },
                { month: 11, day: 25, name: 'Navidad' },
                { date: easter, name: 'Pascua' }
            ],
            'IT': [
                { month: 0, day: 1, name: 'Capodanno' },
                { month: 0, day: 6, name: 'Epifania' },
                { month: 3, day: 25, name: 'Liberazione' },
                { month: 4, day: 1, name: 'Festa del Lavoro' },
                { month: 5, day: 2, name: 'Festa della Repubblica' },
                { month: 7, day: 15, name: 'Ferragosto' },
                { month: 10, day: 1, name: 'Ognissanti' },
                { month: 11, day: 8, name: 'Immacolata' },
                { month: 11, day: 25, name: 'Natale' },
                { month: 11, day: 26, name: 'Santo Stefano' },
                { date: easter, name: 'Pasqua' },
                { date: easterMonday, name: 'Pasquetta' }
            ],
            'NL': [
                { month: 0, day: 1, name: 'Nieuwjaar' },
                { month: 3, day: 27, name: 'Koningsdag' },
                { month: 4, day: 4, name: 'Dodenherdenking' },
                { month: 4, day: 5, name: 'Bevrijdingsdag' },
                { month: 11, day: 25, name: 'Kerstmis' },
                { month: 11, day: 26, name: 'Tweede Kerstdag' },
                { date: easter, name: 'Pasen' },
                { date: easterMonday, name: 'Tweede Paasdag' },
                { date: ascension, name: 'Hemelvaart' },
                { date: whitMonday, name: 'Tweede Pinksterdag' }
            ],
            'LU': [
                { month: 0, day: 1, name: 'Jour de l\'an' },
                { month: 5, day: 23, name: 'Fête Nationale' },
                { month: 7, day: 15, name: 'Assomption' },
                { month: 10, day: 1, name: 'Toussaint' },
                { month: 11, day: 25, name: 'Noël' },
                { month: 11, day: 26, name: 'Saint-Étienne' },
                { date: easter, name: 'Pâques' },
                { date: easterMonday, name: 'Lundi de Pâques' },
                { date: ascension, name: 'Ascension' },
                { date: whitMonday, name: 'Lundi de Pentecôte' }
            ]
        };

        const countryList = countryHolidays[country] || countryHolidays['FR'];
        
        countryList.forEach(holiday => {
            let date;
            if (holiday.date) {
                date = holiday.date;
            } else {
                date = new Date(year, holiday.month, holiday.day);
            }
            const dateKey = this.getDateKey(date);
            holidays[dateKey] = holiday.name;
        });

        return holidays;
    }

    // Obtenir la clé de date au format YYYY-MM-DD
    getDateKey(date) {
        return date.toISOString().split('T')[0];
    }

    // Obtenir la clé de date avec période (pour demi-journées)
    getDateKeyWithPeriod(date, period) {
        const baseKey = this.getDateKey(date);
        if (period === 'full') {
            return baseKey;
        }
        return `${baseKey}-${period}`;
    }

    // Obtenir toutes les clés possibles pour une date (journée complète, matin, après-midi)
    getDateKeys(date) {
        const baseKey = this.getDateKey(date);
        return {
            full: baseKey,
            morning: `${baseKey}-morning`,
            afternoon: `${baseKey}-afternoon`
        };
    }

    // Vérifier si une date a un congé et retourner les détails
    getLeaveForDate(date) {
        const keys = this.getDateKeys(date);
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
    renderCalendar() {
        this.renderSemesterView();
    }

    // Rendre la vue mensuelle
    renderMonthView() {
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
    renderSemesterView() {
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
    createYearDayElement(date) {
        const dayElement = document.createElement('div');
        dayElement.className = 'year-day';
        const dateKey = this.getDateKey(date);
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
        const publicHolidays = this.getPublicHolidays(this.selectedCountry, date.getFullYear());
        if (publicHolidays[dateKey]) {
            dayElement.classList.add('public-holiday');
            dayElement.title = publicHolidays[dateKey];
        }
        
        // Vérifier si cette date est sélectionnée
        if (this.selectedDates.some(d => this.getDateKey(d) === dateKey)) {
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
            
            // Détecter Ctrl ou Cmd
            const isMultiSelect = e.ctrlKey || e.metaKey;
            
            if (isMultiSelect) {
                // Sélection multiple avec Ctrl (ou Cmd sur Mac)
                e.preventDefault();
                this.toggleDateSelection(date);
                // Ne pas ouvrir la modale automatiquement, permettre de continuer à sélectionner
            } else {
                // Clic simple : sélection unique ou ouvrir la modale si des dates sont déjà sélectionnées
                if (this.selectedDates.length > 0 && this.selectedDates.some(d => this.getDateKey(d) === this.getDateKey(date))) {
                    // On clique sur une date déjà sélectionnée, ouvrir la modale
                    this.openModal(date);
                } else {
                    // Nouvelle sélection unique
                    this.selectedDates = [date];
                    this.updateDateSelectionVisual();
                    this.openModal(date);
                }
            }
        };
        
        dayElement.addEventListener('click', handleDayClick);
        // Également sur le contenu pour s'assurer que ça fonctionne partout
        dayContent.addEventListener('click', handleDayClick);

        return dayElement;
    }

    // Créer un élément de jour
    createDayElement(container, date, isOtherMonth) {
        const day = document.createElement('div');
        day.className = 'day';
        const dateKey = this.getDateKey(date);
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
        const publicHolidays = this.getPublicHolidays(this.selectedCountry, date.getFullYear());
        if (publicHolidays[dateKey]) {
            day.classList.add('public-holiday');
            day.title = publicHolidays[dateKey];
        }
        
        // Vérifier si cette date est sélectionnée
        if (this.selectedDates.some(d => this.getDateKey(d) === dateKey)) {
            day.classList.add('selected');
        }

        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = date.getDate();
        day.appendChild(dayNumber);

        // Vérifier s'il y a un congé pour ce jour (journée complète ou demi-journées)
        // Note: dateKey est déjà défini plus haut pour les jours fériés
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
        day.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const isMultiSelect = e.ctrlKey || e.metaKey;
            
            if (isMultiSelect) {
                // Sélection multiple avec Ctrl (ou Cmd sur Mac)
                e.preventDefault();
                this.toggleDateSelection(date);
                // Ne pas ouvrir la modale automatiquement, permettre de continuer à sélectionner
            } else {
                // Clic simple : sélection unique ou ouvrir la modale si des dates sont déjà sélectionnées
                if (this.selectedDates.length > 0 && this.selectedDates.some(d => this.getDateKey(d) === this.getDateKey(date))) {
                    // On clique sur une date déjà sélectionnée, ouvrir la modale
                    this.openModal(date);
                } else {
                    // Nouvelle sélection unique
                    this.selectedDates = [date];
                    this.updateDateSelectionVisual();
                    this.openModal(date);
                }
            }
        });

        container.appendChild(day);
    }

    // Obtenir le libellé du type de congé
    getLeaveTypeLabel(type) {
        const config = this.leaveTypesConfig.find(t => t.id === type);
        return config ? config.label : type;
    }

    // Obtenir la configuration d'un type de congé
    getLeaveTypeConfig(type) {
        const config = this.leaveTypesConfig.find(t => t.id === type);
        if (!config) return null;
        
        // Ajouter le quota de l'année en cours
        const currentYear = this.currentDate.getFullYear();
        const quota = this.getQuotaForYear(type, currentYear);
        return { ...config, quota };
    }

    // Basculer la sélection d'une date (pour sélection multiple)
    toggleDateSelection(date) {
        const dateKey = this.getDateKey(date);
        const index = this.selectedDates.findIndex(d => this.getDateKey(d) === dateKey);
        
        if (index > -1) {
            // Déjà sélectionnée, la retirer
            this.selectedDates.splice(index, 1);
        } else {
            // Pas sélectionnée, l'ajouter
            this.selectedDates.push(date);
        }
        
        // Mettre à jour l'affichage visuel immédiatement
        this.updateDateSelectionVisual();
        
        // Afficher l'aide si c'est la première sélection multiple
        if (this.selectedDates.length > 1) {
            const helpHint = document.getElementById('helpHint');
            if (helpHint) {
                helpHint.style.display = 'none'; // Masquer l'aide une fois qu'on a compris
            }
        }
        
        // Mettre à jour la modale si elle est déjà ouverte, sinon ne pas l'ouvrir automatiquement
        const modal = document.getElementById('modal');
        if (modal.style.display === 'block') {
            // La modale est déjà ouverte, juste mettre à jour l'affichage
            this.updateModalForSelection();
        }
        // Ne pas ouvrir automatiquement la modale lors de la sélection multiple avec Ctrl
    }

    // Mettre à jour la modale pour la sélection multiple
    updateModalForSelection() {
        if (this.selectedDates.length === 0) {
            this.closeModal();
            return;
        }
        
        const date = this.selectedDates[0];
        const leaveInfo = this.getLeaveForDate(date);
        
        // Afficher les informations de sélection
        let dateStr;
        const selectionInfo = document.getElementById('selectionInfo');
        
        if (this.selectedDates.length > 1) {
            dateStr = date.toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            selectionInfo.textContent = `⚠️ ${this.selectedDates.length} jours sélectionnés - Le congé sera appliqué à tous ces jours`;
            selectionInfo.style.display = 'block';
        } else {
            dateStr = date.toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            selectionInfo.style.display = 'none';
        }
        
        document.getElementById('selectedDate').textContent = dateStr;
        
        // Mettre en évidence le bouton du type de congé actuel selon la période
        this.updateLeaveButtonsHighlight(leaveInfo);
    }

    // Mettre à jour l'affichage visuel des dates sélectionnées
    updateDateSelectionVisual() {
        // Retirer toutes les classes de sélection
        document.querySelectorAll('.day.selected, .year-day.selected').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Ajouter la classe de sélection aux dates sélectionnées
        this.selectedDates.forEach(date => {
            const dateKey = this.getDateKey(date);
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
    openModal(date) {
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
        
        // Mettre en évidence le bouton du type de congé actuel selon la période
        this.updateLeaveButtonsHighlight(leaveInfo);

        modal.style.display = 'block';
        // Ne pas bloquer les clics sur le calendrier - permettre la sélection multiple
        modal.classList.add('active');
    }

    // Mettre à jour la mise en évidence des boutons de congé
    updateLeaveButtonsHighlight(leaveInfo) {
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
    getLeaveColor(type) {
        const config = this.getLeaveTypeConfig(type);
        return config ? config.color : '#4a90e2';
    }

    // Rendre les boutons de types de congé dynamiquement
    renderLeaveTypeButtons() {
        const container = document.getElementById('leaveTypes');
        container.innerHTML = '';

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
    }

    // Fermer la modal
    closeModal() {
        const modal = document.getElementById('modal');
        modal.style.display = 'none';
        modal.classList.remove('active');
        this.selectedDate = null;
        // Réinitialiser la sélection multiple après fermeture
        this.selectedDates = [];
        this.updateDateSelectionVisual();
    }

    // Ajouter ou modifier un congé
    setLeave(date, type) {
        // Si plusieurs dates sont sélectionnées, appliquer à toutes
        const datesToProcess = this.selectedDates.length > 1 ? this.selectedDates : [date];
        const period = this.selectedPeriod || 'full';
        
        datesToProcess.forEach(d => {
            const keys = this.getDateKeys(d);
            
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
        
        this.saveLeaves();
        this.renderCalendar();
        this.closeModal();
    }

    // Supprimer un congé
    removeLeave(date) {
        // Si plusieurs dates sont sélectionnées, supprimer pour toutes
        const datesToProcess = this.selectedDates.length > 1 ? this.selectedDates : [date];
        const period = this.selectedPeriod || 'full';
        
        datesToProcess.forEach(d => {
            const keys = this.getDateKeys(d);
            
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
        
        this.saveLeaves();
        this.renderCalendar();
        this.closeModal();
    }

    // Changer de vue
    switchView(mode) {
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

    // Mettre à jour les statistiques
    updateStats() {
        // Utiliser l'année de la vue actuelle
        const currentYear = this.currentDate.getFullYear();
        
        // Compter les jours (0.5 pour demi-journée, 1 pour journée complète) pour l'année en cours uniquement
        let totalDays = 0;
        const processedDates = new Set();

        Object.keys(this.leaves).forEach(dateKey => {
            // Extraire la date de base (sans -morning ou -afternoon)
            const baseDateKey = dateKey.split('-').slice(0, 3).join('-');
            const date = new Date(baseDateKey);
            
            // Filtrer par année
            if (date.getFullYear() !== currentYear) {
                return;
            }
            
            if (!processedDates.has(baseDateKey)) {
                processedDates.add(baseDateKey);
                const leaveInfo = this.getLeaveForDate(date);
                
                if (leaveInfo.full) {
                    totalDays += 1;
                } else {
                    if (leaveInfo.morning) totalDays += 0.5;
                    if (leaveInfo.afternoon) totalDays += 0.5;
                }
            }
        });

        document.getElementById('totalDays').textContent = this.formatNumber(totalDays);

        // Calculer le total des jours restants selon les quotas configurés (pour l'année en cours)
        let totalRemaining = 0;
        const processedDatesForQuota = new Set();
        
        // Compter les jours utilisés par type (0.5 pour demi-journée, 1 pour journée complète) pour l'année en cours
        const usedDays = {};

        Object.keys(this.leaves).forEach(dateKey => {
            const baseDateKey = dateKey.split('-').slice(0, 3).join('-');
            const date = new Date(baseDateKey);
            
            // Filtrer par année
            if (date.getFullYear() !== currentYear) {
                return;
            }
            
            if (!processedDatesForQuota.has(baseDateKey)) {
                processedDatesForQuota.add(baseDateKey);
                const leaveInfo = this.getLeaveForDate(date);
                
                if (leaveInfo.full) {
                    usedDays[leaveInfo.full] = (usedDays[leaveInfo.full] || 0) + 1;
                } else {
                    if (leaveInfo.morning) {
                        usedDays[leaveInfo.morning] = (usedDays[leaveInfo.morning] || 0) + 0.5;
                    }
                    if (leaveInfo.afternoon) {
                        usedDays[leaveInfo.afternoon] = (usedDays[leaveInfo.afternoon] || 0) + 0.5;
                    }
                }
            }
        });

        // Calculer les jours restants et le total des quotas pour chaque type avec quota (pour l'année en cours)
        let totalQuotas = 0;
        console.log('Calcul des jours restants pour l\'année:', currentYear);
        console.log('Quotas disponibles:', this.leaveQuotasByYear);
        this.leaveTypesConfig.forEach(typeConfig => {
            const quota = this.getQuotaForYear(typeConfig.id, currentYear);
            console.log(`Type: ${typeConfig.name} (${typeConfig.id}), Quota: ${quota}`);
            if (quota !== null && quota !== undefined && quota > 0) {
                totalQuotas += quota; // Ajouter au total des quotas
                const used = usedDays[typeConfig.id] || 0;
                const remaining = quota - used;
                totalRemaining += Math.max(0, remaining); // Ne pas compter les dépassements négatifs
                console.log(`  -> Utilisé: ${used}, Restant: ${remaining}`);
            }
        });
        
        console.log(`Total jours restants: ${totalRemaining}, Total quotas: ${totalQuotas}`);

        // Afficher au format "restants/total" (ex: 24/49 ou 24.5/49.5)
        document.getElementById('remainingDays').textContent = `${this.formatNumber(totalRemaining)}/${this.formatNumber(totalQuotas)}`;
    }

    // Mettre à jour l'affichage des quotas
    updateLeaveQuotas() {
        const container = document.getElementById('leaveQuotas');
        container.innerHTML = '';

        // Utiliser l'année de la vue actuelle
        const currentYear = this.currentDate.getFullYear();

        // Compter les jours utilisés par type (0.5 pour demi-journée, 1 pour journée complète) pour l'année en cours uniquement
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
                
                if (leaveInfo.full) {
                    usedDays[leaveInfo.full] = (usedDays[leaveInfo.full] || 0) + 1;
                } else {
                    if (leaveInfo.morning) {
                        usedDays[leaveInfo.morning] = (usedDays[leaveInfo.morning] || 0) + 0.5;
                    }
                    if (leaveInfo.afternoon) {
                        usedDays[leaveInfo.afternoon] = (usedDays[leaveInfo.afternoon] || 0) + 0.5;
                    }
                }
            }
        });

        // Créer les cartes de quota (pour l'année en cours)
        this.leaveTypesConfig.forEach(typeConfig => {
            const quota = this.getQuotaForYear(typeConfig.id, currentYear);
            if (quota !== null && quota !== undefined) {
                const used = usedDays[typeConfig.id] || 0;
                const remaining = quota - used;
                const percentage = quota > 0 ? (used / quota) * 100 : 0;

                const quotaCard = document.createElement('div');
                quotaCard.className = 'quota-card';
                
                const quotaHeader = document.createElement('div');
                quotaHeader.className = 'quota-header';
                quotaHeader.innerHTML = `
                    <span class="quota-name">${typeConfig.name}</span>
                    <span class="quota-numbers">${this.formatNumber(used)} / ${this.formatNumber(quota)}</span>
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
                        ${remaining >= 0 ? `Restant: ${this.formatNumber(remaining)}` : `Dépassé: ${this.formatNumber(Math.abs(remaining))}`}
                    </span>
                `;
                quotaCard.appendChild(quotaFooter);

                container.appendChild(quotaCard);
            }
        });
    }

    // Configuration des événements
    setupEventListeners() {
        // Navigation semestrielle
        document.getElementById('prevMonth').addEventListener('click', () => {
            // Passer au semestre précédent
            const currentMonth = this.currentDate.getMonth();
            if (currentMonth < 6) {
                // On est au 1er semestre, aller au 2ème semestre de l'année précédente
                this.currentYear--;
                this.currentDate.setFullYear(this.currentYear);
                this.currentDate.setMonth(6);
            } else {
                // On est au 2ème semestre, aller au 1er semestre
                this.currentDate.setMonth(0);
            }
            this.renderCalendar();
            this.updateStats();
            this.updateLeaveQuotas();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            // Passer au semestre suivant
            const currentMonth = this.currentDate.getMonth();
            if (currentMonth < 6) {
                // On est au 1er semestre, aller au 2ème semestre
                this.currentDate.setMonth(6);
            } else {
                // On est au 2ème semestre, aller au 1er semestre de l'année suivante
                this.currentYear++;
                this.currentDate.setFullYear(this.currentYear);
                this.currentDate.setMonth(0);
            }
            this.renderCalendar();
            this.updateStats();
            this.updateLeaveQuotas();
        });

        // Boutons de période (matin/après-midi/journée complète)
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.selectedPeriod = e.target.dataset.period;
                
                // Mettre à jour la mise en évidence des boutons
                const leaveInfo = this.getLeaveForDate(this.selectedDate);
                this.updateLeaveButtonsHighlight(leaveInfo);
            });
        });

        // Boutons de type de congé (déléguation d'événement pour les boutons dynamiques)
        document.getElementById('leaveTypes').addEventListener('click', (e) => {
            if (e.target.classList.contains('leave-btn') && this.selectedDate) {
                this.setLeave(this.selectedDate, e.target.dataset.type);
            }
        });

        // Bouton supprimer
        document.getElementById('removeLeave').addEventListener('click', () => {
            if (this.selectedDate) {
                this.removeLeave(this.selectedDate);
            }
        });

        // Fermer la modal
        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });

        // Fermer la modal en cliquant en dehors
        window.addEventListener('click', (event) => {
            const modal = document.getElementById('modal');
            if (event.target === modal) {
                this.closeModal();
            }
            const configModal = document.getElementById('configModal');
            if (event.target === configModal) {
                this.closeConfigModal();
            }
        });

        // Navigation au clavier
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeModal();
                this.closeConfigModal();
            }
        });

        // Configuration
        const configBtn = document.getElementById('configBtn');
        if (configBtn) {
            configBtn.addEventListener('click', () => {
                console.log('Bouton de configuration cliqué');
                this.openConfigModal();
            });
        } else {
            console.error('Bouton de configuration non trouvé');
        }

        document.querySelector('.config-close').addEventListener('click', () => {
            this.closeConfigModal();
        });

        document.getElementById('saveConfigBtn').addEventListener('click', () => {
            this.saveConfig();
        });

        document.getElementById('cancelConfigBtn').addEventListener('click', () => {
            this.closeConfigModal();
        });

        document.getElementById('addLeaveTypeBtn').addEventListener('click', () => {
            this.addLeaveType();
        });
    }

    // Ouvrir la modale de configuration
    openConfigModal() {
        const modal = document.getElementById('configModal');
        // Réinitialiser l'année de configuration à l'année en cours
        this.configYear = this.currentDate.getFullYear();
        this.renderConfigModal();
        modal.style.display = 'block';
    }

    // Fermer la modale de configuration
    closeConfigModal() {
        const modal = document.getElementById('configModal');
        modal.style.display = 'none';
    }

    // Rendre la modale de configuration
    renderConfigModal() {
        // Mettre à jour le sélecteur de pays
        const countrySelect = document.getElementById('countrySelect');
        if (countrySelect) {
            countrySelect.value = this.selectedCountry;
        }

        // Mettre à jour le sélecteur d'année
        const yearSelect = document.getElementById('configYearSelect');
        if (yearSelect) {
            // Générer les options d'années (année actuelle - 2 à année actuelle + 5)
            const currentYear = this.currentDate.getFullYear();
            yearSelect.innerHTML = '';
            for (let year = currentYear - 2; year <= currentYear + 5; year++) {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                if (year === this.configYear) {
                    option.selected = true;
                }
                yearSelect.appendChild(option);
            }
            
            // Event listener pour le changement d'année (éviter les doublons)
            if (!yearSelect.hasAttribute('data-listener-added')) {
                yearSelect.setAttribute('data-listener-added', 'true');
                yearSelect.addEventListener('change', (e) => {
                    this.configYear = parseInt(e.target.value);
                    this.renderConfigModal();
                });
            }
        }

        const container = document.getElementById('leaveTypesConfig');
        container.innerHTML = '';

        // Afficher les quotas pour l'année sélectionnée
        const selectedYear = this.configYear;
        this.leaveTypesConfig.forEach((typeConfig, index) => {
            const quota = this.getQuotaForYear(typeConfig.id, selectedYear);
            const item = document.createElement('div');
            item.className = 'leave-type-item';
            item.innerHTML = `
                <div class="leave-type-inputs">
                    <input type="text" class="leave-type-name" value="${typeConfig.name}" 
                           placeholder="Nom du type" data-index="${index}">
                    <input type="text" class="leave-type-label" value="${typeConfig.label}" 
                           placeholder="Label (ex: P)" maxlength="10" data-index="${index}">
                    <input type="color" class="leave-type-color" value="${typeConfig.color}" 
                           data-index="${index}">
                    <input type="number" class="leave-type-quota" value="${quota !== null && quota !== undefined ? quota : ''}" 
                           placeholder="Quota (vide = illimité)" min="0" data-index="${index}">
                    <button class="delete-type-btn" data-index="${index}" title="Supprimer ce type" aria-label="Supprimer">🗑️</button>
                </div>
            `;
            container.appendChild(item);
        });

        // Ajouter les événements
        container.querySelectorAll('.delete-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                const typeToDelete = this.leaveTypesConfig[index];
                
                // Vérifier si ce type est utilisé dans les congés
                const isUsed = this.isLeaveTypeUsed(typeToDelete.id);
                
                let confirmMessage = `Êtes-vous sûr de vouloir supprimer le type "${typeToDelete.name}" ?`;
                if (isUsed) {
                    confirmMessage += `\n\nAttention : Ce type est utilisé dans ${this.countLeaveTypeUsage(typeToDelete.id)} jour(s) de congé. Ces congés seront également supprimés.`;
                }
                if (this.leaveTypesConfig.length === 1) {
                    confirmMessage += `\n\nAttention : C'est le dernier type de congé. Vous devrez en créer un nouveau.`;
                }
                
                if (confirm(confirmMessage)) {
                    // Supprimer les congés de ce type
                    if (isUsed) {
                        this.removeLeavesOfType(typeToDelete.id);
                    }
                    
                    // Supprimer le type de la configuration
                    this.leaveTypesConfig.splice(index, 1);
                    
                    // Si c'était le dernier type, en créer un par défaut
                    if (this.leaveTypesConfig.length === 0) {
                        this.leaveTypesConfig.push({
                            id: `type-${Date.now()}`,
                            name: 'Congé',
                            label: 'C',
                            color: '#4a90e2',
                            quota: null
                        });
                    }
                    
                    this.renderConfigModal();
                }
            });
        });
    }

    // Vérifier si un type de congé est utilisé
    isLeaveTypeUsed(typeId) {
        return Object.values(this.leaves).includes(typeId);
    }

    // Compter le nombre de jours où un type de congé est utilisé
    countLeaveTypeUsage(typeId) {
        let count = 0;
        const processedDates = new Set();

        Object.keys(this.leaves).forEach(dateKey => {
            const baseDateKey = dateKey.split('-').slice(0, 3).join('-');
            
            if (!processedDates.has(baseDateKey)) {
                processedDates.add(baseDateKey);
                const leaveInfo = this.getLeaveForDate(new Date(baseDateKey));
                
                if (leaveInfo.full === typeId) {
                    count += 1;
                } else {
                    if (leaveInfo.morning === typeId) count += 0.5;
                    if (leaveInfo.afternoon === typeId) count += 0.5;
                }
            }
        });

        return count;
    }

    // Supprimer tous les congés d'un type donné
    removeLeavesOfType(typeId) {
        const keysToDelete = [];
        
        Object.keys(this.leaves).forEach(dateKey => {
            if (this.leaves[dateKey] === typeId) {
                keysToDelete.push(dateKey);
            }
        });
        
        keysToDelete.forEach(key => {
            delete this.leaves[key];
        });
        
        if (keysToDelete.length > 0) {
            this.saveLeaves();
            this.renderCalendar();
        }
    }

    // Ajouter un nouveau type de congé
    addLeaveType() {
        const newType = {
            id: `type-${Date.now()}`,
            name: 'Nouveau Type',
            label: 'NT',
            color: '#4a90e2',
            quota: null
        };
        this.leaveTypesConfig.push(newType);
        this.renderConfigModal();
    }

    // Sauvegarder la configuration
    saveConfig() {
        // Sauvegarder le pays sélectionné
        const countrySelect = document.getElementById('countrySelect');
        if (countrySelect) {
            this.selectedCountry = countrySelect.value;
            this.saveSelectedCountry();
        }

        const inputs = document.querySelectorAll('#leaveTypesConfig .leave-type-item');
        const newConfig = [];
        const selectedYear = this.configYear;

        // Initialiser l'année dans leaveQuotasByYear si elle n'existe pas
        if (!this.leaveQuotasByYear[selectedYear]) {
            this.leaveQuotasByYear[selectedYear] = {};
        }

        inputs.forEach((item, index) => {
            const name = item.querySelector('.leave-type-name').value.trim();
            const label = item.querySelector('.leave-type-label').value.trim();
            const color = item.querySelector('.leave-type-color').value;
            const quotaInput = item.querySelector('.leave-type-quota').value;
            const quota = quotaInput === '' ? null : parseInt(quotaInput);
            
            // Récupérer l'ID du type depuis la configuration actuelle
            const typeId = this.leaveTypesConfig[index].id;
            
            // Sauvegarder le quota pour l'année sélectionnée
            if (quota !== null && !isNaN(quota)) {
                this.leaveQuotasByYear[selectedYear][typeId] = quota;
            } else {
                // Supprimer le quota si vide
                if (this.leaveQuotasByYear[selectedYear][typeId] !== undefined) {
                    delete this.leaveQuotasByYear[selectedYear][typeId];
                }
            }

            if (name && label) {
                const oldType = this.leaveTypesConfig[index];
                newConfig.push({
                    id: oldType ? oldType.id : `type-${Date.now()}-${index}`,
                    name: name,
                    label: label,
                    color: color
                });
            }
        });

        if (newConfig.length > 0) {
            // Sauvegarder les types de congés AVANT de mettre à jour la configuration
            // pour s'assurer que les jours de congé existants ne sont pas perdus
            console.log('Jours de congé avant sauvegarde de la config:', Object.keys(this.leaves).length, 'entrées');
            
            this.leaveTypesConfig = newConfig;
            this.saveLeaveTypesConfig();
            this.saveLeaveQuotasByYear();
            
            // Vérifier que les jours de congé sont toujours présents
            console.log('Jours de congé après sauvegarde de la config:', Object.keys(this.leaves).length, 'entrées');
            
            this.closeConfigModal();
            this.renderCalendar();
            this.updateStats();
            this.updateLeaveQuotas();
        } else {
            alert('Veuillez remplir au moins un type de congé avec un nom et un label.');
        }
    }
}

// Initialiser l'application quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM chargé, initialisation du gestionnaire de congés...');
    try {
        const manager = new LeaveManager();
        console.log('Gestionnaire de congés initialisé avec succès', manager);
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        alert('Erreur lors du chargement de l\'application. Veuillez vérifier la console pour plus de détails.');
    }
});

