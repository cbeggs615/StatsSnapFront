<template>
  <div class="admin-team-management">
    <form @submit.prevent="handleAddTeam" class="add-team-form">
      <h2>Add a Team</h2>
      <div>
        <label for="teamname">Team Name:</label>
        <input id="teamname" v-model="teamname" required />
      </div>
      <div>
        <label for="sport">Sport:</label>
        <select id="sport" v-model="sport" required>
          <option value="" disabled>Select a sport</option>
          <option v-for="s in sportsList" :key="s._id" :value="s._id">{{ s.name }}</option>
        </select>
      </div>
      <button type="submit">Add Team</button>
      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="success" class="success">Team added and tracking started!</div>
    </form>

    <div class="delete-team-form">
      <h2>Delete a Team</h2>
      <div>
        <label for="deleteTeam">Team to Delete:</label>
        <select id="deleteTeam" v-model="selectedTeamToDelete" required>
          <option value="" disabled>Select a team to delete</option>
          <option v-for="team in allTeams" :key="team._id" :value="team._id">
            {{ team.name }} - {{ getSportName(team.sport) }}
          </option>
        </select>
        <div v-if="allTeams.length === 0" class="loading-text">Loading teams...</div>
      </div>
      <button @click="handleDeleteTeam" type="button" class="delete-btn">Delete Team</button>
      <div v-if="deleteError" class="error">{{ deleteError }}</div>
      <div v-if="deleteSuccess" class="success">Team deleted successfully!</div>
    </div>
  </div>
</template>

<script>
import { API_BASE } from '../utils/apiConfig.js'
import { fetchSportsList } from '../utils/api.js';

export default {
  name: 'AddTeamForm',
  props: ['username'],
  data() {
    return {
      teamname: '',
      sport: '', // should be _id string
      sportsList: [],
      allTeams: [],
      selectedTeamToDelete: '',
      error: '',
      success: false,
      deleteError: '',
      deleteSuccess: false,
      refreshInterval: null
    }
  },
  async mounted() {
    this.startAutoRefresh();
  },
  beforeUnmount() {
    clearInterval(this.refreshInterval);
  },
  watch: {
    // Watch for changes in sportsList length to refresh dropdown
    sportsList(newList, oldList) {
      if (newList.length !== oldList.length) {
        this.sport = '';
      }
    }
  },
  methods: {
    async refreshSportsList() {
      const sports = await fetchSportsList();
      this.sportsList = Array.isArray(sports)
        ? sports.slice().sort((a, b) => a.name.localeCompare(b.name))
        : [];
    },
    async refreshAllTeams() {
      try {
        const response = await fetch(`${API_BASE}/SportsStats/_getAllTeams`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        const data = await response.json();
        this.allTeams = Array.isArray(data)
          ? data.slice().sort((a, b) => (a.name || a.teamname).localeCompare(b.name || b.teamname))
          : [];
      } catch (e) {
        console.error('Error fetching teams:', e);
        this.allTeams = [];
      }
    },
    getSportName(sportId) {
      if (!sportId || !this.sportsList || this.sportsList.length === 0) {
        return 'Loading...';
      }
      const sport = this.sportsList.find(s => s._id === sportId);
      return sport ? sport.name : 'Unknown Sport';
    },
    startAutoRefresh() {
      this.refreshSportsList();
      this.refreshAllTeams();
      this.refreshInterval = setInterval(() => {
        this.refreshSportsList();
        this.refreshAllTeams();
      }, 5000); // refresh every 5 seconds
    },
    async handleAddTeam() {
      this.error = '';
      this.success = false;
      // Ensure sport is a string (the _id)
      const selectedSport = this.sportsList.find(s => s._id === this.sport);
      const sportId = selectedSport ? selectedSport._id : this.sport;
      try {
        // Add team to SportsStats
        const teamRes = await fetch(`${API_BASE}/SportsStats/addTeam`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamname: this.teamname, sport: sportId })
        });
        const teamData = await teamRes.json();
        if (!teamData.teamStats) {
          this.error = teamData.error || 'Failed to add team.';
          return;
        }
        this.success = true;
        this.teamname = '';
        this.sport = '';
        this.$emit('team-added');
        await this.refreshSportsList(); // Refresh sports list after adding a team
      } catch (e) {
        this.error = 'Network error: ' + (e.message || e);
        console.error('Network error during team add:', e);
      }
    },
    async handleDeleteTeam() {
      this.deleteError = '';
      this.deleteSuccess = false;
      if (!this.selectedTeamToDelete) {
        this.deleteError = 'Please select a team to delete.';
        return;
      }
      try {
        const teamToDelete = this.allTeams.find(team => team._id === this.selectedTeamToDelete);
        if (!teamToDelete) {
          this.deleteError = 'Team not found.';
          return;
        }
        const teamname = teamToDelete.name;
        const sport = teamToDelete.sport;
        if (sport === 'Loading...' || sport === 'Unknown Sport') {
          this.deleteError = 'Sport information not available. Please try again.';
          return;
        }
        const response = await fetch(`${API_BASE}/SportsStats/removeTeam`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamname, sport })
        });
        const result = await response.json();
        if (!result.error) {
          this.deleteSuccess = true;
          this.selectedTeamToDelete = '';
          await this.refreshAllTeams();
          this.$emit('team-added');
        } else {
          this.deleteError = result.error;
        }
      } catch (e) {
        this.deleteError = 'Network error: ' + (e.message || e);
        console.error('Network error during team deletion:', e);
      }
    }
  }
}
</script>

<style scoped>
.admin-team-management {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
  justify-content: center;
  margin: 32px auto;
}
.add-team-form, .delete-team-form {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(99, 102, 241, 0.08);
  padding: 28px 24px;
  min-width: 320px;
  max-width: 400px;
  margin-bottom: 24px;
}
.add-team-form h2, .delete-team-form h2 {
  color: #6366f1;
  font-size: 1.3rem;
  margin-bottom: 18px;
}
label {
  font-weight: 500;
  color: #22223b;
}
input, select {
  width: 100%;
  padding: 8px;
  margin: 8px 0 16px 0;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  font-size: 1rem;
}
.delete-btn {
  background: #dc2626;
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 8px;
  transition: background 0.2s;
}
.delete-btn:hover {
  background: #b91c1c;
}
.loading-text {
  color: #6366f1;
  font-size: 0.95rem;
}
.error {
  color: #dc2626;
  font-weight: 500;
}
.success {
  color: #059669;
  font-weight: 500;
}
@media (max-width: 700px) {
  .admin-team-management {
    flex-direction: column;
    gap: 0;
  }
  .add-team-form, .delete-team-form {
    min-width: 0;
    max-width: 100%;
    margin-bottom: 16px;
  }
}
</style>
