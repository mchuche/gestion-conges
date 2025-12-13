<template>
  <div class="stats">
    <div class="stat-card">
      <span class="stat-label">Jours posés</span>
      <span class="stat-value">{{ formatNumber(stats.totalUsed) }}</span>
    </div>
    <div class="stat-card">
      <span class="stat-label">Jours restants</span>
      <span class="stat-value">{{ formatNumber(stats.totalRemaining) }}/{{ formatNumber(stats.totalQuotas) }}</span>
    </div>
  </div>
</template>

<script setup>
import { useStats } from '../../composables/useStats'

const { stats, formatNumber } = useStats()
</script>

<style scoped>
.stats {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.stat-card {
  flex: 1;
  min-width: 150px;
  background: linear-gradient(135deg, var(--primary-color, #4a90e2), #357abd);
  color: white;
  padding: 20px;
  border-radius: 4px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(74, 144, 226, 0.3);
}

.stat-label {
  display: block;
  font-size: 0.9em;
  opacity: 0.9;
  margin-bottom: 10px;
}

.stat-value {
  display: block;
  font-size: 2.5em;
  font-weight: bold;
}

@media (max-width: 768px) {
  .stats {
    flex-direction: column;
  }
  
  .stat-card {
    width: 100%;
  }
}
</style>

