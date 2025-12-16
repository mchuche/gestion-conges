<template>
  <Modal :model-value="showModal" @close="closeModal" title="Aide">
    <template #body>
      <div class="help-modal-content">
        <h3>Comment utiliser l'application</h3>
        
        <section class="help-section">
          <h4>📅 Sélectionner des jours</h4>
          <ul>
            <li><strong>Clic simple</strong> : Sélectionne un jour et ouvre la modale de sélection de congé</li>
            <li><strong>Ctrl/Cmd + Clic</strong> : Sélectionne plusieurs jours pour appliquer le même type de congé</li>
            <li><strong>Période</strong> : Choisissez entre journée complète, matin ou après-midi</li>
          </ul>
        </section>

        <section class="help-section">
          <h4>🎨 Types de congés</h4>
          <ul>
            <li><strong>Congés</strong> : Comptent dans les quotas (ex: Congé Payé, RTT)</li>
            <li><strong>Événements</strong> : Ne comptent pas dans les quotas (ex: Maladie, Télétravail, Formation)</li>
            <li>Les couleurs sont personnalisables dans la configuration</li>
          </ul>
        </section>

        <section class="help-section">
          <h4>⚙️ Configuration</h4>
          <ul>
            <li>Accédez à la configuration via le menu (☰) > Configuration</li>
            <li>Modifiez les types de congés : nom, label, couleur, catégorie</li>
            <li>Configurez les quotas par année pour chaque type de congé</li>
            <li>Ajoutez ou supprimez des types de congés</li>
          </ul>
        </section>

        <section class="help-section">
          <h4>🌓 Thème</h4>
          <ul>
            <li>Basculez entre le mode clair et sombre avec le bouton ☀️/🌙</li>
            <li>Votre préférence est sauvegardée automatiquement</li>
          </ul>
        </section>

        <section class="help-section">
          <h4>⛶ Pleine largeur</h4>
          <ul>
            <li>Activez le mode pleine largeur avec le bouton ⛶</li>
            <li>Utile pour les grands écrans</li>
          </ul>
        </section>

        <section class="help-section">
          <h4>💡 Astuces</h4>
          <ul>
            <li>Les jours passés sont affichés avec une opacité réduite</li>
            <li>Le jour actuel est mis en évidence avec une bordure</li>
            <li>Les jours fériés sont automatiquement détectés selon le pays sélectionné</li>
            <li>Les weekends sont visuellement différenciés</li>
          </ul>
        </section>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { computed } from 'vue'
import { useUIStore } from '../../stores/ui'
import Modal from '../common/Modal.vue'

const uiStore = useUIStore()

const showModal = computed(() => uiStore.showHelpModal)

function closeModal() {
  uiStore.closeHelpModal()
}
</script>

<style scoped>
/* Le padding et le scroll sont déjà gérés par le composant Modal */

.help-modal-content h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: var(--text-color);
}

.help-section {
  margin-bottom: 25px;
}

.help-section h4 {
  margin-bottom: 10px;
  color: var(--primary-color);
  font-size: 1.1em;
}

.help-section ul {
  margin: 0;
  padding-left: 20px;
  color: var(--text-color);
}

.help-section li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.help-section strong {
  color: var(--primary-color);
}
</style>

