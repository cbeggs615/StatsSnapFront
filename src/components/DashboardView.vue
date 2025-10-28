<template>
  <div class="dashboard">
    <h1 class="dashboard-title">
      <span class="title-word">
        <span class="capital-m">M</span><span class="small-caps">Y</span><span class="capital-t">T</span><span class="small-caps">EAMS</span>
      </span>
      <span class="title-space"> </span>
      <span class="title-word">
        <span class="capital-d">D</span><span class="small-caps">ASHBOARD</span>
      </span>
    </h1>
    <div v-if="loading" class="loading-message">Loading...</div>
    <div v-else-if="teams.length === 0" class="no-teams-message">
      You are not tracking any teams yet.
    </div>
    <div v-else>
      <div v-for="sport in sortedSports" :key="sport" class="sport-section">
        <h2 class="sport-header">{{ sport }}</h2>
        <div class="sport-teams">
          <div v-for="team in teamsBySport[sport]" :key="team.teamId" class="team-card">
        <div class="team-header">
          <div class="team-info" @click="openStatsModal(team)" style="cursor:pointer;" title="Click to view all stats">
            <h3>{{ team.teamname }}</h3>
            <div class="team-sport">{{ team.sportName }}</div>
            <div class="click-hint">Click for StatsShot</div>
          </div>
          <div class="team-header-actions">
            <button @click="openEditStatsModal(team)" class="edit-stats-btn">Manage</button>
            <button @click="removeTeam(team.teamId)" class="remove-btn">Remove</button>
          </div>
        </div>
        <div class="stats">
          <h4>Key Stats</h4>
          <ul v-if="Object.keys(team.keyStatsData).length">
            <li v-for="([stat, value], idx) in Object.entries(team.keyStatsData).slice(0,2)" :key="stat">
              <strong>{{ cleanStatName(stat) }}</strong> {{ value }}
            </li>
            <li v-if="Object.keys(team.keyStatsData).length > 2" class="more-stats-indicator">
              <em>+ {{ Object.keys(team.keyStatsData).length - 2 }} more stats</em>
            </li>
          </ul>
          <div v-else class="no-stats">
            No key stats available.
          </div>
        </div>
          </div>
        </div>
      </div>
      <TeamStatsModal
        v-if="showStatsModal"
        :team="selectedTeam"
        :visible="showStatsModal"
        @close="closeStatsModal"
      />
      <EditTeamStatsModal
        v-if="showEditStatsModal"
        :team="selectedTeam"
        :visible="showEditStatsModal"
        :username="username"
        @close="closeEditStatsModal"
        @stat-added="loadTeams"
      />
    </div>
  </div>
</template>

<script>
import TeamStatsModal from './TeamStatsModal.vue';
import EditTeamStatsModal from './EditTeamStatsModal.vue';
import { getUserStatsCollection, createUserStatsCollection, cleanStatName } from '../utils/api.js';

