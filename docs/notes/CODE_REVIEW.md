# 🔍 Revue de Code - Améliorations Possibles

Ce document liste les améliorations identifiées dans le codebase.

## 🔴 Priorité Haute

### 1. **Imports non utilisés**

**Fichier : `src/stores/leaves.js`**
- `watch` est importé mais jamais utilisé
- `src/stores/leaveTypes.js` et `src/stores/quotas.js` : même problème

**Impact :** Code mort, bundle légèrement plus lourd

**Solution :** Supprimer les imports inutilisés

---

### 2. **Gestion DELETE Realtime - Fallback inefficace**

**Fichier : `src/stores/leaves.js` (ligne ~125)**
- Si `date_key` manque dans DELETE, on recharge TOUS les congés
- C'est très inefficace pour une seule suppression

**Impact :** Performance, charge réseau inutile

**Solution :** 
- Vérifier que `REPLICA IDENTITY FULL` est bien configuré
- Stocker un mapping `id -> date_key` pour pouvoir supprimer directement même si Realtime n'envoie que l'ID

---

### 3. **Console.log en production**

**Fichiers : `src/App.vue`, `src/components/calendar/Calendar.vue`, `src/components/modals/LeaveModal.vue`**
- Plusieurs `console.log` qui ne passent pas par le logger

**Impact :** Logs en production, performance légèrement impactée

**Solution :** Remplacer par `logger.log()` ou `devLogger.log()`

---

### 4. **Realtime (obsolète côté front)**

**Ancien fichier : `src/composables/useRealtime.js`** (supprimé — stack **Nest + API REST**).

Les stores (`leaves`, etc.) exposent encore `setupRealtime()` en **no-op** pour compatibilité. Une future évolution serait WebSocket/SSE côté Nest si besoin de push.

---

## 🟡 Priorité Moyenne

### 5. **Code dupliqué dans les stores**

**Fichiers : `src/stores/leaves.js`, `src/stores/leaveTypes.js`, `src/stores/quotas.js`**
- Logique similaire pour `setupRealtime()` dans chaque store
- Pattern répétitif pour la gestion Realtime

**Impact :** Maintenance difficile, code répétitif

**Solution :** Créer un helper/composable partagé pour la configuration Realtime

---

### 6. **Gestion d'erreurs inconsistante**

**Fichiers multiples**
- Certains endroits utilisent `try/catch` avec gestion complète
- D'autres ignorent les erreurs silencieusement
- Pas de stratégie uniforme pour les erreurs réseau

**Impact :** Expérience utilisateur variable, bugs difficiles à diagnostiquer

**Solution :** Standardiser la gestion d'erreurs, créer un handler d'erreurs global

---

### 7. **Performance - Rechargement complet sur DELETE**

**Fichier : `src/stores/leaves.js`**
- Si `date_key` manque dans DELETE, `loadLeaves()` est appelé
- Recharge TOUTES les données alors qu'une seule ligne a changé

**Impact :** Performance, latence réseau, UX

**Solution :** Implémenter le mapping ID -> date_key ou améliorer le fallback

---

### 8. **Logs de debug en production**

**Ancien contexte** : composable Realtime (fichier supprimé avec la migration Nest). Vérifier encore les `logger.debug` bruyants dans les stores si besoin.

---

## 🟢 Priorité Basse (Améliorations UX/Code Quality)

### 9. **TODOs non résolus**

**Fichier : `src/components/modals/LeaveModal.vue`**
- Ligne 159 : "TODO: Calculer les jours ouvrés pour la sélection multiple"
- Ligne 285 : "TODO: Implémenter la modale de sélection multiple"

**Impact :** Fonctionnalités incomplètes

---

### 10. **Validation manquante**

**Fichiers multiples**
- Pas de validation de format pour certaines données utilisateur
- Pas de sanitization poussée des entrées utilisateur : la sécurité repose surtout sur l’API (validation DTO, ownership)

**Impact :** Sécurité potentielle, données invalides

---

### 11. **Accessibilité**

**Fichiers : composants Vue**
- Certains boutons n'ont pas d'aria-labels
- Navigation au clavier pourrait être améliorée
- Contraste des couleurs à vérifier (WCAG)

**Impact :** Accessibilité limitée

---

### 12. **TypeScript**

**Fichiers : tous**
- Le projet utilise JavaScript mais pourrait bénéficier de TypeScript
- Pas de typage strict, erreurs potentielles à l'exécution

**Impact :** Maintenabilité, détection d'erreurs à la compilation

---

## 📊 Résumé des Actions Prioritaires

1. ✅ Supprimer les imports inutilisés (`watch` dans stores)
2. ✅ Remplacer `console.log` par `logger.log()` ou `devLogger.log()`
3. ~~Abonnements temps réel côté client~~ — retirés au profit de l’API Nest (polling / rechargement si besoin)
4. ✅ Améliorer le fallback DELETE Realtime (éviter le rechargement complet)
5. ✅ Standardiser la gestion d'erreurs (handler global créé et intégré dans quelques endroits clés)
6. ⚠️ Résoudre les TODOs dans `LeaveModal.vue`

---

## 🔧 Améliorations Techniques Recommandées

### A. Temps réel (futur)

Avec Nest, une piste serait **WebSocket ou SSE** côté API plutôt qu’un helper Realtime front. Exemple d’idée (non implémenté) :

```javascript
// Exemple conceptuel — non présent dans le repo
export function useStoreRealtime(storeName, userId, callbacks) {
  // Abonnement WS aux changements de congés
}
```

### B. Mapping ID -> date_key

Pour améliorer le DELETE Realtime :

```javascript
// Dans leaves store
const leaveIdMap = ref({}) // { id: date_key }
```

### C. Error Boundary

Créer un composant ErrorBoundary pour capturer les erreurs Vue :

```vue
<ErrorBoundary>
  <router-view />
</ErrorBoundary>
```

---

## 📈 Métriques du Code

- **Fichiers analysés :** ~30
- **Lignes de code :** ~8000+
- **Issues critiques :** 4
- **Issues moyennes :** 4
- **Issues mineures :** 4

---

## 🎯 Plan d'Action Recommandé

1. **Semaine 1 :** Nettoyage (imports, console.log, TODOs)
2. **Semaine 2 :** Fixes critiques (memory leaks, Realtime DELETE)
3. **Semaine 3 :** Refactoring (code dupliqué, gestion d'erreurs)
4. **Semaine 4 :** Améliorations (accessibilité, TypeScript si souhaité)

