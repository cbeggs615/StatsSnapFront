<template>
  <div v-if="visible" class="edit-stats-modal">
    <div class="edit-stats-card">
      <h2>{{ team.teamname }}</h2>
      <div class="team-sport">{{ team.sportName }}</div>      <h3>My {{ team.sportName }} Key Stats</h3>

      <div v-if="userSelectedStats.length === 0" class="no-stats-message">
        No stats selected. Use the selection below to customize your {{ team.sportName }} stats.
      </div>

      <div class="key-stats-list">
        <div v-for="statItem in displayUserSelectedStats" :key="statItem.key" class="key-stat-item">
          <span class="stat-name"><strong>{{ statItem.displayName }}</strong>:</span>
          <span class="stat-value">{{ team.keyStatsData[statItem.key] !== undefined ? team.keyStatsData[statItem.key] : 'Loading...' }}</span>
          <button class="remove-stat-btn" @click="handleRemoveStat(statItem.key)">Remove</button>
        </div>
      </div>
      <form @submit.prevent="handleAddStat">
        <label for="newStat">Edit your {{ team.sportName }} key stats selection:</label>
        <select id="newStat" v-model="selectedStat" required>
          <option value="" disabled>Select a stat to add</option>
          <option v-for="stat in unselectedStats" :key="stat" :value="stat">{{ cleanStatName(stat) }}</option>
        </select>
        <button type="submit" :disabled="!selectedStat">Add Stat</button>
      </form>
      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="success === true" class="success">Stat was successfully added to your collection!</div>
      <div v-if="success === 'removed'" class="success">Stat was successfully removed from your collection!</div>
      <div v-if="success === 'reset'" class="success">Successfully reset to default {{ team.sportName }} stats!</div>

      <div class="modal-actions">
        <button @click="handleResetToDefault" class="reset-btn">Reset to Default {{ team.sportName }} Stats</button>
        <button @click="$emit('close')" class="close-btn">Close</button>
      </div>
    </div>
  </div>
</template>

