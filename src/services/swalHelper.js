// SweetAlert2 Helper - Fonctions utilitaires pour faciliter l'utilisation de SweetAlert2
// Ces fonctions s'adaptent automatiquement au thème de l'application

import Swal from 'sweetalert2'

// Obtenir la couleur primaire selon le thème
function getPrimaryColor() {
  if (typeof document === 'undefined') return '#4a90e2'
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
  return isDark ? '#5ba3f5' : '#4a90e2'
}

// Obtenir la couleur de danger selon le thème
function getDangerColor() {
  if (typeof document === 'undefined') return '#e74c3c'
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
  return isDark ? '#ff6b6b' : '#e74c3c'
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
}

// Alerte de confirmation
export async function swalConfirm(title, text, confirmText = 'Confirmer', cancelText = 'Annuler') {
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
  })
  
  return result.isConfirmed
}

// Alerte de succès
export async function swalSuccess(title, text, timer = 3000) {
  return await Swal.fire({
    ...swalConfig,
    title: title,
    text: text,
    icon: 'success',
    confirmButtonColor: getPrimaryColor(),
    confirmButtonText: 'OK',
    timer: timer,
    timerProgressBar: timer > 0
  })
}

// Alerte d'erreur
export async function swalError(title, text) {
  return await Swal.fire({
    ...swalConfig,
    title: title,
    text: text,
    icon: 'error',
    confirmButtonColor: getDangerColor(),
    confirmButtonText: 'OK'
  })
}

// Alerte d'information
export async function swalInfo(title, text) {
  return await Swal.fire({
    ...swalConfig,
    title: title,
    text: text,
    icon: 'info',
    confirmButtonColor: getPrimaryColor(),
    confirmButtonText: 'OK'
  })
}

// Alerte de question
export async function swalQuestion(title, text) {
  return await Swal.fire({
    ...swalConfig,
    title: title,
    text: text,
    icon: 'question',
    confirmButtonColor: getPrimaryColor(),
    confirmButtonText: 'OK'
  })
}

// Alerte avec HTML personnalisé
export async function swalHTML(title, html, icon = 'info') {
  return await Swal.fire({
    ...swalConfig,
    title: title,
    html: html,
    icon: icon,
    confirmButtonColor: getPrimaryColor(),
    confirmButtonText: 'OK'
  })
}

// Alerte de confirmation avec HTML
export async function swalConfirmHTML(title, html, confirmText = 'Confirmer', cancelText = 'Annuler') {
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
  })
  
  return result.isConfirmed
}

// Alerte avec input (email, text, etc.)
export async function swalInput(title, inputLabel, inputType = 'text', inputPlaceholder = '', validator = null) {
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
  })
  
  return result.isConfirmed ? result.value : null
}

