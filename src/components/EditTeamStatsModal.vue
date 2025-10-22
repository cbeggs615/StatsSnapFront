<template>
  <div v-if="visible" class="edit-stats-modal">
    <div class="edit-stats-card">
      <h2>{{ team.teamname }}</h2>
      <div class="team-sport">{{ team.sportName }}</div>
      <h3>Current Key Stats</h3>
      <div class="key-stats-list">
        <div v-for="([stat, value], idx) in Object.entries(team.keyStatsData)" :key="stat" class="key-stat-item">
          <span class="stat-name"><strong>{{ stat }}</strong>:</span>
          <span class="stat-value">{{ value }}</span>
          <button class="remove-stat-btn" @click="handleRemoveStat(stat)">Remove</button>
        </div>
      </div>
      <form @submit.prevent="handleAddStat">
        <label for="newStat">Add Stat:</label>
        <select id="newStat" v-model="selectedStat" required>
          <option value="" disabled>Select a stat</option>
          <option v-for="stat in availableStats" :key="stat" :value="stat">{{ stat }}</option>
        </select>
        <button type="submit" :disabled="!selectedStat">Add Stat to All {{ team.sportName }} Teams</button>
      </form>
      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="success === true" class="success">Stat was successfully added for all {{ team.sportName }} teams!</div>
      <div v-if="success === 'removed'" class="success">Stat was successfully removed from all {{ team.sportName }} teams!</div>
      <button @click="$emit('close')" class="close-btn">Close</button>
    </div>
  </div>
</template>

<script>
import { fetchAvailableStatsForTeam, addKeyStat, removeKeyStat } from '../utils/api.js';
export default {
  name: 'EditTeamStatsModal',
  props: {
    team: { type: Object, required: true },
    visible: { type: Boolean, required: true }
  },
  data() {
    return {
      availableStats: [],
      selectedStat: '',
      error: '',
      success: false,
      debug: ''
    }
  },
  methods: {
    fetchStats() {
      if (this.team && this.team.teamname && this.team.sportId) {
        this.debug = `Request: teamname=${this.team.teamname}, sportId=${this.team.sportId}`;
        console.debug(this.debug);
        fetchAvailableStatsForTeam(this.team.teamname, this.team.sportId).then(stats => {
          this.debug += ` | Response: ${JSON.stringify(stats)}`;
          console.debug('API response:', stats);
          this.availableStats = Array.isArray(stats) ? stats : [];
          if (!this.availableStats.length) {
            this.debug += ' | No available stats returned.';
            console.debug('No available stats returned.');
          }
        }).catch(e => {
          this.debug += ` | Error: ${e.message || e}`;
          console.debug('API error:', e);
        });
      }
    },
    async fetchStatsAndTeamStats() {
      await this.fetchStats();
      await this.fetchTeamStats();
    },
    async handleAddStat() {
      this.error = '';
      this.success = false;
      try {
        const result = await addKeyStat(this.team.sportName, this.selectedStat);
        if ((result && Object.keys(result).length === 0) || !result.error) {
          this.success = true;
          await this.fetchStatsAndTeamStats();
          this.selectedStat = '';
          this.$emit('stat-added');
        } else {
          this.error = result.error || 'Failed to add stat.';
        }
      } catch (e) {
        this.error = 'Network error: ' + (e.message || e);
      }
    },
    async handleRemoveStat(stat) {
      this.error = '';
      this.success = false;
      try {
        const result = await removeKeyStat(this.team.sportName, stat);
        if ((result && Object.keys(result).length === 0) || !result.error) {
          this.success = 'removed';
          this.error = '';
          await this.fetchStatsAndTeamStats();
        } else {
          this.error = result.error || 'Failed to remove stat.';
        }
      } catch (e) {
        this.error = 'Network error: ' + (e.message || e);
      }
    },
    async fetchTeamStats() {
      if (this.team && this.team.teamname && this.team.sportId) {
        try {
          const response = await fetch('/api/SportsStats/fetchTeamStats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamname: this.team.teamname, sport: this.team.sportId })
          });
          const data = await response.json();
          this.team.keyStatsData = data.keyStatsData || {};
        } catch (e) {
          this.error = 'Network error: ' + (e.message || e);
        }
      }
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.fetchStatsAndTeamStats();
      }
    }
  },
  mounted() {
    if (this.visible) {
      this.fetchStatsAndTeamStats();
    }
  }
}
</script>

<style scoped>
.edit-stats-modal {
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
.edit-stats-card {
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
form {
  margin-bottom: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  margin-top: 0;
  align-self: flex-end;
}
.close-btn:hover {
  background: #0a2342;
}
.error {
  color: #e63946;
  font-weight: 700;
  margin-top: 10px;
}
.success {
  color: #2ca58d;
  font-weight: 700;
  margin-top: 10px;
}
.debug {
  color: #888;
  font-size: 0.9em;
  margin-top: 10px;
}
.key-stats-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 18px;
}
.key-stat-item {
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
.remove-stat-btn {
  background: #e63946;
  color: #fff;
  border: none;
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-family: 'Montserrat', 'Oswald', sans-serif;
  font-weight: 700;
  cursor: pointer;
  margin-left: 8px;
}
.remove-stat-btn:hover {
  background: #2ca58d;
}
.team-sport {
  color: #2ca58d;
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 10px;
}
</style>
