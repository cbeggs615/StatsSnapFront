<template>
  <form @submit.prevent="handleAddFavorite" class="favorite-team-form">
    <h2>Add Team to Track</h2>

    <div class="form-field">
      <label for="sport">Choose Sport</label>
      <select id="sport" v-model="selectedSport" @change="fetchTeamsForSport" required>
        <option value="" disabled>Select a sport</option>
        <option v-for="sport in sportsList" :key="sport._id" :value="sport._id">
          {{ sport.name }}
        </option>
      </select>
    </div>

    <div v-if="selectedSport" class="form-field">
      <label for="team">Choose Team</label>
      <select id="team" v-model="selectedTeam" required>
        <option value="" disabled>Select a team</option>
        <option v-for="team in availableTeams" :key="team._id" :value="team._id">
          {{ team.name }}
        </option>
      </select>
    </div>

    <button type="submit" :disabled="!selectedTeam">Add to Dashboard</button>

    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="success" class="success">Team successfully added to your dashboard!</div>
  </form>
</template>

<script>
import { API_BASE } from '../utils/apiConfig.js'
import { fetchSportsList, fetchTeamsBySport, fetchSportDetails, createUserStatsCollection, getUserStatsCollection, removeUserStatsCollection } from '../utils/api.js';

export default {
  name: 'FavoriteTeamForm',
  props: ['session', 'username'],
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
        // First, track the team
        const requestBody = {
          path: '/ItemTracking/addItem',
          session: this.session,
          item: this.selectedTeam
        };


        const response = await fetch(`${API_BASE}/ItemTracking/addItem`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
        const result = await response.json();

        if (result.success) {
          // Check if user already has a stat collection for this sport
          const existingCollection = await getUserStatsCollection(this.username, this.selectedSport, this.session);

          // Only create default stats if user doesn't have any stats for this sport yet
          if (!existingCollection || !existingCollection.stats || existingCollection.stats.length === 0) {
            const sportDetails = await fetchSportDetails(this.selectedSport);

            if (sportDetails && sportDetails.defaultKeyStats && sportDetails.defaultKeyStats.length > 0) {
              try {
                // Create default stat items for new sport
                const statsResult = await createUserStatsCollection(
                  this.username,
                  this.selectedSport,
                  sportDetails.defaultKeyStats,
                  this.session
                );

                if (statsResult.error) {
                  // Stat creation failed, but team tracking still succeeded
                } else {
                  // Default stats successfully created for new sport
                }
              } catch (error) {
                // Exception during stats collection management - team tracking still works
              }
            } else {
              // No sport details or default stats available
            }
          } else {
            // User already has stats for this sport - keeping existing configuration
          }

          // Find the full team object and ensure it has the correct sport ID
          const addedTeam = this.availableTeams.find(team => team._id === this.selectedTeam);
          if (addedTeam) {
            // Make sure we use the selectedSport (dropdown value) as the sport ID
            addedTeam.sport = this.selectedSport;
          }

          this.success = true;
          setTimeout(() => { this.success = false }, 2200);
          this.selectedTeam = '';
          this.selectedSport = '';
          this.availableTeams = [];
          await this.refreshSportsList();

          // Emit the full team object instead of just a signal
          this.$emit('team-added', addedTeam);
        } else if (result.error) {
          this.error = /already|duplicate|exist/i.test(result.error)
            ? 'You are already tracking this team'
            : result.error;
        }
      } catch (e) {
        this.error = 'Unable to connect to the server. Please check your connection and try again.';
      }
    }
  }
}


</script>

<style scoped>
.favorite-team-form {
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-left: 4px solid #d50a0a;
  padding: 24px;
  margin: 0;
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  text-align: left;
}
h2 {
  font-family: 'BentonSans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', Arial, sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #222222;
  margin: 0 0 20px 0;
  text-shadow: none;
  letter-spacing: -0.02em;
}
.form-field {
  margin-bottom: 20px;
}
label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333333;
  margin: 12px 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
select {
  width: 100%;
  padding: 12px 16px;
  margin: 0 0 16px 0;
  border: 1px solid #d1d1d1;
  background: #ffffff;
  font-size: 14px;
  font-family: inherit;
  color: #333333;
  transition: all 0.2s ease;
}
select:focus {
  outline: none;
  border-color: #d50a0a;
}
input {
  width: 100%;
  padding: 12px 16px;
  margin: 0 0 16px 0;
  border: 1px solid #d1d1d1;
  background: #ffffff;
  font-size: 14px;
  font-family: inherit;
  color: #333333;
  transition: all 0.2s ease;
}
input:focus {
  outline: none;
  border-color: #d50a0a;
}
button {
  background: #d50a0a;
  color: #ffffff;
  border: 1px solid #d50a0a;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin: 16px 0 0 0;
}
button:hover {
  background: #b71c1c;
  border-color: #b71c1c;
}
button:disabled {
  background: #cccccc;
  border-color: #cccccc;
  cursor: not-allowed;
}
.error {
  color: #d50a0a;
  font-size: 14px;
  padding: 12px;
  background: #ffebee;
  border-left: 4px solid #d50a0a;
  margin: 16px 0;
}
.success {
  color: #1b5e20;
  font-size: 14px;
  padding: 12px;
  background: #e8f5e8;
  border-left: 4px solid #4caf50;
  margin: 16px 0;
}
@media (max-width: 1200px) {
  .favorite-team-form {
    margin: 16px auto;
    max-width: 600px;
  }
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
