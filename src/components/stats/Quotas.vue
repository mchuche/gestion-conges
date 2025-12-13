<template>
  <div class="leave-quotas">
    <div
      v-for="quotaData in quotasByType"
      :key="quotaData.type.id"
      class="quota-card"
    >
      <div class="quota-header">
        <span class="quota-name">{{ quotaData.type.name }}</span>
        <span class="quota-numbers">
          {{ formatNumber(quotaData.used) }} / {{ formatNumber(quotaData.quota) }}
        </span>
      </div>
      <div class="quota-bar">
        <div
          class="quota-fill"
          :style="{
            width: `${quotaData.percentage}%`,
            backgroundColor: quotaData.type.color
          }"
        ></div>
      </div>
      <div class="quota-footer">
        <span
          :class="['quota-remaining', { 'quota-exceeded': quotaData.exceeded }]"
        >
          {{
            quotaData.exceeded
              ? `Dépassé: ${formatNumber(Math.abs(quotaData.remaining))}`
              : `Restant: ${formatNumber(quotaData.remaining)}`
          }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useStats } from '../../composables/useStats'

const { quotasByType, formatNumber } = useStats()
</script>

<style scoped>
.leave-quotas {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.quota-card {
  background: var(--card-bg, white);
  border: 2px solid var(--border-color, #e0e0e0);
  border-radius: 4px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.quota-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.quota-name {
  font-weight: 600;
  color: var(--text-color, #2c3e50);
  font-size: 0.95em;
}

.quota-numbers {
  font-weight: bold;
  color: var(--primary-color, #4a90e2);
  font-size: 1.1em;
}

.quota-bar {
  width: 100%;
  height: 8px;
  background: var(--bg-color, #f5f5f5);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.quota-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.quota-footer {
  font-size: 0.85em;
  color: var(--text-color, #2c3e50);
}

.quota-remaining {
  color: var(--secondary-color, #50c878);
  font-weight: 500;
}

.quota-exceeded {
  color: var(--danger-color, #e74c3c);
}

@media (max-width: 768px) {
  .leave-quotas {
    grid-template-columns: 1fr;
  }
}
</style>

