<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="['btn', variant, size, { 'btn-block': block }]"
    @click="handleClick"
  >
    <slot></slot>
  </button>
</template>

<script setup>
const props = defineProps({
  type: {
    type: String,
    default: 'button'
  },
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'danger', 'success', 'outline'].includes(value)
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  disabled: {
    type: Boolean,
    default: false
  },
  block: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

function handleClick(event) {
  if (!props.disabled) {
    emit('click', event)
  }
}
</script>

<style scoped>
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-block {
  width: 100%;
}

/* Variants */
.btn.primary {
  background: var(--primary-color, #4a90e2);
  color: white;
}

.btn.primary:hover:not(:disabled) {
  background: var(--primary-hover, #357abd);
}

.btn.secondary {
  background: var(--secondary-color, #95a5a6);
  color: white;
}

.btn.secondary:hover:not(:disabled) {
  background: var(--secondary-hover, #7f8c8d);
}

.btn.danger {
  background: var(--danger-color, #e74c3c);
  color: white;
}

.btn.danger:hover:not(:disabled) {
  background: var(--danger-hover, #c0392b);
}

.btn.success {
  background: var(--success-color, #27ae60);
  color: white;
}

.btn.success:hover:not(:disabled) {
  background: var(--success-hover, #229954);
}

.btn.outline {
  background: transparent;
  border: 2px solid var(--primary-color, #4a90e2);
  color: var(--primary-color, #4a90e2);
}

.btn.outline:hover:not(:disabled) {
  background: var(--primary-color, #4a90e2);
  color: white;
}

/* Sizes */
.btn.small {
  padding: 6px 12px;
  font-size: 14px;
}

.btn.medium {
  padding: 10px 20px;
  font-size: 16px;
}

.btn.large {
  padding: 14px 28px;
  font-size: 18px;
}
</style>

