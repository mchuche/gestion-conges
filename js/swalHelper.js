// SweetAlert2 Helper - Fonctions utilitaires pour faciliter l'utilisation de SweetAlert2
// Ces fonctions s'adaptent automatiquement au thème de l'application

// Obtenir la couleur primaire selon le thème
function getPrimaryColor() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return isDark ? '#5ba3f5' : '#4a90e2';
}

// Obtenir la couleur de danger selon le thème
function getDangerColor() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return isDark ? '#ff6b6b' : '#e74c3c';
}

// Obtenir la couleur de fond selon le thème
function getBackgroundColor() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return isDark ? '#2d2d2d' : '#ffffff';
}

// Configuration par défaut pour SweetAlert2
const swalConfig = {
    customClass: {
        popup: 'swal2-popup-custom',
        confirmButton: 'swal2-confirm-custom',
        cancelButton: 'swal2-cancel-custom'
    },
    buttonsStyling: false,
    allowOutsideClick: false,
    allowEscapeKey: true
};

// Alerte de confirmation
async function swalConfirm(title, text, confirmText = 'Confirmer', cancelText = 'Annuler') {
    const result = await Swal.fire({
        ...swalConfig,
        title: title,
        text: text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        confirmButtonColor: getDangerColor(),
        cancelButtonColor: '#95a5a6',
        reverseButtons: true,
        focusCancel: true
    });
    
    return result.isConfirmed;
}

// Alerte de succès
async function swalSuccess(title, text, timer = 3000) {
    return await Swal.fire({
        ...swalConfig,
        title: title,
        text: text,
        icon: 'success',
        confirmButtonColor: getPrimaryColor(),
        confirmButtonText: 'OK',
        timer: timer,
        timerProgressBar: timer > 0
    });
}

// Alerte d'erreur
async function swalError(title, text) {
    return await Swal.fire({
        ...swalConfig,
        title: title,
        text: text,
        icon: 'error',
        confirmButtonColor: getDangerColor(),
        confirmButtonText: 'OK'
    });
}

// Alerte d'information
async function swalInfo(title, text) {
    return await Swal.fire({
        ...swalConfig,
        title: title,
        text: text,
        icon: 'info',
        confirmButtonColor: getPrimaryColor(),
        confirmButtonText: 'OK'
    });
}

// Alerte de question
async function swalQuestion(title, text) {
    return await Swal.fire({
        ...swalConfig,
        title: title,
        text: text,
        icon: 'question',
        confirmButtonColor: getPrimaryColor(),
        confirmButtonText: 'OK'
    });
}

// Alerte avec HTML personnalisé
async function swalHTML(title, html, icon = 'info') {
    return await Swal.fire({
        ...swalConfig,
        title: title,
        html: html,
        icon: icon,
        confirmButtonColor: getPrimaryColor(),
        confirmButtonText: 'OK'
    });
}

// Alerte de confirmation avec HTML
async function swalConfirmHTML(title, html, confirmText = 'Confirmer', cancelText = 'Annuler') {
    const result = await Swal.fire({
        ...swalConfig,
        title: title,
        html: html,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        confirmButtonColor: getDangerColor(),
        cancelButtonColor: '#95a5a6',
        reverseButtons: true,
        focusCancel: true
    });
    
    return result.isConfirmed;
}

// Alerte avec input (email, text, etc.)
async function swalInput(title, inputLabel, inputType = 'text', inputPlaceholder = '', validator = null) {
    const result = await Swal.fire({
        ...swalConfig,
        title: title,
        input: inputType,
        inputLabel: inputLabel,
        inputPlaceholder: inputPlaceholder,
        showCancelButton: true,
        confirmButtonText: 'Valider',
        cancelButtonText: 'Annuler',
        confirmButtonColor: getPrimaryColor(),
        cancelButtonColor: '#95a5a6',
        inputValidator: validator,
        reverseButtons: true
    });
    
    return result.isConfirmed ? result.value : null;
}

// Exporter les fonctions globalement
window.swalConfirm = swalConfirm;
window.swalSuccess = swalSuccess;
window.swalError = swalError;
window.swalInfo = swalInfo;
window.swalQuestion = swalQuestion;
window.swalHTML = swalHTML;
window.swalConfirmHTML = swalConfirmHTML;
window.swalInput = swalInput;

