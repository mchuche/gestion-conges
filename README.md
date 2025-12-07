# 📅 Gestionnaire de Congés

Une application web moderne et responsive pour gérer vos jours de congé avec un calendrier interactif.

## ✨ Fonctionnalités

- 📆 **Calendrier interactif** : Naviguez entre les mois et cliquez sur n'importe quel jour pour ajouter un congé
- 🎨 **Types de congés** : 
  - Congé Payé
  - RTT
  - Congé Sans Solde
  - Maladie
  - Télétravail
  - Formation
- 💾 **Sauvegarde automatique** : Tous vos congés sont sauvegardés localement dans votre navigateur
- 📊 **Statistiques** : Affiche le nombre total de congés posés et ceux du mois en cours
- 📱 **Responsive** : Fonctionne parfaitement sur ordinateur, tablette et mobile
- 🎯 **Interface moderne** : Design élégant et intuitif

## 🚀 Utilisation

1. **Ouvrir l'application** :
   - Ouvrez simplement le fichier `index.html` dans votre navigateur web
   - Ou servez les fichiers via un serveur web local

2. **Ajouter un congé** :
   - Cliquez sur un jour dans le calendrier
   - Choisissez le type de congé dans la fenêtre qui s'ouvre
   - Le congé sera automatiquement sauvegardé

3. **Supprimer un congé** :
   - Cliquez sur un jour qui a déjà un congé
   - Cliquez sur le bouton "Supprimer" dans la fenêtre

4. **Naviguer entre les mois** :
   - Utilisez les flèches ◀ et ▶ pour changer de mois

## 💻 Compatibilité

- ✅ Tous les navigateurs modernes (Chrome, Firefox, Safari, Edge)
- ✅ Windows, macOS, Linux
- ✅ iOS et Android (via navigateur)
- ✅ Peut être installé comme PWA (Progressive Web App) sur mobile

## 📁 Structure des fichiers

```
gestion-conges/
├── index.html      # Structure HTML
├── styles.css      # Styles et design responsive
├── script.js       # Logique de l'application
└── README.md       # Ce fichier
```

## 🔧 Installation comme PWA (optionnel)

Pour installer l'application sur votre téléphone ou tablette :

1. Ouvrez l'application dans votre navigateur mobile
2. Utilisez l'option "Ajouter à l'écran d'accueil" de votre navigateur
3. L'application sera accessible comme une app native

## 💡 Notes techniques

- Les données sont stockées dans le `localStorage` du navigateur
- Aucune connexion internet n'est nécessaire après le chargement initial
- Les données restent privées et ne sont jamais envoyées à un serveur

## 🎨 Personnalisation

Vous pouvez facilement personnaliser :
- Les couleurs dans `styles.css` (variables CSS `:root`)
- Les types de congés dans `index.html` et `script.js`
- Le format de date dans `script.js`

## 📝 Licence

Libre d'utilisation pour usage personnel.

---

**Profitez de votre gestionnaire de congés ! 🎉**

