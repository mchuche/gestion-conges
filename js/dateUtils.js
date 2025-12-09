// DateUtils - Wrappers autour de date-fns pour faciliter l'utilisation
// Ces fonctions encapsulent date-fns pour une utilisation plus simple

// Vérifier que date-fns est disponible
// Note: date-fns peut être disponible sous différents noms selon le CDN
let dateFnsAvailable = false;
if (typeof dateFns !== 'undefined') {
    dateFnsAvailable = true;
} else if (typeof window.dateFns !== 'undefined') {
    window.dateFns = window.dateFns;
    dateFnsAvailable = true;
} else if (typeof date_fns !== 'undefined') {
    window.dateFns = date_fns;
    dateFnsAvailable = true;
}

if (!dateFnsAvailable) {
    console.warn('[DateUtils] date-fns non disponible, utilisation des fonctions natives');
    console.log('[DateUtils] Tentative de chargement depuis CDN...');
    // Essayer de charger date-fns depuis un autre CDN si le premier a échoué
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/date-fns@2.30.0/index.js';
    script.onerror = () => {
        console.warn('[DateUtils] Échec du chargement de date-fns depuis unpkg, utilisation des fonctions natives');
    };
    script.onload = () => {
        console.log('[DateUtils] date-fns chargé depuis unpkg');
        if (typeof date_fns !== 'undefined') {
            window.dateFns = date_fns;
        }
    };
    document.head.appendChild(script);
}

// Obtenir l'année d'une date
function getYear(date) {
    // Vérifier que date est valide
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        console.error('[DateUtils] Date invalide dans getYear:', date);
        return new Date().getFullYear();
    }
    if (typeof dateFns !== 'undefined' && dateFns.getYear) {
        try {
            return dateFns.getYear(date);
        } catch (e) {
            console.warn('[DateUtils] Erreur avec dateFns.getYear, utilisation native:', e);
            return date.getFullYear();
        }
    }
    return date.getFullYear();
}

// Obtenir le mois d'une date (0-11)
function getMonth(date) {
    if (typeof dateFns !== 'undefined' && dateFns.getMonth) {
        return dateFns.getMonth(date);
    }
    return date.getMonth();
}

// Obtenir le jour du mois (1-31)
function getDate(date) {
    if (typeof dateFns !== 'undefined' && dateFns.getDate) {
        return dateFns.getDate(date);
    }
    return date.getDate();
}

// Obtenir le jour de la semaine (0 = Dimanche, 6 = Samedi)
function getDay(date) {
    if (typeof dateFns !== 'undefined' && dateFns.getDay) {
        return dateFns.getDay(date);
    }
    return date.getDay();
}

// Créer une nouvelle date avec année, mois, jour
function createDate(year, month, day) {
    // Toujours utiliser la méthode native pour créer une date, plus fiable
    // date-fns est utilisé pour les manipulations, pas pour la création
    const date = new Date(year, month, day);
    // Vérifier que la date est valide
    if (isNaN(date.getTime())) {
        console.error('[DateUtils] Date invalide créée:', year, month, day);
        return new Date(); // Retourner la date actuelle en cas d'erreur
    }
    return date;
}

// Obtenir le premier jour du mois
function startOfMonth(date) {
    if (typeof dateFns !== 'undefined' && dateFns.startOfMonth) {
        return dateFns.startOfMonth(date);
    }
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

// Obtenir le dernier jour du mois
function endOfMonth(date) {
    if (typeof dateFns !== 'undefined' && dateFns.endOfMonth) {
        return dateFns.endOfMonth(date);
    }
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

// Obtenir le premier jour de l'année
function startOfYear(date) {
    if (typeof dateFns !== 'undefined' && dateFns.startOfYear) {
        return dateFns.startOfYear(date);
    }
    return new Date(date.getFullYear(), 0, 1);
}

// Ajouter des jours à une date
function addDays(date, amount) {
    if (typeof dateFns !== 'undefined' && dateFns.addDays) {
        return dateFns.addDays(date, amount);
    }
    const result = new Date(date);
    result.setDate(result.getDate() + amount);
    return result;
}

// Ajouter des mois à une date
function addMonths(date, amount) {
    if (typeof dateFns !== 'undefined' && dateFns.addMonths) {
        return dateFns.addMonths(date, amount);
    }
    const result = new Date(date);
    result.setMonth(result.getMonth() + amount);
    return result;
}

// Ajouter des années à une date
function addYears(date, amount) {
    if (typeof dateFns !== 'undefined' && dateFns.addYears) {
        return dateFns.addYears(date, amount);
    }
    const result = new Date(date);
    result.setFullYear(result.getFullYear() + amount);
    return result;
}

// Définir l'année d'une date (retourne une nouvelle date)
function setYear(date, year) {
    if (typeof dateFns !== 'undefined' && dateFns.setYear) {
        return dateFns.setYear(date, year);
    }
    const result = new Date(date);
    result.setFullYear(year);
    return result;
}

// Définir le mois d'une date (retourne une nouvelle date)
function setMonth(date, month) {
    if (typeof dateFns !== 'undefined' && dateFns.setMonth) {
        return dateFns.setMonth(date, month);
    }
    const result = new Date(date);
    result.setMonth(month);
    return result;
}

// Définir le jour d'une date (retourne une nouvelle date)
function setDate(date, day) {
    if (typeof dateFns !== 'undefined' && dateFns.setDate) {
        return dateFns.setDate(date, day);
    }
    const result = new Date(date);
    result.setDate(day);
    return result;
}

// Comparer si deux dates sont le même jour
function isSameDay(dateLeft, dateRight) {
    if (typeof dateFns !== 'undefined' && dateFns.isSameDay) {
        return dateFns.isSameDay(dateLeft, dateRight);
    }
    return dateLeft.getFullYear() === dateRight.getFullYear() &&
           dateLeft.getMonth() === dateRight.getMonth() &&
           dateLeft.getDate() === dateRight.getDate();
}

// Vérifier si une date est avant une autre
function isBefore(date, dateToCompare) {
    if (typeof dateFns !== 'undefined' && dateFns.isBefore) {
        return dateFns.isBefore(date, dateToCompare);
    }
    return date < dateToCompare;
}

// Vérifier si une date est après une autre
function isAfter(date, dateToCompare) {
    if (typeof dateFns !== 'undefined' && dateFns.isAfter) {
        return dateFns.isAfter(date, dateToCompare);
    }
    return date > dateToCompare;
}

// Obtenir le nombre de jours dans un mois
function getDaysInMonth(date) {
    if (typeof dateFns !== 'undefined' && dateFns.getDaysInMonth) {
        return dateFns.getDaysInMonth(date);
    }
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

// Formater une date au format YYYY-MM-DD
function formatDateKey(date) {
    if (typeof dateFns !== 'undefined' && dateFns.format) {
        return dateFns.format(date, 'yyyy-MM-dd');
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Obtenir aujourd'hui (sans heures)
function today() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// Cloner une date
function cloneDate(date) {
    if (typeof dateFns !== 'undefined' && dateFns.clone) {
        return dateFns.clone(date);
    }
    return new Date(date.getTime());
}