export default {
  name: 'DashboardView',
  components: { TeamStatsModal, EditTeamStatsModal },
  props: ['username'],
  data() {
    return {
      loading: true,
      teams: [],
      showStatsModal: false,
      showEditStatsModal: false,
      selectedTeam: null
    }
  },
  computed: {
    teamsBySport() {
      const grouped = {};
      this.teams.forEach(team => {
        const sportName = team.sportName || team.sport || 'Unknown';
        if (!grouped[sportName]) {
          grouped[sportName] = [];
        }
        grouped[sportName].push(team);
      });
      
      // Sort teams within each sport by team name
      Object.keys(grouped).forEach(sport => {
        grouped[sport].sort((a, b) => a.teamname.localeCompare(b.teamname));
      });
      
      return grouped;
    },
    sortedSports() {
      return Object.keys(this.teamsBySport).sort();
    }
  },
  methods: {
    cleanStatName,
    async getUserStatsCollection(username, sport) {
      // Use the API helper function which handles the parsing
      return await getUserStatsCollection(username, sport);
    },
    async loadTeams() {
      this.loading = true;
      try {
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const trackedRes = await fetch('/api/ItemTracking/_getItemsTrackedByUser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: this.username }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const trackedData = await trackedRes.json();

        // Handle both possible response formats
        let rawTeamIds = [];
        if (Array.isArray(trackedData) && trackedData[0]?.items) {
          rawTeamIds = trackedData[0].items;
        } else if (trackedData?.items) {
          rawTeamIds = trackedData.items;
        }

        // Filter out null values, stat items, and ensure we have valid team IDs
        const teamIds = rawTeamIds.filter(id =>
          id !== null &&
          id !== undefined &&
          id !== '' &&
          !id.startsWith('stat:') // Exclude individual stat items
        );


        // Fetch all teams to get team details
        const allTeamsController = new AbortController();
        const allTeamsTimeoutId = setTimeout(() => allTeamsController.abort(), 10000);

        const allTeamsRes = await fetch('/api/SportsStats/_getAllTeams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
          signal: allTeamsController.signal
        });
        clearTimeout(allTeamsTimeoutId);
        const allTeamsData = await allTeamsRes.json();

        // Fetch sports list to map sport IDs to sport names
        const sportsRes = await fetch('/api/SportsStats/_getSportsList', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        const sportsData = await sportsRes.json();

        // Create a map of sport ID to sport name
        const sportMap = {};
        if (Array.isArray(sportsData)) {
          sportsData.forEach(sport => {
            sportMap[sport._id] = sport.name;
          });
        }

        // Create a map of team ID to team details for quick lookup
        const teamMap = {};
        if (Array.isArray(allTeamsData)) {
          allTeamsData.forEach(team => {
            teamMap[team._id] = {
              teamname: team.name,
              sport: team.sport,
              sportName: sportMap[team.sport] || 'Unknown Sport'
            };
          });
        }


        const teams = [];
        for (const teamId of teamIds) {
          // Get team details from the map
          const details = teamMap[teamId] || { teamname: teamId, sport: 'Unknown', sportName: 'Unknown Sport' };
          const teamname = details.teamname || teamId;
          const sport = details.sportName || 'Unknown Sport';
          const sportId = details.sport || 'Unknown';

          // Create basic team object first
          const team = {
            teamId,
            teamname,
            sportId: sportId,
            sportName: sport,
            keyStatsData: {}
          };

          // Try to fetch key stats (optional)
          try {
            console.debug('Fetching stats for', teamname, 'with sportId', sportId);

            // Check if user has tracked stats for this sport
            const userStats = await this.getUserStatsCollection(this.username, sportId);

            const requestBody = {
              teamname,
              sport: sportId
            };

            // If user has tracked stats, use those (even if empty); otherwise API will use defaultKeyStats
            if (userStats) {
              // Convert clean names to API format (with "stat:" prefix)
              const apiFormatStats = (userStats.stats || []).map(stat =>
                stat.startsWith('stat:') ? stat : `stat:${stat}`
              );
              requestBody.stats = apiFormatStats;
              console.debug('Using user tracked stats:', userStats.stats, '→ API format:', apiFormatStats);
            } else {
              console.debug('No user stats found, using sport defaultKeyStats');
            }

            const statsRes = await fetch('/api/SportsStats/fetchTeamStats', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody)
            });

            if (!statsRes.ok) {
              console.error('fetchTeamStats API error:', statsRes.status, await statsRes.text());
              continue; // Skip this team if stats fail
            }

            const statsData = await statsRes.json();
            console.debug('fetchTeamStats response for', teamname, 'with sportId', sportId, ':', statsData);

            if (statsData.error) {
              console.error('fetchTeamStats returned error:', statsData.error);
              team.keyStatsData = {};
            } else {
              team.keyStatsData = statsData.keyStatsData || {};

              // If user has tracked stats, filter keyStatsData to only include selected stats
              if (userStats) {
                const filteredKeyStatsData = {};
                const selectedStats = userStats.stats || [];
                selectedStats.forEach(stat => {
                  if (team.keyStatsData[stat] !== undefined) {
                    filteredKeyStatsData[stat] = team.keyStatsData[stat];
                  }
                });
                team.keyStatsData = filteredKeyStatsData;
                console.debug('Filtered keyStatsData to match user selection:', team.keyStatsData);
              } else {
                console.debug('Final keyStatsData (defaults):', team.keyStatsData);
              }
            }
          } catch (statsError) {
            console.error('Failed to load stats for', teamname, ':', statsError);
            team.keyStatsData = {}; // Ensure it's always an object
          }

          teams.push(team);
        }
        this.teams = teams;

        // Update selectedTeam reference if a team was selected
        if (this.selectedTeam && this.selectedTeam.teamId) {
          const updatedTeam = teams.find(t => t.teamId === this.selectedTeam.teamId);
          if (updatedTeam) {
            this.selectedTeam = updatedTeam;
            console.debug('Updated selectedTeam with fresh data:', this.selectedTeam);
          }
        }
      } catch (e) {
        console.error('Error loading dashboard:', e);
      } finally {
        this.loading = false;
      }
    },
    async removeTeam(teamId) {
      try {
        console.log('Removing team:', teamId);
        const response = await fetch('/api/ItemTracking/removeItem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: this.username, item: teamId })
        });
        const result = await response.json();
        if (!result.error) {
          console.log('Team removed successfully');
          // Reload teams to refresh the display
          await this.loadTeams();
        } else {
          console.error('Error removing team:', result.error);
        }
      } catch (e) {
        console.error('Network error removing team:', e);
      }
    },
    openStatsModal(team) {
      this.selectedTeam = team;
      this.showStatsModal = true;
    },
    closeStatsModal() {
      this.showStatsModal = false;
      this.selectedTeam = null;
    },
    openEditStatsModal(team) {
      console.debug('Opening EditTeamStatsModal for team:', team);
      this.selectedTeam = team;
      this.showEditStatsModal = true;
    },
    closeEditStatsModal() {
      this.showEditStatsModal = false;
      this.selectedTeam = null;
    },

  },
  mounted() {
    this.loadTeams();

    // Dashboard loaded successfully
  },

}
</script>

