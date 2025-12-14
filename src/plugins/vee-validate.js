import { configure, defineRule } from 'vee-validate'
import { required, email, min, min_value as minValue } from '@vee-validate/rules'
import { localize, setLocale } from '@vee-validate/i18n'
import fr from '@vee-validate/i18n/dist/locale/fr.json'

// Définir les règles globales
defineRule('required', required)
defineRule('email', email)
defineRule('min', min)
defineRule('min_value', minValue)

// Règle personnalisée pour valider le JSON
defineRule('json', (value) => {
  if (!value || typeof value !== 'string') {
    return 'Ce champ doit contenir du JSON valide'
  }
  try {
    JSON.parse(value)
    return true
  } catch (e) {
    return 'Le JSON est invalide: ' + e.message
  }
})

// Configurer la localisation avec messages personnalisés
configure({
  generateMessage: localize({
    fr: {
      ...fr,
      messages: {
        ...fr.messages,
        required: 'Ce champ est requis',
        email: 'Veuillez entrer un email valide',
        min: 'Le champ doit contenir au moins {min} caractères',
        min_value: 'La valeur doit être au moins {min}',
        json: 'Le JSON est invalide'
      }
    }
  })
})

// Définir la locale par défaut
setLocale('fr')

