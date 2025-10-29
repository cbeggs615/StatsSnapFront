<template>
  <div class="stat-shot-modal" v-if="visible">
    <div class="stat-shot-overlay" @click="$emit('close')"></div>
    <div class="stat-shot-card">
      <div class="modal-header">
        <div class="team-info">
          <h2 class="team-name">{{ team.teamname }}</h2>
          <div class="team-sport">{{ team.sportName || team.sport }}</div>
        </div>
        <button @click="$emit('close')" class="close-button">×</button>
      </div>

      <div class="stats-section">
        <h3 class="section-title">{{ team.teamname }} StatShot</h3>
        <div class="stats-grid">
          <div v-for="([stat, value], idx) in Object.entries(team.keyStatsData)" :key="stat" class="stat-card">
            <div class="stat-label">{{ cleanStatName(stat) }}</div>
            <div class="stat-value">{{ value }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { cleanStatName } from '../utils/api.js';

export default {
  name: 'TeamStatsModal',
  props: {
    team: { type: Object, required: true },
    visible: { type: Boolean, required: true }
  },
  methods: {
    cleanStatName
  }
}
</script>

<style scoped>
.stat-shot-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.stat-shot-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.75);
  cursor: pointer;
}

.stat-shot-card {
  position: relative;
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-left: 4px solid #d50a0a;
  max-width: 700px;
  width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  text-align: left;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 32px 32px 0 32px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 32px;
  padding-bottom: 20px;
}

.team-info {
  flex: 1;
}

.team-name {
  font-family: 'BentonSans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', Arial, sans-serif;
  font-size: 28px;
  font-weight: 700;
  color: #222222;
  margin: 0 0 8px 0;
  text-shadow: none;
  letter-spacing: -0.02em;
}

.team-sport {
  font-size: 14px;
  font-weight: 600;
  color: #666666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  font-size: 32px;
  font-weight: 300;
  color: #999999;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.close-button:hover {
  color: #d50a0a;
}

.stats-section {
  padding: 0 32px 32px 32px;
}

.section-title {
  font-family: 'BentonSans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', Arial, sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #222222;
  margin: 0 0 24px 0;
  text-shadow: none;
  letter-spacing: -0.02em;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  padding: 16px;
  text-align: center;
}

.stat-label {
  font-size: 12px;
  font-weight: 600;
  color: #666666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #222222;
  font-family: 'BentonSans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', Arial, sans-serif;
}

@media (max-width: 768px) {
  .stat-shot-card {
    width: 95vw;
    max-height: 85vh;
  }

  .modal-header {
    padding: 20px 20px 0 20px;
    margin-bottom: 20px;
    padding-bottom: 16px;
  }

  .stats-section {
    padding: 0 20px 20px 20px;
  }

  .team-name {
    font-size: 24px;
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
  }

  .stat-card {
    padding: 12px;
  }

  .stat-value {
    font-size: 20px;
  }
}
</style>
