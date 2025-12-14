import { createI18n } from 'vue-i18n'

const messages = {
  fr: {
    // À compléter progressivement
    common: {
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      close: 'Fermer',
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès'
    },
    auth: {
      login: 'Connexion',
      signup: 'Inscription',
      email: 'Email',
      password: 'Mot de passe',
      name: 'Nom',
      loginButton: 'Se connecter',
      signupButton: "S'inscrire",
      switchToSignup: "S'inscrire",
      switchToLogin: 'Se connecter',
      passwordHint: 'Minimum 6 caractères'
    },
    validation: {
      required: 'Ce champ est requis',
      email: 'Email invalide',
      minLength: 'Minimum {min} caractères',
      passwordTooShort: 'Le mot de passe doit contenir au moins 6 caractères'
    }
  },
  en: {
    // À compléter progressivement
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success'
    },
    auth: {
      login: 'Login',
      signup: 'Sign up',
      email: 'Email',
      password: 'Password',
      name: 'Name',
      loginButton: 'Log in',
      signupButton: 'Sign up',
      switchToSignup: 'Sign up',
      switchToLogin: 'Log in',
      passwordHint: 'Minimum 6 characters'
    },
    validation: {
      required: 'This field is required',
      email: 'Invalid email',
      minLength: 'Minimum {min} characters',
      passwordTooShort: 'Password must be at least 6 characters'
    }
  }
}

const i18n = createI18n({
  legacy: false, // Utiliser l'API Composition au lieu de l'API Legacy
  locale: 'fr',
  fallbackLocale: 'fr',
  messages
})

export default i18n

