<template>
  <div class="team-details-modal" v-if="visible">
    <div class="team-details-card">
      <h2>{{ team.teamname }}</h2>
      <div class="team-sport">{{ team.sportName || team.sport }}</div>
      <h3>All Stats</h3>
      <div class="all-stats-list">
        <div v-for="([stat, value], idx) in Object.entries(team.keyStatsData)" :key="stat" class="all-stat-item">
          <span class="stat-name"><strong>{{ stat }}</strong>:</span>
          <span class="stat-value">{{ value }}</span>
        </div>
      </div>
      <button @click="$emit('close')" class="close-btn">Close</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TeamStatsModal',
  props: {
    team: { type: Object, required: true },
    visible: { type: Boolean, required: true }
  }
}
</script>

<style scoped>
.team-details-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(60, 60, 60, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}
.team-details-card {
  background: #fff;
  color: #0a2342;
  border-radius: 18px;
  box-shadow: 0 4px 24px rgba(44, 165, 141, 0.18);
  padding: 32px 28px;
  min-width: 320px;
  max-width: 90vw;
  font-family: 'Montserrat', 'Oswald', sans-serif;
  text-align: left;
}
.team-sport {
  color: #2ca58d;
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 10px;
}
.all-stats-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 18px;
}
.all-stat-item {
  background: #f8fafc;
  border-radius: 10px;
  padding: 8px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 2px 8px rgba(44, 165, 141, 0.10);
}
.stat-name {
  color: #2ca58d;
  font-weight: 700;
}
.stat-value {
  color: #0a2342;
  font-weight: 500;
}
.close-btn {
  background: #2ca58d;
  color: #fff;
  border: none;
  padding: 10px 24px;
  border-radius: 18px;
  font-size: 1rem;
  font-family: 'Montserrat', 'Oswald', sans-serif;
  font-weight: 700;
  cursor: pointer;
  margin-top: 18px;
}
.close-btn:hover {
  background: #0a2342;
}
</style>
