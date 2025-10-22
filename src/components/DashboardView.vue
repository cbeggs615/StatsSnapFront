<template>
  <div class="dashboard">
    <h2>My Tracked Teams</h2>
    <div v-if="loading">Loading...</div>
    <div v-else-if="teams.length === 0">
      You are not tracking any teams yet.
    </div>
    <div v-else>
      <div v-for="team in teams" :key="team.teamId" class="team-card">
        <div class="team-header" @click="openStatsModal(team)" style="cursor:pointer;">
          <h3>{{ team.teamname }}</h3>
          <div class="team-sport">{{ team.sportName }}</div>
        </div>
        <div class="stats">
          <h4>Key Stats</h4>
          <ul v-if="Object.keys(team.keyStatsData).length">
            <li v-for="([stat, value], idx) in Object.entries(team.keyStatsData).slice(0,2)" :key="stat">
              <strong>{{ stat }}</strong> {{ value }}
            </li>
          </ul>
          <div v-else class="no-stats">
            No key stats available.
            <pre style="font-size:0.8em; color:#e63946; background:#f8fafc; padding:4px; border-radius:4px;">{{ team.keyStatsData }}</pre>
          </div>
        </div>
        <button @click="removeTeam(team.teamId)" class="remove-btn">Stop Tracking</button>
        <button @click="openEditStatsModal(team)" class="edit-stats-btn">Edit Stats</button>
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
        @close="closeEditStatsModal"
        @stat-added="loadTeams"
      />
    </div>
  </div>
</template>

<script>
import TeamStatsModal from './TeamStatsModal.vue';
import EditTeamStatsModal from './EditTeamStatsModal.vue';
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
  methods: {
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

        // Filter out null values and ensure we have valid team IDs
        const teamIds = rawTeamIds.filter(id => id !== null && id !== undefined && id !== '');


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
            const statsRes = await fetch('/api/SportsStats/fetchTeamStats', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ teamname, sport: sportId })
            });
            const statsData = await statsRes.json();
            console.debug('fetchTeamStats response for', teamname, 'with sportId', sportId, ':', statsData);
            team.keyStatsData = statsData.keyStatsData || {};
          } catch (statsError) {
            console.warn('Failed to load stats for', teamname, ':', statsError);
          }

          teams.push(team);
        }
        this.teams = teams;
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
  async mounted() {
    await this.loadTeams();
  },

}
</script>

<style scoped>
.dashboard {
  max-width: 900px;
  margin: 40px auto;
  padding: 24px;
}
.team-card {
  background: #fff;
  color: #0a2342;
  border-radius: 18px;
  box-shadow: 0 4px 16px rgba(44, 165, 141, 0.12);
  padding: 24px;
  margin: 18px auto;
  max-width: 480px;
  font-family: 'Montserrat', 'Oswald', sans-serif;
  text-align: left;
  position: relative;
  display: flex;
  flex-direction: column;
}
.team-card:hover {
  box-shadow: 0 4px 24px rgba(99, 102, 241, 0.18);
}
.team-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  position: relative;
}
.team-header h3 {
  flex: 1;
  font-family: 'Oswald', 'Montserrat', sans-serif;
  color: #2ca58d;
  font-size: 1.3rem;
  font-weight: 900;
  letter-spacing: 1px;
  margin: 0;
  padding-right: 0;
  white-space: normal;
  overflow: visible;
  text-overflow: initial;
}
.team-sport {
  color: #2ca58d;
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 6px;
  margin-top: 2px;
}
.remove-btn {
  position: absolute;
  bottom: 16px;
  right: 16px;
  background: #e63946;
  color: #fff;
  border: none;
  padding: 4px 10px;
  border-radius: 14px;
  font-size: 0.85rem;
  font-family: 'Montserrat', 'Oswald', sans-serif;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(44, 165, 141, 0.10);
  transition: background 0.2s, transform 0.2s;
  min-width: 70px;
  text-align: center;
}
.remove-btn:hover {
  background: #2ca58d;
  color: #fff;
  transform: scale(1.05);
}
.edit-stats-btn {
  position: absolute;
  bottom: 52px;
  right: 16px;
  background: #2ca58d;
  color: #fff;
  border: none;
  padding: 4px 10px;
  border-radius: 14px;
  font-size: 0.85rem;
  font-family: 'Montserrat', 'Oswald', sans-serif;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(44, 165, 141, 0.10);
  transition: background 0.2s, transform 0.2s;
  min-width: 70px;
  text-align: center;
}
.edit-stats-btn:hover {
  background: #e63946;
  color: #fff;
  transform: scale(1.05);
}
.stats {
  margin-top: 12px;
}
.stats h4 {
  color: #2ca58d;
  font-family: 'Montserrat', 'Oswald', sans-serif;
  font-weight: 700;
  margin-bottom: 6px;
}
ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
li {
  margin-bottom: 6px;
  font-size: 1rem;
}
a {
  color: #2ca58d;
  text-decoration: underline;
  margin-left: 8px;
  font-weight: 700;
}
@media (max-width: 600px) {
  .dashboard {
    padding: 8px;
  }
  .team-card {
    padding: 12px 8px;
  }
}
</style>
