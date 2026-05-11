# 🚀 Guide d'utilisation des nouvelles améliorations

Ce document explique comment utiliser les nouvelles fonctionnalités ajoutées au projet.

## ✅ Améliorations implémentées

### 1. ✨ AutoAnimate - Animations automatiques

**Status :** ✅ Implémenté et actif

Les animations sont automatiquement appliquées à toutes les listes dans l'application.

**Où ça fonctionne :**
- Cartes de quotas (Stats/Quotas)
- Liste des jours dans le calendrier
- Liste des équipes
- Liste des utilisateurs en admin
- Liste des logs d'audit

**Personnalisation :** Les animations sont configurées globalement dans `src/main.js`. Pour les désactiver sur un composant spécifique, utilisez `v-auto-animate="false"`.

---

### 2. 🔔 Système de Toasts

**Status :** ✅ Implémenté

Système de notifications non-intrusives pour remplacer les `alert()` et certains `Swal.fire()`.

**Utilisation :**

```javascript
import { useToast } from '@/composables/useToast'

const { success, error, warning, info } = useToast()

// Exemples
success('Congé enregistré avec succès !')
error('Erreur lors de la sauvegarde')
warning('Quota presque atteint')
info('Chargement en cours...')
```

**Composant :** `<ToastContainer />` est déjà ajouté dans `App.vue`

---

### 3. ✅ VeeValidate - Validation de formulaires

**Status :** ✅ Configuré et prêt à l'emploi

**Fichier d'exemple :** `src/components/auth/LoginForm-veevalidate.vue.example`

**Utilisation de base :**

```vue
<template>
  <Form @submit="handleSubmit" v-slot="{ meta }">
    <Field
      name="email"
      type="email"
      v-model="email"
      rules="required|email"
      :class="{ 'error': errors.email }"
    />
    <ErrorMessage name="email" />
    
    <button :disabled="!meta.valid">Soumettre</button>
  </Form>
</template>

<script setup>
import { Form, Field, ErrorMessage, useForm } from 'vee-validate'

const { handleSubmit, errors } = useForm()

const handleSubmit = handleSubmit(async (values) => {
  // Validation réussie, traiter le formulaire
})
</script>
```

**Règles disponibles :**
- `required` - Champ obligatoire
- `email` - Format email valide
- `min:6` - Minimum 6 caractères
- `min_value:0` - Valeur minimum

**Localisation :** Les messages d'erreur sont en français par défaut.

---

### 4. 🌍 Vue I18n - Internationalisation

**Status :** ✅ Configuré (structure de base)

**Utilisation :**

```vue
<template>
  <div>{{ $t('auth.login') }}</div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const message = t('auth.login')
</script>
```

**Ajout de traductions :** Éditer `src/i18n/index.js`

**Changer de langue :**
```javascript
import { useI18n } from 'vue-i18n'
const { locale } = useI18n()
locale.value = 'en' // ou 'fr'
```

---

### 5. 🎯 ESLint + Prettier

**Status :** ✅ Configuré

**Commandes :**

```bash
# Vérifier les erreurs
npm run lint

# Corriger automatiquement
npm run lint -- --fix

# Formater avec Prettier
npx prettier --write "src/**/*.{vue,js}"
```

**Fichiers de config :**
- `.eslintrc.cjs` - Configuration ESLint
- `.prettierrc` - Configuration Prettier
- `.prettierignore` - Fichiers à ignorer

---

### 6. 📅 VueDatePicker

**Status :** ✅ Installé, prêt à l'emploi

**Utilisation :**

```vue
<template>
  <Datepicker
    v-model="date"
    :locale="fr"
    :enable-time-picker="false"
  />
</template>

<script setup>
import { ref } from 'vue'
import Datepicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { fr } from 'date-fns/locale'

const date = ref(new Date())
</script>
```

**Documentation :** https://vue-datepicker.netlify.app/

---

### 7. 🎨 Headless UI Vue

**Status :** ✅ Installé, prêt à l'emploi

**Exemple : Modal améliorée**

```vue
<template>
  <Dialog :open="isOpen" @close="setIsOpen">
    <DialogPanel>
      <DialogTitle>Mon titre</DialogTitle>
      <DialogDescription>Ma description</DialogDescription>
      <!-- Contenu -->
    </DialogPanel>
  </Dialog>
</template>

<script setup>
import { Dialog, DialogPanel, DialogTitle, DialogDescription } from '@headlessui/vue'
</script>
```

**Documentation :** https://headlessui.com/vue/menu

---

## 📋 Prochaines étapes recommandées

1. **Mettre à jour les formulaires** pour utiliser VeeValidate (voir exemple)
2. **Remplacer les `alert()`** par des toasts dans les composants existants
3. **Ajouter plus de traductions** dans `src/i18n/index.js`
4. **Utiliser VueDatePicker** dans les composants de sélection de dates
5. **Améliorer l'accessibilité** avec Headless UI pour les modals et dropdowns

---

## 🔧 Configuration des packages

Tous les packages sont installés et configurés. Les fichiers de configuration sont :

- **AutoAnimate :** `src/main.js` (plugin global)
- **Toasts :** `src/composables/useToast.js` + `src/components/common/ToastContainer.vue`
- **VeeValidate :** `src/plugins/vee-validate.js`
- **Vue I18n :** `src/i18n/index.js`
- **ESLint :** `.eslintrc.cjs`
- **Prettier :** `.prettierrc`

---

## 💡 Exemples d'intégration

### Exemple 1 : Remplacer un alert par un toast

**Avant :**
```javascript
alert('Congé enregistré avec succès !')
```

**Après :**
```javascript
import { useToast } from '@/composables/useToast'
const { success } = useToast()
success('Congé enregistré avec succès !')
```

### Exemple 2 : Ajouter VeeValidate à un formulaire

Voir le fichier `src/components/auth/LoginForm-veevalidate.vue.example`

### Exemple 3 : Utiliser i18n

```vue
<template>
  <button>{{ $t('common.save') }}</button>
</template>
```

---

## 📦 Packages installés

- `@formkit/auto-animate` - Animations automatiques
- `@vueuse/core` - Utilitaires Vue (pour les toasts)
- `vee-validate` + `@vee-validate/rules` + `@vee-validate/i18n` - Validation
- `vue-i18n` - Internationalisation
- `@vuepic/vue-datepicker` - Date picker
- `@headlessui/vue` - Composants accessibles
- `eslint` + `eslint-plugin-vue` + `@vue/eslint-config-prettier` - Linting
- `prettier` - Formatage de code

