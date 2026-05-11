# SweetAlert2 - Exemples d'utilisation

Ce fichier contient des exemples d'utilisation de SweetAlert2 dans l'application pour référence future.

## Fonctions disponibles

Toutes les fonctions sont disponibles globalement via `window` :

- `swalConfirm(title, text, confirmText, cancelText)` - Confirmation simple
- `swalConfirmHTML(title, html, confirmText, cancelText)` - Confirmation avec HTML
- `swalSuccess(title, text, timer)` - Message de succès
- `swalError(title, text)` - Message d'erreur
- `swalInfo(title, text)` - Message d'information
- `swalQuestion(title, text)` - Message de question
- `swalHTML(title, html, icon)` - Message avec HTML personnalisé
- `swalInput(title, inputLabel, inputType, inputPlaceholder, validator)` - Input personnalisé

## Exemples d'utilisation

### 1. Confirmation simple

```javascript
const confirmed = await swalConfirm(
    'Supprimer ?',
    'Êtes-vous sûr de vouloir supprimer cet élément ?',
    'Oui, supprimer',
    'Annuler'
);

if (confirmed) {
    // Action de suppression
}
```

### 2. Confirmation avec HTML

```javascript
const confirmed = await swalConfirmHTML(
    '⚠️ Supprimer l\'utilisateur ?',
    `Êtes-vous sûr de vouloir supprimer <strong>${email}</strong> ?<br><br>
     Cette action est <strong style="color: var(--danger-color);">irréversible</strong>.`,
    'Oui, supprimer',
    'Annuler'
);
```

### 3. Message de succès avec auto-fermeture

```javascript
await swalSuccess(
    '✅ Opération réussie',
    'Les données ont été sauvegardées avec succès.',
    3000  // Fermeture automatique après 3 secondes
);
```

### 4. Message d'erreur

```javascript
await swalError(
    '❌ Erreur',
    'Une erreur est survenue lors de la sauvegarde.'
);
```

### 5. Message d'information

```javascript
await swalInfo(
    'Information',
    'Votre quota de congés est presque épuisé.'
);
```

### 6. Input personnalisé

```javascript
const email = await swalInput(
    'Ajouter un membre',
    'Adresse email',
    'email',
    'exemple@email.com',
    (value) => {
        if (!value) {
            return 'Veuillez entrer une adresse email';
        }
        if (!value.includes('@')) {
            return 'Adresse email invalide';
        }
    }
);

if (email) {
    // Utiliser l'email
}
```

### 7. Message avec HTML personnalisé

```javascript
await swalHTML(
    'Statistiques',
    `
        <div style="text-align: left;">
            <p><strong>Congés posés:</strong> 10.5 jours</p>
            <p><strong>Jours restants:</strong> 14.5 jours</p>
            <p><strong>Quota total:</strong> 25 jours</p>
        </div>
    `,
    'info'
);
```

## Adaptation au thème

Toutes les alertes s'adaptent automatiquement au thème (sombre/clair) grâce aux styles CSS personnalisés dans `styles.css`.

Les couleurs utilisent les variables CSS :
- `var(--primary-color)` pour les boutons de confirmation
- `var(--danger-color)` pour les boutons de suppression
- `var(--card-bg)` pour le fond
- `var(--text-color)` pour le texte

## Remplacement des alertes natives

Pour remplacer une alerte native :

**AVANT :**
```javascript
alert('Message');
if (confirm('Confirmer ?')) {
    // Action
}
```

**APRÈS :**
```javascript
await swalSuccess('Titre', 'Message');
const confirmed = await swalConfirm('Titre', 'Confirmer ?');
if (confirmed) {
    // Action
}
```

