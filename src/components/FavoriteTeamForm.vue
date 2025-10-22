<template>
  <form @submit.prevent="handleAddFavorite" class="favorite-team-form">
    <h2>Track a Team</h2>
    <div>
      <label for="sport">Sport:</label>
      <select id="sport" v-model="selectedSport" @change="fetchTeamsForSport" required>
        <option value="" disabled>Select a sport</option>
        <option v-for="sport in sportsList" :key="sport._id" :value="sport._id">
          {{ sport.name }}
        </option>
      </select>
    </div>
    <div v-if="selectedSport">
      <label for="team">Team:</label>
      <select id="team" v-model="selectedTeam" required>
        <option value="" disabled>Select a team</option>
        <option v-for="team in availableTeams" :key="team._id" :value="team._id">
          {{ team.name }}
        </option>
      </select>
    </div>
    <button type="submit" :disabled="!selectedTeam">Start Tracking</button>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="success" class="success">Now tracking this team!</div>
  </form>
</template>

<script>
import { fetchSportsList, fetchTeamsBySport } from '../utils/api.js';

export default {
  name: 'FavoriteTeamForm',
  props: ['username'],
  data() {
    return {
      sportsList: [],
      selectedSport: '',
      availableTeams: [],
      selectedTeam: '',
      error: '',
      success: false
    }
  },
  async mounted() {
    await this.refreshSportsList();
  },
  methods: {
    async refreshSportsList() {
      const sports = await fetchSportsList();
      this.sportsList = Array.isArray(sports)
        ? sports.slice().sort((a, b) => a.name.localeCompare(b.name))
        : [];
    },
    async fetchTeamsForSport() {
      const rawTeams = await fetchTeamsBySport(this.selectedSport);
      console.info('Full response from /api/SportsStats/_getTeamsBySport:', rawTeams);
      if (Array.isArray(rawTeams) && rawTeams.length === 0) {
        console.warn(`No teams found for sport ID: ${this.selectedSport}. Check if teams exist for this sport in the backend.`);
      } else if (!Array.isArray(rawTeams)) {
        console.error('Unexpected response from fetchTeamsBySport:', rawTeams);
      } else {
        console.info(`Fetched ${rawTeams.length} teams for sport ID: ${this.selectedSport}.`);
      }
      this.availableTeams = Array.isArray(rawTeams)
        ? rawTeams.map(team => ({
            _id: team._id,
            name: team.name || team.teamname,
            sport: team.sport
          })).sort((a, b) => a.name.localeCompare(b.name))
        : [];
      this.selectedTeam = '';
    },
    async handleAddFavorite() {
      this.error = '';
      this.success = false;
      try {
        const response = await fetch('/api/ItemTracking/addItem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: this.username, item: this.selectedTeam })
        });
        const result = await response.json();
        if (!result.error) {
          this.success = true;
          setTimeout(() => { this.success = false }, 2200);
          this.selectedTeam = '';
          this.selectedSport = '';
          this.availableTeams = [];
          await this.refreshSportsList();
          this.$emit('team-added');
        } else {
          this.error = result.error;
        }
      } catch (e) {
        this.error = 'Network error: ' + (e.message || e);
        console.error('Network error during add favorite:', e);
      }
    }
  }
}
</script>

<style scoped>
.favorite-team-form {
  background: #fff;
  color: #0a2342;
  border-radius: 18px;
  box-shadow: 0 4px 16px rgba(44, 165, 141, 0.12);
  padding: 24px;
  margin: 18px auto;
  max-width: 480px;
  font-family: 'Montserrat', 'Oswald', sans-serif;
}
h2 {
  font-family: 'Oswald', 'Montserrat', sans-serif;
  color: #2ca58d;
  font-size: 1.3rem;
  font-weight: 700;
}
label {
  font-weight: 500;
  color: #22223b;
}
select {
  width: 100%;
  padding: 8px;
  margin: 8px 0 16px 0;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  font-size: 1rem;
}
input {
  width: 100%;
  padding: 10px;
  margin: 8px 0 16px 0;
  border: 1px solid #2ca58d;
  border-radius: 8px;
  font-size: 1rem;
  font-family: 'Montserrat', 'Oswald', sans-serif;
  color: #0a2342;
  background: #f8fafc;
  text-align: left;
}
button {
  background: #2ca58d;
  color: #fff;
  border: none;
  padding: 12px 28px;
  border-radius: 30px;
  font-size: 1.1rem;
  font-family: 'Montserrat', 'Oswald', sans-serif;
  font-weight: 700;
  cursor: pointer;
  margin: 10px 0;
  box-shadow: 0 2px 8px rgba(44, 165, 141, 0.15);
  transition: background 0.2s, transform 0.2s;
}
button:hover {
  background: #0a2342;
  color: #fff;
  transform: scale(1.05);
}
.error {
  color: #e63946;
  font-weight: 700;
}
.success {
  color: #2ca58d;
  font-weight: 700;
}
@media (max-width: 600px) {
  .favorite-team-form {
    min-width: 0;
    max-width: 100%;
    margin: 16px auto;
    padding: 16px;
  }
}
</style>
