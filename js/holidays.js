// Jours fériés - Calcul des jours fériés par pays et année

// Obtenir les jours fériés pour un pays et une année
function getPublicHolidays(country, year) {
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
            // Si holiday.date est déjà une Date, l'utiliser directement
            // Sinon, créer une nouvelle Date
            date = holiday.date instanceof Date ? holiday.date : new Date(holiday.date);
        } else if (holiday.month !== undefined && holiday.day !== undefined) {
            // Créer une date à partir du mois et du jour
            date = new Date(year, holiday.month, holiday.day);
        } else {
            // Ignorer les jours fériés sans date valide
            console.warn('[Holidays] Jour férié sans date valide:', holiday);
            return;
        }
        
        // Vérifier que la date est valide avant de créer la clé
        if (isNaN(date.getTime())) {
            console.warn('[Holidays] Date invalide pour le jour férié:', holiday, 'Date:', date);
            return;
        }
        
        try {
            const dateKey = getDateKey(date);
            holidays[dateKey] = holiday.name;
        } catch (error) {
            console.warn('[Holidays] Erreur lors de la création de la clé de date:', error, 'Holiday:', holiday, 'Date:', date);
        }
    });

    return holidays;
}



