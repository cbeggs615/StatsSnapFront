<template>
  <div class="admin-sport-management">
    <form @submit.prevent="handleAddSport" class="add-sport-form">
      <h2>Add a Sport (Admin Only)</h2>
      <div>
        <label for="sportName">Sport Name:</label>
        <input id="sportName" v-model="sportName" required />
      </div>
      <div>
        <label for="source">Source:</label>
        <input id="source" v-model="source" required />
      </div>
      <div>
        <label for="default">Default Key Stats (comma separated):</label>
        <input id="default" v-model="defaultStats" required />
      </div>
      <button type="submit">Add Sport</button>
      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="success" class="success">Sport added!</div>
    </form>

    <div class="delete-sport-form">
      <h2>Delete a Sport (Admin Only)</h2>
      <div>
        <label for="deleteSport">Sport to Delete:</label>
        <select id="deleteSport" v-model="selectedSportToDelete" required>
          <option value="" disabled>Select a sport to delete</option>
          <option v-for="sport in sportsList" :key="sport._id" :value="sport._id">
            {{ sport.name }}
          </option>
        </select>
      </div>
      <button @click="handleDeleteSport" type="button" class="delete-btn">Delete Sport</button>
      <div v-if="deleteError" class="error">{{ deleteError }}</div>
      <div v-if="deleteSuccess" class="success">Sport deleted successfully!</div>
    </div>
  </div>
</template>

<script>
import { fetchSportsList } from '../utils/api.js';

export default {
  name: 'AddSportForm',
  props: ['isAdmin'],
  data() {
    return {
      sportName: '',
      source: '',
      defaultStats: '',
      sportsList: [],
      selectedSportToDelete: '',
      error: '',
      success: false,
      deleteError: '',
      deleteSuccess: false
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
    async handleAddSport() {
      this.error = '';
      this.success = false;
      if (!this.isAdmin) {
        this.error = 'Only admin can add sports.';
        return;
      }
      try {
        const response = await fetch('/api/SportsStats/addSport', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sportName: this.sportName,
            source: this.source,
            default: this.defaultStats.split(',').map(s => s.trim())
          })
        });
        const result = await response.json();
        if (result.sport) {
          this.success = true;
          this.sportName = '';
          this.source = '';
          this.defaultStats = '';
          this.$emit('sport-added');
          await this.refreshSportsList();
        } else {
          this.error = result.error || 'Failed to add sport.';
        }
      } catch (e) {
        this.error = 'Network error: ' + (e.message || e);
        console.error('Network error during sport add:', e);
      }
    },
    async handleDeleteSport() {
      this.deleteError = '';
      this.deleteSuccess = false;

      if (!this.isAdmin) {
        this.deleteError = 'Only admin can delete sports.';
        return;
      }

      if (!this.selectedSportToDelete) {
        this.deleteError = 'Please select a sport to delete.';
        return;
      }

      try {
        const response = await fetch('/api/SportsStats/deleteSport', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sportName: this.getSportNameById(this.selectedSportToDelete) })
        });
        const result = await response.json();

        if (!result.error) {
          this.deleteSuccess = true;
          this.selectedSportToDelete = '';
          await this.refreshSportsList();
          this.$emit('sport-added');
        } else {
          this.deleteError = result.error;
        }
      } catch (e) {
        this.deleteError = 'Network error: ' + (e.message || e);
        console.error('Network error during sport deletion:', e);
      }
    },
    getSportNameById(id) {
      const sport = this.sportsList.find(s => s._id === id);
      return sport ? sport.name : '';
    },
  }
}
</script>

<style scoped>
.admin-sport-management {
  max-width: 900px;
  margin: 32px auto;
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
  justify-content: center;
}
.add-sport-form, .delete-sport-form {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(99, 102, 241, 0.08);
  padding: 28px 24px;
  min-width: 320px;
  max-width: 400px;
  margin-bottom: 24px;
}
.add-sport-form h2, .delete-sport-form h2 {
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
.error {
  color: #dc2626;
  font-weight: 500;
}
.success {
  color: #059669;
  font-weight: 500;
}
@media (max-width: 700px) {
  .admin-sport-management {
    flex-direction: column;
    gap: 0;
  }
  .add-sport-form, .delete-sport-form {
    min-width: 0;
    max-width: 100%;
    margin-bottom: 16px;
  }
}
</style>