<script>
import { fetchAvailableStatsForTeam, getUserStatsCollection, addUserStat, removeUserStat, removeUserStatsCollection, createUserStatsCollection, fetchSportDetails, cleanStatName } from '../utils/api.js';
export default {
  name: 'EditTeamStatsModal',
  props: {
    team: { type: Object, required: true },
    visible: { type: Boolean, required: true },
    username: { type: String, required: true }
  },
  data() {
    return {
      availableStats: [],
      selectedStat: '',
      error: '',
      success: false,
      debug: '',
      userSelectedStats: []
    }
  },
  computed: {
    unselectedStats() {
      return this.availableStats.filter(stat => !this.userSelectedStats.includes(stat));
    },
    displayUserSelectedStats() {
      return this.userSelectedStats.map(stat => ({
        key: stat,
        displayName: this.cleanStatName(stat)
      }));
    }
  },
  methods: {
    cleanStatName,
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
        console.debug('Adding stat:', this.selectedStat);

        // Add the individual stat
        const result = await this.addUserStat(this.selectedStat);

        if (result.error) {
          this.error = result.error;
          return;
        }

        // Update UI immediately
        if (!this.userSelectedStats.includes(this.selectedStat)) {
          this.userSelectedStats.push(this.selectedStat);
        }

        console.debug('Stat added, fetching fresh team stats...');

        // Fetch fresh team stats with the updated stats
        await this.fetchTeamStats();

        console.debug('Fresh team stats:', this.team.keyStatsData);

        this.success = true;
        this.selectedStat = '';
        this.$emit('stat-added');
      } catch (e) {
        console.error('Error in handleAddStat:', e);
        this.error = 'Unable to connect to the server. Please check your connection and try again.';
      }
    },
    async handleRemoveStat(stat) {
      this.error = '';
      this.success = false;
      try {
        console.debug('Removing stat:', stat);

        // Remove the individual stat
        const result = await this.removeUserStat(stat);

        if (result.error) {
          this.error = result.error;
          return;
        }

        // Update UI immediately
        this.userSelectedStats = this.userSelectedStats.filter(s => s !== stat);

        console.debug('Stat removed, fetching fresh team stats...');

        // Fetch fresh team stats with the updated stats
        await this.fetchTeamStats();

        console.debug('Fresh team stats:', this.team.keyStatsData);

        this.success = 'removed';
        this.error = '';
        this.$emit('stat-added'); // Emit to trigger dashboard refresh
      } catch (e) {
        console.error('Error in handleRemoveStat:', e);
        this.error = 'Unable to connect to the server. Please check your connection and try again.';
      }
    },
    async fetchTeamStats() {
      console.log('🚀 fetchTeamStats called!');
      if (this.team && this.team.teamname && this.team.sportId) {
        try {
          console.log('🔍 === EDIT TEAM STATS MODAL DEBUG ===');
          console.log('🏟️  Team:', this.team.teamname, 'Sport ID:', this.team.sportId);
          console.log('👤 Username:', this.username);

          // Get user's tracked stats for this sport
          console.log('📊 Calling getUserStatsCollection...');
          const userStats = await this.getUserStatsCollection();
          let statsToRequest = null;

          console.log('📊 getUserStatsCollection result:', JSON.stringify(userStats, null, 2));

          if (userStats && userStats.hasUserStats) {
            // User has customized their stats for this sport
            statsToRequest = userStats.stats || [];
            this.userSelectedStats = userStats.stats || [];
            console.debug('✅ User has customized stats - setting userSelectedStats to:', this.userSelectedStats);
          } else {
            // User hasn't customized stats for this sport yet - they'll see defaults
            statsToRequest = null;
            this.userSelectedStats = []; // Will be updated after API call to show defaults
            console.debug('❌ No customized user stats - will show sport defaults');
          }

          const requestBody = {
            teamname: this.team.teamname,
            sport: this.team.sportId
          };

          if (userStats && userStats.hasUserStats) {
            // User has customized stats, send in API format (with "stat:" prefix)
            const apiFormatStats = statsToRequest.map(stat =>
              stat.startsWith('stat:') ? stat : `stat:${stat}`
            );
            requestBody.stats = apiFormatStats;
            console.log('🔄 Converting stats for API:', statsToRequest, '→', apiFormatStats);
          } else {
            // No customized stats, let API return defaults
            console.debug('No customized stats, will use API defaults');
          }

          console.debug('Sending request to fetchTeamStats:', JSON.stringify(requestBody, null, 2));

          const response = await fetch('/api/SportsStats/fetchTeamStats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          });
          const data = await response.json();
          console.debug('fetchTeamStats response:', JSON.stringify(data, null, 2));
          this.team.keyStatsData = data.keyStatsData || {};

          // Handle display based on whether user has customized stats
          if (!userStats || !userStats.hasUserStats) {
            // User hasn't customized this sport - show them what they would get by default
            // This gives them a preview of what they'll be tracking
            this.userSelectedStats = Object.keys(this.team.keyStatsData);
            console.debug('✅ No customization - showing default stats as preview:', this.userSelectedStats);
          } else {
            // User has customized stats - show exactly what they've chosen
            // Filter keyStatsData to only include their selections
            const filteredKeyStatsData = {};
            this.userSelectedStats.forEach(stat => {
              if (this.team.keyStatsData[stat] !== undefined) {
                filteredKeyStatsData[stat] = this.team.keyStatsData[stat];
              }
            });
            this.team.keyStatsData = filteredKeyStatsData;
            console.debug('✅ Has customized stats - showing exact user selection:', this.team.keyStatsData);
          }

          console.debug('🔍 FINAL userSelectedStats:', this.userSelectedStats);
        } catch (e) {
          console.error('Error in fetchTeamStats:', e);
          this.error = 'Unable to connect to the server. Please check your connection and try again.';
        }
      }
    },
    async getUserStatsCollection() {
      // Use the API helper function
      return await getUserStatsCollection(this.username, this.team.sportId);
    },

    async addUserStat(statName) {
      // Use the API helper function
      return await addUserStat(this.username, this.team.sportId, statName);
    },
    async removeUserStat(statName) {
      // Use the API helper function
      return await removeUserStat(this.username, this.team.sportId, statName);
    },
    async handleResetToDefault() {
      this.error = '';
      this.success = false;
      try {
        console.debug('Resetting to default stats for sport:', this.team.sportId);

        // First, remove all current user stats for this sport
        const removeResult = await removeUserStatsCollection(this.username, this.team.sportId);
        console.debug('Removed current stats:', removeResult);

        // Check if removal was successful
        if (removeResult.error) {
          this.error = 'Failed to remove current stats: ' + removeResult.error;
          return;
        }

        // Then, get the default stats for this sport
        const sportDetails = await fetchSportDetails(this.team.sportId);
        if (!sportDetails || !Array.isArray(sportDetails.defaultKeyStats)) {
          this.error = 'No default stats available for this sport.';
          return;
        }

        // Create the default stats collection for the user
        const createResult = await createUserStatsCollection(
          this.username,
          this.team.sportId,
          sportDetails.defaultKeyStats
        );

        if (createResult.error) {
          this.error = createResult.error;
          return;
        }

        // Verify that the stats were actually created
        if (!createResult.success || createResult.successCount === 0) {
          this.error = 'Failed to create default stats. Please try again.';
          return;
        }

        console.debug('Created', createResult.successCount, 'default stats');

        // Show success message
        this.success = 'reset';

        // Clear the selected stat dropdown
        this.selectedStat = '';

        // Refresh the stats display to show the new defaults
        await this.fetchStatsAndTeamStats();

        console.debug('Successfully reset to default stats');
      } catch (e) {
        console.error('Error in handleResetToDefault:', e);
        this.error = 'Unable to connect to the server. Please check your connection and try again.';
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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}
.edit-stats-card {
  background: #ffffff;
  color: #222222;
  border: 1px solid #e5e5e5;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  padding: 32px;
  min-width: 480px;
  max-width: 600px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  text-align: left;
}
h2 {
  font-size: 24px;
  font-weight: 700;
  color: #222222;
  margin: 0 0 8px 0;
}
h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333333;
  margin: 24px 0 16px 0;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
form {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
label {
  font-size: 14px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 8px;
}
select, button[type="submit"] {
  padding: 12px 16px;
  border: 1px solid #d1d1d1;
  background: #ffffff;
  font-size: 14px;
  transition: all 0.2s ease;
}
select:focus {
  outline: none;
  border-color: #d50a0a;
}
.close-btn {
  background: #ffffff;
  border: 1px solid #d1d1d1;
  color: #333333;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  align-self: flex-end;
}
.close-btn:hover {
  background: #f0f0f0;
  border-color: #999999;
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
.key-stats-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}
.key-stat-item {
  background: #f7f7f7;
  border: 1px solid #e5e5e5;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 200px;
  gap: 12px;
}
.stat-name {
  color: #767676;
  font-weight: 500;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.stat-value {
  color: #222222;
  font-weight: 700;
  font-size: 18px;
  font-weight: 500;
}
.remove-stat-btn {
  background: #ffffff;
  border: 1px solid #d1d1d1;
  color: #d50a0a;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.remove-stat-btn:hover {
  background: #d50a0a;
  color: #ffffff;
  border-color: #d50a0a;
}
.no-stats-message {
  color: #999999;
  padding: 24px;
  background: #f7f7f7;
  border: 2px dashed #e5e5e5;
  text-align: center;
  margin: 16px 0;
}
.team-sport {
  color: #767676;
  font-size: 13px;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}
.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e5e5e5;
}
.reset-btn {
  background: #d50a0a;
  color: #ffffff;
  border: 1px solid #d50a0a;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
}
.reset-btn:hover {
  background: #b71c1c;
  border-color: #b71c1c;
}
.close-btn {
  flex: 0 0 auto;
}
button[type="submit"] {
  background: #d50a0a;
  border: 1px solid #d50a0a;
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
}
button[type="submit"]:hover {
  background: #b71c1c;
  border-color: #b71c1c;
}
</style>
