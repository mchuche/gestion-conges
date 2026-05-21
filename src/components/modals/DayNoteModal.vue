<template>
  <Modal v-if="showModal" :model-value="true" title="Note du jour" @close="closeModal">
    <p class="note-date-label">{{ formattedDate }}</p>
    <textarea
      v-model="draft"
      class="note-textarea"
      rows="4"
      maxlength="500"
      placeholder="Rappel, rendez-vous, lieu…"
      @keydown.ctrl.enter="save"
      @keydown.meta.enter="save"
    />
    <p class="note-hint">{{ draft.length }} / 500 — Ctrl+Entrée pour enregistrer</p>
    <div class="note-actions">
      <button type="button" class="btn-secondary" @click="closeModal">Annuler</button>
      <button
        v-if="hasExisting"
        type="button"
        class="btn-danger"
        @click="removeNote"
      >
        Supprimer
      </button>
      <button type="button" class="btn-primary" :disabled="saving" @click="save">
        Enregistrer
      </button>
    </div>
  </Modal>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useUIStore } from '../../stores/ui'
import { useDayNotesStore } from '../../stores/dayNotes'
import { getDateKey } from '../../services/utils'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Modal from '../common/Modal.vue'
import { useToast } from '../../composables/useToast'

const { error: showErrorToast, success: showSuccessToast } = useToast()

const uiStore = useUIStore()
const dayNotesStore = useDayNotesStore()

const showModal = computed(() => uiStore.showDayNoteModal)
const draft = ref('')
const saving = ref(false)

const dateKey = computed(() =>
  uiStore.selectedDate ? getDateKey(uiStore.selectedDate) : null,
)

const formattedDate = computed(() => {
  if (!uiStore.selectedDate) return ''
  return format(uiStore.selectedDate, 'EEEE d MMMM yyyy', { locale: fr })
})

const hasExisting = computed(() => {
  if (!dateKey.value) return false
  return Boolean(dayNotesStore.getNote(dateKey.value))
})

watch(
  () => [showModal.value, uiStore.selectedDate],
  () => {
    if (showModal.value && dateKey.value) {
      draft.value = dayNotesStore.getNote(dateKey.value)
    }
  },
  { immediate: true },
)

function closeModal() {
  uiStore.closeDayNoteModal()
}

async function save() {
  if (!dateKey.value || saving.value) return
  saving.value = true
  try {
    await dayNotesStore.saveNote(dateKey.value, draft.value)
    showSuccessToast('Note enregistrée')
    closeModal()
  } catch {
    showErrorToast('Impossible d’enregistrer la note')
  } finally {
    saving.value = false
  }
}

async function removeNote() {
  if (!dateKey.value || saving.value) return
  saving.value = true
  try {
    draft.value = ''
    await dayNotesStore.saveNote(dateKey.value, '')
    showSuccessToast('Note supprimée')
    closeModal()
  } catch {
    showErrorToast('Impossible de supprimer la note')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.note-date-label {
  margin: 0 0 12px;
  font-weight: 600;
  color: var(--text-color, #2c3e50);
  text-transform: capitalize;
}

.note-textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 10px;
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 4px;
  font-family: inherit;
  font-size: 1em;
  resize: vertical;
  min-height: 100px;
  background: var(--card-bg, white);
  color: var(--text-color, #2c3e50);
}

.note-hint {
  margin: 8px 0 16px;
  font-size: 0.85em;
  color: var(--text-muted, #666);
}

.note-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.btn-primary,
.btn-secondary,
.btn-danger {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 0.95em;
}

.btn-primary {
  background: var(--primary-color, #4a90e2);
  color: white;
}

.btn-secondary {
  background: var(--bg-color, #f0f0f0);
  color: var(--text-color, #2c3e50);
}

.btn-danger {
  background: var(--danger-color, #e74c3c);
  color: white;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