<style scoped>
.dashboard {
  width: 100%;
  margin: 0;
  padding: 32px 24px;
  background: #f7f7f7;
  box-sizing: border-box;
}
.dashboard-title {
  font-family: 'Impact', 'Franklin Gothic Bold', 'Trebuchet MS Bold', 'Arial Black', sans-serif;
  font-size: 32px;
  font-weight: 900;
  font-style: italic;
  color: #222222;
  margin: 0 0 32px 0;
  text-align: left;
  letter-spacing: -0.5px;
  line-height: 1;
  text-shadow: none;
  display: flex;
  align-items: baseline;
  text-transform: uppercase;
}

.title-word {
  display: inline-flex;
  align-items: baseline;
}

.title-space {
  width: 0.2em;
}

.capital-m, .capital-t, .capital-d {
  font-size: 32px;
  font-weight: 900;
}

.dashboard-title .small-caps {
  font-size: 24px;
  font-weight: 900;
}
.loading-message, .no-teams-message {
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-left: 4px solid #d50a0a;
  padding: 32px;
  margin: 16px 0;
  font-size: 16px;
  color: #666666;
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

.sport-section {
  margin-bottom: 48px;
}

.sport-header {
  font-family: 'BentonSans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', Arial, sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #d50a0a;
  margin: 0 0 24px 0;
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #d50a0a;
  padding-bottom: 8px;
}

.sport-teams {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.team-card {
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-left: 4px solid #d50a0a;
  margin: 0 0 16px 0;
  padding: 16px;
  transition: all 0.2s ease;
  position: relative;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  text-align: left;
}
.team-card:hover {
  border-left-color: #d50a0a;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}
.team-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  cursor: pointer;
}
.team-info {
  text-align: left;
  flex-grow: 1;
}
.team-header h3 {
  font-size: 18px;
  font-weight: 700;
  color: #222222;
  margin: 0;
  letter-spacing: -0.01em;
  text-align: left;
}
.team-sport {
  color: #767676;
  font-size: 13px;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
  text-align: left;
}
.team-header-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
.remove-btn, .edit-stats-btn {
  background: #ffffff;
  border: 1px solid #d1d1d1;
  color: #333333;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.remove-btn:hover {
  background: #f0f0f0;
  border-color: #999999;
}
.stats {
  border-top: 1px solid #e5e5e5;
  padding-top: 12px;
  margin-top: 12px;
  text-align: left;
}
.stats h4 {
  color: #333333;
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  text-align: left;
}
ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: flex-start;
}
li {
  display: flex;
  flex-direction: column;
  min-width: 120px;
  text-align: left;
}
li strong {
  font-size: 11px;
  color: #767676;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}
li:not(.more-stats-indicator) {
  font-size: 24px;
  font-weight: 700;
  color: #222222;
  line-height: 1;
  margin-top: 4px;
}
.more-stats-indicator {
  color: #999999;
  font-style: italic;
  font-size: 12px;
  align-self: flex-start;
  text-align: left;
}
.click-hint {
  font-size: 11px;
  color: #999999;
  margin-top: 2px;
  text-align: left;
}
.team-info:hover .click-hint {
  color: #d50a0a;
}
.no-stats {
  color: #999999;
  font-size: 14px;
  padding: 20px 0;
  text-align: center;
  border: 2px dashed #e5e5e5;
}
.no-stats pre {
  display: none;
}
@media (max-width: 600px) {
  .dashboard {
    padding: 16px 12px;
  }
  .dashboard-title {
    font-size: 24px;
    margin-bottom: 24px;
  }
  .sport-header {
    font-size: 20px;
    margin-bottom: 16px;
  }
  .sport-section {
    margin-bottom: 32px;
  }
  .team-card {
    padding: 12px;
  }
  ul {
    gap: 16px;
  }
  li {
    min-width: 100px;
  }
  .team-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .team-header-actions {
    width: 100%;
  }
}
</style>
